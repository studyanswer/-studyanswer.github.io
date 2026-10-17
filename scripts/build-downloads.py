"""Build shareable textbook exports from the existing public course catalogs."""
import json
import zipfile
from pathlib import Path
import fitz

root = Path(__file__).resolve().parent.parent
out = root / 'release-files'
out.mkdir(exist_ok=True)
subjects = ['ai-basics', 'practical-ai', 'semiconductor-packaging', 'applied-math', 'electronic-circuits', 'computer-practice', 'programming-ii']
merged = fitz.open()
toc, index, extracted = [], [], []
count = 0
with zipfile.ZipFile(out / 'all-textbooks-originals.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for slug in subjects:
        catalog = json.loads((root / 'library' / slug / 'catalog.json').read_text())
        subject = catalog['subject']
        toc.append([1, subject, len(merged) + 1])
        for doc in catalog['documents']:
            if doc.get('type') == 'csv':
                continue
            path = root / doc['sourceUrl'].removeprefix('./')
            with fitz.open(path) as source:
                assert len(source) == doc['pageCount']
                toc.append([2, doc['name'], len(merged) + 1])
                merged.insert_pdf(source)
            archive.write(path, subject + '/' + doc['name'])
            count += 1
            index.append(f"{subject}\t{doc['name']}\t{doc['pageCount']}페이지")
            extracted.append(f"\n# {subject} / {doc['name']}\n")
            for chunk in doc['chunks']:
                extracted.append(f"\n## {chunk['page']}페이지\n{chunk['text']}\n")
    archive.writestr('자료목록.txt', '\n'.join(index))
    archive.writestr('전체교재_검색용텍스트.md', '\n'.join(extracted))
assert count == 81 and len(merged) == 1771
merged.set_toc(toc)
merged.set_metadata({'title': '전체 교재 7과목 81개 합본'})
merged.save(out / 'all-textbooks-81.pdf', garbage=3, deflate=True)
merged.close()
with zipfile.ZipFile(out / 'quiz-book-216.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for ext in ['pdf', 'md', 'json']:
        file = root / 'downloads' / f'quiz-book-216.{ext}'
        archive.write(file, file.name)
print('Built 81 PDFs / 1771 pages and the 216-question sharing bundle')
