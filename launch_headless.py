#!/usr/bin/env python3
"""
Headless Full Stack Launcher for Kalshi Trading System
Launches all services without GUI for terminal environments
"""

import asyncio
import sys
import os
import subprocess
import time
import signal
from pathlib import Path
import logging

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Configuration
LAUNCHER_DIR = Path(__file__).parent.absolute()
FRONTEND_DIR = LAUNCHER_DIR / "frontend"
WEBSOCKET_BRIDGE = LAUNCHER_DIR / "websocket_bridge.py"
REDIS_DIR = LAUNCHER_DIR

# Global process tracking
processes = {}


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    logger.info("\nShutdown signal received. Stopping all services...")
    stop_all()
    sys.exit(0)


def stop_all():
    """Stop all running services"""
    for name, proc in processes.items():
        try:
            if proc.poll() is None:  # Still running
                logger.info(f"Stopping {name}...")
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    logger.warning(f"Force killing {name}...")
                    proc.kill()
                    proc.wait()
                logger.info(f"{name} stopped")
        except Exception as e:
            logger.error(f"Error stopping {name}: {e}")


def start_redis():
    """Start Redis server"""
    try:
        # Check if Redis is already running
        result = subprocess.run(
            ["redis-cli", "ping"], capture_output=True, text=True, timeout=2
        )
        if "PONG" in result.stdout:
            logger.info("Redis is already running")
            return True
    except:
        pass

    try:
        logger.info("Starting Redis...")
        proc = subprocess.Popen(
            ["redis-server", "redis.conf"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(LAUNCHER_DIR),
        )
        processes["redis"] = proc

        # Wait for Redis to be ready
        time.sleep(2)

        # Verify it's running
        for _ in range(5):
            try:
                result = subprocess.run(
                    ["redis-cli", "ping"], capture_output=True, text=True, timeout=2
                )
                if "PONG" in result.stdout:
                    logger.info("Redis started successfully")
                    return True
            except:
                pass
            time.sleep(1)

        logger.warning("Redis may not have started properly")
        return False
    except Exception as e:
        logger.error(f"Failed to start Redis: {e}")
        return False


def start_websocket_bridge():
    """Start WebSocket Bridge backend"""
    try:
        logger.info("Starting WebSocket Bridge...")
        proc = subprocess.Popen(
            [sys.executable, str(WEBSOCKET_BRIDGE)],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            cwd=str(LAUNCHER_DIR),
            universal_newlines=True,
            bufsize=1,
        )
        processes["backend"] = proc

        # Wait and check for successful startup
        start_time = time.time()
        while time.time() - start_time < 30:
            if proc.poll() is not None:
                logger.error("WebSocket Bridge exited early")
                return False

            try:
                line = proc.stdout.readline()
                if line:
                    print(f"[BACKEND] {line.strip()}")
                    if "WebSocket server listening" in line or "ready" in line.lower():
                        logger.info("WebSocket Bridge started successfully")
                        return True
            except:
                pass

            time.sleep(0.1)

        logger.warning("WebSocket Bridge startup timeout, but process is running")
        return True
    except Exception as e:
        logger.error(f"Failed to start WebSocket Bridge: {e}")
        return False


def start_frontend():
    """Start React frontend"""
    try:
        logger.info("Starting Frontend (React)...")

        # Determine the correct npm command
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"

        proc = subprocess.Popen(
            [npm_cmd, "start"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            cwd=str(FRONTEND_DIR),
            universal_newlines=True,
            bufsize=1,
            env={**os.environ, "BROWSER": "none"},  # Don't open browser
        )
        processes["frontend"] = proc

        # Wait and check for successful startup
        start_time = time.time()
        while time.time() - start_time < 60:
            if proc.poll() is not None:
                logger.error("Frontend exited early")
                return False

            try:
                line = proc.stdout.readline()
                if line:
                    print(f"[FRONTEND] {line.strip()}")
                    if (
                        "Local:" in line
                        or "Compiled successfully" in line
                        or "ready" in line.lower()
                    ):
                        logger.info("Frontend started successfully")
                        logger.info("Dashboard available at: http://localhost:3003")
                        return True
            except:
                pass

            time.sleep(0.1)

        logger.warning("Frontend startup timeout, but process is running")
        return True
    except Exception as e:
        logger.error(f"Failed to start Frontend: {e}")
        return False


def start_self_healing_worker():
    """Start Self-Healing Worker"""
    try:
        worker_dir = LAUNCHER_DIR / "self_healing_worker"
        if not (worker_dir / "main.py").exists():
            logger.info("Self-Healing Worker not found, skipping")
            return True

        logger.info("Starting Self-Healing Worker...")
        proc = subprocess.Popen(
            [sys.executable, "main.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            cwd=str(worker_dir),
            universal_newlines=True,
            bufsize=1,
        )
        processes["worker"] = proc

        # Give it a moment to start
        time.sleep(2)

        if proc.poll() is None:
            logger.info("Self-Healing Worker started")
            return True
        else:
            logger.warning("Self-Healing Worker exited early")
            return False
    except Exception as e:
        logger.error(f"Failed to start Self-Healing Worker: {e}")
        return False


def monitor_processes():
    """Monitor all processes and restart if needed"""
    while True:
        time.sleep(5)

        for name, proc in list(processes.items()):
            if proc.poll() is not None and proc.returncode != 0:
                logger.warning(
                    f"{name} exited with code {proc.returncode}, restarting..."
                )

                # Remove from processes dict
                del processes[name]

                # Restart the service
                if name == "redis":
                    start_redis()
                elif name == "backend":
                    start_websocket_bridge()
                elif name == "frontend":
                    start_frontend()
                elif name == "worker":
                    start_self_healing_worker()


def launch_full_stack():
    """Launch all services in sequence"""
    logger.info("=" * 60)
    logger.info("Kalshi Trading System - Full Stack Launcher")
    logger.info("=" * 60)

    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # 1. Start Redis
    logger.info("\n[1/4] Starting Redis...")
    if not start_redis():
        logger.warning("Redis may not be available. Continuing anyway...")

    # 2. Start WebSocket Bridge
    logger.info("\n[2/4] Starting WebSocket Bridge...")
    if not start_websocket_bridge():
        logger.error("Failed to start WebSocket Bridge. Aborting.")
        stop_all()
        return False

    # 3. Start Frontend
    logger.info("\n[3/4] Starting Frontend...")
    if not start_frontend():
        logger.error("Failed to start Frontend. Aborting.")
        stop_all()
        return False

    # 4. Start Self-Healing Worker (optional)
    logger.info("\n[4/4] Starting Self-Healing Worker...")
    start_self_healing_worker()

    logger.info("\n" + "=" * 60)
    logger.info("All services started successfully!")
    logger.info("Dashboard: http://localhost:3003")
    logger.info("Press Ctrl+C to stop all services")
    logger.info("=" * 60)

    # Start monitoring
    try:
        monitor_processes()
    except KeyboardInterrupt:
        signal_handler(None, None)

    return True


if __name__ == "__main__":
    try:
        success = launch_full_stack()
        sys.exit(0 if success else 1)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        stop_all()
        sys.exit(1)
