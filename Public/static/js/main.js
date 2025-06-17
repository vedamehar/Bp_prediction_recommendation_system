let isDetectionRunning = false;
let isPredicting = false; // <-- Add this flag
let rppgDataCheckInterval;

import FaceDetection from './face-detection.js';
import { BloodPressurePrediction } from './bp-prediction.js';
import VideoRecorder from './recording.js';

const MIN_SAMPLES_FOR_PREDICTION = 100;

document.addEventListener('DOMContentLoaded', async function() {
    const elements = {
        startButton: document.getElementById('startDetection'),
        stopButton: document.getElementById('stopDetection'),
        predictButton: document.getElementById('predictBP'),
        loadingSpinner: document.getElementById('loadingSpinner'),
        errorMessage: document.getElementById('errorMessage'),
        webcamContainer: document.getElementById('webcamContainer'),
        webcam: document.getElementById('webcam'),
        canvas: document.getElementById('canvas'),
        dataStatus: document.getElementById('dataStatus'),
        progressBar: document.getElementById('dataProgress'),
        dataStatusContainer: document.getElementById('dataStatusContainer'),
        recordingStatus: document.getElementById('recordingStatus'),
        recordingProgress: document.getElementById('recordingProgress'),
        recordedVideo: document.getElementById('recordedVideo'),
        resultsSection: document.getElementById('resultsSection'),
        newReadingBtn: document.getElementById('newReadingBtn')
    };

    if (!elements.startButton) {
        console.error('Start button not found!');
        return;
    }

    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');

    const faceDetection = new FaceDetection();
    const bpPredictor = new BloodPressurePrediction();
    const videoRecorder = new VideoRecorder();
    let isDetectionRunning = false;
    let rppgDataCheckInterval;

    function showError(message, isFatal = false) {
        elements.errorMessage.textContent = message;
        elements.errorMessage.style.display = 'block';
        
        if (isFatal) {
            elements.startButton.disabled = true;
        }
    }

    function hideError() {
        elements.errorMessage.style.display = 'none';
    }

    function updateDataStatus() {
        if (!window.rppgBuffer) return;
        
        const validSamples = window.rppgBuffer.filter(val => !isNaN(val));
        const count = validSamples.length;
        const percent = Math.min(100, (count / MIN_SAMPLES_FOR_PREDICTION) * 100);
        
        elements.dataStatus.textContent = `${count}/${MIN_SAMPLES_FOR_PREDICTION} samples collected`;
        elements.progressBar.style.width = `${percent}%`;
        elements.progressBar.setAttribute('aria-valuenow', percent);
        elements.recordingProgress.style.width = `${percent}%`;
        
        if (count >= MIN_SAMPLES_FOR_PREDICTION && !isPredicting ) {
             isPredicting = true; // Set flag to prevent re-entry
            predictBloodPressure();
            // Stop detection and camera
            // stopDetection();
        }
    }

    elements.startButton.addEventListener('click', startDetection);
    if (elements.stopButton) elements.stopButton.addEventListener('click', stopDetection);
    if (elements.predictButton) elements.predictButton.addEventListener('click', predictBloodPressure);
    if (elements.newReadingBtn) {
        elements.newReadingBtn.addEventListener('click', () => {
            if (elements.resultsSection) {
                elements.resultsSection.style.display = 'none';
            }
            startDetection();
        });
    }

    async function startDetection() {
        if (isDetectionRunning) return;

        try {
            hideError();
            elements.loadingSpinner.style.display = 'block';
            elements.startButton.disabled = true;

            window.rppgBuffer = [];

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
                audio: false
            });

            elements.webcam.srcObject = stream;
            await new Promise((resolve) => {
                elements.webcam.onloadedmetadata = resolve;
            });

            await videoRecorder.start(stream);
            await faceDetection.startWebcam();
            // Add this delay to ensure video is ready
            await new Promise(resolve => setTimeout(resolve, 500));
            faceDetection.startDetection(handleFaceDetection);

            isDetectionRunning = true;
            elements.webcamContainer.style.display = 'block';
            elements.startButton.style.display = 'none';
            elements.stopButton.style.display = 'inline-block';
            elements.predictButton.style.display = 'inline-block';
            elements.dataStatusContainer.style.display = 'block';
            elements.recordingStatus.style.display = 'block';

            updateDataStatus();
            rppgDataCheckInterval = setInterval(updateDataStatus, 500);

        } catch (error) {
            showError(`Failed to start detection: ${error.message}`, true);
            console.error('Detection error:', error);
        } finally {
            elements.loadingSpinner.style.display = 'none';
        }
    }

    function handleFaceDetection(faceData) {
        if (faceData.detected && faceData.rppgValue) {
            bpPredictor.updateBuffer(faceData.rppgValue);
        }
    }

    async function stopDetection() {
        if (!isDetectionRunning) return;

        try {
            if (rppgDataCheckInterval) {
                clearInterval(rppgDataCheckInterval);
                rppgDataCheckInterval = null;
            }

            if (videoRecorder) {
                await videoRecorder.stop();
            }

            if (faceDetection) {
                faceDetection.stopDetection();
            }

            isDetectionRunning = false;
            elements.webcamContainer.style.display = 'none';
            elements.startButton.style.display = 'inline-block';
            elements.startButton.disabled = false;
            elements.stopButton.style.display = 'none';
            elements.predictButton.style.display = 'none';
            elements.dataStatusContainer.style.display = 'none';
            elements.recordingStatus.style.display = 'none';

        } catch (error) {
            showError(`Failed to stop detection: ${error.message}`);
            console.error('Stop detection error:', error);
        }
    }
    
    async function predictBloodPressure() {
    if (!isDetectionRunning) {
        showError('Please start face detection first');
        return;
    }

    try {
        hideError();
        elements.loadingSpinner.style.display = 'block';
        elements.predictButton.disabled = true;

        if (!window.rppgBuffer || window.rppgBuffer.length < MIN_SAMPLES_FOR_PREDICTION) {
            showError(`Need more data (${window.rppgBuffer?.length || 0}/${MIN_SAMPLES_FOR_PREDICTION} samples)`);
            isPredicting = false; // Reset flag on error
            return;
        }

        // Add retry logic for face detection
        let faceData = null;
        const maxAttempts = 5;
        let attempts = 0;
        
        while (!faceData && attempts < maxAttempts) {
            faceData = await faceDetection.getCurrentDetection();
            if (!faceData) {
                await new Promise(resolve => setTimeout(resolve, 300));
                attempts++;
                console.log(`Face detection attempt ${attempts}/${maxAttempts}`);
                // Provide user feedback
                elements.errorMessage.textContent = `Attempt ${attempts}: Adjust your position...`;
                elements.errorMessage.style.display = 'block';
            }
        }

        if (!faceData) {
            throw new Error(`No face detected after ${maxAttempts} attempts. Please ensure:
                - Your face is clearly visible
                - There is good lighting
                - You're not wearing glasses or hats that might obscure your face`);
        }
        
        const prediction = await bpPredictor.predictFromFace(faceData);
        console.log('Prediction:', prediction);

        // Check for success property if your backend returns it
        if (prediction && prediction.success !== false) {
            sessionStorage.setItem('bpPrediction', JSON.stringify(prediction));
            window.location.href = '/results';
        } else {
            // Store error message and redirect
            sessionStorage.setItem('bpPredictionError', prediction.error || 'Prediction failed. Please try again.');
            window.location.href = '/results';
        }
        
    } catch (error) {
        showError(`Prediction failed: ${error.message}`);
        console.error('Prediction error:', error);
    } finally {
        elements.loadingSpinner.style.display = 'none';
        elements.predictButton.disabled = false;    
        isPredicting = false; // Reset flag after prediction
    }
}

    function displayResults(prediction) {
        document.getElementById('systolicValue').textContent = prediction.systolic.toFixed(1);
        document.getElementById('diastolicValue').textContent = prediction.diastolic.toFixed(1);
        
        const category = determineBPCategory(prediction.systolic, prediction.diastolic);
        const categoryElement = document.getElementById('bpCategory');
        categoryElement.textContent = category.name;
        categoryElement.className = `bp-category-badge ${category.className}`;
        
        document.getElementById('detectedEmotion').textContent = 
            prediction.emotion.charAt(0).toUpperCase() + prediction.emotion.slice(1);
        
        const suggestionsList = document.getElementById('suggestionsList');
        suggestionsList.innerHTML = prediction.suggestions
            .map(suggestion => `
                <li class="list-group-item">
                    <i class="fas fa-check-circle text-success me-2"></i>
                    ${suggestion}
                </li>
            `).join('');
        
        elements.resultsSection.style.display = 'block';
        elements.webcamContainer.style.display = 'none';
        elements.predictButton.style.display = 'none';
    }

    function determineBPCategory(systolic, diastolic) {
        if (systolic < 120 && diastolic < 80) {
            return { name: 'Normal', className: 'normal' };
        } else if (systolic < 130 && diastolic < 80) {
            return { name: 'Elevated', className: 'elevated' };
        } else if (systolic < 140 || diastolic < 90) {
            return { name: 'Stage 1 Hypertension', className: 'hypertension-1' };
        } else {
            return { name: 'Stage 2 Hypertension', className: 'hypertension-2' };
        }
    }
});

