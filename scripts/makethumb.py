from PIL import Image
import os

input_folder = "assets/initial_images"  # Folder with original images
output_folder = "thumbnails"  # Folder where thumbnails will be saved

os.makedirs(output_folder, exist_ok=True)

for filename in os.listdir(input_folder):
    if filename.endswith(".jpg") or filename.endswith(".JPG"):
        img_path = os.path.join(input_folder, filename)
        img = Image.open(img_path)
        
        img.thumbnail((50, 50))  # Resize to 50x50 pixels
        
        thumbnail_path = os.path.join(output_folder, filename)
        img.save(thumbnail_path, "JPEG", quality=80)  # Save with compression

        print(f"Saved thumbnail: {thumbnail_path}")
