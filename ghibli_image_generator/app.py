from flask import Flask
from src.routes import main_routes

app = Flask(__name__)

# Configuration settings can be added here
app.config['UPLOAD_FOLDER'] = 'static/images'

# Registering the routes
app.register_blueprint(main_routes)

if __name__ == '__main__':
    app.run(debug=True)