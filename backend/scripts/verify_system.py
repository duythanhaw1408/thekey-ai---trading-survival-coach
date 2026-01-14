#!/usr/bin/env python3
"""
THEKEY System Verification Script
Checks all new modules from the upgrade are properly connected.

Run: python backend/scripts/verify_system.py
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def check_imports():
    """Verify all new modules can be imported."""
    print("=" * 50)
    print("🔍 THEKEY System Verification")
    print("=" * 50)
    
    errors = []
    
    # Phase 1: Rule Engine
    print("\n📦 Phase 1: Rule Engine")
    try:
        from services.rule_engine import RuleEngine, rule_engine
        print("  ✅ services.rule_engine")
    except Exception as e:
        print(f"  ❌ services.rule_engine: {e}")
        errors.append(("rule_engine", str(e)))
    
    # Phase 2: SSE/Streaming
    print("\n📦 Phase 2: SSE Streaming")
    try:
        from routes.stream import router, create_job, update_job, get_job
        print("  ✅ routes.stream")
    except Exception as e:
        print(f"  ❌ routes.stream: {e}")
        errors.append(("stream", str(e)))
    
    try:
        from services.background_tasks import AsyncTaskRunner
        print("  ✅ services.background_tasks")
    except Exception as e:
        print(f"  ❌ services.background_tasks: {e}")
        errors.append(("background_tasks", str(e)))
    
    # Phase 3: KB/RAG
    print("\n📦 Phase 3: Knowledge Base / RAG")
    try:
        from models.kb_document import KBDocument
        print("  ✅ models.kb_document")
    except Exception as e:
        print(f"  ❌ models.kb_document: {e}")
        errors.append(("kb_document", str(e)))
    
    try:
        from services.rag_retriever import RAGRetriever, get_rag_retriever
        print("  ✅ services.rag_retriever")
    except Exception as e:
        print(f"  ❌ services.rag_retriever: {e}")
        errors.append(("rag_retriever", str(e)))
    
    try:
        from routes.kb import router
        print("  ✅ routes.kb")
    except Exception as e:
        print(f"  ❌ routes.kb: {e}")
        errors.append(("kb_routes", str(e)))
    
    # Phase 4: Observability
    print("\n📦 Phase 4: Observability")
    try:
        from models.ai_call_log import AICallLog
        print("  ✅ models.ai_call_log")
    except Exception as e:
        print(f"  ❌ models.ai_call_log: {e}")
        errors.append(("ai_call_log", str(e)))
    
    try:
        from routes.analytics import router
        print("  ✅ routes.analytics")
    except Exception as e:
        print(f"  ❌ routes.analytics: {e}")
        errors.append(("analytics", str(e)))
    
    # Core modules
    print("\n📦 Core Modules")
    try:
        from models import User, Trade, Session, AIPrediction, KBDocument, AICallLog
        print("  ✅ All models exported from models/__init__.py")
    except Exception as e:
        print(f"  ❌ models export: {e}")
        errors.append(("models_export", str(e)))
    
    try:
        from services.ai.ai_tracking import AITracker
        print("  ✅ services.ai.ai_tracking")
    except Exception as e:
        print(f"  ❌ ai_tracking: {e}")
        errors.append(("ai_tracking", str(e)))
    
    # Main app
    print("\n📦 Main Application")
    try:
        # Check if main.py can be parsed (not executed)
        import ast
        with open(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'main.py')) as f:
            ast.parse(f.read())
        print("  ✅ main.py syntax OK")
    except Exception as e:
        print(f"  ❌ main.py: {e}")
        errors.append(("main", str(e)))
    
    # Summary
    print("\n" + "=" * 50)
    if errors:
        print(f"❌ FAILED: {len(errors)} error(s) found")
        for module, error in errors:
            print(f"  - {module}: {error}")
        return False
    else:
        print("✅ ALL CHECKS PASSED!")
        return True


def check_routes():
    """List all registered routes."""
    print("\n" + "=" * 50)
    print("📋 Route Verification")
    print("=" * 50)
    
    expected_routes = [
        "/api/protection",
        "/api/trades",
        "/api/stream",
        "/api/kb",
        "/api/analytics",
        "/auth",
    ]
    
    print("\nExpected route prefixes:")
    for route in expected_routes:
        print(f"  - {route}")
    
    print("\n(Full verification requires running the server)")


def check_migrations():
    """Check migration files exist."""
    print("\n" + "=" * 50)
    print("📋 Migration Verification")
    print("=" * 50)
    
    migrations_dir = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'alembic', 'versions'
    )
    
    if os.path.exists(migrations_dir):
        files = os.listdir(migrations_dir)
        py_files = [f for f in files if f.endswith('.py') and not f.startswith('__')]
        print(f"\n  Found {len(py_files)} migration file(s):")
        for f in py_files:
            print(f"    - {f}")
    else:
        print("  ⚠️ No migrations directory found")


if __name__ == "__main__":
    success = check_imports()
    check_routes()
    check_migrations()
    
    print("\n" + "=" * 50)
    if success:
        print("🚀 System is ready for deployment!")
        print("\nNext steps:")
        print("  1. git add -A && git commit -m 'Upgrade: Phases 1-4'")
        print("  2. git push")
        print("  3. Run migrations: alembic upgrade head")
        print("  4. Seed KB: python -m scripts.seed_kb")
    else:
        print("⚠️ Fix errors before deployment")
    
    sys.exit(0 if success else 1)
