from flask import Flask

app = Flask(__name__)

from src.routes import *

# Additional package-level configurations can be added here if needed.