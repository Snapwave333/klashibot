import asyncio
import os
import json
from datetime import datetime
import mcp.server.stdio
import mcp.types as types
from mcp.server.lowlevel import NotificationOptions, Server
from mcp.server.models import InitializationOptions

server = Server("kalashi-system")

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="get_gpu_stats",
            description="Get real-time VRAM and GPU usage for RTX 4070",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        types.Tool(
            name="git_operations",
            description="Perform git operations (status, commit, rollback)",
            inputSchema={
                "type": "object",
                "properties": {
                    "action": {"type": "string", "enum": ["status", "commit", "rollback"]},
                    "message": {"type": "string"}
                },
                "required": ["action"]
            }
        ),
        types.Tool(
            name="docker_manager",
            description="Manage local Docker containers (restart, status)",
            inputSchema={
                "type": "object",
                "properties": {
                    "action": {"type": "string", "enum": ["status", "restart"]},
                    "container_name": {"type": "string"}
                },
                "required": ["action"]
            }
        ),
        types.Tool(
            name="play_profit_chime",
            description="Trigger the 'Ka-Ching' profit chime audio",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        types.Tool(
            name="get_detailed_time",
            description="Get precise system time for event loop syncing",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict | None) -> list[types.TextContent]:
    arguments = arguments or {}
    if name == "get_gpu_stats":
        return await _get_gpu_stats()
    elif name == "git_operations":
        return await _handle_git(arguments)
    elif name == "docker_manager":
        return await _handle_docker(arguments)
    elif name == "play_profit_chime":
        return [types.TextContent(type="text", text="SIGNAL_PROFIT_CHIME_TRIGGERED")]
    elif name == "get_detailed_time":
        now = datetime.now()
        return [types.TextContent(type="text", text=json.dumps({
            "iso": now.isoformat(),
            "timestamp": now.timestamp(),
            "microsecond": now.microsecond
        }))]
    return [types.TextContent(type="text", text=f"Tool {name} not implemented")]

async def _get_gpu_stats():
    try:
        proc = await asyncio.create_subprocess_exec(
            "nvidia-smi", "--query-gpu=memory.used,memory.total,utilization.gpu", "--format=csv,noheader,nounits",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, _ = await proc.communicate()
        if proc.returncode == 0:
            used, total, util = stdout.decode().strip().split(", ")
            return [types.TextContent(type="text", text=json.dumps({
                "vram_used_mb": int(used),
                "vram_total_mb": int(total),
                "gpu_utilization_pct": int(util),
                "status": "HEALTHY" if int(used) < 6500 else "VRAM_CRITICAL"
            }))]
    except Exception:
        pass
    return [types.TextContent(type="text", text=json.dumps({
        "vram_used_mb": 4200, "vram_total_mb": 8192, "gpu_utilization_pct": 12, "status": "HEALTHY (MOCKED)"
    }))]

async def _handle_git(args):
    action = args.get("action")
    if action == "status":
        proc = await asyncio.create_subprocess_exec("git", "status", "--short", stdout=asyncio.subprocess.PIPE)
        stdout, _ = await proc.communicate()
        return [types.TextContent(type="text", text=stdout.decode() or "Clean")]
    elif action == "commit":
        msg = args.get("message", "Auto-update from Vivian")
        add_proc = await asyncio.create_subprocess_exec("git", "add", ".")
        await add_proc.wait()
        proc = await asyncio.create_subprocess_exec("git", "commit", "-m", msg, stdout=asyncio.subprocess.PIPE)
        stdout, _ = await proc.communicate()
        return [types.TextContent(type="text", text=stdout.decode())]
    return [types.TextContent(type="text", text="Invalid Git action")]

async def _handle_docker(args):
    action = args.get("action")
    container = args.get("container_name", "kalashi-backend")
    if action == "status":
        proc = await asyncio.create_subprocess_exec("docker", "ps", "--filter", f"name={container}", "--format", "{{.Status}}", stdout=asyncio.subprocess.PIPE)
        stdout, _ = await proc.communicate()
        return [types.TextContent(type="text", text=stdout.decode().strip() or "Not found")]
    elif action == "restart":
        proc = await asyncio.create_subprocess_exec("docker", "restart", container, stdout=asyncio.subprocess.PIPE)
        stdout, _ = await proc.communicate()
        return [types.TextContent(type="text", text=f"Restarted {container}: {stdout.decode()}")]
    return [types.TextContent(type="text", text="Invalid Docker action")]

async def main():
    async with mcp.server.stdio.stdio_server() as (read, write):
        await server.run(
            read, 
            write, 
            InitializationOptions(
                server_name="kalashi-system",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            )
        )

if __name__ == "__main__":
    asyncio.run(main())
