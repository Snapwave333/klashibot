import aiohttp
from monitors.base import BaseMonitor
from config import settings

class BackendMonitor(BaseMonitor):
    def __init__(self):
        super().__init__("backend")
        self.health_url = f"{settings.BACKEND_URL}/health" # Assuming backend exposes this

    async def check_health(self) -> bool:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.health_url, timeout=3.0) as response:
                    self.metrics["status_code"] = response.status
                    if response.status == 200:
                        return True
                    else:
                        self.metrics["error"] = f"HTTP {response.status}"
                        return False
        except Exception as e:
            self.metrics["error"] = str(e)
            return False
