import asyncio
import os
import json
from pathlib import Path
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def verify_server(server_id, info):
    print(f"\n--- Testing MCP Server: [{server_id}] ---")
    
    cwd_relative = info.get("working_directory", ".")
    full_cwd = (Path(__file__).parent / cwd_relative).resolve()
    
    args = info["args"][:]
    env = {**os.environ, **info.get("env", {})}
    
    # If using module (-m), add working_directory to PYTHONPATH
    if "-m" in args:
        env["PYTHONPATH"] = str(full_cwd) + os.pathsep + env.get("PYTHONPATH", "")
    else:
        # If it's a script, make the path absolute
        for i, arg in enumerate(args):
            if arg.endswith(".py"):
                args[i] = str((full_cwd / arg).resolve())

    server_params = StdioServerParameters(
        command=info["command"],
        args=args,
        env=env,
    )

    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                tools_response = await session.list_tools()
                print("   [OK] Connection Successful!")
                print(f"   Tools found: {len(tools_response.tools)}")
                for tool in tools_response.tools:
                    print(f"      - {tool.name}")
                return True
    except Exception as e:
        print(f"   [FAIL] Connection Failed: {e}")
        return False

async def main():
    config_path = Path("config/mcp_config.json")
    if not config_path.exists():
        print("[Error] MCP Config not found!")
        return

    def read_config():
        with open(config_path, "r") as f:
            return json.load(f)
            
    config = await asyncio.to_thread(read_config)

    results = {}
    for server_id, info in config.get("mcpServers", {}).items():
        results[server_id] = await verify_server(server_id, info)

    print("\n" + "="*40)
    print("MCP VERIFICATION SUMMARY")
    print("="*40)
    all_ok = True
    for server_id, success in results.items():
        status = "PASSED" if success else "FAILED"
        print(f"{server_id:<15}: {status}")
        if not success: all_ok = False
    
    if all_ok:
        print("\nALL MCP SERVERS OPERATIONAL")
    else:
        print("\nSOME SERVERS FAILED VERIFICATION")

if __name__ == "__main__":
    asyncio.run(main())
