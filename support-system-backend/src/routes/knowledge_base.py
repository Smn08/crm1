from flask import Blueprint, request, jsonify, session
from src.models.user import db, User
from src.models.knowledge_base import KnowledgeBaseArticle

knowledge_bp = Blueprint('knowledge', __name__)

@knowledge_bp.route('/knowledgebase', methods=['GET'])
def get_articles():
    """Get all knowledge base articles"""
    try:
        category = request.args.get('category')
        search = request.args.get('search')
        
        query = KnowledgeBaseArticle.query
        
        if category:
            query = query.filter(KnowledgeBaseArticle.category == category)
        
        if search:
            query = query.filter(
                KnowledgeBaseArticle.title.contains(search) |
                KnowledgeBaseArticle.content.contains(search)
            )
        
        articles = query.order_by(KnowledgeBaseArticle.created_at.desc()).all()
        
        return jsonify([article.to_dict() for article in articles])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@knowledge_bp.route('/knowledgebase/<int:article_id>', methods=['GET'])
def get_article(article_id):
    """Get a specific knowledge base article"""
    try:
        article = KnowledgeBaseArticle.query.get_or_404(article_id)
        return jsonify(article.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@knowledge_bp.route('/knowledgebase', methods=['POST'])
def create_article():
    """Create a new knowledge base article (admin only)"""
    try:
        # Check if user is logged in and is admin
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = User.query.get(session['user_id'])
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        if not data or not data.get('title') or not data.get('content') or not data.get('category'):
            return jsonify({'error': 'Title, content, and category are required'}), 400
        
        article = KnowledgeBaseArticle(
            title=data['title'],
            content=data['content'],
            category=data['category'],
            author_id=user.id
        )
        
        db.session.add(article)
        db.session.commit()
        
        return jsonify(article.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@knowledge_bp.route('/knowledgebase/<int:article_id>', methods=['PUT'])
def update_article(article_id):
    """Update a knowledge base article (admin only)"""
    try:
        # Check if user is logged in and is admin
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = User.query.get(session['user_id'])
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        article = KnowledgeBaseArticle.query.get_or_404(article_id)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if 'title' in data:
            article.title = data['title']
        if 'content' in data:
            article.content = data['content']
        if 'category' in data:
            article.category = data['category']
        
        db.session.commit()
        
        return jsonify(article.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@knowledge_bp.route('/knowledgebase/<int:article_id>', methods=['DELETE'])
def delete_article(article_id):
    """Delete a knowledge base article (admin only)"""
    try:
        # Check if user is logged in and is admin
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = User.query.get(session['user_id'])
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        article = KnowledgeBaseArticle.query.get_or_404(article_id)
        
        db.session.delete(article)
        db.session.commit()
        
        return jsonify({'message': 'Article deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@knowledge_bp.route('/knowledgebase/categories', methods=['GET'])
def get_categories():
    """Get all available categories"""
    try:
        categories = db.session.query(KnowledgeBaseArticle.category).distinct().all()
        return jsonify([category[0] for category in categories])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

