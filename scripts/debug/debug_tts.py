import asyncio
from tts_service import tts_service
import os

async def test():
    print(f"CWD: {os.getcwd()}")
    print(f"Cache Dir: {tts_service.cache_dir}")
    print(f"Absolute Cache Dir: {tts_service.cache_dir.resolve()}")
    
    path = await tts_service.speak("Debugging audio generation.")
    print(f"Generated Path: {path}")
    
    if path and os.path.exists(path):
        print("✅ File exists on disk!")
    else:
        print("❌ File MISSING from disk!")
        
    # List directory contents
    print("Directory contents:")
    for f in os.listdir(tts_service.cache_dir):
        print(f" - {f}")

if __name__ == "__main__":
    asyncio.run(test())
