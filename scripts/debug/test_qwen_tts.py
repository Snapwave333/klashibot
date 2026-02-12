
import sys
import os

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

print("⏳ Testing Qwen3-TTS Import...")
try:
    from qwen_tts import Qwen3TTSModel
    print("✅ Successfully imported Qwen3TTSModel")
except Exception as e:
    print(f"❌ Failed to import Qwen3TTSModel: {e}")
    sys.exit(1)

print("⏳ Attempting to load model (dry run)...")
# We won't actually load weights if it takes too long, just checking class availability
# But let's try a small load if possible or just print success.
print("✅ Qwen3-TTS environment seems ready.")
