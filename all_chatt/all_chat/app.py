from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///messages.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.String(100), default=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/messages', methods=['GET'])
def get_messages():
    messages = Message.query.order_by(Message.id.asc()).all()
    return jsonify([
        {"id": msg.id, "text": msg.text, "timestamp": msg.timestamp}
        for msg in messages
    ])

@app.route('/messages', methods=['POST'])
def add_message():
    data = request.get_json()
    msg = Message(text=data['text'])
    db.session.add(msg)
    db.session.commit()
    return jsonify({"success": True, "id": msg.id})

@app.route('/messages/<int:msg_id>', methods=['DELETE'])
def delete_message(msg_id):
    msg = Message.query.get(msg_id)
    if msg:
        db.session.delete(msg)
        db.session.commit()
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Message not found"}), 404

if __name__ == '__main__':
    app.run(debug=True)
