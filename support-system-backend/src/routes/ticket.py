from flask import Blueprint, jsonify, request, session
from src.models.user import User, db
from src.models.ticket import Ticket
from src.models.status import Status
from src.routes.user import login_required, admin_required
from functools import wraps
from telegram_notify import send_telegram_message

ticket_bp = Blueprint('ticket', __name__)

def agent_or_admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        user = User.query.get(session['user_id'])
        if not user or user.role not in ['admin', 'agent']:
            return jsonify({'error': 'Agent or admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@ticket_bp.route('/tickets', methods=['POST'])
@login_required
def create_ticket():
    data = request.json
    user = User.query.get(session['user_id'])
    
    # Only customers can create tickets
    if user.role != 'customer':
        return jsonify({'error': 'Only customers can create tickets'}), 403
    
    # Get "Pending Moderation" status
    pending_status = Status.query.filter_by(name='Pending Moderation').first()
    if not pending_status:
        return jsonify({'error': 'Pending Moderation status not found'}), 500
    
    ticket = Ticket(
        customer_id=user.id,
        title=data['title'],
        description=data['description'],
        priority=data.get('priority', 'Medium'),
        status_id=pending_status.id
    )
    db.session.add(ticket)
    db.session.commit()
    
    # Формируем расширенное уведомление
    customer_name = user.username
    customer_email = user.email
    company = getattr(user, 'company', None) or 'Не указана'
    msg = f"<b>Новая заявка #{ticket.id}</b>\n" \
          f"<b>Тема:</b> {ticket.title}\n" \
          f"<b>Описание:</b> {ticket.description}\n" \
          f"<b>Заказчик:</b> {customer_name} ({customer_email})\n" \
          f"<b>Компания:</b> {company}"
    send_telegram_message(msg)
    
    return jsonify(ticket.to_dict()), 201

@ticket_bp.route('/tickets', methods=['GET'])
@login_required
def get_tickets():
    user = User.query.get(session['user_id'])
    
    # Build query based on user role
    if user.role == 'customer':
        # Customers see only their tickets
        tickets = Ticket.query.filter_by(customer_id=user.id)
    elif user.role == 'agent':
        # Agents see tickets assigned to them or unassigned tickets
        tickets = Ticket.query.filter(
            (Ticket.agent_id == user.id) | (Ticket.agent_id == None)
        )
    else:  # admin
        # Admins see all tickets
        tickets = Ticket.query
    
    # Apply filters
    status_filter = request.args.get('status')
    priority_filter = request.args.get('priority')
    agent_filter = request.args.get('agent_id')
    
    if status_filter:
        status = Status.query.filter_by(name=status_filter).first()
        if status:
            tickets = tickets.filter_by(status_id=status.id)
    
    if priority_filter:
        tickets = tickets.filter_by(priority=priority_filter)
    
    if agent_filter and user.role == 'admin':
        tickets = tickets.filter_by(agent_id=agent_filter)
    
    # Order by creation date (newest first)
    tickets = tickets.order_by(Ticket.created_at.desc()).all()
    
    return jsonify([ticket.to_dict() for ticket in tickets])

@ticket_bp.route('/tickets/<int:ticket_id>', methods=['GET'])
@login_required
def get_ticket(ticket_id):
    user = User.query.get(session['user_id'])
    ticket = Ticket.query.get_or_404(ticket_id)
    
    # Check access permissions
    if user.role == 'customer' and ticket.customer_id != user.id:
        return jsonify({'error': 'Access denied'}), 403
    elif user.role == 'agent' and ticket.agent_id != user.id and ticket.agent_id is not None:
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify(ticket.to_dict(include_messages=True))

@ticket_bp.route('/tickets/<int:ticket_id>/assign', methods=['PUT'])
@admin_required
def assign_ticket(ticket_id):
    data = request.json
    ticket = Ticket.query.get_or_404(ticket_id)
    agent = User.query.get_or_404(data['agent_id'])
    
    if agent.role != 'agent':
        return jsonify({'error': 'User is not an agent'}), 400
    
    ticket.agent_id = agent.id
    
    # Update status to "In Progress"
    in_progress_status = Status.query.filter_by(name='In Progress').first()
    if in_progress_status:
        ticket.status_id = in_progress_status.id
    
    db.session.commit()
    
    # Уведомление о назначении исполнителя
    msg = f"<b>Заявка #{ticket.id}</b> назначена исполнителю: <b>{agent.username}</b>"
    send_telegram_message(msg)
    
    return jsonify(ticket.to_dict())

@ticket_bp.route('/tickets/<int:ticket_id>/status', methods=['PUT'])
@agent_or_admin_required
def update_ticket_status(ticket_id):
    data = request.json
    ticket = Ticket.query.get_or_404(ticket_id)
    user = User.query.get(session['user_id'])
    
    # Check if agent is assigned to this ticket
    if user.role == 'agent' and ticket.agent_id != user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    old_status = ticket.status.name if ticket.status else ''
    new_status = Status.query.filter_by(name=data['status']).first()
    if not new_status:
        return jsonify({'error': 'Invalid status'}), 400
    
    ticket.status_id = new_status.id
    
    # If closing ticket, set closed_at
    if data['status'] == 'Closed':
        from datetime import datetime
        ticket.closed_at = datetime.utcnow()
    
    db.session.commit()
    
    # Уведомление о закрытии заявки
    if data['status'] == 'Closed':
        msg = f"<b>Заявка #{ticket.id}</b> закрыта!"\
              f"\nТема: {ticket.title}"
        send_telegram_message(msg)
    
    return jsonify(ticket.to_dict())

@ticket_bp.route('/tickets/<int:ticket_id>/priority', methods=['PUT'])
@admin_required
def update_ticket_priority(ticket_id):
    data = request.json
    ticket = Ticket.query.get_or_404(ticket_id)
    
    valid_priorities = ['Low', 'Medium', 'High', 'Critical']
    if data['priority'] not in valid_priorities:
        return jsonify({'error': 'Invalid priority'}), 400
    
    ticket.priority = data['priority']
    db.session.commit()
    
    return jsonify(ticket.to_dict())

@ticket_bp.route('/tickets/stats', methods=['GET'])
@login_required
def ticket_stats():
    user = User.query.get(session['user_id'])
    query = Ticket.query
    if user.role == 'agent':
        query = query.filter_by(agent_id=user.id)
    elif user.role == 'customer':
        query = query.filter_by(customer_id=user.id)
    tickets = query.all()
    def count_status(name):
        status = Status.query.filter_by(name=name).first()
        if not status:
            return 0
        return sum(1 for t in tickets if t.status_id == status.id)
    return jsonify({
        'total': len(tickets),
        'pending_moderation': count_status('Pending Moderation'),
        'open': count_status('Open'),
        'in_progress': count_status('In Progress'),
        'awaiting_customer': count_status('Awaiting Customer Reply'),
        'awaiting_agent': count_status('Awaiting Agent Reply'),
        'resolved': count_status('Resolved'),
        'closed': count_status('Closed'),
    })

