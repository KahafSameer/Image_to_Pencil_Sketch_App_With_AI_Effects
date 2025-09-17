import numpy as np
import cv2
import typing
import os
import argparse


class PencilSketch:
    """Apply pencil sketch effect to an image"""

    def __init__(
        self,
        blur_sigma: int = 5,
        ksize: typing.Tuple[int, int] = (0, 0),
        sharpen_value: int = None,
        kernel: np.ndarray = None,
    ) -> None:
        """
        Args:
            blur_sigma (int): Sigma value for Gaussian blur.
            ksize (tuple): Kernel size for Gaussian blur.
            sharpen_value (int): Sharpening strength (optional).
            kernel (np.ndarray): Custom sharpening kernel (optional).
        """
        self.blur_sigma = blur_sigma
        self.ksize = ksize
        self.sharpen_value = sharpen_value
        self.kernel = (
            np.array([[0, -1, 0], [-1, sharpen_value, -1], [0, -1, 0]])
            if kernel is None and sharpen_value is not None
            else kernel
        )

    def dodge(self, front: np.ndarray, back: np.ndarray) -> np.ndarray:
        """
        Blend two images using the "color dodge" technique.
        Args:
            front: Blurred inverted image.
            back: Grayscale image.
        """
        result = back * 255.0 / (255.0 - front)
        result[result > 255] = 255
        result[back == 255] = 255
        return result.astype("uint8")

    def sharpen(self, image: np.ndarray) -> np.ndarray:
        """Sharpen the image using a kernel, if sharpen_value is set."""
        if self.sharpen_value is not None and isinstance(self.sharpen_value, int):
            inverted = 255 - image
            return 255 - cv2.filter2D(src=inverted, ddepth=-1, kernel=self.kernel)
        return image

    def __call__(self, frame: np.ndarray) -> np.ndarray:
        """Apply the full pencil sketch effect to the given image (frame)."""
        # Convert to grayscale
        grayscale = np.array(np.dot(frame[..., :3], [0.299, 0.587, 0.114]), dtype=np.uint8)
        grayscale = np.stack((grayscale,) * 3, axis=-1)

        # Invert and blur
        inverted_img = 255 - grayscale
        blur_img = cv2.GaussianBlur(inverted_img, ksize=self.ksize, sigmaX=self.blur_sigma)

        # Blend (dodge)
        final_img = self.dodge(blur_img, grayscale)

        # Optional sharpening
        sharpened_image = self.sharpen(final_img)

        return sharpened_image


def main():
    parser = argparse.ArgumentParser(description="Convert an image to a pencil sketch.")
    parser.add_argument("input", help="Path to input image file (e.g., input.jpg)")
    parser.add_argument("output", help="Path to save output sketch image (e.g., output/sketch.png)")
    parser.add_argument("--blur_sigma", type=int, default=5, help="Sigma value for Gaussian blur.")
    parser.add_argument("--ksize", type=int, nargs=2, default=[0, 0], help="Kernel size for Gaussian blur.")
    parser.add_argument("--sharpen_value", type=int, default=None, help="Sharpening strength (optional).")
    args = parser.parse_args()

    # Read image
    image = cv2.imread(args.input)
    if image is None:
        print("[Error] Could not read image. Please check the path.")
        return

    # Create sketcher and apply effect
    sketcher = PencilSketch(blur_sigma=args.blur_sigma, ksize=tuple(args.ksize), sharpen_value=args.sharpen_value)
    sketch_image = sketcher(image)

    # Save the sketch image
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    cv2.imwrite(args.output, sketch_image)
    print(f"[Success] Sketch saved to {args.output}")


if __name__ == "__main__":
    main()
