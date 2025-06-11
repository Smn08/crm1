from src.extensions import db
from datetime import datetime

class Ticket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    agent_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    status_id = db.Column(db.Integer, db.ForeignKey('status.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), nullable=False, default='Medium')  # Low, Medium, High, Critical
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    messages = db.relationship('Message', backref='ticket', lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Ticket {self.id}: {self.title}>'

    def to_dict(self, include_messages=False):
        result = {
            'id': self.id,
            'customer_id': self.customer_id,
            'agent_id': self.agent_id,
            'status_id': self.status_id,
            'title': self.title,
            'description': self.description,
            'priority': self.priority,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None,
            'customer': self.customer.to_dict() if self.customer else None,
            'agent': self.agent.to_dict() if self.agent else None,
            'status': self.status.to_dict() if self.status else None
        }
        
        if include_messages:
            result['messages'] = [msg.to_dict() for msg in self.messages.order_by('created_at')]
            
        return result

    def update_status_based_on_action(self, action_user_role, new_status_name=None):
        """Update ticket status based on user action"""
        from src.models.status import Status
        
        if new_status_name:
            # Explicit status change
            new_status = Status.query.filter_by(name=new_status_name).first()
            if new_status:
                self.status_id = new_status.id
        else:
            # Automatic status change based on message sender
            if action_user_role == 'agent':
                # Agent replied, waiting for customer
                awaiting_customer = Status.query.filter_by(name='Awaiting Customer Reply').first()
                if awaiting_customer:
                    self.status_id = awaiting_customer.id
            elif action_user_role == 'customer':
                # Customer replied, waiting for agent
                awaiting_agent = Status.query.filter_by(name='Awaiting Agent Reply').first()
                if awaiting_agent:
                    self.status_id = awaiting_agent.id
        
        self.updated_at = datetime.utcnow()
        db.session.commit()

