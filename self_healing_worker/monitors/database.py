from sqlalchemy import create_engine, text
from monitors.base import BaseMonitor
from config import settings

class DatabaseMonitor(BaseMonitor):
    def __init__(self):
        super().__init__("database")
        self.enabled = False
        self.engine = None
        if settings.DATABASE_URL:
            self.enabled = True
            self.engine = create_engine(settings.DATABASE_URL)

    async def check_health(self) -> bool:
        if not self.enabled:
            self.metrics["status"] = "disabled"
            return True

        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                self.metrics["query_result"] = result.scalar()
                return True
        except Exception as e:
            self.metrics["error"] = str(e)
            return False
