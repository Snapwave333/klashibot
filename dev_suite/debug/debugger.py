
import logging
import sys
import yaml
from pathlib import Path
from rich.logging import RichHandler
from rich.console import Console
import pdb

console = Console()

class Debugger:
    def __init__(self, config_path="dev_suite/config/suite_config.yaml"):
        self.config = self._load_config(config_path)
        self._setup_logging()
        self.breakpoints_enabled = self.config['debugging'].get('enable_breakpoints', True)

    def _load_config(self, path):
        try:
            with open(path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            print(f"Failed to load config: {e}")
            return {"debugging": {"log_level": "INFO"}}

    def _setup_logging(self):
        log_level = self.config['debugging'].get('log_level', 'INFO')
        logging.basicConfig(
            level=log_level,
            format="%(message)s",
            datefmt="[%X]",
            handlers=[RichHandler(console=console, rich_tracebacks=True)]
        )
        self.logger = logging.getLogger("KalshiDebugger")
        
        # File handler
        log_file = self.config['debugging'].get('log_file')
        if log_file:
            file_handler = logging.FileHandler(log_file)
            file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
            self.logger.addHandler(file_handler)

    def log(self, message, level="info", **kwargs):
        getattr(self.logger, level)(message, extra=kwargs)

    def breakpoint(self):
        if self.breakpoints_enabled:
            self.logger.warning("Hit breakpoint! Entering debugger...")
            pdb.set_trace()

    def inspect(self, variable_name, variable_value):
        self.logger.info(f"Inspecting {variable_name}: {variable_value}")
        console.print(variable_value)

debugger = Debugger()
