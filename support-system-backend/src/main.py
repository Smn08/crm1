import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.extensions import db
from src.models.status import Status
from src.models.ticket import Ticket
from src.models.message import Message
from src.models.knowledge_base import KnowledgeBaseArticle
from src.routes.user import user_bp
from src.routes.ticket import ticket_bp
from src.routes.message import message_bp
from src.routes.status import status_bp
from src.routes.knowledge_base import knowledge_bp
from src.routes.company import bp as company_bp
from src.models.user import db, User

app = Flask(__name__, 
            static_folder=os.path.join(os.path.dirname(__file__), 'static'),
            static_url_path='')
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes with detailed configuration
CORS(app, 
     origins=['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5002', 'http://127.0.0.1:5002'],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(ticket_bp, url_prefix='/api')
app.register_blueprint(message_bp, url_prefix='/api')
app.register_blueprint(status_bp, url_prefix='/api')
app.register_blueprint(knowledge_bp, url_prefix='/api')
app.register_blueprint(company_bp, url_prefix='/api')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
with app.app_context():
    db.create_all()
    # Initialize default statuses
    Status.init_default_statuses()
    # Initialize default knowledge base articles
    KnowledgeBaseArticle.init_default_articles()
    User.init_default_users()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path == "":
        return send_from_directory(app.static_folder, 'index.html')
    
    try:
        return send_from_directory(app.static_folder, path)
    except:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
