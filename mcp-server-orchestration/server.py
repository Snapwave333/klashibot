import asyncio
import json
import mcp.server.stdio
import mcp.types as types
from mcp.server.lowlevel import NotificationOptions, Server
from mcp.server.models import InitializationOptions

server = Server("kalashi-orchestration")

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="k8s_manager",
            description="Manage Kubernetes clusters and pods",
            inputSchema={
                "type": "object",
                "properties": {
                    "action": {"type": "string", "enum": ["get_pods", "restart_deployment", "get_logs"]},
                    "resource_name": {"type": "string"}
                },
                "required": ["action"]
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict | None) -> list[types.TextContent]:
    arguments = arguments or {}
    if name == "k8s_manager":
        action = arguments.get("action")
        r_name = arguments.get("resource_name", "kalashi-worker")
        
        try:
            if action == "get_pods":
                proc = await asyncio.create_subprocess_exec("kubectl", "get", "pods", "-o", "json", stdout=asyncio.subprocess.PIPE)
                stdout, _ = await proc.communicate()
                return [types.TextContent(type="text", text=stdout.decode() or "[]")]
            elif action == "restart_deployment":
                proc = await asyncio.create_subprocess_exec("kubectl", "rollout", "restart", f"deployment/{r_name}", stdout=asyncio.subprocess.PIPE)
                stdout, _ = await proc.communicate()
                return [types.TextContent(type="text", text=stdout.decode())]
        except Exception as e:
            return [types.TextContent(type="text", text=f"K8s Error: {str(e)}")]

    return [types.TextContent(type="text", text=f"Tool {name} not implemented")]

async def main():
    async with mcp.server.stdio.stdio_server() as (read, write):
        await server.run(
            read, 
            write, 
            InitializationOptions(
                server_name="kalashi-orchestration",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            )
        )

if __name__ == "__main__":
    asyncio.run(main())
