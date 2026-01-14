# --- THEKEY DATA INTEGRITY AUDIT BOT v4.0 ---
# Focus: Stress, Idempotency, Timezones, Export, Trust Decay
import asyncio
import httpx
import uuid
import json
import os
import time
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load configuration
load_dotenv()
BASE_URL = "http://localhost:8000"
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/thekey"
RAW_DB_URL = DATABASE_URL.replace("+psycopg", "")

class AuditorV4:
    def __init__(self):
        self.client = httpx.AsyncClient(base_url=BASE_URL, timeout=30.0)
        self.engine = create_engine(DATABASE_URL, connect_args={"prepare_threshold": None})
        self.user_email = f"audit_v4_{uuid.uuid4().hex[:6]}@thekey.ai"
        self.user_pass = "AuditPassword123!"
        self.token = None
        self.user_id = None
        self.headers = {}

    async def setup(self):
        print(f"🎬 Setting up Audit User: {self.user_email}")
        resp = await self.client.post("/auth/signup", json={"email": self.user_email, "password": self.user_pass})
        if resp.status_code != 200:
            print(f"❌ Setup failed: {resp.text}")
            return False
        data = resp.json()
        self.token = data["access_token"]
        self.user_id = data["user"]["id"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        return True

    async def test_1_stress_volume(self):
        print("\n🚀 [TEST 1] Massive Data Volume Stress Test (1k trades)")
        start_time = time.time()
        
        print("Creating 1000 trades in DB (Bulk Insert)...")
        trades_data = [
            {"id": str(uuid.uuid4()), "user_id": self.user_id}
            for _ in range(1000)
        ]
        with self.engine.connect() as conn:
            conn.execute(text("""
                INSERT INTO trades (id, user_id, symbol, side, entry_price, quantity, status, entry_time)
                VALUES (:id, :user_id, 'STRESS', 'BUY', 100, 1, 'OPEN', NOW())
            """), trades_data)
            conn.commit()
        
        db_time = time.time() - start_time
        print(f"Created in {db_time:.2f}s. Now checking API performance...")
        
        api_start = time.time()
        resp = await self.client.get("/api/progress/summary", headers=self.headers)
        summary_latency = time.time() - api_start
        
        journal_start = time.time()
        resp_journal = await self.client.get("/api/trades/?limit=1000", headers=self.headers)
        journal_latency = time.time() - journal_start
        
        print(f"  - Summary Latency: {summary_latency:.2f}s {'✅' if summary_latency < 2.5 else '🚨'}")
        print(f"  - Journal Latency (1k items): {journal_latency:.2f}s {'✅' if journal_latency < 2.5 else '🚨'}")
        
        if summary_latency < 2.5 and journal_latency < 2.5:
            return "PASS"
        return f"FAIL (Latency Sum={summary_latency:.1f}s, Jrn={journal_latency:.1f}s)"

    async def test_2_idempotency(self):
        print("\n🛡️ [TEST 2] Idempotency (Network Flakiness Retry)")
        i_key = str(uuid.uuid4())
        payload = {
            "symbol": "IDEM",
            "side": "BUY",
            "entry_price": 50.5,
            "quantity": 10,
            "entry_time": datetime.now(timezone.utc).isoformat()
        }
        
        headers_idem = {**self.headers, "X-Idempotency-Key": i_key}
        
        print("Sending first request...")
        resp1 = await self.client.post("/api/trades/", json=payload, headers=headers_idem)
        
        print("Sending second request (retry)...")
        resp2 = await self.client.post("/api/trades/", json=payload, headers=headers_idem)
        
        # Check DB count
        with self.engine.connect() as conn:
            count = conn.execute(text("SELECT count(*) FROM trades WHERE symbol = 'IDEM' AND user_id = :uid"), 
                                 {"uid": self.user_id}).scalar()
        
        print(f"  - Duplicate check: {count} record(s) found. {'✅' if count == 1 else '🚨'}")
        if count == 1 and resp2.status_code == 200:
            return "PASS"
        return f"FAIL (Count: {count}, RespCode: {resp2.status_code})"

    async def test_3_timezone_shift(self):
        print("\n🌍 [TEST 3] Timezone Edge Cases")
        print("Updating user timezone to 'Pacific/Honolulu'...")
        await self.client.put("/auth/settings", json={"timezone": "Pacific/Honolulu"}, headers=self.headers)
        
        resp = await self.client.get("/api/reflection/checkin/today", headers=self.headers)
        print(f"  - Timezone Check Response: {resp.status_code} {'✅' if resp.status_code == 200 else '🚨'}")
        return "PASS" if resp.status_code == 200 else f"FAIL ({resp.status_code})"

    async def test_4_data_export(self):
        print("\n📂 [TEST 4] Data Export & GDPR Integrity")
        resp = await self.client.get("/auth/export-data", headers=self.headers)
        if resp.status_code != 200:
            return f"FAIL (HTTP {resp.status_code})"
        
        data = resp.json()
        has_trades = len(data.get("trades", [])) > 0
        has_user = data.get("user_profile", {}).get("email") == self.user_email
        
        print(f"  - Export accuracy: Trades:{has_trades}, UserMatch:{has_user} {'✅' if has_trades and has_user else '🚨'}")
        return "PASS" if (has_trades and has_user) else "FAIL (Incomplete data)"

    async def test_5_shadow_score_decay(self):
        print("\n📉 [TEST 5] Shadow Score Manipulation & Trust Decay")
        old_date = (datetime.now() - timedelta(days=3)).date()
        old_created = datetime.now() - timedelta(days=3)
        
        with self.engine.connect() as conn:
            conn.execute(text("""
                INSERT INTO checkins (id, user_id, answers, date, created_at, questions)
                VALUES (:id, :user_id, '[2,2,2]', :date, :created, '["q1","q2","q3"]')
            """), {"id": str(uuid.uuid4()), "user_id": self.user_id, "date": old_date, "created": old_created})
            conn.commit()
        
        with self.engine.connect() as conn:
            conn.execute(text("UPDATE users SET shadow_score = '{\"trust_score\": 100}' WHERE id = :uid"), {"uid": self.user_id})
            conn.commit()
            
        print("Calling /summary to trigger decay...")
        resp = await self.client.get("/api/progress/summary", headers=self.headers)
        if resp.status_code != 200:
             return f"FAIL (HTTP {resp.status_code}: {resp.text[:50]})"
        
        data = resp.json()
        new_trust = data.get("trust_score")
        
        print(f"  - Initial Trust: 100, New Trust: {new_trust} {'✅' if new_trust < 100 else '🚨'}")
        if new_trust < 100:
            return "PASS"
        return f"FAIL (Trust: {new_trust})"

    async def cleanup(self):
        print(f"\n🧹 Cleaning up Audit User: {self.user_email}")
        with self.engine.connect() as conn:
            conn.execute(text("DELETE FROM idempotency_keys WHERE user_id = :uid"), {"uid": self.user_id})
            conn.execute(text("DELETE FROM checkins WHERE user_id = :uid"), {"uid": self.user_id})
            conn.execute(text("DELETE FROM trades WHERE user_id = :uid"), {"uid": self.user_id})
            conn.execute(text("DELETE FROM sessions WHERE user_id = :uid"), {"uid": self.user_id})
            conn.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": self.user_id})
            conn.commit()

    async def run_audit(self):
        print("============================================================")
        print("🛡️ THEKEY DATA INTEGRITY AUDIT BOT v4.0")
        print("============================================================")
        
        if not await self.setup():
            return
        
        results = {}
        results["Stress Volume"] = await self.test_1_stress_volume()
        results["Idempotency"] = await self.test_2_idempotency()
        results["Timezone"] = await self.test_3_timezone_shift()
        results["Data Export"] = await self.test_4_data_export()
        results["Trust Decay"] = await self.test_5_shadow_score_decay()
        
        await self.cleanup()
        
        print("\n" + "="*60)
        print("📜 FINAL DATA INTEGRITY AUDIT v4.0 REPORT")
        score = sum(1 for res in results.values() if res == "PASS")
        print(f"OVERALL SCORE: {score}/{len(results)}")
        for test, res in results.items():
            status = "PASS" if res == "PASS" else f"FAIL ({res})"
            print(f"[{status}] {test}")
        print("="*60)

if __name__ == "__main__":
    auditor = AuditorV4()
    asyncio.run(auditor.run_audit())
