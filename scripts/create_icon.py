#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Create a custom icon for Kalashi Trading System
"""

import sys
from PIL import Image, ImageDraw, ImageFont
import os

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def create_icon():
    """Create a custom Kalashi icon"""
    # Create image with transparent background
    size = 256
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw circular background (dark void color)
    center = size // 2
    radius = size // 2 - 10
    draw.ellipse(
        [center - radius, center - radius, center + radius, center + radius],
        fill=(20, 20, 30, 255),
        outline=(0, 255, 136, 255),
        width=8
    )

    # Draw "K" in the center (neon green)
    try:
        # Try to use a bold font
        font_size = 140
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()

    # Calculate text position for centering
    text = "K"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = center - text_width // 2
    text_y = center - text_height // 2 - 10

    # Draw "K" with glow effect
    # Outer glow (larger, more transparent)
    for offset in range(5, 0, -1):
        alpha = int(50 * (offset / 5))
        draw.text(
            (text_x - offset, text_y),
            text,
            font=font,
            fill=(0, 255, 136, alpha)
        )
        draw.text(
            (text_x + offset, text_y),
            text,
            font=font,
            fill=(0, 255, 136, alpha)
        )
        draw.text(
            (text_x, text_y - offset),
            text,
            font=font,
            fill=(0, 255, 136, alpha)
        )
        draw.text(
            (text_x, text_y + offset),
            text,
            font=font,
            fill=(0, 255, 136, alpha)
        )

    # Main text (neon green)
    draw.text(
        (text_x, text_y),
        text,
        font=font,
        fill=(0, 255, 136, 255)
    )

    # Add small "AI" indicator at bottom
    try:
        small_font = ImageFont.truetype("arial.ttf", 24)
    except:
        small_font = ImageFont.load_default()

    ai_text = "AI"
    ai_bbox = draw.textbbox((0, 0), ai_text, font=small_font)
    ai_width = ai_bbox[2] - ai_bbox[0]
    ai_x = center - ai_width // 2
    ai_y = center + radius - 40

    draw.text(
        (ai_x, ai_y),
        ai_text,
        font=small_font,
        fill=(0, 200, 255, 255)
    )

    # Save as PNG first
    png_path = "icon.png"
    img.save(png_path, "PNG")
    print(f"✓ Created {png_path}")

    # Create multiple sizes for ICO format
    icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    icon_images = [img.resize(size, Image.Resampling.LANCZOS) for size in icon_sizes]

    # Save as ICO
    ico_path = "icon.ico"
    icon_images[0].save(
        ico_path,
        format='ICO',
        sizes=icon_sizes
    )
    print(f"✓ Created {ico_path}")

    return ico_path


if __name__ == "__main__":
    try:
        icon_path = create_icon()
        print(f"\n✅ Icon created successfully: {icon_path}")
    except Exception as e:
        print(f"❌ Error creating icon: {e}")
        print("Pillow library may not be installed. Run: pip install Pillow")
