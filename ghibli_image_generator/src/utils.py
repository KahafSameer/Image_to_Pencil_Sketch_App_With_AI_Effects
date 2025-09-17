def generate_ghibli_image(prompt):
    # Placeholder function for generating a Ghibli-style image
    # This function should call the model and return the generated image path or data
    pass

def save_image(image_data, filename):
    # Function to save the generated image to the static/images directory
    with open(f'static/images/{filename}', 'wb') as f:
        f.write(image_data)

def load_image(filename):
    # Function to load an image from the static/images directory
    with open(f'static/images/{filename}', 'rb') as f:
        return f.read()