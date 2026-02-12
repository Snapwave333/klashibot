import asyncio
from fastapi import FastAPI
from contextlib import asynccontextmanager
from healer.engine import HealerEngine
from config import settings

healer = HealerEngine()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the healer loop in background
    task = asyncio.create_task(healer.run_loop())
    yield
    # Shutdown
    task.cancel()

app = FastAPI(title="Kalashi Self-Healing Worker", lifespan=lifespan)

@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "worker_id": settings.WORKER_ID}

@app.get("/api/v1/status")
async def get_system_status():
    """Return aggregated status of all monitored components."""
    # In a real sync, we'd cache this or run parallel
    results = await healer.check_all()
    return {"status": "active", "components": results}

@app.post("/api/v1/check/{component_id}")
async def trigger_check(component_id: str):
    # Find monitor and run check
    for monitor in healer.monitors:
        if monitor.name == component_id:
            return await monitor.run_check()
    return {"error": "Component not found"}
