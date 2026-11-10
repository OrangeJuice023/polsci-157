"""Verify reading data integrity for the Review Center.

Usage (from repo root):
    python scripts/verify_annotations.py

Checks, for every src/data/reading-*.ts file:
  1. Every annotation passage is an EXACT substring of its page's paragraphs
     (the reader highlights via substring match — a mismatch means no highlight).
  2. Every annotation page exists in the reading content.
  3. Annotation ids are unique per file.
  4. Content pages are contiguous starting at 1.

Also checks flashcards/questions pageRef values ("PDF p. N") for reading-backed
topics against each reading's total page count.

Exit code 0 = all checks pass, 1 = failures found.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data"

PAGE_BLOCK = re.compile(
    r"\{\s*page:\s*(\d+),(?:\s*heading:\s*\"(?:[^\"\\]|\\.)*\",)?\s*paragraphs:\s*\[(.*?)\]\s*,?\s*\}",
    re.DOTALL,
)
STRING = re.compile(r"\"((?:[^\"\\]|\\.)*)\"")
ANNOTATION = re.compile(
    r"id:\s*\"(?P<id>[^\"]+)\"\s*,\s*readingId:\s*\"(?P<reading>[^\"]+)\"\s*,\s*"
    r"page:\s*(?P<page>\d+)\s*,\s*category:\s*\"(?P<cat>[^\"]+)\"\s*,\s*"
    r"passage:\s*\"(?P<passage>(?:[^\"\\]|\\.)*)\"",
    re.DOTALL,
)
PAGEREF = re.compile(r"\{\s*id:\s*'(?P<id>[^']+)'.*?pageRef:\s*'PDF p\.\s*(?P<page>\d+)'", re.DOTALL)


def unescape(s: str) -> str:
    return s.replace('\\"', '"').replace("\\n", "\n").replace("\\\\", "\\")


def check_reading(path: Path) -> list[str]:
    errors: list[str] = []
    text = path.read_text(encoding="utf-8")
    head, sep, tail = text.partition("_ANNOTATIONS")
    if not sep:
        return [f"{path.name}: no annotations export found"]
    pages: dict[int, str] = {}
    for m in PAGE_BLOCK.finditer(head):
        num = int(m.group(1))
        paras = [unescape(s) for s in STRING.findall(m.group(2))]
        pages[num] = "\n".join(paras)
    if not pages:
        print(f"{path.name}: no content yet (placeholder), skipped")
        return errors
    contiguous = sorted(pages) == list(range(1, max(pages) + 1))
    if not contiguous:
        errors.append(f"{path.name}: content pages not contiguous from 1: {sorted(pages)}")
    seen: set[str] = set()
    count = 0
    for m in ANNOTATION.finditer(tail):
        count += 1
        aid, page = m.group("id"), int(m.group("page"))
        passage = unescape(m.group("passage"))
        if aid in seen:
            errors.append(f"{path.name}: duplicate annotation id {aid}")
        seen.add(aid)
        if page not in pages:
            errors.append(f"{path.name}: {aid} points at missing page {page}")
            continue
        if passage not in pages[page]:
            errors.append(
                f"{path.name}: {aid} passage NOT FOUND on page {page}: {passage[:80]!r}..."
            )
    print(f"{path.name}: {len(pages)} pages, {count} annotations checked")
    return errors


def reading_page_counts() -> dict[str, int]:
    """Map topicId -> total pages for reading-backed topics (from readings.ts)."""
    text = (DATA / "readings.ts").read_text(encoding="utf-8")
    topics = re.findall(r"topicId:\s*'([^']+)'", text)
    totals = [int(n) for n in re.findall(r"totalPages:\s*(\d+)", text)]
    return dict(zip(topics, totals))


def check_pagerefs() -> list[str]:
    errors: list[str] = []
    counts = reading_page_counts()
    for fname in ("flashcards.ts", "questions.ts"):
        text = (DATA / fname).read_text(encoding="utf-8")
        for m in PAGEREF.finditer(text):
            cid, page = m.group("id"), int(m.group("page"))
            tm = re.search(r"topicId:\s*'([^']+)'", text[m.start() : m.start() + 400])
            topic = tm.group(1) if tm else "?"
            if topic in counts and page > counts[topic]:
                errors.append(f"{fname}: {cid} pageRef p.{page} exceeds {counts[topic]} pages")
    return errors


def main() -> int:
    errors: list[str] = []
    for path in sorted(DATA.glob("reading-*.ts")):
        errors.extend(check_reading(path))
    errors.extend(check_pagerefs())
    if errors:
        print("\nFAILURES:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("\nAll annotation and pageRef checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
