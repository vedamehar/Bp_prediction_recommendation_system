// filepath: c:\Users\vedam\OneDrive\Desktop\ASEP-2\Bp_prediction_recommendation_system\Public\static\js\result.js
// This script populates the results page with stored BP data and suggestions.

window.addEventListener('DOMContentLoaded', () => {
    const data = JSON.parse(localStorage.getItem("bpResult"));
    const errorMessage = document.getElementById("errorMessage");
    if (data) {
        document.getElementById("systolicValue").textContent = data.systolic;
        document.getElementById("diastolicValue").textContent = data.diastolic;
        document.getElementById("bpCategory").textContent = data.category;
        document.getElementById("detectedEmotion").textContent = data.emotion;
        errorMessage.style.display = "none";
        populateSuggestions(data.category);
    } else {
        errorMessage.style.display = "block";
    }
});

function populateSuggestions(category) {
    const list = document.getElementById("suggestionsList");
    list.innerHTML = "";
    const tips = {
        "Normal": ["Maintain regular checkups", "Keep exercising"],
        "Elevated": ["Reduce sodium intake", "Monitor regularly"],
        "Hypertension Stage 1": ["Consult a doctor", "Avoid stress"],
        "Hypertension Stage 2": ["Seek medical attention", "Strict diet control"]
    };
    if (tips[category]) {
        tips[category].forEach(tip => {
            const li = document.createElement("li");
            li.textContent = tip;
            list.appendChild(li);
        });
    } else {
        list.innerHTML = "<li>No suggestions available.</li>";
    }
}