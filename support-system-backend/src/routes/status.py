from flask import Blueprint, jsonify
from src.models.status import Status

status_bp = Blueprint('status', __name__)

@status_bp.route('/statuses', methods=['GET'])
def get_statuses():
    statuses = Status.query.all()
    return jsonify([status.to_dict() for status in statuses])

