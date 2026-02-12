import asyncio
import logging
from typing import Dict, Any, List
from monitors.base import BaseMonitor
from monitors.redis_monitor import RedisMonitor
from monitors.backend import BackendMonitor
from monitors.database import DatabaseMonitor
from config import settings

from monitors.mcp import MCPMonitor

logger = logging.getLogger(__name__)

class HealerEngine:
    def __init__(self):
        self.monitors: List[BaseMonitor] = [
            RedisMonitor(),
            BackendMonitor(),
            DatabaseMonitor(),
            MCPMonitor()
        ]
        self.history: List[Dict[str, Any]] = []

    async def run_loop(self):
        while True:
            logger.info("Running health checks...")
            results = await self.check_all()
            # Logic to trigger repairs would go here
            await asyncio.sleep(settings.CHECK_INTERVAL_SECONDS)

    async def check_all(self) -> Dict[str, Any]:
        results = {}
        for monitor in self.monitors:
            res = await monitor.run_check()
            results[monitor.name] = res
            if res["status"] == "error":
                logger.error(f"Issue detected in {monitor.name}: {res.get('metrics', {}).get('error')}")
                # TODO: Trigger Repair Strategy
        return results

    def get_status(self) -> Dict[str, Any]:
        # Return last known status from cache or run on demand? 
        # For simplicity in this v1, this just returns structure, 
        # real implementation stores state in self.latest_results
        return {"monitors": [m.name for m in self.monitors]} # Simplified
