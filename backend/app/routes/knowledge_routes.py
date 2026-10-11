import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models import FAQ, Document, DocumentChunk, User
from app.schemas import FAQResponse, FAQCreate, FAQUpdate, DocumentResponse
from app.auth import get_current_user, require_admin, require_staff_or_admin
from app.rag.document_processor import (
    extract_pages_from_file, chunk_document_pages, DocumentProcessingError
)

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge Base & RAG"])

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB limit

@router.get("/faqs", response_model=List[FAQResponse])
def get_faqs(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve FAQs with optional category and search filters."""
    query = db.query(FAQ).filter(FAQ.is_approved == True)
    if category and category.lower() != "all":
        query = query.filter(FAQ.category.ilike(f"%{category}%"))
    if search:
        search_filter = f"%{search}%"
        query = query.filter((FAQ.question.ilike(search_filter)) | (FAQ.answer.ilike(search_filter)))
    return query.order_by(FAQ.category, FAQ.id).all()

@router.post("/faqs", response_model=FAQResponse)
def create_faq(
    faq_data: FAQCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to create a verified FAQ."""
    new_faq = FAQ(**faq_data.model_dump())
    db.add(new_faq)
    db.commit()
    db.refresh(new_faq)
    return new_faq

@router.put("/faqs/{faq_id}", response_model=FAQResponse)
def update_faq(
    faq_id: int,
    faq_update: FAQUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to edit an existing FAQ."""
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found.")

    update_dict = faq_update.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(faq, k, v)
    db.commit()
    db.refresh(faq)
    return faq

@router.delete("/faqs/{faq_id}")
def delete_faq(
    faq_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to delete an FAQ."""
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found.")
    db.delete(faq)
    db.commit()
    return {"success": True, "message": "FAQ deleted."}

@router.get("/documents", response_model=List[DocumentResponse])
def get_documents(db: Session = Depends(get_db)):
    """List indexed college documents."""
    return db.query(Document).order_by(Document.created_at.desc()).all()

@router.post("/upload-document", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    category: str = Form("General"),
    description: Optional[str] = Form(None),
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """
    Admin/Staff endpoint to upload and ingest official PDF documents into the RAG vector store.
    Extracts text page-by-page, detects scanned/OCR-needed files, and indexes chunks.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".txt"]:
        raise HTTPException(status_code=400, detail="Only .pdf and .txt college documents are permitted.")

    # Derive clean title if not provided
    clean_title = (title or "").strip()
    if not clean_title:
        base_name = os.path.splitext(file.filename)[0]
        clean_title = base_name.replace("_", " ").replace("-", " ").strip().title()
        if not clean_title:
            clean_title = "College Document"

    # Save uploaded file
    clean_filename = os.path.basename(file.filename)
    save_path = os.path.join(settings.UPLOAD_DIR, clean_filename)
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(save_path)
    if file_size > MAX_FILE_SIZE_BYTES:
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=400, detail="File exceeds maximum allowed size of 25MB.")

    # Process and extract text
    try:
        pages_data, total_pages, ocr_needed = extract_pages_from_file(save_path)

        if ocr_needed:
            # Document is scanned or has no text
            doc = Document(
                filename=clean_filename,
                title=clean_title,
                description=description,
                category=category,
                file_path=save_path,
                file_size=file_size,
                page_count=total_pages,
                ocr_needed=True,
                is_approved=False,
                status="ocr_needed",
                error_message="Document contains no extractable text. Scanned PDF requires OCR processing before indexing.",
                chunk_count=0
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)
            return doc

        chunks = chunk_document_pages(pages_data, chunk_size=350, chunk_overlap=70)

        doc = Document(
            filename=clean_filename,
            title=clean_title,
            description=description,
            category=category,
            file_path=save_path,
            file_size=file_size,
            page_count=total_pages,
            ocr_needed=False,
            is_approved=True,
            status="indexed",
            error_message=None,
            chunk_count=len(chunks)
        )
        db.add(doc)
        db.flush()

        for chunk_data in chunks:
            chunk_obj = DocumentChunk(
                document_id=doc.id,
                page_number=chunk_data["page_number"],
                chunk_index=chunk_data["chunk_index"],
                content=chunk_data["content"]
            )
            db.add(chunk_obj)

        db.commit()
        db.refresh(doc)
        return doc
    except DocumentProcessingError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@router.delete("/documents/{doc_id}")
def delete_document(
    doc_id: int,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """
    Staff/Admin endpoint to delete an outdated document and immediately remove it from search index.
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # 1. Delete associated chunks from DB first
    db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()

    # 2. Remove file from disk if exists
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()
    return {"success": True, "message": f"Document '{doc.title}' deleted and removed from RAG index."}

@router.get("/documents/{doc_id}/view")
def view_document_file(
    doc_id: int,
    db: Session = Depends(get_db)
):
    """
    Serve document file inline for in-browser PDF viewing, reading, or download.
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # If physical file exists on disk, stream it inline
    if doc.file_path and os.path.exists(doc.file_path):
        media_type = "application/pdf" if doc.filename.lower().endswith(".pdf") else "text/plain"
        return FileResponse(
            doc.file_path,
            media_type=media_type,
            filename=doc.filename,
            headers={"Content-Disposition": f"inline; filename=\"{doc.filename}\""}
        )

    # Fallback: stream extracted text and chunks from DB
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).order_by(DocumentChunk.page_number, DocumentChunk.chunk_index).all()
    lines = [
        f"CAMPUS HELPDESK OFFICIAL DOCUMENT: {doc.title}",
        f"Category: {doc.category}",
        f"Filename: {doc.filename}",
        f"Pages: {doc.page_count or 1} | Chunks: {len(chunks)}",
        "=" * 60,
        f"Description: {doc.description or 'Official college document.'}",
        "=" * 60,
        ""
    ]
    for c in chunks:
        lines.append(f"--- [PAGE {c.page_number}] CHUNK #{c.chunk_index + 1} ---")
        lines.append(c.content)
        lines.append("")

    return Response(
        content="\n".join(lines),
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f"inline; filename=\"{doc.filename}.txt\""}
    )

@router.get("/documents/{doc_id}/chunks")
def get_document_chunks(
    doc_id: int,
    db: Session = Depends(get_db)
):
    """
    Return all chunks and page numbers for a document to view inside the admin inspection modal.
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).order_by(DocumentChunk.page_number, DocumentChunk.chunk_index).all()
    return [
        {
            "id": c.id,
            "page_number": c.page_number,
            "chunk_index": c.chunk_index,
            "content": c.content
        }
        for c in chunks
    ]

@router.put("/documents/{doc_id}/replace", response_model=DocumentResponse)
async def replace_document(
    doc_id: int,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """
    Admin/Staff endpoint to replace an outdated PDF with a new version, clearing old chunks
    and immediately re-indexing new chunks.
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".txt"]:
        raise HTTPException(status_code=400, detail="Only .pdf and .txt documents are permitted.")

    # Save new file
    clean_filename = os.path.basename(file.filename)
    save_path = os.path.join(settings.UPLOAD_DIR, clean_filename)
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(save_path)

    try:
        # Delete old chunks
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()

        # Extract from new file
        pages_data, total_pages, ocr_needed = extract_pages_from_file(save_path)

        doc.filename = clean_filename
        doc.file_path = save_path
        doc.file_size = file_size
        doc.page_count = total_pages
        if title:
            doc.title = title
        if description is not None:
            doc.description = description

        if ocr_needed:
            doc.ocr_needed = True
            doc.is_approved = False
            doc.status = "ocr_needed"
            doc.error_message = "Scanned document requires OCR processing before indexing."
            doc.chunk_count = 0
        else:
            chunks = chunk_document_pages(pages_data, chunk_size=350, chunk_overlap=70)
            doc.ocr_needed = False
            doc.is_approved = True
            doc.status = "indexed"
            doc.error_message = None
            doc.chunk_count = len(chunks)

            for chunk_data in chunks:
                chunk_obj = DocumentChunk(
                    document_id=doc.id,
                    page_number=chunk_data["page_number"],
                    chunk_index=chunk_data["chunk_index"],
                    content=chunk_data["content"]
                )
                db.add(chunk_obj)

        db.commit()
        db.refresh(doc)
        return doc
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to replace and re-index document: {str(e)}")

@router.post("/documents/{doc_id}/reprocess", response_model=DocumentResponse)
def reprocess_document(
    doc_id: int,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """
    Admin/Staff endpoint to reprocess an existing document on disk.
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document file does not exist on disk.")

    try:
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()
        pages_data, total_pages, ocr_needed = extract_pages_from_file(doc.file_path)

        doc.page_count = total_pages
        if ocr_needed:
            doc.ocr_needed = True
            doc.is_approved = False
            doc.status = "ocr_needed"
            doc.error_message = "Scanned document requires OCR processing before indexing."
            doc.chunk_count = 0
        else:
            chunks = chunk_document_pages(pages_data, chunk_size=350, chunk_overlap=70)
            doc.ocr_needed = False
            doc.is_approved = True
            doc.status = "indexed"
            doc.error_message = None
            doc.chunk_count = len(chunks)

            for chunk_data in chunks:
                chunk_obj = DocumentChunk(
                    document_id=doc.id,
                    page_number=chunk_data["page_number"],
                    chunk_index=chunk_data["chunk_index"],
                    content=chunk_data["content"]
                )
                db.add(chunk_obj)

        db.commit()
        db.refresh(doc)
        return doc
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Reprocessing failed: {str(e)}")
