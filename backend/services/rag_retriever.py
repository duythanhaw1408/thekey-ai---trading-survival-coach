# backend/services/rag_retriever.py
"""
THEKEY RAG Retriever Service
Retrieves relevant knowledge base documents for Coach responses.
Uses Gemini embeddings + hybrid search (keyword + semantic).
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, text
import json

from models.kb_document import KBDocument


class RAGRetriever:
    """
    Retrieves relevant knowledge base documents using hybrid search.
    
    Search Strategy:
    1. Keyword matching (BM25-style) - Fast, good for exact terms
    2. Semantic search (embeddings) - Good for concept matching
    3. Combine and re-rank results
    """
    
    def __init__(self, db: Session, gemini_client=None):
        self.db = db
        self.gemini_client = gemini_client
    
    def search(
        self,
        query: str,
        context: str = "all",  # pre_trade, post_trade, crisis, daily_checkin, all
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
        limit: int = 5,
        use_semantic: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Search knowledge base with hybrid retrieval.
        
        Args:
            query: User's question or context
            context: Which phase of trading (for filtering)
            category: Filter by category (policy, playbook, etc.)
            tags: Filter by specific tags
            limit: Maximum number of results
            use_semantic: Whether to use embedding-based search
        
        Returns:
            List of relevant documents with scores
        """
        results = []
        
        # Step 1: Keyword search
        keyword_results = self._keyword_search(query, context, category, tags, limit * 2)
        
        # Step 2: Semantic search (if enabled and embeddings available)
        semantic_results = []
        if use_semantic and self.gemini_client:
            try:
                semantic_results = self._semantic_search(query, context, category, tags, limit * 2)
            except Exception as e:
                print(f"[RAG] Semantic search failed: {e}")
        
        # Step 3: Combine and re-rank
        results = self._combine_results(keyword_results, semantic_results, limit)
        
        return results
    
    def _keyword_search(
        self,
        query: str,
        context: str,
        category: Optional[str],
        tags: Optional[List[str]],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Keyword-based search using PostgreSQL full-text search."""
        
        # Build base query
        q = self.db.query(KBDocument)
        
        # Filter by context (applies_to)
        if context and context != "all":
            q = q.filter(
                or_(
                    KBDocument.applies_to.contains([context]),
                    KBDocument.applies_to.contains(["all"])
                )
            )
        
        # Filter by category
        if category:
            q = q.filter(KBDocument.category == category)
        
        # Filter by tags
        if tags:
            q = q.filter(KBDocument.tags.overlap(tags))
        
        # Keyword matching (simple ILIKE for now)
        # For production, use PostgreSQL ts_vector for proper full-text search
        search_terms = query.lower().split()
        for term in search_terms[:3]:  # Limit to 3 terms for performance
            q = q.filter(
                or_(
                    func.lower(KBDocument.title).contains(term),
                    func.lower(KBDocument.content).contains(term),
                    func.lower(KBDocument.summary).contains(term)
                )
            )
        
        # Order by severity (CRITICAL first)
        severity_order = {"CRITICAL": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 4}
        docs = q.limit(limit).all()
        
        # Score and format results
        results = []
        for doc in docs:
            score = self._calculate_keyword_score(query, doc)
            results.append({
                "id": str(doc.id),
                "title": doc.title,
                "content": doc.content,
                "summary": doc.summary,
                "category": doc.category,
                "tags": doc.tags,
                "severity": doc.severity,
                "score": score,
                "source": "keyword"
            })
        
        return sorted(results, key=lambda x: x["score"], reverse=True)
    
    def _calculate_keyword_score(self, query: str, doc: KBDocument) -> float:
        """Calculate relevance score for keyword match."""
        query_lower = query.lower()
        score = 0.0
        
        # Title match (highest weight)
        if query_lower in doc.title.lower():
            score += 0.5
        
        # Summary match
        if doc.summary and query_lower in doc.summary.lower():
            score += 0.3
        
        # Content match
        if query_lower in doc.content.lower():
            score += 0.2
        
        # Severity boost
        severity_boost = {"CRITICAL": 0.3, "HIGH": 0.2, "MEDIUM": 0.1, "LOW": 0.0}
        score += severity_boost.get(doc.severity, 0.0)
        
        return min(score, 1.0)
    
    def _semantic_search(
        self,
        query: str,
        context: str,
        category: Optional[str],
        tags: Optional[List[str]],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Semantic search using Gemini embeddings."""
        
        # Get query embedding
        query_embedding = self._get_embedding(query)
        if not query_embedding:
            return []
        
        # For now, we do in-memory similarity calculation
        # In production, use pgvector for efficient vector search
        q = self.db.query(KBDocument).filter(KBDocument.embedding.isnot(None))
        
        # Apply filters
        if context and context != "all":
            q = q.filter(
                or_(
                    KBDocument.applies_to.contains([context]),
                    KBDocument.applies_to.contains(["all"])
                )
            )
        
        if category:
            q = q.filter(KBDocument.category == category)
        
        if tags:
            q = q.filter(KBDocument.tags.overlap(tags))
        
        docs = q.limit(100).all()  # Get more for re-ranking
        
        # Calculate similarity scores
        results = []
        for doc in docs:
            if doc.embedding:
                doc_embedding = doc.embedding if isinstance(doc.embedding, list) else json.loads(doc.embedding)
                similarity = self._cosine_similarity(query_embedding, doc_embedding)
                
                results.append({
                    "id": str(doc.id),
                    "title": doc.title,
                    "content": doc.content,
                    "summary": doc.summary,
                    "category": doc.category,
                    "tags": doc.tags,
                    "severity": doc.severity,
                    "score": similarity,
                    "source": "semantic"
                })
        
        # Sort by similarity and return top results
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:limit]
    
    def _get_embedding(self, text: str) -> Optional[List[float]]:
        """Get embedding vector for text using Gemini."""
        if not self.gemini_client:
            return None
        
        try:
            return self.gemini_client.get_embedding(text)
        except Exception as e:
            print(f"[RAG] Embedding failed: {e}")
            return None
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        if len(vec1) != len(vec2):
            return 0.0
        
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = sum(a * a for a in vec1) ** 0.5
        norm2 = sum(b * b for b in vec2) ** 0.5
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    def _combine_results(
        self,
        keyword_results: List[Dict],
        semantic_results: List[Dict],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Combine and re-rank results from both search methods."""
        
        # Merge results by ID
        merged = {}
        
        for result in keyword_results:
            merged[result["id"]] = {
                **result,
                "keyword_score": result["score"],
                "semantic_score": 0.0
            }
        
        for result in semantic_results:
            if result["id"] in merged:
                merged[result["id"]]["semantic_score"] = result["score"]
            else:
                merged[result["id"]] = {
                    **result,
                    "keyword_score": 0.0,
                    "semantic_score": result["score"]
                }
        
        # Calculate combined score (weighted average)
        for doc_id in merged:
            doc = merged[doc_id]
            # Weight: 40% keyword, 60% semantic (semantic is usually more relevant)
            doc["combined_score"] = 0.4 * doc["keyword_score"] + 0.6 * doc["semantic_score"]
            doc["score"] = doc["combined_score"]
        
        # Sort by combined score
        results = list(merged.values())
        results.sort(key=lambda x: x["combined_score"], reverse=True)
        
        return results[:limit]
    
    def get_context_for_coach(
        self,
        user_question: str,
        trade_context: Optional[Dict] = None,
        limit: int = 3
    ) -> str:
        """
        Get relevant KB context formatted for Coach prompt.
        
        Returns a formatted string of relevant policies/playbooks
        that can be injected into the Coach system prompt.
        """
        # Determine context based on trade_context
        context = "all"
        tags = []
        
        if trade_context:
            if trade_context.get("is_pre_trade"):
                context = "pre_trade"
                tags.extend(["risk", "position_size", "stop_loss"])
            elif trade_context.get("is_post_trade"):
                context = "post_trade"
                tags.extend(["reflection", "process"])
            elif trade_context.get("consecutive_losses", 0) >= 2:
                context = "crisis"
                tags.extend(["revenge", "emotion", "cooldown"])
        
        # Search KB
        results = self.search(
            query=user_question,
            context=context,
            tags=tags if tags else None,
            limit=limit
        )
        
        if not results:
            return ""
        
        # Format results for prompt injection
        context_parts = ["### Relevant Trading Policies & Guidelines:\n"]
        
        for i, doc in enumerate(results, 1):
            context_parts.append(f"**{i}. {doc['title']}** ({doc['category'].upper()})")
            if doc.get("summary"):
                context_parts.append(f"   {doc['summary']}")
            else:
                # Use first 200 chars of content
                context_parts.append(f"   {doc['content'][:200]}...")
            context_parts.append("")
        
        return "\n".join(context_parts)


# Singleton instance (initialized with db in route)
def get_rag_retriever(db: Session, gemini_client=None) -> RAGRetriever:
    return RAGRetriever(db, gemini_client)
