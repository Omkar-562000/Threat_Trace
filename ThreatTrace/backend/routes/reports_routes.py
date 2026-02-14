# backend/routes/reports_routes.py
from flask import Blueprint, request, jsonify, current_app, send_file
from datetime import datetime
import io
import csv
from utils.role_guard import role_required

reports_bp = Blueprint('reports', __name__)

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def get_collection_safely(db, collection_name):
    """Get collection, return empty list if doesn't exist"""
    try:
        if collection_name in db.list_collection_names():
            return db[collection_name]
        return None
    except:
        return None


# ============================================================
# 1️⃣ GENERATE SUMMARY REPORT
# ============================================================
@reports_bp.route('/summary', methods=['POST'])
def generate_summary_report():
    """
    Generate comprehensive security summary report
    
    Request Body:
    - date_from: Start date (ISO format)
    - date_to: End date (ISO format)
    
    Returns:
    - summary: Aggregate statistics
    - alerts_by_severity: Breakdown of alerts by severity
    - alerts_by_source: Breakdown of alerts by source
    - top_threats: List of most critical alerts
    - recent_activities: Recent security events
    """
    try:
        db = current_app.config["DB"]
        
        # Get date range from request
        data = request.get_json(silent=True) or {}
        date_from = data.get('date_from', '')
        date_to = data.get('date_to', '')
        
        # Build date filter
        date_filter = {}
        if date_from or date_to:
            date_filter['timestamp'] = {}
            if date_from:
                date_filter['timestamp']['$gte'] = date_from
            if date_to:
                date_filter['timestamp']['$lte'] = date_to
        
        # ========================================
        # COLLECT DATA FROM ALL MODULES
        # ========================================
        
        # 1. ALERTS STATISTICS
        alerts_col = get_collection_safely(db, 'alerts') or get_collection_safely(db, 'system_alerts')
        total_alerts = 0
        alerts_by_severity = {}
        alerts_by_source = {}
        top_threats = []
        
        if alerts_col:
            total_alerts = alerts_col.count_documents(date_filter)
            
            # Breakdown by severity
            severity_pipeline = [
                {'$match': date_filter} if date_filter else {'$match': {}},
                {'$group': {'_id': '$severity', 'count': {'$sum': 1}}}
            ]
            severity_results = list(alerts_col.aggregate(severity_pipeline))
            alerts_by_severity = {
                item['_id']: item['count'] 
                for item in severity_results 
                if item.get('_id')
            }
            
            # Breakdown by source
            source_pipeline = [
                {'$match': date_filter} if date_filter else {'$match': {}},
                {'$group': {'_id': '$source', 'count': {'$sum': 1}}}
            ]
            source_results = list(alerts_col.aggregate(source_pipeline))
            alerts_by_source = {
                item['_id']: item['count'] 
                for item in source_results 
                if item.get('_id')
            }
            
            # Top threats (critical and high severity)
            top_threats_cursor = alerts_col.find(
                {**date_filter, 'severity': {'$in': ['critical', 'high']}}
            ).sort('timestamp', -1).limit(10)
            top_threats = [serialize_doc(alert) for alert in top_threats_cursor]
        
        # 2. RANSOMWARE SCANS
        ransomware_col = get_collection_safely(db, 'ransomware_logs')
        total_scans = 0
        if ransomware_col:
            total_scans = ransomware_col.count_documents(date_filter)
        
        # 3. AUDIT/INTEGRITY CHECKS
        audit_col = get_collection_safely(db, 'audit_logs')
        total_audits = 0
        if audit_col:
            total_audits = audit_col.count_documents(date_filter)
        
        # 4. SYSTEM LOGS
        logs_col = get_collection_safely(db, 'logs') or get_collection_safely(db, 'system_logs')
        total_logs = 0
        if logs_col:
            total_logs = logs_col.count_documents(date_filter)
        
        # 5. RECENT ACTIVITIES (from all sources)
        recent_activities = []
        
        # Get recent alerts
        if alerts_col:
            recent_alerts = alerts_col.find(date_filter).sort('timestamp', -1).limit(5)
            for alert in recent_alerts:
                recent_activities.append({
                    'message': f"{alert.get('title', 'Alert')}: {alert.get('message', '')}",
                    'timestamp': alert.get('timestamp'),
                    'source': 'alerts',
                    'severity': alert.get('severity')
                })
        
        # Get recent audits
        if audit_col:
            recent_audits = audit_col.find(date_filter).sort('last_verified', -1).limit(3)
            for audit in recent_audits:
                status = "Tampered" if audit.get('tampered') else "Clean"
                recent_activities.append({
                    'message': f"File integrity check: {audit.get('file_path', 'Unknown')} - {status}",
                    'timestamp': audit.get('last_verified'),
                    'source': 'audit'
                })
        
        # Get recent scans
        if ransomware_col:
            recent_scans = ransomware_col.find(date_filter).sort('scan_time', -1).limit(3)
            for scan in recent_scans:
                result = scan.get('result', {})
                status = "Suspicious" if result.get('high_entropy') or result.get('suspicious_patterns') else "Clean"
                recent_activities.append({
                    'message': f"Ransomware scan: {scan.get('filename', 'Unknown')} - {status}",
                    'timestamp': scan.get('scan_time'),
                    'source': 'ransomware'
                })
        
        # Sort recent activities by timestamp
        recent_activities.sort(
            key=lambda x: x.get('timestamp', ''),
            reverse=True
        )
        recent_activities = recent_activities[:20]  # Limit to 20
        
        # ========================================
        # BUILD REPORT
        # ========================================
        
        report = {
            'generated_at': datetime.utcnow().isoformat() + 'Z',
            'date_range': {
                'from': date_from,
                'to': date_to
            },
            'summary': {
                'total_alerts': total_alerts,
                'total_scans': total_scans,
                'total_audits': total_audits,
                'total_logs': total_logs
            },
            'alerts_by_severity': alerts_by_severity,
            'alerts_by_source': alerts_by_source,
            'top_threats': top_threats,
            'recent_activities': recent_activities
        }
        
        return jsonify({
            'status': 'success',
            'report': report
        }), 200
        
    except Exception as e:
        print(f"❌ generate_summary_report error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': f'Failed to generate report: {str(e)}'
        }), 500


# ============================================================
# 2️⃣ EXPORT ALERTS AS CSV (Corporate/Technical Only)
# ============================================================
@reports_bp.route('/export/alerts/csv', methods=['GET'])
@role_required('corporate', 'technical')
def export_alerts_csv():
    """
    Export alerts as CSV file (Corporate/Technical only)
    
    Query Parameters:
    - date_from: Start date filter
    - date_to: End date filter
    - severity: Severity filter
    - status: Status filter
    - source: Source filter
    """
    try:
        db = current_app.config["DB"]
        alerts_col = get_collection_safely(db, 'alerts') or get_collection_safely(db, 'system_alerts')
        
        if not alerts_col:
            return jsonify({
                'status': 'error',
                'message': 'No alerts data available'
            }), 404
        
        # Build filter query from query parameters
        query = {}
        
        severity = request.args.get('severity', '').strip()
        if severity:
            query['severity'] = severity.lower()
        
        status = request.args.get('status', '').strip()
        if status:
            query['status'] = status.lower()
        
        source = request.args.get('source', '').strip()
        if source:
            query['source'] = {'$regex': source, '$options': 'i'}
        
        date_from = request.args.get('date_from', '').strip()
        date_to = request.args.get('date_to', '').strip()
        
        if date_from or date_to:
            query['timestamp'] = {}
            if date_from:
                query['timestamp']['$gte'] = date_from
            if date_to:
                query['timestamp']['$lte'] = date_to
        
        # Fetch alerts
        alerts_cursor = alerts_col.find(query).sort('timestamp', -1).limit(10000)  # Limit for safety
        alerts = list(alerts_cursor)
        
        if not alerts:
            return jsonify({
                'status': 'error',
                'message': 'No alerts found for the given filters'
            }), 404
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Timestamp',
            'Title',
            'Message',
            'Severity',
            'Source',
            'Status',
            'Acknowledged At',
            'Acknowledged By',
            'Resolved At',
            'Resolved By'
        ])
        
        # Write data rows
        for alert in alerts:
            writer.writerow([
                alert.get('timestamp', ''),
                alert.get('title', ''),
                alert.get('message', ''),
                alert.get('severity', ''),
                alert.get('source', ''),
                alert.get('status', 'active'),
                alert.get('acknowledged_at', ''),
                alert.get('acknowledged_by', ''),
                alert.get('resolved_at', ''),
                alert.get('resolved_by', '')
            ])
        
        # Prepare file for download
        output.seek(0)
        
        # Generate filename with timestamp
        filename = f"alerts_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        print(f"❌ export_alerts_csv error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': f'Failed to export CSV: {str(e)}'
        }), 500


# ============================================================
# 3️⃣ EXPORT SUMMARY AS PDF (Corporate/Technical Only)
# ============================================================
@reports_bp.route('/export/summary/pdf', methods=['POST'])
@role_required('corporate', 'technical')
def export_summary_pdf():
    """
    Export summary report as PDF (Corporate/Technical only)
    
    Request Body:
    - date_from: Start date
    - date_to: End date
    
    Note: Requires reportlab package
    """
    try:
        # Check if reportlab is available
        try:
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.lib import colors
            from reportlab.lib.units import inch
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        except ImportError:
            return jsonify({
                'status': 'error',
                'message': 'PDF export not available. Please install reportlab: pip install reportlab'
            }), 501
        
        db = current_app.config["DB"]
        
        # Get date range from request
        data = request.get_json(silent=True) or {}
        date_from = data.get('date_from', '')
        date_to = data.get('date_to', '')
        
        # Build date filter
        date_filter = {}
        if date_from or date_to:
            date_filter['timestamp'] = {}
            if date_from:
                date_filter['timestamp']['$gte'] = date_from
            if date_to:
                date_filter['timestamp']['$lte'] = date_to
        
        # Gather statistics
        alerts_col = get_collection_safely(db, 'alerts') or get_collection_safely(db, 'system_alerts')
        ransomware_col = get_collection_safely(db, 'ransomware_logs')
        audit_col = get_collection_safely(db, 'audit_logs')
        logs_col = get_collection_safely(db, 'logs') or get_collection_safely(db, 'system_logs')
        
        total_alerts = alerts_col.count_documents(date_filter) if alerts_col else 0
        total_scans = ransomware_col.count_documents(date_filter) if ransomware_col else 0
        total_audits = audit_col.count_documents(date_filter) if audit_col else 0
        total_logs = logs_col.count_documents(date_filter) if logs_col else 0
        
        # Create PDF in memory
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#6366f1'),
            spaceAfter=30
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#4f46e5'),
            spaceAfter=12
        )
        
        # Title
        title = Paragraph("ThreatTrace Security Report", title_style)
        elements.append(title)
        
        # Date range
        date_range_text = f"Report Period: {date_from or 'All time'} to {date_to or 'Present'}"
        elements.append(Paragraph(date_range_text, styles['Normal']))
        elements.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC", styles['Normal']))
        elements.append(Spacer(1, 0.5*inch))
        
        # Summary Statistics
        elements.append(Paragraph("Summary Statistics", heading_style))
        
        summary_data = [
            ['Metric', 'Count'],
            ['Total Alerts', str(total_alerts)],
            ['Ransomware Scans', str(total_scans)],
            ['Integrity Checks', str(total_audits)],
            ['System Logs', str(total_logs)]
        ]
        
        summary_table = Table(summary_data, colWidths=[4*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(summary_table)
        elements.append(Spacer(1, 0.5*inch))
        
        # Alerts by Severity
        if alerts_col:
            elements.append(Paragraph("Alerts by Severity", heading_style))
            
            severity_pipeline = [
                {'$match': date_filter} if date_filter else {'$match': {}},
                {'$group': {'_id': '$severity', 'count': {'$sum': 1}}}
            ]
            severity_results = list(alerts_col.aggregate(severity_pipeline))
            
            if severity_results:
                severity_data = [['Severity', 'Count']]
                for item in severity_results:
                    if item.get('_id'):
                        severity_data.append([
                            item['_id'].upper(),
                            str(item['count'])
                        ])
                
                severity_table = Table(severity_data, colWidths=[4*inch, 2*inch])
                severity_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                
                elements.append(severity_table)
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        
        # Generate filename
        filename = f"threattrace_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return send_file(
            buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        print(f"❌ export_summary_pdf error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': f'Failed to export PDF: {str(e)}'
        }), 500


# ============================================================
# LEGACY PING ENDPOINT (Keep for compatibility)
# ============================================================
@reports_bp.route('/ping', methods=['GET'])
def ping():
    return jsonify({"ok": True, "msg": "reports route alive"}), 200
