from PIL import Image
import io

class ImageCompression:
    def __init__(self, image_file):
        self.image = Image.open(image_file)

    def compress(self, output_path, quality=60):
        rgb_image = self.image.convert('RGB')  # JPG doesn't support transparency
        rgb_image.save(output_path, "JPEG", quality=quality, optimize=True)
