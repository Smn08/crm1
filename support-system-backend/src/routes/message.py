from flask import Blueprint, jsonify, request, session, current_app, send_from_directory
from src.models.user import User, db
from src.models.ticket import Ticket
from src.models.message import Message
from src.routes.user import login_required
from src.routes.ticket import allowed_file, save_file
import os

message_bp = Blueprint('message', __name__)

@message_bp.route('/tickets/<int:ticket_id>/messages', methods=['POST'])
@login_required
def create_message(ticket_id):
    user = User.query.get(session['user_id'])
    ticket = Ticket.query.get_or_404(ticket_id)
    
    # Check access permissions
    if user.role == 'customer' and ticket.customer_id != user.id:
        return jsonify({'error': 'Access denied'}), 403
    elif user.role == 'agent' and ticket.agent_id != user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    content = request.form.get('content', '')
    
    message = Message(
        ticket_id=ticket_id,
        sender_id=user.id,
        content=content
    )
    
    db.session.add(message)
    db.session.flush()  # Get message ID
    
    # Handle file attachments
    files = request.files.getlist('attachments')
    attachments = []
    errors = []
    
    for file in files:
        if not file or not file.filename:
            continue
            
        if not allowed_file(file):
            errors.append(f"File '{file.filename}' is not allowed. Supported formats: JPG, PNG, GIF, PDF, TXT (max 5MB)")
            continue
            
        filename = save_file(file, f"{ticket_id}/messages/{message.id}")
        if filename:
            attachments.append(filename)
        else:
            errors.append(f"Failed to save file '{file.filename}'")
    
    if errors:
        db.session.rollback()
        return jsonify({'error': '\n'.join(errors)}), 400
    
    if attachments:
        message.attachments = attachments
    
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

@message_bp.route('/uploads/tickets/<int:ticket_id>/messages/<int:message_id>/<path:filename>', methods=['GET'])
@login_required
def download_message_attachment(ticket_id, message_id, filename):
    user = User.query.get(session['user_id'])
    ticket = Ticket.query.get_or_404(ticket_id)
    message = Message.query.get_or_404(message_id)
    
    # Check access permissions
    if user.role == 'customer' and ticket.customer_id != user.id:
        return jsonify({'error': 'Access denied'}), 403
    elif user.role == 'agent' and ticket.agent_id != user.id and ticket.agent_id is not None:
        return jsonify({'error': 'Access denied'}), 403
    
    if message.ticket_id != ticket_id:
        return jsonify({'error': 'Access denied'}), 403
    
    if not message.attachments or filename not in message.attachments:
        return jsonify({'error': 'File not found'}), 404
    
    directory = os.path.join(current_app.config['UPLOAD_FOLDER'], str(ticket_id), 'messages', str(message_id))
    return send_from_directory(directory, filename)

