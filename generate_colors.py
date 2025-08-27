import json
from PIL import Image
import os

def get_average_color(img_path):
    img = Image.open(img_path).convert('RGB')
    pixels = list(img.getdata())
    r, g, b = 0, 0, 0
    for pixel in pixels:
        r += pixel[0]
        g += pixel[1]
        b += pixel[2]
    
    num_pixels = len(pixels)
    avg_r = r / num_pixels
    avg_g = g / num_pixels
    avg_b = b / num_pixels
    
    return {
        "r": avg_r / 255.0,
        "g": avg_g / 255.0,
        "b": avg_b / 255.0,
        "rgbString": f"rgb({round(avg_r)}, {round(avg_g)}, {round(avg_b)})"
    }

state_data = []
image_dir = 'state_flags_png/'
thumb_dir = 'state_flags_thumbnails/'
state_files = sorted([f for f in os.listdir(image_dir) if f.endswith('.png')])

for filename in state_files:
    state_name = filename.replace('.png', '').replace('_', ' ')
    avg_color = get_average_color(os.path.join(image_dir, filename))
    state_data.append({
        "name": state_name,
        "color": [avg_color["r"], avg_color["g"], avg_color["b"]],
        "rgbString": avg_color["rgbString"],
        "thumbnail": os.path.join(thumb_dir, filename)
    })

with open('state_colors.json', 'w') as f:
    json.dump(state_data, f, indent=2)

print("state_colors.json has been updated with accurate, unrounded, normalized values.")
