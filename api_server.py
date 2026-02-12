
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("REST_API")

app = FastAPI(title="Kalshi Agent API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Reference to the main WebSocketBridge instance
# This will be injected when the server starts in the same loop
bridge_instance = None

class CommandRequest(BaseModel):
    command: str

class TTSConfig(BaseModel):
    enabled: bool

@app.on_event("startup")
async def startup_event():
    logger.info("REST API Started")

@app.get("/health")
async def health_check():
    return {"status": "ok", "agent_status": bridge_instance.bot_state if bridge_instance else "UNKNOWN"}

@app.post("/control/command")
async def send_command(request: CommandRequest):
    if not bridge_instance:
        raise HTTPException(status_code=503, detail="Bridge not initialized")
    
    cmd = request.command.upper()
    logger.info(f"REST Received Command: {cmd}")
    
    if cmd == "START":
        await bridge_instance._handle_bot_start()
    elif cmd == "PAUSE":
        await bridge_instance._handle_bot_pause()
    elif cmd == "STOP":
        await bridge_instance._handle_bot_stop() 
    elif cmd == "RESTART":
        await bridge_instance._handle_system_restart()
    else:
        raise HTTPException(status_code=400, detail=f"Unknown command: {cmd}")
        
    return {"status": "success", "command": cmd, "new_state": bridge_instance.bot_state}
    
@app.get("/status")
async def get_status():
    if not bridge_instance:
         raise HTTPException(status_code=503, detail="Bridge not initialized")
    
    # Ensure portfolio is serializable (dict)
    portfolio_data = bridge_instance.portfolio if isinstance(bridge_instance.portfolio, dict) else {}
    
    return {
        "bot_state": bridge_instance.bot_state,
        "tts_enabled": bridge_instance.tts_enabled,
        "portfolio_balance": portfolio_data.get("cash", 0),
        "active_positions_count": len(portfolio_data.get("positions", [])),
        "health": "healthy" 
    }

@app.post("/config/tts")
async def configure_tts(config: TTSConfig):
    if not bridge_instance:
        raise HTTPException(status_code=503, detail="Bridge not initialized")
        
    bridge_instance.tts_enabled = config.enabled
    await bridge_instance.broadcast("TTS_STATE", {"enabled": config.enabled})
    return {"status": "success", "tts_enabled": config.enabled}
