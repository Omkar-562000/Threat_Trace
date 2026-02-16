# backend/routes/alerts_routes.py
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from bson import ObjectId
from utils.role_guard import role_required
from flask_jwt_extended import get_jwt_identity, get_jwt
from utils.security_audit import log_security_event

alerts_bp = Blueprint('alerts', __name__)

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def serialize_alert(alert):
    """Convert MongoDB alert document to JSON-serializable format"""
    if alert and "_id" in alert:
        alert["_id"] = str(alert["_id"])
    return alert


def get_alerts_collection():
    """Get alerts collection from database"""
    db = current_app.config["DB"]
    # Try both collection names for compatibility
    if "alerts" in db.list_collection_names():
        return db["alerts"]
    elif "system_alerts" in db.list_collection_names():
        return db["system_alerts"]
    else:
        # Create new collection
        return db["alerts"]


# ============================================================
# 1️⃣ GET ALL ALERTS WITH FILTERS & PAGINATION
# ============================================================
@alerts_bp.route('/', methods=['GET'])
@role_required('personal', 'corporate', 'technical')
def get_alerts():
    """
    Get all alerts with optional filters and pagination
    
    Query Parameters:
    - severity: Filter by severity (critical, high, medium, low, info)
    - status: Filter by status (active, acknowledged, resolved)
    - source: Filter by source (ransomware, audit, system, etc.)
    - date_from: Filter by start date (ISO format)
    - date_to: Filter by end date (ISO format)
    - page: Page number (default: 1)
    - per_page: Items per page (default: 50, max: 100)
    """
    try:
        collection = get_alerts_collection()
        
        # Build filter query
        query = {}
        
        # Filter by severity
        severity = request.args.get('severity', '').strip()
        if severity:
            query['severity'] = severity.lower()
        
        # Filter by status
        status = request.args.get('status', '').strip()
        if status:
            query['status'] = status.lower()
        else:
            # Default: show active and acknowledged alerts
            query['status'] = {'$in': ['active', 'acknowledged']}
        
        # Filter by source
        source = request.args.get('source', '').strip()
        if source:
            query['source'] = {'$regex': source, '$options': 'i'}
        
        # Filter by date range
        date_from = request.args.get('date_from', '').strip()
        date_to = request.args.get('date_to', '').strip()
        
        if date_from or date_to:
            query['timestamp'] = {}
            if date_from:
                query['timestamp']['$gte'] = date_from
            if date_to:
                query['timestamp']['$lte'] = date_to
        
        # Pagination
        page = max(1, int(request.args.get('page', 1)))
        per_page = min(100, max(1, int(request.args.get('per_page', 50))))
        skip = (page - 1) * per_page
        
        # Get total count
        total = collection.count_documents(query)
        
        # Get alerts
        alerts_cursor = collection.find(query).sort('timestamp', -1).skip(skip).limit(per_page)
        alerts = [serialize_alert(alert) for alert in alerts_cursor]
        
        return jsonify({
            'status': 'success',
            'alerts': alerts,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        }), 200
        
    except Exception as e:
        print(f"❌ get_alerts error: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to fetch alerts: {str(e)}'
        }), 500


# ============================================================
# 2️⃣ GET ALERT STATISTICS
# ============================================================
@alerts_bp.route('/stats', methods=['GET'])
@role_required('personal', 'corporate', 'technical')
def get_alert_stats():
    """
    Get alert statistics
    
    Returns:
    - total: Total number of alerts
    - active: Number of active alerts
    - acknowledged: Number of acknowledged alerts
    - resolved: Number of resolved alerts
    - by_severity: Breakdown by severity level
    - by_source: Breakdown by source
    """
    try:
        collection = get_alerts_collection()
        
        # Get counts by status
        total = collection.count_documents({})
        active = collection.count_documents({'status': 'active'})
        acknowledged = collection.count_documents({'status': 'acknowledged'})
        resolved = collection.count_documents({'status': 'resolved'})
        
        # Breakdown by severity
        severity_pipeline = [
            {'$group': {'_id': '$severity', 'count': {'$sum': 1}}}
        ]
        severity_results = list(collection.aggregate(severity_pipeline))
        by_severity = {item['_id']: item['count'] for item in severity_results if item['_id']}
        
        # Breakdown by source
        source_pipeline = [
            {'$group': {'_id': '$source', 'count': {'$sum': 1}}}
        ]
        source_results = list(collection.aggregate(source_pipeline))
        by_source = {item['_id']: item['count'] for item in source_results if item['_id']}
        
        return jsonify({
            'status': 'success',
            'stats': {
                'total': total,
                'active': active,
                'acknowledged': acknowledged,
                'resolved': resolved,
                'by_severity': by_severity,
                'by_source': by_source
            }
        }), 200
        
    except Exception as e:
        print(f"❌ get_alert_stats error: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to fetch statistics: {str(e)}'
        }), 500


# ============================================================
# 3️⃣ ACKNOWLEDGE SINGLE ALERT
# ============================================================
@alerts_bp.route('/<alert_id>/acknowledge', methods=['POST'])
@role_required('personal', 'corporate', 'technical')
def acknowledge_alert(alert_id):
    """
    Acknowledge a single alert
    
    Request Body:
    - acknowledged_by: User who acknowledged (optional)
    """
    try:
        collection = get_alerts_collection()
        
        # Validate ObjectId
        try:
            obj_id = ObjectId(alert_id)
        except:
            return jsonify({
                'status': 'error',
                'message': 'Invalid alert ID'
            }), 400
        
        # Get acknowledged_by from request
        data = request.get_json(silent=True) or {}
        acknowledged_by = data.get('acknowledged_by', 'user')
        claims = get_jwt() or {}
        identity = get_jwt_identity()
        
        # Update alert
        result = collection.update_one(
            {'_id': obj_id},
            {
                '$set': {
                    'status': 'acknowledged',
                    'acknowledged_at': datetime.utcnow().isoformat() + 'Z',
                    'acknowledged_by': acknowledged_by
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({
                'status': 'error',
                'message': 'Alert not found'
            }), 404

        log_security_event(
            action="acknowledge_alert",
            status="success",
            severity="info",
            details={"alert_id": alert_id, "acknowledged_by": acknowledged_by},
            target="alerts",
            user_id=str(identity) if identity is not None else None,
            role=claims.get("role"),
            source="alerts_api",
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Alert acknowledged successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ acknowledge_alert error: {e}")
        log_security_event(
            action="acknowledge_alert",
            status="failed",
            severity="medium",
            details={"alert_id": alert_id, "error": str(e)},
            target="alerts",
            source="alerts_api",
        )
        return jsonify({
            'status': 'error',
            'message': f'Failed to acknowledge alert: {str(e)}'
        }), 500


# ============================================================
# 4️⃣ RESOLVE SINGLE ALERT
# ============================================================
@alerts_bp.route('/<alert_id>/resolve', methods=['POST'])
@role_required('personal', 'corporate', 'technical')
def resolve_alert(alert_id):
    """
    Resolve a single alert
    
    Request Body:
    - resolved_by: User who resolved (optional)
    - note: Resolution note (optional)
    """
    try:
        collection = get_alerts_collection()
        
        # Validate ObjectId
        try:
            obj_id = ObjectId(alert_id)
        except:
            return jsonify({
                'status': 'error',
                'message': 'Invalid alert ID'
            }), 400
        
        # Get data from request
        data = request.get_json(silent=True) or {}
        resolved_by = data.get('resolved_by', 'user')
        note = data.get('note', '')
        claims = get_jwt() or {}
        identity = get_jwt_identity()
        
        # Update alert
        update_data = {
            'status': 'resolved',
            'resolved_at': datetime.utcnow().isoformat() + 'Z',
            'resolved_by': resolved_by
        }
        
        if note:
            update_data['resolution_note'] = note
        
        result = collection.update_one(
            {'_id': obj_id},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({
                'status': 'error',
                'message': 'Alert not found'
            }), 404

        log_security_event(
            action="resolve_alert",
            status="success",
            severity="info",
            details={"alert_id": alert_id, "resolved_by": resolved_by},
            target="alerts",
            user_id=str(identity) if identity is not None else None,
            role=claims.get("role"),
            source="alerts_api",
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Alert resolved successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ resolve_alert error: {e}")
        log_security_event(
            action="resolve_alert",
            status="failed",
            severity="medium",
            details={"alert_id": alert_id, "error": str(e)},
            target="alerts",
            source="alerts_api",
        )
        return jsonify({
            'status': 'error',
            'message': f'Failed to resolve alert: {str(e)}'
        }), 500


# ============================================================
# 5️⃣ DELETE ALERT (TECHNICAL ONLY)
# ============================================================
@alerts_bp.route('/<alert_id>', methods=['DELETE'])
@role_required('technical')
def delete_alert(alert_id):
    """
    Delete an alert (Technical role only)
    """
    try:
        collection = get_alerts_collection()
        claims = get_jwt() or {}
        identity = get_jwt_identity()
        
        # Validate ObjectId
        try:
            obj_id = ObjectId(alert_id)
        except:
            return jsonify({
                'status': 'error',
                'message': 'Invalid alert ID'
            }), 400
        
        # Delete alert
        result = collection.delete_one({'_id': obj_id})
        
        if result.deleted_count == 0:
            return jsonify({
                'status': 'error',
                'message': 'Alert not found'
            }), 404

        log_security_event(
            action="delete_alert",
            status="success",
            severity="high",
            details={"alert_id": alert_id},
            target="alerts",
            user_id=str(identity) if identity is not None else None,
            role=claims.get("role"),
            source="alerts_api",
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Alert deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ delete_alert error: {e}")
        log_security_event(
            action="delete_alert",
            status="failed",
            severity="high",
            details={"alert_id": alert_id, "error": str(e)},
            target="alerts",
            source="alerts_api",
        )
        return jsonify({
            'status': 'error',
            'message': f'Failed to delete alert: {str(e)}'
        }), 500


# ============================================================
# 6️⃣ BULK ACKNOWLEDGE ALERTS
# ============================================================
@alerts_bp.route('/bulk/acknowledge', methods=['POST'])
@role_required('personal', 'corporate', 'technical')
def bulk_acknowledge_alerts():
    """
    Acknowledge multiple alerts at once
    
    Request Body:
    - alert_ids: List of alert IDs
    - acknowledged_by: User who acknowledged (optional)
    """
    try:
        collection = get_alerts_collection()
        
        # Get data from request
        data = request.get_json(silent=True) or {}
        alert_ids = data.get('alert_ids', [])
        acknowledged_by = data.get('acknowledged_by', 'user')
        claims = get_jwt() or {}
        identity = get_jwt_identity()
        
        if not alert_ids or not isinstance(alert_ids, list):
            return jsonify({
                'status': 'error',
                'message': 'alert_ids must be a non-empty array'
            }), 400
        
        # Convert to ObjectIds
        try:
            obj_ids = [ObjectId(aid) for aid in alert_ids]
        except:
            return jsonify({
                'status': 'error',
                'message': 'Invalid alert ID format'
            }), 400
        
        # Bulk update
        result = collection.update_many(
            {'_id': {'$in': obj_ids}},
            {
                '$set': {
                    'status': 'acknowledged',
                    'acknowledged_at': datetime.utcnow().isoformat() + 'Z',
                    'acknowledged_by': acknowledged_by
                }
            }
        )

        log_security_event(
            action="bulk_acknowledge_alerts",
            status="success",
            severity="info",
            details={"count": result.modified_count},
            target="alerts",
            user_id=str(identity) if identity is not None else None,
            role=claims.get("role"),
            source="alerts_api",
        )

        return jsonify({
            'status': 'success',
            'message': f'{result.modified_count} alerts acknowledged',
            'modified_count': result.modified_count
        }), 200
        
    except Exception as e:
        print(f"❌ bulk_acknowledge_alerts error: {e}")
        log_security_event(
            action="bulk_acknowledge_alerts",
            status="failed",
            severity="medium",
            details={"error": str(e)},
            target="alerts",
            source="alerts_api",
        )
        return jsonify({
            'status': 'error',
            'message': f'Failed to acknowledge alerts: {str(e)}'
        }), 500


# ============================================================
# 7️⃣ BULK RESOLVE ALERTS
# ============================================================
@alerts_bp.route('/bulk/resolve', methods=['POST'])
@role_required('personal', 'corporate', 'technical')
def bulk_resolve_alerts():
    """
    Resolve multiple alerts at once
    
    Request Body:
    - alert_ids: List of alert IDs
    - resolved_by: User who resolved (optional)
    """
    try:
        collection = get_alerts_collection()
        
        # Get data from request
        data = request.get_json(silent=True) or {}
        alert_ids = data.get('alert_ids', [])
        resolved_by = data.get('resolved_by', 'user')
        claims = get_jwt() or {}
        identity = get_jwt_identity()
        
        if not alert_ids or not isinstance(alert_ids, list):
            return jsonify({
                'status': 'error',
                'message': 'alert_ids must be a non-empty array'
            }), 400
        
        # Convert to ObjectIds
        try:
            obj_ids = [ObjectId(aid) for aid in alert_ids]
        except:
            return jsonify({
                'status': 'error',
                'message': 'Invalid alert ID format'
            }), 400
        
        # Bulk update
        result = collection.update_many(
            {'_id': {'$in': obj_ids}},
            {
                '$set': {
                    'status': 'resolved',
                    'resolved_at': datetime.utcnow().isoformat() + 'Z',
                    'resolved_by': resolved_by
                }
            }
        )

        log_security_event(
            action="bulk_resolve_alerts",
            status="success",
            severity="info",
            details={"count": result.modified_count},
            target="alerts",
            user_id=str(identity) if identity is not None else None,
            role=claims.get("role"),
            source="alerts_api",
        )

        return jsonify({
            'status': 'success',
            'message': f'{result.modified_count} alerts resolved',
            'modified_count': result.modified_count
        }), 200
        
    except Exception as e:
        print(f"❌ bulk_resolve_alerts error: {e}")
        log_security_event(
            action="bulk_resolve_alerts",
            status="failed",
            severity="medium",
            details={"error": str(e)},
            target="alerts",
            source="alerts_api",
        )
        return jsonify({
            'status': 'error',
            'message': f'Failed to resolve alerts: {str(e)}'
        }), 500


# ============================================================
# LEGACY PING ENDPOINT (Keep for compatibility)
# ============================================================
@alerts_bp.route('/ping', methods=['GET'])
def ping():
    return jsonify({"ok": True, "msg": "alerts route alive"}), 200
