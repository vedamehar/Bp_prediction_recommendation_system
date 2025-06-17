// This file manages video recording functionalities, possibly for capturing user input.

document.addEventListener('DOMContentLoaded', () => {
    const recordButton = document.getElementById('recordButton');
    const stopButton = document.getElementById('stopButton');
    const recordedVideo = document.getElementById('recordedVideo');
    let mediaRecorder;
    let recordedBlobs = [];

    if (recordButton) {
        recordButton.addEventListener('click', startRecording);
    }

    if (stopButton) {
        stopButton.addEventListener('click', stopRecording);
    }

    function startRecording() {
        recordedBlobs = [];
        const stream = document.querySelector('video').captureStream();
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.start();
    }

    function stopRecording() {
        mediaRecorder.stop();
        recordedVideo.src = URL.createObjectURL(new Blob(recordedBlobs, { type: 'video/webm' }));
    }

    function handleDataAvailable(event) {
        if (event.data.size > 0) {
            recordedBlobs.push(event.data);
        }
    }
}
)