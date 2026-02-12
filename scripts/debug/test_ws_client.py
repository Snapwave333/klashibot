#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Test WebSocket client to verify bridge is working"""
import asyncio
import json
import sys
import websockets

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

async def test_connection():
    uri = "ws://127.0.0.1:8766"

    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to WebSocket bridge")

            # Wait for initial state
            initial_msg = await websocket.recv()
            print(f"📨 Received initial state: {json.loads(initial_msg)['type']}")

            # Send PLAY command
            play_cmd = {
                "type": "COMMAND",
                "payload": {"command": "PLAY"}
            }
            print(f"\n📤 Sending PLAY command...")
            await websocket.send(json.dumps(play_cmd))

            # Wait for responses
            print("\n📥 Waiting for responses (10 seconds)...\n")
            try:
                for i in range(10):
                    msg = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                    data = json.loads(msg)
                    print(f"[{i+1}] Type: {data.get('type')}, Payload keys: {list(data.get('payload', {}).keys())}")
            except asyncio.TimeoutError:
                print("⏱️ Timeout waiting for messages")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
