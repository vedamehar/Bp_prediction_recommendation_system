from flask import Flask, request, jsonify, render_template, redirect, url_for

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    systolic = data.get('systolic')
    diastolic = data.get('diastolic')

    if systolic is None or diastolic is None:
        return jsonify({'error': 'Invalid input'}), 400

    category = determine_bp_category(systolic, diastolic)
    result = {
        'systolic': systolic,
        'diastolic': diastolic,
        'category': category
    }

    # Store result in localStorage (client-side)
    return jsonify(result)

def determine_bp_category(systolic, diastolic):
    if systolic < 120 and diastolic < 80:
        return "Normal"
    elif 120 <= systolic < 130 and diastolic < 80:
        return "Elevated"
    elif 130 <= systolic < 140 or 80 <= diastolic < 90:
        return "Hypertension Stage 1"
    elif systolic >= 140 or diastolic >= 90:
        return "Hypertension Stage 2"
    else:
        return "Unknown"

@app.route('/results')
def results():
    return render_template('results.html')

if __name__ == '__main__':
    app.run(debug=True)