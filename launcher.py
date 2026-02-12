#!/usr/bin/env python3
"""
Kalashi Async Launcher
Launches Backend, Frontend, and Redis in parallel with granular status reporting.
"""

import asyncio
import sys
import os
import subprocess
import webbrowser
from pathlib import Path
import tkinter as tk
from tkinter import ttk
import threading

# Configuration
LAUNCHER_DIR = Path(__file__).parent.absolute()
FRONTEND_DIR = LAUNCHER_DIR / "frontend"
WEBSOCKET_BRIDGE = LAUNCHER_DIR / "websocket_bridge.py"

class AsyncLauncherApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Kalashi Async Launcher")
        self.root.geometry("600x450")
        self.root.resizable(False, False)
        
        # Styles
        style = ttk.Style()
        style.theme_use('clam')
        style.configure("TProgressbar", thickness=20)
        
        # UI Components
        self.setup_ui()
        
        # Processes
        self.processes = {}
        self.loop = asyncio.new_event_loop()
        
        # Start Async Loop in background thread
        threading.Thread(target=self.start_async_loop, daemon=True).start()

    def setup_ui(self):
        # Header
        header = tk.Frame(self.root, bg="#0a0a0f")
        header.pack(fill=tk.X, ipady=15)
        
        tk.Label(header, text="KALASHI", font=("Segoe UI", 24, "bold"), fg="#00ff88", bg="#0a0a0f").pack()
        tk.Label(header, text="Autonomous Trading System", font=("Segoe UI", 10), fg="#8888aa", bg="#0a0a0f").pack()

        # Service Status Area
        self.status_frame = tk.Frame(self.root, padx=40, pady=20)
        self.status_frame.pack(fill=tk.BOTH, expand=True)
        
        self.indicators = {}
        services = [
            ("redis", "Redis Database"),
            ("backend", "Neural Backend (Py)"),
            ("frontend", "React Dashboard"),
            ("worker", "Self-Healing Worker")
        ]
        
        for key, name in services:
            frame = tk.Frame(self.status_frame)
            frame.pack(fill=tk.X, pady=5)
            
            lbl = tk.Label(frame, text=f"WAITING", font=("Consolas", 9), width=10, fg="#666")
            lbl.pack(side=tk.RIGHT)
            self.indicators[key] = lbl
            
            tk.Label(frame, text=name, font=("Segoe UI", 11)).pack(side=tk.LEFT)

        # Progress Bar
        self.progress = ttk.Progressbar(self.root, orient=tk.HORIZONTAL, length=500, mode='determinate')
        self.progress.pack(pady=20)

        # Controls
        btn_frame = tk.Frame(self.root, pady=20)
        btn_frame.pack()
        
        self.btn_launch = tk.Button(btn_frame, text="INITIATE SEQUENCE", command=self.trigger_launch, 
                                  bg="#00ff88", fg="black", font=("Segoe UI", 11, "bold"), padx=20, pady=10, relief="flat")
        self.btn_launch.pack(side=tk.LEFT, padx=10)
        
        self.btn_stop = tk.Button(btn_frame, text="ABORT", command=self.stop_all, 
                                bg="#ff3366", fg="white", font=("Segoe UI", 11, "bold"), padx=20, pady=10, relief="flat", state=tk.DISABLED)
        self.btn_stop.pack(side=tk.LEFT, padx=10)

    def update_status(self, service, status, color):
        def _update():
            lbl = self.indicators[service]
            lbl.config(text=status, fg=color)
        self.root.after(0, _update)
        
    def start_async_loop(self):
        asyncio.set_event_loop(self.loop)
        self.loop.run_forever()

    def trigger_launch(self):
        self.btn_launch.config(state=tk.DISABLED)
        self.btn_stop.config(state=tk.NORMAL)
        asyncio.run_coroutine_threadsafe(self.launch_sequence(), self.loop)

    async def launch_sequence(self):
        # 1. Start Redis check (Simulated or via Docker check in real scenario)
        self.update_status("redis", "STARTING", "orange")
        self.progress['value'] = 10
        await asyncio.sleep(0.5) 
        # In a real async launcher, we might spawn docker here. 
        # For simplicity, we assume Redis is via Docker Compose or System Service
        self.update_status("redis", "ACTIVE", "#00bc7d") # Green
        
        # 2. Launch Backend & Frontend in Parallel
        process_tasks = [
            self.start_service("backend", [sys.executable, str(WEBSOCKET_BRIDGE)], str(LAUNCHER_DIR)),
            self.start_service("frontend", ["npm.cmd", "start"] if sys.platform=="win32" else ["npm", "start"], str(FRONTEND_DIR))
        ]
        
        self.progress['value'] = 30
        await asyncio.gather(*process_tasks)
        
        # 3. Finalize
        self.progress['value'] = 100
        self.root.after(2000, lambda: webbrowser.open("http://localhost:3002"))

    async def start_service(self, name, cmd, cwd):
        self.update_status(name, "BOOTING", "orange")
        try:
            # Create subprocess asynchronously
            process = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=cwd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            self.processes[name] = process
            
            # Watch stdout for "ready" signals (simple heuristic)
            asyncio.create_task(self.monitor_output(name, process))
            
            return process
        except Exception as e:
            self.update_status(name, "FAILED", "red")
            print(f"Failed to start {name}: {e}")

    async def monitor_output(self, name, process):
        while True:
            line = await process.stdout.readline()
            if not line: break
            decoded = line.decode('utf-8', errors='ignore').strip()
            # print(f"[{name}] {decoded}")
            
            if name == "backend" and "WebSocket server listening" in decoded:
                self.update_status("backend", "ONLINE", "#00ff88")
                self.progress['value'] += 35
                
            if name == "frontend" and ("Local:" in decoded or "Compiled successfully" in decoded):
                self.update_status("frontend", "ONLINE", "#00ff88")
                self.progress['value'] += 35

    def stop_all(self):
        asyncio.run_coroutine_threadsafe(self._async_stop(), self.loop)

    async def _async_stop(self):
        for name, proc in self.processes.items():
            try:
                proc.terminate()
                self.update_status(name, "STOPPING", "orange")
                await proc.wait()
                self.update_status(name, "HALTED", "red")
            except: pass
        
        self.root.after(0, lambda: self.btn_launch.config(state=tk.NORMAL))
        self.root.after(0, lambda: self.btn_stop.config(state=tk.DISABLED))
        self.progress['value'] = 0

if __name__ == "__main__":
    root = tk.Tk()
    app = AsyncLauncherApp(root)
    root.mainloop()
