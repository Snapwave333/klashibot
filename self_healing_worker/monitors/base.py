from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import time
import logging

logger = logging.getLogger(__name__)

class BaseMonitor(ABC):
    def __init__(self, name: str):
        self.name = name
        self.status = "unknown"
        self.last_check: Optional[float] = None
        self.metrics: Dict[str, Any] = {}

    @abstractmethod
    async def check_health(self) -> bool:
        """
        Perform the health check.
        Returns: True if healthy, False otherwise.
        """
        pass

    async def run_check(self) -> Dict[str, Any]:
        """
        Wrapper to run the check and capture metrics/time.
        """
        start_time = time.time()
        try:
            is_healthy = await self.check_health()
            self.status = "ok" if is_healthy else "error"
        except Exception as e:
            logger.error(f"Error checking {self.name}: {e}")
            self.status = "error"
            self.metrics["error"] = str(e)
            is_healthy = False
        
        latency_ms = (time.time() - start_time) * 1000
        self.last_check = time.time()
        self.metrics["latency_ms"] = round(latency_ms, 2)
        
        return {
            "name": self.name,
            "status": self.status,
            "latency_ms": self.metrics["latency_ms"],
            "metrics": self.metrics,
            "timestamp": self.last_check
        }
