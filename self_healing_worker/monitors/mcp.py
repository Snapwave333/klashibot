import aiohttp
from monitors.base import BaseMonitor
from config import settings

class MCPMonitor(BaseMonitor):
    def __init__(self):
        super().__init__("mcp")
        self.enabled = bool(settings.MCP_HEALTH_ENDPOINT)
    
    async def check_health(self) -> bool:
        if not self.enabled:
            self.metrics["status"] = "disabled"
            return True

        url = settings.MCP_HEALTH_ENDPOINT
        if not url:
             return True

        try:
             async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=5.0) as response:
                    latency = 0 # Placeholder if needed
                    if response.status == 200:
                        return True
                    else:
                        self.metrics["error"] = f"HTTP {response.status}"
                        return False
        except Exception as e:
            self.metrics["error"] = str(e)
            return False
