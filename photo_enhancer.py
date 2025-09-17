import cv2
import numpy as np

class PhotoEnhancer:
    def __init__(self, fileObject):
        image_stream = fileObject.read()
        image_np = np.frombuffer(image_stream, np.uint8)
        self.img = cv2.imdecode(image_np, cv2.IMREAD_COLOR)

    def enhance(self, save_path):
        # Step 1: Moderate CLAHE for contrast enhancement
        lab = cv2.cvtColor(self.img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=0.9, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        lab = cv2.merge((cl, a, b))
        contrast_img = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

        # Step 2: Moderate unsharp masking
        blur = cv2.GaussianBlur(contrast_img, (0, 0), sigmaX=3.1)
        sharp = cv2.addWeighted(contrast_img, 1.7, blur, -0.7, 0)

        # Step 3: Slight color vibrancy
        hsv = cv2.cvtColor(sharp, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        s = cv2.add(s, 23)
        s = np.clip(s, 0, 255)
        final = cv2.cvtColor(cv2.merge([h, s, v]), cv2.COLOR_HSV2BGR)

        # Save result
        cv2.imwrite(save_path, final)
