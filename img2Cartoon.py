import cv2
import numpy as np

class Cartoon:
    def __init__(self, fileobject):
        self.fileobject = fileobject

    def convert(self, filename):
        # Read the image from the uploaded file
        file_bytes = np.asarray(bytearray(self.fileobject.read()), dtype=np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        # Step 1: Apply multiple bilateral filters for smoothing
        img_color = img.copy()
        for _ in range(5):  # More iterations for better smoothing
            img_color = cv2.bilateralFilter(img_color, d=9, sigmaColor=75, sigmaSpace=75)

        # Step 2: Convert to grayscale and apply median blur
        img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        img_gray = cv2.medianBlur(img_gray, 7)

        # Step 3: Create an edge mask using adaptive thresholding (with Gaussian method)
        img_edge = cv2.adaptiveThreshold(img_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                         cv2.THRESH_BINARY, 7, 2)

        # Step 4: Combine the color image with the edge mask
        img_edge_colored = cv2.cvtColor(img_edge, cv2.COLOR_GRAY2BGR)
        img_cartoon = cv2.bitwise_and(img_color, img_edge_colored)

        # Optional Step 5: Enhance contrast using CLAHE
        lab = cv2.cvtColor(img_cartoon, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        img_cartoon = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

        # Save the resulting image
        cv2.imwrite(filename, img_cartoon)
