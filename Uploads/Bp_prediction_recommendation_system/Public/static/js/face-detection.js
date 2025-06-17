// filepath: c:\Users\vedam\OneDrive\Desktop\ASEP-2\Bp_prediction_recommendation_system\Public\static\js\face-detection.js
// This file contains logic for detecting faces using a webcam or video input.

let videoElement = document.getElementById('video');
let canvasElement = document.getElementById('canvas');
let canvasContext = canvasElement.getContext('2d');
let faceDetectionModel;

// Load the face detection model
async function loadFaceDetectionModel() {
    faceDetectionModel = await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
}

// Start video stream
async function startVideoStream() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    videoElement.srcObject = stream;
}

// Detect faces in the video stream
async function detectFaces() {
    const detections = await faceapi.detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
    canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
    faceapi.draw.drawDetections(canvasElement, detections);
    faceapi.draw.drawFaceLandmarks(canvasElement, detections);
    requestAnimationFrame(detectFaces);
}

// Initialize the face detection
async function initFaceDetection() {
    await loadFaceDetectionModel();
    await startVideoStream();
    detectFaces();
}

// Call the initialization function
initFaceDetection();