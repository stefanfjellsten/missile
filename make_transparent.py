from PIL import Image
import os

def make_transparent(input_path, output_path):
    print(f"Processing {input_path}...")
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # Check if pixel is white (or very close to white)
        # item is (R, G, B, A)
        # Tolerance 240 for white artifacts
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0)) # Transparent
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved transparent image to {output_path}")

input_file = "public/Gemini_Generated_Image_mywwkkmywwkkmyww.png"
output_file = "public/favicon.png"

if os.path.exists(input_file):
    make_transparent(input_file, output_file)
else:
    print(f"Error: {input_file} not found")
