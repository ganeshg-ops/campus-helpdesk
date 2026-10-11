import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import FAQ, Document, DocumentChunk

STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
    "can", "cannot", "could", "did", "do", "does", "doing", "don't", "down", "during", "each", "few",
    "for", "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself",
    "him", "himself", "his", "how", "i", "if", "in", "into", "is", "isn't", "it", "its", "itself",
    "let's", "me", "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only",
    "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should",
    "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then",
    "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "very",
    "was", "wasn't", "we", "were", "weren't", "what", "when", "where", "which", "while", "who", "whom",
    "why", "with", "would", "you", "your", "yours", "yourself", "yourselves"
}

class KnowledgeRetriever:
    """
    RAG retriever that indexes and retrieves approved FAQs and Document Chunks
    using content-token matching and relevance ranking with source citations.
    """
    def __init__(self):
        pass

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r"\w+", text.lower())

    def _get_meaningful_tokens(self, tokens: List[str]) -> List[str]:
        return [t for t in tokens if t not in STOP_WORDS and len(t) > 2]

    def search(
        self,
        query: str,
        db: Session,
        category: Optional[str] = None,
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        raw_tokens = self._tokenize(query)
        meaningful_query_tokens = self._get_meaningful_tokens(raw_tokens)

        # If query has no meaningful words, return empty
        if not meaningful_query_tokens:
            return []

        # 1. Fetch all approved FAQs
        faqs = db.query(FAQ).filter(FAQ.is_approved == True).all()

        # 2. Fetch all approved Document Chunks (only successfully indexed documents!)
        chunks = db.query(DocumentChunk).join(Document).filter(
            Document.is_approved == True,
            Document.status == "indexed"
        ).all()

        candidates = []

        # Process FAQs
        for f in faqs:
            item_text = f"{f.question} {f.answer}".lower()
            item_tokens = set(self._tokenize(item_text))

            # Match meaningful query tokens
            matched_tokens = [t for t in meaningful_query_tokens if t in item_tokens or any(t in w for w in item_tokens)]
            if matched_tokens:
                match_ratio = len(matched_tokens) / len(meaningful_query_tokens)
                cat_boost = 0.2 if (category and category.lower() in f.category.lower()) else 0.0
                score = round(min(match_ratio * 0.8 + cat_boost, 0.99), 2)

                if match_ratio >= 0.25 or len(matched_tokens) >= 2:
                    candidates.append({
                        "score": score,
                        "type": "faq",
                        "id": f.id,
                        "title": f.question,
                        "content": f.answer,
                        "category": f.category,
                        "document": f.source_document,
                        "page_number": None,
                        "is_verified": True,
                        "relevance_score": score
                    })

        # Process Document Chunks
        for c in chunks:
            doc_title = c.document.title if c.document else "College Document"
            doc_cat = c.document.category if c.document else "General"
            doc_filename = c.document.filename if c.document else "Document.pdf"
            page_num = getattr(c, "page_number", 1) or 1

            item_text = f"{doc_title} {doc_filename} {c.content}".lower()
            item_tokens = set(self._tokenize(item_text))

            matched_tokens = [t for t in meaningful_query_tokens if t in item_tokens or any(t in w for w in item_tokens)]
            if matched_tokens:
                match_ratio = len(matched_tokens) / len(meaningful_query_tokens)
                cat_boost = 0.15 if (category and category.lower() in doc_cat.lower()) else 0.0
                score = round(min(match_ratio * 0.75 + cat_boost, 0.95), 2)

                if match_ratio >= 0.25 or len(matched_tokens) >= 2:
                    candidates.append({
                        "score": score,
                        "type": "document_chunk",
                        "id": c.id,
                        "title": f"{doc_title} (Page {page_num})",
                        "content": c.content,
                        "category": doc_cat,
                        "document": f"{doc_title} (Page {page_num})",
                        "source_doc_title": doc_title,
                        "filename": doc_filename,
                        "page_number": page_num,
                        "is_verified": True,
                        "relevance_score": score
                    })

        # Sort by relevance score descending
        candidates.sort(key=lambda x: x["score"], reverse=True)
        return candidates[:top_k]

retriever = KnowledgeRetriever()
