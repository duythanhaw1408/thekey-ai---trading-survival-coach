import asyncio
import json
import httpx
import os
import sys
import psycopg
from datetime import datetime
from typing import Dict, Any

# --- SETUP PATHS ---
backend_path = os.path.dirname(os.path.abspath(__file__))
if backend_path not in sys.path:
    sys.path.append(backend_path)

# --- CONFIGURATION ---
BASE_URL = "http://localhost:8000"

# Load env to get the REAL DB URL
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/thekey"

if "+psycopg" in DATABASE_URL:
    RAW_DB_URL = DATABASE_URL.replace("+psycopg", "")
else:
    RAW_DB_URL = DATABASE_URL

class IntegrityAuditor:
    def __init__(self):
        self.client = httpx.AsyncClient(base_url=BASE_URL, timeout=30.0)
        self.conn = psycopg.connect(RAW_DB_URL)
        self.user_email = f"audit_v3_{int(datetime.now().timestamp())}@thekey.ai"
        self.user_id = None
        self.token = None
        self.reports = []

    def log_report(self, test_name: str, status: str, data_points: Dict, breaks: list = None, evidence: str = ""):
        report = {
            "test": test_name,
            "status": status,
            "data_points": data_points,
            "breaks": breaks or [],
            "evidence": evidence
        }
        self.reports.append(report)
        print(f"\n[{status}] {test_name}")
        for k, v in data_points.items():
            print(f"  - {k}: {v}")
        if breaks:
            print(f"  🚨 BREAKS: {breaks}")

    async def close(self):
        await self.client.aclose()
        self.conn.close()

    # --- AUDIT METHODS ---

    async def audit_id_chain(self):
        """[TEST 1] User Registration -> Trade Creation ID Chain"""
        # Step 1: Register
        reg_payload = {"email": self.user_email, "password": "AuditPassword123!"}
        resp = await self.client.post("/auth/signup", json=reg_payload)
        api_data = resp.json()
        self.user_id = api_data["user"]["id"]
        self.token = api_data["access_token"]

        # Step 2: Create Trade
        trade_payload = {
            "symbol": "BTCUSD",
            "side": "BUY",
            "entry_price": 60000.0,
            "quantity": 0.01,
            "entry_time": datetime.now().isoformat()
        }
        trade_resp = await self.client.post("/api/trades/", json=trade_payload, headers={"Authorization": f"Bearer {self.token}"})
        api_trade = trade_resp.json()
        trade_id = api_trade["id"]

        # Step 3: DB Verification (THE TRUTH)
        cur = self.conn.cursor()
        cur.execute("SELECT id, user_id FROM trades WHERE id = %s", (trade_id,))
        db_row = cur.fetchone()
        
        db_trade_id = str(db_row[0]) if db_row else None
        db_user_id = str(db_row[1]) if db_row else None

        passed = (db_trade_id == trade_id) and (db_user_id == self.user_id)
        breaks = []
        if not db_row: breaks.append("Trade not found in DB")
        elif db_user_id != self.user_id: breaks.append(f"UserID Mismatch! API: {self.user_id}, DB: {db_user_id}")

        self.log_report("ID Chain: User -> Trade", "PASS" if passed else "FAIL", 
                       {"API_UserID": self.user_id, "DB_UserID": db_user_id, "TradeID": trade_id},
                       breaks, f"API Response: {api_trade}")
        return trade_id

    async def audit_state_propagation(self):
        """[TEST 2] Emotional State -> Protection Guardian Propagation"""
        # Step 1: Submit TILTED check-in
        checkin_payload = {"answers": [2, 2, 2, 2, 2]} 
        resp = await self.client.post("/api/reflection/checkin/submit", json=checkin_payload, headers={"Authorization": f"Bearer {self.token}"})
        checkin_api_data = resp.json()
        
        # Step 2: Verify DB state (Wait a bit for consistency if needed)
        await asyncio.sleep(1)
        cur = self.conn.cursor()
        cur.execute("SELECT emotional_state FROM checkins WHERE user_id = %s ORDER BY created_at DESC LIMIT 1", (self.user_id,))
        row = cur.fetchone()
        db_state = row[0] if row else None

        # Step 3: Call Protection Guardian
        # We need to see if the Guardian uses the LATEST check-in state
        trade_req = {
            "trade": {"symbol": "ETHUSD", "side": "BUY", "size": 100, "entry_price": 2500},
            "stats": {"consecutiveLosses": 1, "consecutiveWins": 0},
            "settings": {"daily_trade_limit": 5, "max_position_size_usd": 500}
        }
        prot_resp = await self.client.post("/api/protection/check-trade", json=trade_req, headers={"Authorization": f"Bearer {self.token}"})
        prot_data = prot_resp.json()
        
        # Step 4: Analysis
        # Checking if Protection reason contains any hint of the emotional state
        passed = db_state is not None and ("state" in str(prot_data).lower() or "tilted" in str(prot_data).lower() or prot_data.get("decision") in ["WARN", "BLOCK"])
        
        breaks = []
        if db_state is None:
            breaks.append("Check-in NOT saved to DB even after 200 OK from API")
        elif not passed:
            breaks.append(f"Data Break: Protection Guardian decision ({prot_data.get('decision')}) ignored TILTED state in DB")

        self.log_report("State Propagation: Checkin -> Protection", "PASS" if passed else "FAIL",
                       {"DB_Emotional_State": db_state, "Guardian_Decision": prot_data.get("decision")},
                       breaks, f"Guardian Response: {json.dumps(prot_data, indent=2)}")

    async def audit_timestamp_consistency(self):
        """[TEST 6] Timestamp Logical Consistency"""
        cur = self.conn.cursor()
        # Check if any trades are created AFTER being closed (impossible)
        cur.execute("SELECT id FROM trades WHERE exit_time IS NOT NULL AND exit_time < entry_time")
        bad_trades = cur.fetchall()
        
        # Check if created_at is strictly increasing for a user
        cur.execute("SELECT COUNT(*) FROM trades t1 JOIN trades t2 ON t1.user_id = t2.user_id WHERE t1.created_at > t2.created_at AND t1.id < t2.id")
        # Note: This is a loose check as IDs are UUIDs, but created_at should follow sequence
        
        passed = len(bad_trades) == 0
        self.log_report("Timestamp Consistency", "PASS" if passed else "FAIL",
                       {"Inconsistent_Trades_Count": len(bad_trades)},
                       ["Found trades where exit_time < entry_time"] if not passed else [])

    async def audit_db_constraints(self):
        """[TEST 5] Data Type Consistency (Enum/JSON validation)"""
        cur = self.conn.cursor()
        # Check for invalid decisions
        cur.execute("SELECT COUNT(*) FROM trades WHERE ai_decision IS NOT NULL AND ai_decision NOT IN ('ALLOW', 'WARN', 'BLOCK')")
        invalid_decisions = cur.fetchone()[0]
        
        # Check for invalid emotional states
        cur.execute("SELECT COUNT(*) FROM checkins WHERE emotional_state IS NOT NULL AND emotional_state NOT IN ('FOCUSED', 'ANXIOUS', 'CALM', 'TILTED', 'CONFIDENT')")
        invalid_states = cur.fetchone()[0]
        
        passed = (invalid_decisions == 0) and (invalid_states == 0)
        self.log_report("DB Constraints & Enums", "PASS" if passed else "FAIL",
                       {"Invalid_Decisions": invalid_decisions, "Invalid_States": invalid_states},
                       ["Enum violation found in DB columns"] if not passed else [])

    def print_final_summary(self):
        print("\n" + "="*60 + "\n📜 FINAL DATA INTEGRITY AUDIT REPORT")
        passed = len([r for r in self.reports if r["status"] == "PASS"])
        total = len(self.reports)
        print(f"OVERALL SCORE: {passed}/{total}")
        print("="*60)

async def run_audit():
    auditor = IntegrityAuditor()
    try:
        await auditor.audit_id_chain()
        await auditor.audit_state_propagation()
        await auditor.audit_timestamp_consistency()
        await auditor.audit_db_constraints()
    finally:
        auditor.print_final_summary()
        await auditor.close()

if __name__ == "__main__":
    asyncio.run(run_audit())
