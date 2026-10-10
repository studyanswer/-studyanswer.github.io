#!/usr/bin/env python3
"""Add locally recognized Korean/English image text to built-in catalogs.
Original PDFs remain unchanged. Requires PyMuPDF, pdftotext, Tesseract,
and kor/eng traineddata. Resume cached pages after an interrupted run.
"""
import argparse
import concurrent.futures
import csv
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import time
import fitz

ROOT = Path(__file__).resolve().parents[1]
fitz.TOOLS.mupdf_display_errors(False)


def normalized(text):
    return re.sub(r'\W+', '', text).casefold()


def chunks(text, page, ocr=False):
    result = []
    for start in range(0, len(text), 550):
        section = text[start:start + 700].strip()
        if section:
            item = {'page': page, 'text': section}
            if ocr:
                item['ocr'] = True
            result.append(item)
    return result


def recognize(job):
    path, page_number, native, source_hash, cache_dir, tessdata = job
    cache = cache_dir / source_hash / f'{page_number:04d}.json'
    if cache.exists():
        return json.loads(cache.read_text())
    with fitz.open(path) as doc:
        page = doc[page_number - 1]
        scale = min(2.5, 2400 / max(page.rect.width, page.rect.height))
        image = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
        with tempfile.TemporaryDirectory(prefix='secret-note-ocr-') as tmp:
            image_path = Path(tmp) / 'page.png'
            output = Path(tmp) / 'result'
            image.save(image_path)
            subprocess.run([
                'tesseract', str(image_path), str(output), '--tessdata-dir',
                str(tessdata), '-l', 'kor+eng', '--psm', '3', '-c', 'tessedit_create_tsv=1'
            ], check=True, capture_output=True, timeout=120,
                env={**os.environ, 'OMP_THREAD_LIMIT': '1'})
            lines = {}
            with output.with_suffix('.tsv').open(newline='') as f:
                for row in csv.DictReader(f, delimiter='\t', quoting=csv.QUOTE_NONE):
                    if row.get('level') != '5' or not row.get('text', '').strip():
                        continue
                    if float(row['conf']) < 25:
                        continue
                    key = (row['block_num'], row['par_num'], row['line_num'])
                    lines.setdefault(key, []).append(row['text'].strip())
    native_lines = {normalized(line) for line in native.splitlines() if line.strip()}
    retained = []
    for words in lines.values():
        line = ' '.join(words)
        key = normalized(line)
        if len(key) >= 2 and key not in native_lines:
            retained.append(line)
    text = '\n'.join(retained)
    if len(normalized(text)) < 12:
        text = ''
    result = {'page': page_number, 'text': text}
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(result, ensure_ascii=False))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tessdata-dir', type=Path, required=True)
    parser.add_argument('--cache-dir', type=Path, default=Path('/workspace/.cache/secret-note-ocr/pages-v2'))
    parser.add_argument('--workers', type=int, default=4)
    args = parser.parse_args()
    for lang in ('kor', 'eng'):
        if not (args.tessdata_dir / f'{lang}.traineddata').is_file():
            parser.error(f'{lang}.traineddata is missing')
    jobs, catalogs = [], []
    for catalog_path in sorted((ROOT / 'library').glob('*/catalog.json')):
        catalog = json.loads(catalog_path.read_text())
        if catalog.get('ocrVersion') == 2:
            print(f"Already processed: {catalog['subject']}", flush=True)
            continue
        catalogs.append((catalog_path, catalog))
        for item in catalog['documents']:
            if item.get('type') == 'csv':
                continue
            path = ROOT / item['sourceUrl'].removeprefix('./')
            text = subprocess.run(['pdftotext', '-layout', str(path), '-'],capture_output=True,text=True,check=True).stdout
            pages = text.split('\f')
            if pages[-1] == '':
                pages.pop()
            assert len(pages) == item['pageCount'], path
            item['chunks'] = []
            item['_ocr'] = {}
            source_hash = hashlib.sha256(path.read_bytes()).hexdigest()
            with fitz.open(path) as doc:
                assert len(doc) == len(pages), path
                for number, raw_text in enumerate(pages, 1):
                    native = '\n'.join(line.strip() for line in raw_text.splitlines() if line.strip())
                    item['chunks'].extend(chunks(native, number))
                    page = doc[number - 1]
                    area = sum(fitz.Rect(image['bbox']).get_area() for image in page.get_image_info())
                    if area / page.rect.get_area() >= .12 or len(native) < 40:
                        jobs.append((item, (str(path), number, native, source_hash,
                                           args.cache_dir, args.tessdata_dir)))
    print(f'OCR targets: {len(jobs)} pages, {args.workers} workers', flush=True)
    started = time.monotonic()
    failures = []
    with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(recognize, job): item for item, job in jobs}
        for completed, future in enumerate(concurrent.futures.as_completed(futures), 1):
            item = futures[future]
            try:
                result = future.result()
                if result['text']:
                    item['_ocr'][result['page']] = result['text']
            except Exception as error:
                failures.append((item['name'], str(error)))
                if len(failures)<=3:
                    print(f"ERROR {item['name']}: {type(error).__name__}: {error}",flush=True)
            if completed % 25 == 0 or completed == len(jobs):
                print(f'OCR {completed}/{len(jobs)} · {time.monotonic()-started:.0f}s · failures {len(failures)}', flush=True)
    if failures:
        for filename, error in failures:
            print(f'FAILED {filename}: {error}', flush=True)
        raise SystemExit('OCR incomplete; catalogs not saved. Fix failures and resume using cached pages.')
    total = 0
    for path, catalog in catalogs:
        for item in catalog['documents']:
            if item.get('type') == 'csv':
                continue
            results = item.pop('_ocr')
            item['ocrPageCount'] = len(results)
            item['ocrCharacters'] = sum(len(text) for text in results.values())
            for number, text in sorted(results.items()):
                item['chunks'].extend(chunks(text, number, ocr=True))
            item['chunks'].sort(key=lambda chunk: chunk['page'])
            item['vectors'] = None
            total += len(results)
        catalog['version'] = 2
        catalog['ocrVersion'] = 2
        temporary = path.with_suffix('.json.tmp')
        temporary.write_text(json.dumps(catalog, ensure_ascii=False, separators=(',', ':')))
        temporary.replace(path)
        print(f"Saved {catalog['subject']}: {sum(d.get('ocrPageCount', 0) for d in catalog['documents'])} pages with OCR text", flush=True)
    print(f'COMPLETE: {total} pages gained OCR text', flush=True)


if __name__ == '__main__':
    main()
