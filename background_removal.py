from flask import Flask, request, send_file, jsonify
from rembg import remove
import numpy as np
import cv2
from io import BytesIO

app = Flask(__name__)

class BackgroundRemoval:
    def __init__(self, file):
        self.file = file

    def convert(self):
        try:
            self.file.seek(0)
            file_bytes = np.frombuffer(self.file.read(), np.uint8)
            input_image = cv2.imdecode(file_bytes, cv2.IMREAD_UNCHANGED)
            
            if input_image is None:
                raise ValueError("Invalid image file")
                
            # Check for grayscale/single channel images
            if len(input_image.shape) < 3:
                input_image = cv2.cvtColor(input_image, cv2.COLOR_GRAY2RGB)
            elif input_image.shape[2] == 1:
                input_image = cv2.cvtColor(input_image, cv2.COLOR_GRAY2RGB)
            elif input_image.shape[2] == 3:
                input_image = cv2.cvtColor(input_image, cv2.COLOR_BGR2RGB)
            elif input_image.shape[2] == 4:
                input_image = cv2.cvtColor(input_image, cv2.COLOR_BGRA2RGBA)
            
            output_image = remove(input_image)
            
            # Convert back for OpenCV
            if output_image.shape[2] == 4:
                output_image = cv2.cvtColor(output_image, cv2.COLOR_RGBA2BGRA)
            else:
                output_image = cv2.cvtColor(output_image, cv2.COLOR_RGB2BGR)
            
            success, buffer = cv2.imencode('.png', output_image)
            if not success:
                raise ValueError("Image encoding failed")
                
            return BytesIO(buffer)
            
        finally:
            self.file.close()

@app.route('/remove-bg', methods=['POST'])
def remove_bg():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Empty file uploaded'}), 400
        
    try:
        bg_removal = BackgroundRemoval(file)
        output_io = bg_removal.convert()
        output_io.seek(0)
        return send_file(
            output_io,
            mimetype='image/png',
            as_attachment=True,
            download_name='background_removed.png'
        )
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        app.logger.error(f"Processing error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)