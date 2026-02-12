import asyncio
import websockets
import json

async def test_connection():
    uri = "ws://localhost:8766"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("WebSocket Connection Established!")
            
            # Wait for initial state
            message = await websocket.recv()
            data = json.loads(message)
            
            if data.get("type") == "INITIAL_STATE":
                print("Received INITIAL_STATE")
                print(f"   Payload keys: {list(data['payload'].keys())}")
                
            else:
                print(f"Received unexpected message: {data.get('type')}")
                
            # Send a ping/command
            print("Sending connection test command...")
            await websocket.send(json.dumps({
                "type": "COMMAND", 
                "payload": {"command": "PING"} # Backend doesn't explicitly handle PING but shouldn't crash
            }))
            print("Command sent successfully")
            
    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
