import redis
from monitors.base import BaseMonitor
from config import settings

class RedisMonitor(BaseMonitor):
    def __init__(self):
        super().__init__("redis")
        self.client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            password=settings.REDIS_PASSWORD,
            socket_timeout=2.0
        )

    async def check_health(self) -> bool:
        try:
            info = self.client.info()
            self.metrics["used_memory"] = info.get("used_memory_human")
            self.metrics["connected_clients"] = info.get("connected_clients")
            self.metrics["uptime_days"] = info.get("uptime_in_days")
            return True
        except Exception as e:
            self.metrics["error"] = str(e)
            return False
