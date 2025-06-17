class FaceDetection {
    constructor() {
        this.webcamElement = document.getElementById('webcam');
        this.canvasElement = document.getElementById('canvas');
        this.webcam = null;
        this.isModelLoaded = false;
        this.detectionInterval = null;
        this.detectionRate = 30;
        this.lastDetectionTime = 0;
        this.faceDetectionCount = 0;
        this.minFaceDetectionCount = 5;
    }

    async loadModels() {
        try {
            console.log('Loading face detection models...');
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/static/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/static/models')
            ]);
            this.isModelLoaded = true;
            console.log('Face detection models loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading models:', error);
            throw error;
        }
    }

    async startWebcam() {
        if (!this.isModelLoaded) {
            await this.loadModels();
        }

        return new Promise((resolve, reject) => {
            if (navigator.mediaDevices?.getUserMedia) {
                navigator.mediaDevices.getUserMedia({
                    video: { 
                        width: 640, 
                        height: 480, 
                        facingMode: 'user',
                        frameRate: { ideal: 30, max: 30 }
                    },
                    audio: false
                }).then(stream => {
                    this.webcamElement.srcObject = stream;
                    this.webcam = stream;
                    this.webcamElement.addEventListener('loadedmetadata', () => {
                        this.canvasElement.width = this.webcamElement.videoWidth;
                        this.canvasElement.height = this.webcamElement.videoHeight;
                        console.log(`Webcam started at ${this.webcamElement.videoWidth}x${this.webcamElement.videoHeight}`);
                        resolve(true);
                    });
                }).catch(reject);
            } else {
                reject(new Error('Webcam not supported'));
            }
        });
    }

    async startDetection(onFaceDetected = null) {
        if (!this.webcam) {
            await this.startWebcam();
        }

        // Add this check to ensure video is ready
        await new Promise((resolve) => {
            if (this.webcamElement.readyState >= 3) { // HAVE_FUTURE_DATA
                resolve();
            } else {
                this.webcamElement.addEventListener('canplay', resolve, { once: true });
            }
        });

      

        const canvas = this.canvasElement;
        const displaySize = {
            width: this.webcamElement.videoWidth,
            height: this.webcamElement.videoHeight
        };
        faceapi.matchDimensions(canvas, displaySize);

        this.detectionInterval = setInterval(async () => {
            try {
                const now = Date.now();
                if (now - this.lastDetectionTime < 1000 / this.detectionRate) {
                    return;
                }
                this.lastDetectionTime = now;

                const detections = await faceapi.detectAllFaces(
                    this.webcamElement,
                    new faceapi.TinyFaceDetectorOptions()
                ).withFaceLandmarks();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(this.webcamElement, 0, 0, canvas.width, canvas.height);

                faceapi.draw.drawDetections(canvas, resizedDetections);
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

                if (resizedDetections.length > 0) {
                    this.faceDetectionCount++;
                    
                    if (this.faceDetectionCount >= this.minFaceDetectionCount) {
                        const faceData = {
                            detected: true,
                            landmarks: resizedDetections[0].landmarks.positions,
                            boundingBox: resizedDetections[0].detection.box,
                            timestamp: Date.now()
                        };

                        try {
                            if (window.rPPG && typeof window.rPPG.extractForeheadROI === 'function') {
                                const roi = window.rPPG.extractForeheadROI(faceData.landmarks);
                                
                                if (roi && roi.x >= 0 && roi.y >= 0 && roi.width > 0 && roi.height > 0) {
                                    const greenMean = window.rPPG.extractGreenMean(ctx, roi);
                                    
                                    if (!isNaN(greenMean) && greenMean > 0) {
                                        window.rPPG.addToBuffer(greenMean);
                                        faceData.rppgValue = greenMean;
                                        
                                        ctx.strokeStyle = 'lime';
                                        ctx.lineWidth = 2;
                                        ctx.strokeRect(roi.x, roi.y, roi.width, roi.height);
                                    }
                                }
                            }
                        } catch (error) {
                            console.error('rPPG processing error:', error);
                        }

                        if (typeof onFaceDetected === 'function') {
                            onFaceDetected(faceData);
                        }
                    }
                } else {
                    this.faceDetectionCount = 0;
                    if (typeof onFaceDetected === 'function') {
                        onFaceDetected({ detected: false });
                    }
                }
            } catch (error) {
                console.error('Detection error:', error);
                if (typeof onFaceDetected === 'function') {
                    onFaceDetected({ detected: false, error: error.message });
                }
            }
        }, 1000 / this.detectionRate);
    }

    stopDetection() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
            console.log('Face detection stopped');
        }
        this.stopWebcam();
    }

    stopWebcam() {
        if (this.webcam) {
            this.webcam.getTracks().forEach(track => {
                track.stop();
                console.log('Stopped webcam track:', track.kind);
            });
            this.webcamElement.srcObject = null;
            this.webcam = null;
        }
        
        const ctx = this.canvasElement.getContext('2d');
        ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }

    async getCurrentDetection() {
        if (!this.webcam || !this.isModelLoaded) return null;
        
        try {
            const detection = await faceapi.detectSingleFace(
                this.webcamElement,
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks();

            if (!detection) return null;

            return {
                landmarks: detection.landmarks.positions,
                boundingBox: detection.detection.box,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Detection error:', error);
            return null;
        }
    }
}

export default FaceDetection;
window.FaceDetection = FaceDetection;