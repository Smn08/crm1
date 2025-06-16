from src.extensions import db
from datetime import datetime

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('ticket.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    attachments = db.Column(db.JSON)

    def __repr__(self):
        return f'<Message {self.id} in Ticket {self.ticket_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'sender_id': self.sender_id,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'sender': self.sender.to_dict() if self.sender else None,
            'attachments': self.attachments or []
        }

