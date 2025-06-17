import sys
import cv2
import numpy as np
import mediapipe as mp
from joblib import load
from scipy.signal import detrend, welch
import json

# Load models
model_sys = load("python_src/models/systolic_model.joblib")
model_dia = load("python_src/models/diastolic_model.joblib")

# Get video file path from Node.js
video_path = sys.argv[1]

# Initialize mediapipe
mp_face = mp.solutions.face_mesh
face_mesh = mp_face.FaceMesh(static_image_mode=False, max_num_faces=1)

# POS algorithm
def extract_pos_signal(rgb_window):
    # Implementation of POS algorithm
    pass

# Feature extraction
def extract_features(signal, fps):
    # Implementation of feature extraction
    pass

# Read video
cap = cv2.VideoCapture(video_path)
fps = cap.get(cv2.CAP_PROP_FPS)
rgb_signals = []

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Resize and convert color
    frame_rgb = cv2.cvtColor(cv2.resize(frame, (640, 480)), cv2.COLOR_BGR2RGB)
    results = face_mesh.process(frame_rgb)

    if results.multi_face_landmarks:
        landmarks = results.multi_face_landmarks[0].landmark

        # Use forehead region (landmarks between eyes)
        points = [landmarks[i] for i in [10, 338, 297, 332, 284]]
        coords = [(int(p.x * 640), int(p.y * 480)) for p in points]
        xs, ys = zip(*coords)
        x1, x2, y1, y2 = min(xs), max(xs), min(ys), max(ys)

        roi = frame_rgb[y1:y2, x1:x2]
        if roi.size == 0:
            continue

        r, g, b = np.mean(roi[:, :, 0]), np.mean(roi[:, :, 1]), np.mean(roi[:, :, 2])
        rgb_signals.append([r, g, b])

cap.release()

# Process collected signal
if len(rgb_signals) < 30:
    print("0,0")  # Fallback
    sys.exit()

pulse_signal = extract_pos_signal(rgb_signals)
features = extract_features(pulse_signal, fps)
features += [0] * (10 - len(features))  # pad to match ML model input

# Predict BP
sbp = model_sys.predict([features])[0]
dbp = model_dia.predict([features])[0]

# Determine blood pressure category
if sbp < 120 and dbp < 80:
    category = "Normal"
elif 120 <= sbp <= 129 and dbp < 80:
    category = "Elevated"
elif 130 <= sbp <= 139 or 80 <= dbp <= 89:
    category = "Hypertension Stage 1"
else:
    category = "Hypertension Stage 2"

# Output result to Node.js
result = {
    "systolic": int(round(sbp)),
    "diastolic": int(round(dbp)),
    "category": category
}
print(json.dumps(result))