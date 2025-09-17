from flask import Flask, render_template, request, send_file
from werkzeug.utils import secure_filename
from time import time
from hashlib import md5
from os.path import join
import os
from datetime import datetime 
from img2Sketch import PencilSketch
from img2Cartoon import Cartoon
from colorization import Colorization
from image_compression import ImageCompression
from photo_enhancer import PhotoEnhancer
from oil_painting import OilPaintingEffect
from background_removal import BackgroundRemoval
from io import BytesIO

UPLOAD_FOLDER = "./static/media/"
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Context processor to make 'now' available in all templates
@app.context_processor
def inject_now():
    return {'now': datetime.now()}

@app.route('/')
@app.route('/uploader', methods=["GET", "POST"])
def upload_file():
    if request.method == 'POST':
        fileObject = request.files['file']
        effect = request.form.get('effect', 'sketch')

        # Save the original file
        original_filename = join(app.config["UPLOAD_FOLDER"], "original.jpg")
        fileObject.seek(0)
        fileObject.save(original_filename)

        # Determine extension based on effect
        ext = '.jpg' if effect in ['compression', 'oil_painting'] else '.png'

        # Create a new name for converted file
        new_filename = secure_filename(md5(str(time()).encode()).hexdigest() + ext)
        new_filepath = join(app.config["UPLOAD_FOLDER"], new_filename)

        # Reset pointer again to reuse same fileObject
        fileObject.seek(0)

        # Apply the selected effect
        try:
            if effect == 'cartoon':
                Cartoon(fileObject).convert(new_filepath)
            elif effect == 'background_removal':
                BackgroundRemoval(fileObject).convert_to_file(new_filepath)
            elif effect == 'compression':
                ImageCompression(fileObject).compress(new_filepath, quality=60)
            elif effect == 'colorization':
                Colorization(fileObject).convert(new_filepath)
            elif effect == 'enhancer':
                PhotoEnhancer(fileObject).enhance(new_filepath)
            elif effect == 'oil_painting':
                OilPaintingEffect(fileObject).apply_oil_painting(new_filepath)
            else:
                PencilSketch().convert(new_filepath)

            return render_template('index.html', file_url=new_filepath, original_url=original_filename)
        except Exception as e:
            return render_template('index.html', error=str(e))
    else:
        return render_template('index.html')

# Crop & Rotate Editor Page
@app.route('/edit', methods=['GET', 'POST'])
def edit_image():
    if request.method == 'POST':
        file = request.files['file']
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return render_template('edit_page.html', image_path=filepath)

    return render_template('edit_page.html', image_path=None)

@app.route('/remove-bg', methods=['POST'])
def remove_bg():
    if 'image' not in request.files:
        return 'No image uploaded', 400
    file = request.files['image']
    try:
        bg_removal = BackgroundRemoval(file)
        output_io = bg_removal.convert()
        output_io.seek(0)
        return send_file(output_io, mimetype='image/png')
    except Exception as e:
        return f'Error: {str(e)}', 500

@app.route('/compress', methods=['POST'])
def compress():
    if 'image' not in request.files:
        return 'No image uploaded', 400
    file = request.files['image']
    try:
        compressor = ImageCompression(file)
        output_io = BytesIO()
        compressor.image.convert('RGB').save(output_io, "JPEG", quality=40, optimize=True)
        output_io.seek(0)
        return send_file(output_io, mimetype='image/jpeg')
    except Exception as e:
        return f'Error: {str(e)}', 500

@app.route('/colorize', methods=['POST'])
def colorize():
    if 'image' not in request.files:
        return 'No image uploaded', 400
    file = request.files['image']
    try:
        colorizer = Colorization(file)
        # Output to BytesIO instead of file path
        import tempfile
        import os
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            temp_path = tmp.name
        colorizer.convert(temp_path)
        with open(temp_path, "rb") as f:
            data = f.read()
        os.remove(temp_path)
        from io import BytesIO
        output_io = BytesIO(data)
        output_io.seek(0)
        return send_file(output_io, mimetype='image/png')
    except Exception as e:
        return f'Error: {str(e)}', 500

@app.route('/oil_paint', methods=['POST'])
def oil_paint():
    if 'image' not in request.files:
        return 'No image uploaded', 400
    file = request.files['image']
    try:
        from io import BytesIO
        painter = OilPaintingEffect(file)
        output_io = BytesIO()
        painter.apply_oil_painting(output_io)
        output_io.seek(0)  # <-- This is important!
        return send_file(output_io, mimetype='image/jpeg')
    except Exception as e:
        print("Oil painting error:", e)
        return f'Error: {str(e)}', 500

@app.route('/pencil_sketch', methods=['POST'])
def pencil_sketch():
    if 'image' not in request.files:
        return 'No image uploaded', 400
    file = request.files['image']
    try:
        import numpy as np
        import cv2
        from io import BytesIO

        # Read image from file storage
        file_bytes = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        if image is None:
            return 'Invalid image', 400

        # Get parameters from request (form or query)
        blur_sigma = request.form.get('blurSigma', type=int)
        sharpen_value = request.form.get('sharpenValue', type=int)
        # Use defaults if not provided
        if blur_sigma is None:
            blur_sigma = 5
        # ksize is always (0,0) for now
        sketcher = PencilSketch(blur_sigma=blur_sigma, ksize=(0,0), sharpen_value=sharpen_value)
        sketch = sketcher(image)

        # Encode to PNG in memory
        success, buffer = cv2.imencode('.png', sketch)
        if not success:
            return 'Encoding failed', 500
        output_io = BytesIO(buffer)
        output_io.seek(0)
        return send_file(output_io, mimetype='image/png')
    except Exception as e:
        return f'Error: {str(e)}', 500

if __name__ == '__main__':
    app.run(debug=True)
