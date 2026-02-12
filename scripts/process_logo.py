
from PIL import Image
import numpy as np
import os

source_path = r"C:\Users\chrom\Downloads\Whisk_46ca7acae086b2fa81c495756b9b834fdr.jpeg"
frontend_path = r"c:\Users\chrom\OneDrive\Desktop\current-projects\production\kalashi\frontend"
public_path = os.path.join(frontend_path, "public")
assets_path = os.path.join(frontend_path, "src", "assets")

# Ensure assets directory exists
os.makedirs(assets_path, exist_ok=True)

def remove_black_background(img_path, tolerance=30):
    img = Image.open(img_path).convert("RGBA")
    data = np.array(img)
    
    # Calculate distance from black
    r, g, b, a = data.T
    # Black is close to (0,0,0)
    # improved black detection: sum of channels is small
    black_areas = (r < tolerance) & (g < tolerance) & (b < tolerance)
    
    data[..., 3][black_areas.T] = 0
    
    return Image.fromarray(data)

try:
    print(f"Processing {source_path}...")
    # Process for Logo (High Res)
    logo_img = remove_black_background(source_path, tolerance=40)
    
    # Save Logo PNG to assets
    logo_dest = os.path.join(assets_path, "aura_logo.png")
    logo_img.save(logo_dest, "PNG")
    print(f"Saved logo to {logo_dest}")
    
    # Process for Favicon
    # Resize to standard icon sizes
    icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    
    favicon_dest = os.path.join(public_path, "favicon.ico")
    logo_img.save(favicon_dest, format='ICO', sizes=icon_sizes)
    print(f"Saved favicon to {favicon_dest}")

    # Also save a 192x192 png for manifest if needed
    pwa_icon_dest = os.path.join(public_path, "logo192.png")
    logo_img.resize((192, 192)).save(pwa_icon_dest, "PNG")
    print(f"Saved PWA icon to {pwa_icon_dest}")

except Exception as e:
    print(f"Error processing image: {e}")
