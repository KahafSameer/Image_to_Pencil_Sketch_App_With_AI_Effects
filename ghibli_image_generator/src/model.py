from flask import jsonify
import random

def generate_ghibli_image(prompt):
    # Simulate image generation based on the prompt
    # In a real application, this function would call a machine learning model
    image_id = random.randint(1, 1000)  # Simulating an image ID
    image_url = f"/static/images/ghibli_image_{image_id}.png"  # Simulated image URL
    return image_url

def process_prompt(prompt):
    # Here you can add any processing logic for the prompt if needed
    return prompt.strip()  # Example: stripping whitespace from the prompt