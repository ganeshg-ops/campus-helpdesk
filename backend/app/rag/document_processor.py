import os
import re
from typing import List, Dict, Any, Tuple
from pypdf import PdfReader

class DocumentProcessingError(Exception):
    pass

class OcrRequiredError(DocumentProcessingError):
    """Raised when a PDF is scanned or contains no extractable text."""
    pass

def extract_pages_from_file(file_path: str) -> Tuple[List[Dict[str, Any]], int, bool]:
    """
    Extracts text page-by-page from PDF or TXT files.
    Returns:
        (pages_list, total_page_count, ocr_needed_flag)
    """
    ext = os.path.splitext(file_path)[1].lower()
    pages_data: List[Dict[str, Any]] = []

    if ext == ".txt":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            raw_content = f.read()
        cleaned = raw_content.strip()
        ocr_needed = len(cleaned) < 10
        pages_data.append({"page_number": 1, "text": cleaned})
        return pages_data, 1, ocr_needed

    elif ext == ".pdf":
        try:
            reader = PdfReader(file_path)
        except Exception as e:
            raise DocumentProcessingError(f"Corrupted or invalid PDF file: {str(e)}")

        total_pages = len(reader.pages)
        if total_pages == 0:
            raise DocumentProcessingError("The PDF document contains 0 pages.")

        total_extracted_chars = 0
        for idx, page in enumerate(reader.pages):
            page_num = idx + 1
            try:
                page_text = page.extract_text() or ""
            except Exception:
                page_text = ""

            cleaned = page_text.strip()
            # Count alphanumeric characters
            alpha_chars = len(re.findall(r"[a-zA-Z0-9]", cleaned))
            total_extracted_chars += alpha_chars
            pages_data.append({"page_number": page_num, "text": cleaned})

        # If negligible text is found across the entire PDF, OCR is required
        ocr_needed = total_extracted_chars < 30
        return pages_data, total_pages, ocr_needed

    else:
        raise DocumentProcessingError(f"Unsupported file extension: {ext}. Only .pdf and .txt files are supported.")


def chunk_document_pages(
    pages_data: List[Dict[str, Any]],
    chunk_size: int = 350,
    chunk_overlap: int = 70
) -> List[Dict[str, Any]]:
    """
    Splits page-extracted text into overlapping chunks, preserving page numbers for citation.
    """
    chunks: List[Dict[str, Any]] = []
    global_chunk_idx = 0

    for page_item in pages_data:
        page_num = page_item["page_number"]
        page_text = page_item["text"]

        words = page_text.split()
        if not words:
            continue

        i = 0
        while i < len(words):
            chunk_words = words[i:i + chunk_size]
            chunk_content = " ".join(chunk_words)

            chunks.append({
                "page_number": page_num,
                "chunk_index": global_chunk_idx,
                "content": chunk_content
            })
            global_chunk_idx += 1

            i += chunk_size - chunk_overlap
            if i >= len(words):
                break

    return chunks


# Backward compatibility helpers
def extract_text_from_file(file_path: str) -> str:
    pages_data, _, _ = extract_pages_from_file(file_path)
    return "\n\n".join(p["text"] for p in pages_data if p["text"]).strip()

def chunk_text(text: str, chunk_size: int = 400, chunk_overlap: int = 80) -> List[str]:
    words = text.split()
    if not words:
        return []

    chunks = []
    i = 0
    while i < len(words):
        chunk_words = words[i:i + chunk_size]
        chunks.append(" ".join(chunk_words))
        i += chunk_size - chunk_overlap
        if i >= len(words):
            break

    return chunks
