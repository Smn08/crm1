from flask import Blueprint, request, jsonify, session
from werkzeug.security import check_password_hash, generate_password_hash
from src.models.user import db, User, Company
from functools import wraps

user_bp = Blueprint('user', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        user = User.query.get(session['user_id'])
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@user_bp.route('/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400
        
        user = User.query.filter_by(username=data['username']).first()
        
        if user and check_password_hash(user.password_hash, data['password']):
            session['user_id'] = user.id
            return jsonify({
                'message': 'Login successful',
                'user': user.to_dict()
            })
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/logout', methods=['POST'])
def logout():
    """User logout"""
    session.pop('user_id', None)
    return jsonify({'message': 'Logout successful'})

@user_bp.route('/me', methods=['GET'])
def get_current_user():
    """Get current user information"""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users', methods=['GET'])
def get_users():
    """Get all users (admin only)"""
    try:
        # Check if user is logged in and is admin
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = User.query.get(session['user_id'])
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        users = User.query.all()
        return jsonify([user.to_dict() for user in users])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users', methods=['POST'])
@admin_required
def create_user():
    """Create a new user (admin only)"""
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'customer')
        company_id = data.get('company_id')
        if not username or not email or not password:
            return jsonify({'error': 'Все поля обязательны'}), 400
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Пользователь с таким именем уже существует'}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Пользователь с таким email уже существует'}), 400
        user = User(username=username, email=email, role=role, company_id=company_id)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return jsonify(user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update a user (admin only)"""
    try:
        # Check if user is logged in and is admin
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        current_user = User.query.get(session['user_id'])
        if not current_user or current_user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        user_to_update = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update fields if provided
        if 'username' in data:
            # Check if username already exists (excluding current user)
            existing_user = User.query.filter_by(username=data['username']).first()
            if existing_user and existing_user.id != user_id:
                return jsonify({'error': 'Username already exists'}), 400
            user_to_update.username = data['username']
        
        if 'email' in data:
            # Check if email already exists (excluding current user)
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != user_id:
                return jsonify({'error': 'Email already exists'}), 400
            user_to_update.email = data['email']
        
        if 'password' in data:
            user_to_update.password_hash = generate_password_hash(data['password'])
        
        if 'role' in data:
            if data['role'] not in ['customer', 'agent', 'admin']:
                return jsonify({'error': 'Invalid role'}), 400
            user_to_update.role = data['role']
        
        db.session.commit()
        
        return jsonify(user_to_update.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user (admin only)"""
    try:
        # Check if user is logged in and is admin
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        current_user = User.query.get(session['user_id'])
        if not current_user or current_user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Prevent admin from deleting themselves
        if current_user.id == user_id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        user_to_delete = User.query.get_or_404(user_id)
        
        db.session.delete(user_to_delete)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/companies', methods=['GET'])
@admin_required
def get_companies():
    """Get all companies (admin only)"""
    try:
        companies = Company.query.order_by(Company.name).all()
        return jsonify([c.to_dict() for c in companies])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/companies', methods=['POST'])
@admin_required
def create_company():
    """Create a new company (admin only)"""
    try:
        data = request.json
        name = data.get('name')
        if not name:
            return jsonify({'error': 'Company name is required'}), 400
        if Company.query.filter_by(name=name).first():
            return jsonify({'error': 'Company with this name already exists'}), 400
        company = Company(name=name)
        db.session.add(company)
        db.session.commit()
        return jsonify(company.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

