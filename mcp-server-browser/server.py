import asyncio
import json
import mcp.server.stdio
import mcp.types as types
from mcp.server.lowlevel import NotificationOptions, Server
from mcp.server.models import InitializationOptions
from playwright.async_api import async_playwright

server = Server("kalashi-browser")

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="browse_and_extract",
            description="Browse a URL and extract text/content for True Probability analysis",
            inputSchema={
                "type": "object",
                "properties": {
                    "url": {"type": "string"},
                    "selector": {"type": "string", "description": "CSS selector to wait for"}
                },
                "required": ["url"]
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict | None) -> list[types.TextContent]:
    arguments = arguments or {}
    if name == "browse_and_extract":
        url = arguments.get("url")
        selector = arguments.get("selector")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            try:
                await page.goto(url, wait_until="networkidle")
                if selector:
                    await page.wait_for_selector(selector)
                
                text = await page.evaluate("() => document.body.innerText")
                await browser.close()
                return [types.TextContent(type="text", text=json.dumps({
                    "url": url,
                    "text_sample": text[:2000],
                    "status": "SUCCESS"
                }))]
            except Exception as e:
                await browser.close()
                return [types.TextContent(type="text", text=f"Error: {str(e)}")]

    return [types.TextContent(type="text", text=f"Tool {name} not implemented")]

async def main():
    async with mcp.server.stdio.stdio_server() as (read, write):
        await server.run(
            read, 
            write, 
            InitializationOptions(
                server_name="kalashi-browser",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            )
        )

if __name__ == "__main__":
    asyncio.run(main())
