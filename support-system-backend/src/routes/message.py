from flask import Blueprint, jsonify, request, session
from src.models.user import User, db
from src.models.ticket import Ticket
from src.models.message import Message
from src.routes.user import login_required

message_bp = Blueprint('message', __name__)

@message_bp.route('/tickets/<int:ticket_id>/messages', methods=['POST'])
@login_required
def create_message(ticket_id):
    data = request.json
    user = User.query.get(session['user_id'])
    ticket = Ticket.query.get_or_404(ticket_id)
    
    # Check access permissions
    if user.role == 'customer' and ticket.customer_id != user.id:
        return jsonify({'error': 'Access denied'}), 403
    elif user.role == 'agent' and ticket.agent_id != user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    message = Message(
        ticket_id=ticket_id,
        sender_id=user.id,
        content=data['content']
    )
    
    db.session.add(message)
    
    # Update ticket status based on who sent the message
    ticket.update_status_based_on_action(user.role)
    
    db.session.commit()
    
    return jsonify(message.to_dict()), 201

@message_bp.route('/tickets/<int:ticket_id>/messages', methods=['GET'])
@login_required
def get_messages(ticket_id):
    user = User.query.get(session['user_id'])
    ticket = Ticket.query.get_or_404(ticket_id)
    
    # Check access permissions
    if user.role == 'customer' and ticket.customer_id != user.id:
        return jsonify({'error': 'Access denied'}), 403
    elif user.role == 'agent' and ticket.agent_id != user.id and ticket.agent_id is not None:
        return jsonify({'error': 'Access denied'}), 403
    
    messages = Message.query.filter_by(ticket_id=ticket_id).order_by(Message.created_at.asc()).all()
    
    return jsonify([message.to_dict() for message in messages])

