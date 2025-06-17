document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('bpForm');
    const systolicInput = document.getElementById('systolicInput');
    const diastolicInput = document.getElementById('diastolicInput');

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const systolic = parseInt(systolicInput.value);
        const diastolic = parseInt(diastolicInput.value);
        const category = determineBPCategory(systolic, diastolic);

        const bpResult = {
            systolic: systolic,
            diastolic: diastolic,
            category: category
        };

        localStorage.setItem("bpResult", JSON.stringify(bpResult));
        window.location.href = '/results';
    });

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
});