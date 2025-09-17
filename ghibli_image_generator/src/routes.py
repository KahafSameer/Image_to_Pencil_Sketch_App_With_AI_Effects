from flask import Blueprint, request, jsonify, send_file
from src.model import generate_ghibli_image
import os

routes = Blueprint('routes', __name__)

@routes.route('/generate-image', methods=['POST'])
def generate_image():
    data = request.get_json()
    prompt = data.get('prompt')

    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400

    # Call the model to generate the image
    image_path = generate_ghibli_image(prompt)

    if not os.path.exists(image_path):
        return jsonify({'error': 'Image generation failed'}), 500

    return send_file(image_path, mimetype='image/png')