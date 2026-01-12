# backend/routes/kb.py
"""
THEKEY Knowledge Base Routes
Admin endpoints for searching and managing KB documents.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from models import get_db, KBDocument
from services.auth.dependencies import get_current_user
from services.rag_retriever import get_rag_retriever
from models import User

router = APIRouter(prefix="/api/kb", tags=["knowledge_base"])


@router.get("/search")
async def search_kb(
    query: str = Query(..., min_length=2, description="Search query"),
    context: str = Query("all", description="Context: pre_trade, post_trade, crisis, daily_checkin, all"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(5, ge=1, le=20),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search the knowledge base for relevant documents.
    
    Returns documents ranked by relevance (hybrid keyword + semantic search).
    """
    retriever = get_rag_retriever(db)
    
    results = retriever.search(
        query=query,
        context=context,
        category=category,
        limit=limit,
        use_semantic=False  # Disable semantic for now (no embeddings yet)
    )
    
    return {
        "query": query,
        "context": context,
        "count": len(results),
        "results": results
    }


@router.get("/documents")
async def list_documents(
    category: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all KB documents with optional category filter."""
    q = db.query(KBDocument)
    
    if category:
        q = q.filter(KBDocument.category == category)
    
    total = q.count()
    docs = q.offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "documents": [doc.to_dict() for doc in docs]
    }


@router.get("/documents/{doc_id}")
async def get_document(
    doc_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific KB document by ID."""
    doc = db.query(KBDocument).filter(KBDocument.id == doc_id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return doc.to_dict()


@router.get("/categories")
async def list_categories(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all unique categories with document counts."""
    from sqlalchemy import func
    
    results = db.query(
        KBDocument.category,
        func.count(KBDocument.id).label('count')
    ).group_by(KBDocument.category).all()
    
    return {
        "categories": [
            {"name": cat, "count": count}
            for cat, count in results
        ]
    }


@router.get("/context/{context_name}")
async def get_context_documents(
    context_name: str,
    limit: int = Query(10, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get documents for a specific context (pre_trade, post_trade, crisis, etc.)."""
    from sqlalchemy import or_
    
    docs = db.query(KBDocument).filter(
        or_(
            KBDocument.applies_to.contains([context_name]),
            KBDocument.applies_to.contains(["all"])
        )
    ).order_by(
        # Order by severity: CRITICAL first
        KBDocument.severity.desc()
    ).limit(limit).all()
    
    return {
        "context": context_name,
        "count": len(docs),
        "documents": [doc.to_dict() for doc in docs]
    }
