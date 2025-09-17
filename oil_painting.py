import cv2
import numpy as np

class OilPaintingEffect:
    def __init__(self, fileObject):
        image_stream = fileObject.read()
        image_np = np.frombuffer(image_stream, np.uint8)
        self.img = cv2.imdecode(image_np, cv2.IMREAD_COLOR)

    def apply_oil_painting(self, output_io):
        # Step 1: Color enhancement using LAB
        lab = cv2.cvtColor(self.img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        lab = cv2.merge((cl, a, b))
        vibrant = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

        # Step 2: Slight saturation boost
        hsv = cv2.cvtColor(vibrant, cv2.COLOR_BGR2HSV)
        hsv[:, :, 1] = cv2.add(hsv[:, :, 1], 25)  # boost saturation
        vibrant = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

        # Step 3: Unsharp masking for clarity
        blur = cv2.GaussianBlur(vibrant, (0, 0), 2.0)
        sharpened = cv2.addWeighted(vibrant, 1.6, blur, -0.6, 0)

        # Step 4: Oil paint effect via median filtering
        oil_painted = cv2.medianBlur(sharpened, 7)

        # Save final image to output_io
        success, buffer = cv2.imencode('.jpg', oil_painted)
        if not success:
            raise ValueError("Could not encode image")
        output_io.write(buffer)
