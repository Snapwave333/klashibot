
import asyncio
import websockets
import aiohttp
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("FullStackDebug")

WS_URL = "ws://127.0.0.1:8766"
AUDIO_URL = "http://127.0.0.1:8767/audio/test" # Test endpoint (likely 404 but confirms server is up if not connection refused)

async def test_websocket():
    logger.info(f"🔌 Testing WebSocket connection to {WS_URL}...")
    try:
        async with websockets.connect(WS_URL, timeout=5) as websocket:
            logger.info("   ✅ WebSocket Connected!")
            
            # fast handshake check
            init_msg = await asyncio.wait_for(websocket.recv(), timeout=5)
            data = json.loads(init_msg)
            logger.info(f"   📥 Received Initial State: {data.get('type')}")
            
            # Send a ping/command
            logger.info("   📤 Sending PING...")
            await websocket.send(json.dumps({"type": "COMMAND", "payload": {"command": "PING"}}))
            logger.info("   ✅ PING Sent (No crash)")
            
    except Exception as e:
        logger.error(f"   ❌ WebSocket Failed: {e}")
        return False
    return True

async def test_audio_server():
    logger.info(f"🔊 Testing Audio Server connection to {AUDIO_URL}...")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(AUDIO_URL, timeout=2) as response:
                # We expect 404 for "test" file, but connection should succeed
                logger.info(f"   ✅ Audio Server Responded: {response.status} (Expected 404 for missing file)")
    except Exception as e:
         logger.error(f"   ❌ Audio Server Failed: {e}")
         return False
    return True

async def main():
    logger.info("🚀 Starting Full Stack Pipeline Debug...")
    
    ws_ok = await test_websocket()
    audio_ok = await test_audio_server()
    
    if ws_ok and audio_ok:
        logger.info("\n✅ FULL STACK HEALTHY: Backend services are reachable.")
    else:
        logger.error("\n❌ FULL STACK UNHEALTHY: Check logs above.")

if __name__ == "__main__":
    asyncio.run(main())
