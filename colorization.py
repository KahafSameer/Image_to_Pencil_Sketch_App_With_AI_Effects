import cv2
import numpy as np
from pathlib import Path

class Colorization:
    def __init__(self, fileobject):
        self.fileobject = fileobject
        self._load_models()
        
    def _load_models(self):
        """Load colorization and denoising models"""
        model_dir = Path('./models')
        
        # Colorization model
        self.color_net = cv2.dnn.readNetFromCaffe(
            str(model_dir/'colorization_deploy_v2.prototxt'),
            str(model_dir/'colorization_release_v2.caffemodel')
        )
        
        # Configure colorization layers
        pts = np.load(model_dir/'pts_in_hull.npy')
        class8 = self.color_net.getLayerId('class8_ab')
        conv8 = self.color_net.getLayerId('conv8_313_rh')
        pts = pts.transpose().reshape(2, 313, 1, 1)
        self.color_net.getLayer(class8).blobs = [pts.astype(np.float32)]
        self.color_net.getLayer(conv8).blobs = [np.full([1, 313], 2.606, dtype=np.float32)]
        
        # Denoising model (using OpenCV's fastNlMeansDenoisingColored)
        self.denoise_params = {
            'h': 3,
            'hColor': 3,
            'templateWindowSize': 7,
            'searchWindowSize': 21
        }

    def _preprocess_image(self):
        """Read and preprocess with noise reduction"""
        self.fileobject.seek(0)
        file_bytes = np.asarray(bytearray(self.fileobject.read()), dtype=np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Could not decode image")
            
        # Step 1: Initial denoising
        denoised = cv2.fastNlMeansDenoisingColored(
            img, 
            None,
            self.denoise_params['h'],
            self.denoise_params['hColor'],
            self.denoise_params['templateWindowSize'],
            self.denoise_params['searchWindowSize']
        )
        
        # Step 2: Contrast enhancement (CLAHE)
        lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        enhanced = cv2.merge((l,a,b))
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        
        # Convert to float32 for colorization
        img_rgb = (enhanced[:, :, [2, 1, 0]] / 255.0).astype(np.float32)
        img_lab = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2Lab)
        self.l_channel = img_lab[:, :, 0]
        
        return enhanced

    def _colorize_image(self, enhanced_img):
        """Perform enhanced colorization"""
        # Resize and prepare input
        l_rs = cv2.resize(self.l_channel, (224, 224))
        l_rs -= 50
        
        # Colorization
        self.color_net.setInput(cv2.dnn.blobFromImage(l_rs))
        ab_dec = self.color_net.forward()[0, :, :, :].transpose((1, 2, 0))
        ab_dec_us = cv2.resize(ab_dec, (self.l_channel.shape[1], self.l_channel.shape[0]))
        
        # Combine with original luminance
        lab_out = np.concatenate((self.l_channel[:, :, np.newaxis], ab_dec_us), axis=2)
        bgr_out = cv2.cvtColor(lab_out.astype(np.float32), cv2.COLOR_Lab2BGR)
        
        # Post-processing: Blend with denoised image
        colorized = np.clip(bgr_out * 255, 0, 255).astype(np.uint8)
        
        # Edge-preserving smoothing
        final = cv2.detailEnhance(colorized, sigma_s=10, sigma_r=0.15)
        
        return final

    def convert(self, filename):
        """Enhanced colorization pipeline"""
        try:
            # Preprocess with denoising
            enhanced_img = self._preprocess_image()
            
            # Colorize
            colorized = self._colorize_image(enhanced_img)
            
            # Final quality check
            if colorized.mean() < 10 or colorized.mean() > 245:
                raise RuntimeError("Colorization failed - extreme pixel values detected")
                
            # Save result
            if not cv2.imwrite(filename, colorized):
                raise RuntimeError("Failed to save output image")
                
            return True
            
        except Exception as e:
            if Path(filename).exists():
                Path(filename).unlink()
            raise RuntimeError(f"Enhanced colorization failed: {str(e)}")
        finally:
            self.fileobject.close()
