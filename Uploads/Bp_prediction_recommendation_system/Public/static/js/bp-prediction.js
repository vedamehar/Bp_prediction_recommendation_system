// filepath: c:\Users\vedam\OneDrive\Desktop\ASEP-2\Bp_prediction_recommendation_system\Public\static\js\bp-prediction.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bpForm'); // Assuming there's a form with this ID
    form.addEventListener('submit', handleFormSubmit);
});

function handleFormSubmit(event) {
    event.preventDefault();

    const systolic = parseInt(document.getElementById('systolicInput').value); // Assuming input fields with these IDs
    const diastolic = parseInt(document.getElementById('diastolicInput').value);
    const category = determineBPCategory(systolic, diastolic);

    const result = {
        systolic: systolic,
        diastolic: diastolic,
        category: category
    };

    localStorage.setItem('bpResult', JSON.stringify(result));
    window.location.href = '/results'; // Redirect to results page
}

function determineBPCategory(systolic, diastolic) {
    if (systolic < 120 && diastolic < 80) {
        return "Normal";
    } else if (systolic >= 120 && systolic < 130 && diastolic < 80) {
        return "Elevated";
    } else if (systolic >= 130 && systolic < 140 || diastolic >= 80 && diastolic < 90) {
        return "Hypertension Stage 1";
    } else {
        return "Hypertension Stage 2";
    }
}