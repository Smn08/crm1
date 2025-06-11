from src.extensions import db

class Status(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    
    # Relationships
    tickets = db.relationship('Ticket', backref='status', lazy='dynamic')

    def __repr__(self):
        return f'<Status {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }

    @staticmethod
    def init_default_statuses():
        """Initialize default statuses if they don't exist"""
        default_statuses = [
            {'name': 'Open', 'description': 'Новая заявка создана заказчиком'},
            {'name': 'In Progress', 'description': 'Исполнитель работает над заявкой'},
            {'name': 'Awaiting Customer Reply', 'description': 'Ожидается ответ заказчика'},
            {'name': 'Awaiting Agent Reply', 'description': 'Ожидается ответ исполнителя'},
            {'name': 'Resolved', 'description': 'Проблема решена, ожидается подтверждение'},
            {'name': 'Closed', 'description': 'Заявка закрыта'}
        ]
        
        for status_data in default_statuses:
            if not Status.query.filter_by(name=status_data['name']).first():
                status = Status(**status_data)
                db.session.add(status)
        
        db.session.commit()

