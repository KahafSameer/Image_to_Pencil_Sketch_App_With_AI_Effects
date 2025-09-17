# Project Deep Technical Documentation

## Table of Contents
1. Overview
2. Project Structure
3. Working Flow
4. Models and Algorithms
    - Colorization
    - Background Removal
    - Cartoonization
    - Oil Painting
    - Photo Enhancement
    - Image Compression
5. Data Flow & User Interaction
6. API & UI Integration
7. Configuration & Extensibility
8. Error Handling & Quality Control
9. References

---

## 1. Overview
This project is an advanced image processing suite built with Python and OpenCV, providing multiple AI-powered effects such as colorization, background removal, cartoonization, oil painting, photo enhancement, and more. It is designed for extensibility and can be used as a backend for web applications or as a standalone tool.

## 2. Project Structure
```
img2sketch/
├── background_removal.py         # Background removal logic
├── colorization.py              # Enhanced colorization with denoising
├── ghibli_cartoon.py            # Ghibli-style cartoonization
├── img2Cartoon.py               # General cartoonization
├── img2Sketch.py                # Pencil sketch transformation
├── oil_painting.py              # Oil painting effect
├── photo_enhancer.py            # Photo enhancement
├── image_compression.py         # Image compression utilities
├── models/                      # Pretrained models (Caffe, Numpy)
│   ├── colorization_deploy_v2.prototxt
│   ├── colorization_release_v2.caffemodel
│   └── pts_in_hull.npy
├── static/                      # Static assets (images, scripts, styles)
├── templates/                   # HTML templates for web UI
├── run.py                       # Main Flask app entry point
├── requirements.txt             # Python dependencies
└── ...
```

## 3. Working Flow
- **User uploads/selects an image** via the web UI or API.
- **Image is processed** by the selected effect pipeline (e.g., colorization, background removal).
- **Preprocessing** (if needed): Denoising, resizing, normalization.
- **Model inference**: The relevant model is loaded and run on the image.
- **Postprocessing**: Enhancement, smoothing, or compositing as required.
- **Result is returned** to the user for download or further editing.

## 4. Models and Algorithms
### 4.1 Colorization (colorization.py)
- **Model**: Uses a Caffe-based deep neural network for colorization (`colorization_deploy_v2.prototxt`, `colorization_release_v2.caffemodel`).
- **Denoising**: Applies `cv2.fastNlMeansDenoisingColored` to reduce noise before colorization.
- **Contrast Enhancement**: Uses CLAHE (Contrast Limited Adaptive Histogram Equalization) on the luminance channel.
- **Colorization Pipeline**:
    1. Denoise input image.
    2. Enhance contrast (CLAHE).
    3. Convert to LAB color space, extract L channel.
    4. Resize and normalize L channel, run through DNN.
    5. Combine predicted AB channels with original L.
    6. Convert back to BGR, apply edge-preserving smoothing (`cv2.detailEnhance`).
    7. Quality check and save.
- **Parameters**: Denoising and CLAHE parameters are tunable for different noise levels.

### 4.2 Background Removal (background_removal.py)
- **Algorithm**: Uses OpenCV's GrabCut or deep learning segmentation to separate foreground from background.
- **Steps**:
    1. Convert image to suitable color space.
    2. Initialize mask and run GrabCut or segmentation model.
    3. Extract foreground, composite on transparent/white background.

### 4.3 Cartoonization (img2Cartoon.py, ghibli_cartoon.py)
- **Algorithm**: Bilateral filtering, edge detection, and color quantization.
- **Steps**:
    1. Denoise and smooth image.
    2. Detect edges (adaptive thresholding).
    3. Reduce color palette (k-means or quantization).
    4. Combine edges and quantized image for cartoon effect.

### 4.4 Oil Painting (oil_painting.py)
- **Algorithm**: Neighborhood intensity mapping to simulate brush strokes.
- **Steps**:
    1. For each pixel, compute intensity histogram in local window.
    2. Assign most frequent intensity/color to center pixel.

### 4.5 Photo Enhancement (photo_enhancer.py)
- **Techniques**: Sharpening, denoising, contrast/brightness adjustment, histogram equalization.

### 4.6 Image Compression (image_compression.py)
- **Algorithm**: Uses OpenCV and PIL for lossy/lossless compression, resizing, and format conversion.

## 5. Data Flow & User Interaction
- **Frontend**: HTML/JS (in `static/` and `templates/`) for user interaction, file upload, effect selection, and result display.
- **Backend**: Flask app (`run.py`) routes requests, invokes processing modules, and returns results.
- **Static/Media**: Processed images are saved in `static/media/` for download or further editing.

## 6. API & UI Integration
- **API Endpoints** (in `run.py`):
    - `/` : Main page
    - `/process` : Handles image upload and effect selection
    - `/download/<filename>` : Download processed image
- **UI**: Modular HTML templates for each effect, with JS for AJAX requests and dynamic updates.

## 7. Configuration & Extensibility
- **Adding New Effects**: Create a new Python module, add UI component, and register route in Flask app.
- **Model Management**: Place new models in `models/` and update loading logic.
- **Parameter Tuning**: Most algorithms expose parameters for denoising, enhancement, etc.

## 8. Error Handling & Quality Control
- **Input Validation**: Checks for valid image files, supported formats.
- **Model Errors**: Catches and logs model loading/inference errors.
- **Output Quality**: Checks for extreme pixel values, failed saves, and cleans up partial outputs.

## 9. References
- OpenCV Documentation: https://docs.opencv.org/
- Caffe Model Zoo: https://github.com/BVLC/caffe/wiki/Model-Zoo
- CLAHE: https://en.wikipedia.org/wiki/Adaptive_histogram_equalization
- fastNlMeansDenoisingColored: https://docs.opencv.org/4.x/d1/d79/group__photo__denoise.html
- Flask: https://flask.palletsprojects.com/

---

*This file is intended for use as a deep technical reference for AI-based documentation generation or onboarding new developers to the project.*
