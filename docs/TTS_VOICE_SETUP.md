# TTS Voice Setup - Chinese English Accent

**Goal:** Configure female voice with Chinese accent speaking English

---

## Current Configuration

The TTS service now searches for **Huihui**, a Chinese female voice that speaks English with a Chinese accent.

### Voice Priority:
1. **Huihui (Primary)** - Chinese female voice, speaks English with accent
2. **Yaoyao/Kangkang (Fallback)** - Other Chinese voices
3. **Any Female Voice (Final Fallback)** - Generic female voices

---

## Installing Windows Chinese Voice (Huihui)

### Method 1: Windows Settings (Recommended)

**For Windows 10/11:**

1. **Open Settings:**
   - Press `Win + I` to open Settings
   - Or search "Settings" in Start Menu

2. **Go to Time & Language:**
   - Click "Time & Language"
   - Click "Language & Region" (or "Language")

3. **Add Chinese Language:**
   - Click "Add a language"
   - Search for "Chinese (Simplified, China)" or "中文"
   - Select "Chinese (Simplified, China)"
   - Click "Next"

4. **Install Speech Features:**
   - Check the box for "Text-to-speech"
   - Check the box for "Speech recognition" (optional)
   - Uncheck "Set as my Windows display language" (unless you want Chinese UI)
   - Click "Install"

5. **Wait for Installation:**
   - Download and installation may take 5-10 minutes
   - You'll see "Language pack installed" when complete

6. **Verify Huihui Voice:**
   - Go to Settings → Time & Language → Speech
   - Under "Voice", you should now see "Microsoft Huihui"

### Method 2: PowerShell (Advanced)

```powershell
# Run PowerShell as Administrator
# Install Chinese language pack
Add-WindowsCapability -Online -Name "Language.TextToSpeech~~~zh-CN~0.0.1.0"
```

---

## Testing the Voice

### Quick Test with Python:

```python
import pyttsx3

engine = pyttsx3.init()
voices = engine.getProperty('voices')

# List all voices
print("Available voices:")
for voice in voices:
    print(f"  - {voice.name}")

# Try to select Huihui
for voice in voices:
    if 'huihui' in voice.name.lower():
        engine.setProperty('voice', voice.id)
        print(f"\nUsing: {voice.name}")
        break

# Test speak
engine.say("Hello, I am speaking English with a Chinese accent")
engine.runAndWait()
```

---

## Expected Output

When you start the Kalashi backend, you should see:

```
🔍 Scanning 5 available voices...
✓ Found Huihui (Chinese English): Microsoft Huihui Desktop - Chinese (Simplified, PRC)
🎙️  Selected voice: Microsoft Huihui Desktop - Chinese (Simplified, PRC)
🎙️  Initialized pyttsx3 TTS (Female Voice, Fast Mode)
```

---

## Alternative: Using Coqui TTS with Chinese English Model

If you want even better quality, use Coqui TTS multilingual models:

### Edit `tts_service.py`:

Change line 60 to use XTTS v2:
```python
self.tts_engine = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2", progress_bar=False)
```

This model supports:
- Multiple languages
- Multiple speakers
- Voice cloning
- Chinese-accented English

---

## Troubleshooting

### Issue: Huihui Not Found

**Check installed voices:**
```python
import pyttsx3
engine = pyttsx3.init()
for voice in engine.getProperty('voices'):
    print(voice.name)
```

**If Huihui is missing:**
1. Verify Chinese language pack is fully installed
2. Restart your computer
3. Check Windows Settings → Speech → Manage voices

### Issue: Voice Sounds Robotic

**Solution:**
- Huihui is a neural TTS voice and should sound natural
- If it sounds robotic, try:
  - Reducing speech rate (change `rate` to 180)
  - Checking audio drivers are updated
  - Using Coqui TTS instead of pyttsx3

### Issue: English Pronunciation is Too Chinese

**Solution:**
This is expected behavior! Huihui speaks English with Chinese accent.

If you want clearer English:
- Use a standard English voice (Zira)
- Or use Coqui TTS multilingual model with speaker selection

---

## Other Asian Accent Options

### Japanese English Accent:
Install Japanese language pack and use **Haruka** voice

### Korean English Accent:
Install Korean language pack and use **Heami** voice

### Indian English Accent:
Install Hindi language pack and use **Hemant** or **Kalpana** voice

---

## Current Voice Settings

**In `tts_service.py`:**

```python
# Speech rate: 200 WPM (faster)
self.tts_engine.setProperty('rate', 200)

# Volume: 90%
self.tts_engine.setProperty('volume', 0.9)
```

**To Adjust:**
- Lower rate (e.g., 180) for clearer pronunciation
- Higher rate (e.g., 220) for even faster speech

---

## Verification Checklist

After installing Chinese language pack:

- [ ] Chinese (Simplified, China) appears in Language & Region settings
- [ ] Text-to-speech feature is installed
- [ ] "Microsoft Huihui" appears in Settings → Speech → Voice
- [ ] Backend shows "✓ Found Huihui" in startup logs
- [ ] TTS toggle in dashboard plays voice with Chinese accent

---

## Summary

✅ **Configured:** TTS searches for Huihui voice (Chinese English)
✅ **Installation:** ~10 minutes via Windows Settings
✅ **Voice Quality:** Natural neural TTS with Chinese accent
✅ **Fallback:** Uses any available female voice if Huihui not found

The system will automatically use Huihui once the Chinese language pack is installed. No code changes needed - just restart the backend!
