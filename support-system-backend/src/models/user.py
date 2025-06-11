from src.extensions import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash



class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='customer')  # customer, admin, agent
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_tickets = db.relationship('Ticket', foreign_keys='Ticket.customer_id', backref='customer', lazy='dynamic')
    assigned_tickets = db.relationship('Ticket', foreign_keys='Ticket.agent_id', backref='agent', lazy='dynamic')
    messages = db.relationship('Message', backref='sender', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    @staticmethod
    def init_default_users():
        if not User.query.filter_by(username="admin").first():
            admin = User(
                username="admin",
                email="admin@example.com",
                role="admin"
            )
            admin.set_password("admin123")
            db.session.add(admin)
        if not User.query.filter_by(username="customer1").first():
            customer = User(
                username="customer1",
                email="customer1@example.com",
                role="customer"
            )
            customer.set_password("password123")
            db.session.add(customer)
        db.session.commit()
