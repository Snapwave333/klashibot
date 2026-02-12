#!/usr/bin/env python3
"""
Build Kalashi Launcher as Windows .exe
Requires: pip install pyinstaller
"""

import subprocess
import sys
import shutil
from pathlib import Path

def build_exe():
    """Build the launcher as a standalone .exe"""

    print("Building Kalashi Launcher .exe...")
    print("=" * 60)

    # Check if PyInstaller is installed
    try:
        import PyInstaller
    except ImportError:
        print("PyInstaller not found. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])

    # Build command
    build_cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--onefile",  # Single executable file
        "--windowed",  # No console window
        "--name=Kalashi",  # Output name
        "--icon=icon.ico",  # Custom icon
        "--add-data=icon.ico;.",  # Include icon in exe
        "launcher.py"
    ]

    print(f"\nRunning: {' '.join(build_cmd)}\n")

    try:
        subprocess.check_call(build_cmd)

        # Get output path
        exe_path = Path("dist") / "Kalashi.exe"
        desktop = Path.home() / "Desktop"
        desktop_exe = desktop / "Kalashi.exe"

        if exe_path.exists():
            print(f"\n{'=' * 60}")
            print("✅ Build successful!")
            print(f"   Executable: {exe_path}")

            # Copy to desktop
            if desktop.exists():
                shutil.copy2(exe_path, desktop_exe)
                print(f"   Copied to Desktop: {desktop_exe}")

            print(f"{'=' * 60}\n")
            print("You can now run Kalashi.exe from your Desktop!")

        else:
            print("\n❌ Build failed - executable not found")

    except subprocess.CalledProcessError as e:
        print(f"\n❌ Build failed: {e}")
        return False

    return True


if __name__ == "__main__":
    # Fix Windows console encoding
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')

    build_exe()
