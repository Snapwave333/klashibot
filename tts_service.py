import asyncio
import os
import sys
from pathlib import Path
from typing import Optional
import hashlib
import time
import torch
import numpy as np
import soundfile as sf
from dotenv import load_dotenv

import warnings

# Suppress annoying warnings
warnings.filterwarnings("ignore", category=UserWarning, module="pkg_resources")
warnings.filterwarnings("ignore", category=UserWarning, module="huggingface_hub")

# Load environment variables
load_dotenv()

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# Configure Qwen3-TTS
TTS_BACKEND = os.getenv("TTS_BACKEND", "qwen3")
TTS_MODEL_PATH = os.getenv("TTS_MODEL_PATH", "Qwen/Qwen3-TTS-12Hz-0.6B-Base")
TTS_REFERENCE_AUDIO = os.getenv("TTS_REFERENCE_AUDIO", "Mandarin Accent.mp3")

# Import Qwen3-TTS
try:
    # Add Qwen3-TTS to path to ensure local imports work
    sys.path.append(str(Path(__file__).parent / "Qwen3-TTS"))
    from qwen_tts import Qwen3TTSModel
    QWEN_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ Qwen3-TTS import failed: {e}. Falling back to gTTS.")
    QWEN_AVAILABLE = False

class TTSService:
    def __init__(self):
        self.cache_dir = Path("data/tts_cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.total_generated = 0
        self.model = None
        self.voice_clone_prompt = None
        
        # Lazy load model in initialize() instead of __init__
        print(f"🔊 TTS Service Configured (Backend: {TTS_BACKEND}) - Waiting for init...")

    async def initialize(self):
        """Async initialization of heavy models."""
        if TTS_BACKEND == "qwen3" and QWEN_AVAILABLE and self.model is None:
            print("⏳ Initializing Qwen3-TTS in background...")
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._initialize_qwen)
        else:
            print("✅ TTS Ready (gTTS or already initialized)")

    def _initialize_qwen(self):
        """Initialize Qwen3-TTS model and Mandarin voice clone prompt."""
        try:
            print("🚀 Loading Qwen3-TTS Model: " + str(TTS_MODEL_PATH) + "...")
            from qwen_tts import Qwen3TTSModel # ensure import
            
            self.model = Qwen3TTSModel.from_pretrained(
                TTS_MODEL_PATH,
                device_map="cpu",
                dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float32
            )
            
            if os.path.exists(TTS_REFERENCE_AUDIO):
                print(f"👤 Cloning Mandarin voice from: {TTS_REFERENCE_AUDIO}")
                self.voice_clone_prompt = TTS_REFERENCE_AUDIO
                print("✅ Mandarin voice clone ready.")
            else:
                print(f"⚠️ Reference audio not found at {TTS_REFERENCE_AUDIO}. Using default voice.")
                
            print("🔊 TTS Service Initialized (Backend: Qwen3)")
        except Exception as e:
            print(f"❌ Failed to load Qwen3-TTS: {e}")

    async def speak(self, text: str, force_refresh: bool = False) -> Optional[str]:
        """Generates audio for the text and returns the file path."""
        if not text:
            return None

        file_hash = hashlib.md5(text.encode()).hexdigest()
        cache_path = self.cache_dir / f"{file_hash}.wav" if self.model else self.cache_dir / f"{file_hash}.mp3"

        if not force_refresh and cache_path.exists():
            return str(cache_path)

        try:
            if self.model:
                # Use Qwen3-TTS with Mandarin Clone
                def _generate_qwen():
                    # correct method is generate_voice_clone
                    # ref_text is required for ICL mode (x_vector_only_mode=False)
                    wavs, fs = self.model.generate_voice_clone(
                        text=text,
                        ref_audio=self.voice_clone_prompt,
                        x_vector_only_mode=True, # Use speaker embedding only to avoid ref_text mismatch
                        language="english"
                    )
                    # wavs is a list of numpy arrays
                    if wavs and len(wavs) > 0:
                        sf.write(str(cache_path), wavs[0], fs)
                        return True
                    return False
                
                success = await asyncio.get_event_loop().run_in_executor(None, _generate_qwen)
                if success:
                    self.total_generated += 1
                    return str(cache_path)
            
            # Fallback to gTTS
            from gtts import gTTS
            def _generate_gtts():
                tts = gTTS(text=text, lang='en', tld='co.uk')
                tts.save(str(cache_path))
            
            await asyncio.get_event_loop().run_in_executor(None, _generate_gtts)
            self.total_generated += 1
            return str(cache_path)

        except Exception as e:
            print(f"❌ TTS Generation Error: {e}")
            return None

    async def speak_trading_alert(self, message: str, _alert_type: str = "info") -> Optional[str]:
        return await self.speak(message)

# Global Instance
tts_service = TTSService()

if __name__ == "__main__":
    async def test():
        path = await tts_service.speak("System initialized. Kalashi trading engine online.")
        print(f"Resulting audio path: {path}")
    
    asyncio.run(test())
