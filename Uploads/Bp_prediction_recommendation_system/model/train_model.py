import pandas as pd
from joblib import load, dump

# Load the dataset
data = pd.read_csv('rppg_features.csv')

# Split the dataset into features and target variables
X = data.drop(columns=['systolic', 'diastolic'])
y_systolic = data['systolic']
y_diastolic = data['diastolic']

# Load the models
model_sys = load('python_src/models/systolic_model.joblib')
model_dia = load('python_src/models/diastolic_model.joblib')

# Train the models (this is a placeholder, actual training logic will depend on the model)
model_sys.fit(X, y_systolic)
model_dia.fit(X, y_diastolic)

# Save the trained models
dump(model_sys, 'python_src/models/systolic_model.joblib')
dump(model_dia, 'python_src/models/diastolic_model.joblib')