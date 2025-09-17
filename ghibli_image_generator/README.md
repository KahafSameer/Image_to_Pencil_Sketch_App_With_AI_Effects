# Ghibli Image Generator

This project is a Flask web application that generates Ghibli-style images based on user prompts. It utilizes a machine learning model to create images that capture the essence of Studio Ghibli's artistic style.

## Project Structure

```
ghibli_image_generator
├── app.py                # Entry point of the Flask application
├── requirements.txt      # Project dependencies
├── src                   # Source code for the application
│   ├── __init__.py      # Initializes the src package
│   ├── routes.py        # Defines Flask routes
│   ├── model.py         # Logic for image generation model
│   └── utils.py         # Utility functions
├── static
│   └── images           # Directory for storing generated images
├── templates
│   └── index.html       # HTML template for user interface
└── README.md            # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd ghibli_image_generator
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

## Usage

1. Run the application:
   ```
   python app.py
   ```

2. Open your web browser and navigate to `http://127.0.0.1:5000`.

3. Enter a prompt in the provided input field and submit to generate a Ghibli-style image.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or features.

## License

This project is licensed under the MIT License. See the LICENSE file for details.