"""Extract text from course-reading PDFs into per-page text files.

Usage (from repo root):
    python scripts/extract_text.py

Reads every PDF in source-materials/ and writes a sibling
<name>.extracted.txt with markers like:
    ===== PDF PAGE 3 =====
so reviewers can cite page references accurately.

- Text-layer PDFs are extracted with pypdf (fast, exact).
- Scanned PDFs (no text layer) fall back to OCR: pages are rendered
  with pymupdf and recognized with rapidocr-onnxruntime.
  Install once with:
      python -m pip install pypdf pymupdf rapidocr-onnxruntime

The .extracted.txt files are committed alongside the PDFs so future
reviewer updates can quote and cite without re-running OCR.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source-materials"

OCR_DPI = 300


def extract_with_pypdf(pdf_path: Path) -> list[str] | None:
    try:
        from pypdf import PdfReader
    except ImportError:
        print("pypdf not installed; skipping text-layer attempt.", file=sys.stderr)
        return None
    reader = PdfReader(str(pdf_path))
    pages = [(p.extract_text() or "") for p in reader.pages]
    total = sum(len(t.strip()) for t in pages)
    if total < 200:
        return None  # scanned; needs OCR
    return pages


def extract_with_ocr(pdf_path: Path) -> list[str]:
    import numpy as np  # type: ignore
    import pymupdf  # type: ignore
    from rapidocr_onnxruntime import RapidOCR  # type: ignore

    engine = RapidOCR()
    doc = pymupdf.open(pdf_path)
    out: list[str] = []
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=OCR_DPI)
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
        result, _ = engine(img)
        if result:
            # result: [box, text, confidence] rows
            lines = [row[1] for row in result if len(row) > 1 and row[1]]
            out.append("\n".join(lines))
        else:
            out.append("")
        print(f"  OCR page {i + 1}/{len(doc)}: {len(out[-1])} chars")
    return out


def main() -> int:
    seen: set[str] = set()
    pdfs = []
    for pattern in ("*.pdf", "*.PDF"):
        for p in sorted(SRC.glob(pattern)):
            if p.name not in seen:
                seen.add(p.name)
                pdfs.append(p)
    if not pdfs:
        print(f"No PDFs found in {SRC}")
        return 1
    for pdf in pdfs:
        print(f"Processing {pdf.name} ...")
        pages = extract_with_pypdf(pdf)
        method = "text-layer"
        if pages is None:
            print("  no text layer; falling back to OCR ...")
            pages = extract_with_ocr(pdf)
            method = "ocr"
        dest = pdf.with_suffix(pdf.suffix + ".extracted.txt")
        with dest.open("w", encoding="utf-8") as fh:
            fh.write(f"SOURCE: {pdf.name}\nMETHOD: {method}\nPAGES: {len(pages)}\n")
            for i, text in enumerate(pages):
                fh.write(f"\n===== PDF PAGE {i + 1} =====\n{text.strip()}\n")
        print(f"  wrote {dest.name} ({sum(len(p) for p in pages)} chars via {method})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
