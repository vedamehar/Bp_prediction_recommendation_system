# Blood Pressure Prediction and Recommendation System

This project is a web application designed to predict blood pressure levels using facial recognition technology and provide recommendations based on the predicted values. The application utilizes machine learning models to analyze video input and extract relevant features for blood pressure prediction.

## Project Structure

The project is organized into the following main directories and files:

- **Public/**: Contains the main application files, static assets, and templates.
  - **app.py**: The main application file that handles web server requests and responses.
  - **main.py**: Additional logic for application routing and setup.
  - **pyproject.toml**: Configuration file specifying project dependencies and metadata.
  - **static/**: Contains static assets such as CSS and JavaScript files.
    - **css/**: Contains stylesheets for the application.
      - **styles.css**: CSS styles defining the visual appearance of the web pages.
    - **js/**: Contains JavaScript files for application functionality.
      - **bp-prediction.js**: Logic for determining blood pressure categories, capturing form submissions, and handling redirection to the results page.
      - **face-detection.js**: Logic for detecting faces using webcam input.
      - **main.js**: Main functionalities and event listeners for the web application.
      - **recording.js**: Manages video recording functionalities.
      - **result.js**: Populates the results page with stored blood pressure data and suggestions.
      - **rppg.js**: Logic for extracting features from the face using remote photoplethysmography (rPPG).
  - **templates/**: Contains HTML templates for the application.
    - **index.html**: Main HTML template for user input.
    - **results.html**: HTML template for displaying blood pressure prediction results.

- **model/**: Contains files related to machine learning models and training.
  - **predict_bp.py**: Logic for predicting blood pressure using trained machine learning models.
  - **rppg_features.csv**: Stores extracted features used for training or predicting blood pressure.
  - **train_model.py**: Logic for training the machine learning models.
  - **train_model.ipynb**: Jupyter notebook for experiments or training processes.
  - **python_src/models/**: Contains saved machine learning models.
    - **diastolic_model.joblib**: Model for predicting diastolic blood pressure.
    - **systolic_model.joblib**: Model for predicting systolic blood pressure.

## Usage

1. Clone the repository to your local machine.
2. Install the required dependencies specified in `pyproject.toml`.
3. Run the application using the command:
   ```
   python app.py
   ```
4. Open your web browser and navigate to `http://localhost:5000` to access the application.
5. Follow the on-screen instructions to input video data and receive blood pressure predictions along with recommendations.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.