from flask import Blueprint, jsonify, request
from src.models.company import Company
from src.extensions import db
from flask_jwt_extended import jwt_required

bp = Blueprint('company', __name__, url_prefix='/api/companies')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_companies():
    companies = Company.query.order_by(Company.name).all()
    return jsonify([c.to_dict() for c in companies])

@bp.route('/', methods=['POST'])
@jwt_required()
def create_company():
    data = request.get_json()
    name = data.get('name')
    if not name:
        return jsonify({'error': 'Название компании обязательно'}), 400
    if Company.query.filter_by(name=name).first():
        return jsonify({'error': 'Компания с таким названием уже существует'}), 400
    company = Company(name=name)
    db.session.add(company)
    db.session.commit()
    return jsonify(company.to_dict()), 201

@bp.route('/<int:company_id>', methods=['DELETE'])
@jwt_required()
def delete_company(company_id):
    company = Company.query.get_or_404(company_id)
    db.session.delete(company)
    db.session.commit()
    return '', 204
