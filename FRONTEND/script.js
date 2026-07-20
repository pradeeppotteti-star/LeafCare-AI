// =========================================
// LeafCare AI
// script.js
// Part 1
// =========================================

// ----------------------------
// HTML Elements
// ----------------------------

const imageInput = document.getElementById("image");

const preview = document.getElementById("preview");

const result = document.getElementById("result");

const button = document.querySelector("button");

const cameraBtn = document.getElementById("cameraBtn");

const captureBtn = document.getElementById("captureBtn");

const camera = document.getElementById("camera");

const downloadBtn = document.getElementById("downloadBtn");

const historyDiv = document.getElementById("history");

const totalPredictions = document.getElementById("totalPredictions");

const healthyCount = document.getElementById("healthyCount");

const diseaseCount = document.getElementById("diseaseCount");

const avgConfidence = document.getElementById("avgConfidence");


// ----------------------------
// Variables
// ----------------------------

let stream = null;

let lastPrediction = null;

let predictionHistory = [];


// =========================================
// IMAGE PREVIEW
// =========================================

imageInput.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) {

        preview.style.display = "none";

        result.style.display = "none";

        result.innerHTML = "";

        return;

    }

    const reader = new FileReader();

    reader.onload = function (e) {

        preview.src = e.target.result;

        preview.style.display = "block";

    };

    reader.readAsDataURL(file);

    result.style.display = "none";

    result.innerHTML = "";

});


// =========================================
// OPEN CAMERA
// =========================================

cameraBtn.addEventListener("click", async () => {

    try {

        stream = await navigator.mediaDevices.getUserMedia({

            video: {

                facingMode: "environment"

            }

        });

        camera.srcObject = stream;

        camera.style.display = "block";

        captureBtn.style.display = "block";

    }

    catch (error) {

        alert("Unable to access camera.");

        console.log(error);

    }

});


// =========================================
// CAPTURE IMAGE
// =========================================

captureBtn.addEventListener("click", () => {

    const canvas = document.createElement("canvas");

    canvas.width = camera.videoWidth;

    canvas.height = camera.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(

        camera,

        0,

        0,

        canvas.width,

        canvas.height

    );

    canvas.toBlob(function(blob){

        const file = new File(

            [blob],

            "captured_leaf.jpg",

            {

                type:"image/jpeg"

            }

        );

        const dt = new DataTransfer();

        dt.items.add(file);

        imageInput.files = dt.files;

        preview.src = URL.createObjectURL(file);

        preview.style.display = "block";

    });

    if(stream){

        stream.getTracks().forEach(track=>track.stop());

    }

    camera.style.display="none";

    captureBtn.style.display="none";

});
// =========================================
// AI PREDICTION
// =========================================

async function predictDisease() {

    const image = imageInput.files[0];

    if (!image) {

        alert("Please select or capture a tomato leaf image.");

        return;

    }

    const formData = new FormData();

    formData.append("image", image);

    button.disabled = true;

    button.innerHTML = "🔍 Analyzing...";

    downloadBtn.style.display = "none";

    result.style.display = "block";

    result.innerHTML = `

        <div class="loading-box">

            <div class="loader"></div>

            <h3>Analyzing Tomato Leaf...</h3>

            <p>Please wait while our AI model processes the image.</p>

        </div>

    `;

    const startTime = performance.now();

    try {

        const response = await fetch(

            "http://127.0.0.1:5000/predict",

            {

                method:"POST",

                body:formData

            }

        );

        const data = await response.json();

        const endTime = performance.now();

        const processingTime = ((endTime-startTime)/1000).toFixed(2);

        if(data.success===false){

            result.innerHTML=`

                <div class="result-card">

                    <h2 style="color:red;">

                        ❌ Invalid Image

                    </h2>

                    <hr>

                    <p>${data.message}</p>

                    <p>

                    Confidence :

                    ${data.confidence}%

                    </p>

                </div>

            `;

            return;

        }

        lastPrediction=data;

        downloadBtn.style.display="block";

        let badgeClass="low";

        if(data.severity==="High"){

            badgeClass="high";

        }

        else if(data.severity==="Medium"){

            badgeClass="medium";

        }

        result.innerHTML=`

            <div class="result-card">

                <h2>

                🍅 Analysis Complete

                </h2>

                <hr>

                <p>

                <b>Disease</b>

                <br>

                ${data.disease}

                </p>

                <p>

                <b>Confidence</b>

                <br>

                ${data.confidence}%

                </p>

                <p>

                <b>Processing Time</b>

                <br>

                ${processingTime} Seconds

                </p>

                <p>

                <b>Severity</b>

                <br>

                <span class="badge ${badgeClass}">

                ${data.severity}

                </span>

                </p>

                <hr>

                <p>

                <b>Symptoms</b>

                <br>

                ${data.symptoms}

                </p>

                <p>

                <b>Treatment</b>

                <br>

                ${data.treatment}

                </p>

                <p>

                <b>Prevention</b>

                <br>

                ${data.prevention}

                </p>

                <p>

                <b>Recommended Fertilizer</b>

                <br>

                ${data.fertilizer}

                </p>

            </div>

        `;

        addHistory(

            data.disease,

            data.confidence

        );

    }

    catch(error){

        console.log(error);

        result.innerHTML=`

            <div class="result-card">

                <h2 style="color:red;">

                ❌ Prediction Failed

                </h2>

                <hr>

                <p>

                Unable to connect with backend server.

                </p>

            </div>

        `;

    }

    finally{

        button.disabled=false;

        button.innerHTML="🔍 Analyze Leaf";

    }

}



// =========================================
// PDF REPORT
// =========================================

downloadBtn.addEventListener(

"click",

function(){

    if(lastPrediction==null){

        return;

    }

    const { jsPDF }=window.jspdf;

    const doc=new jsPDF();

    doc.setFontSize(20);

    doc.text(

        "LeafCare AI Report",

        20,

        20

    );

    doc.setFontSize(12);

    doc.text(

        "Disease : "+lastPrediction.disease,

        20,

        40

    );

    doc.text(

        "Confidence : "+lastPrediction.confidence+"%",

        20,

        55

    );

    doc.text(

        "Severity : "+lastPrediction.severity,

        20,

        70

    );

    doc.text(

        "Symptoms :",

        20,

        90

    );

    doc.text(

        lastPrediction.symptoms,

        20,

        100,

        {

            maxWidth:170

        }

    );

    doc.text(

        "Treatment :",

        20,

        140

    );

    doc.text(

        lastPrediction.treatment,

        20,

        150,

        {

            maxWidth:170

        }

    );

    doc.text(

        "Prevention :",

        20,

        190

    );

    doc.text(

        lastPrediction.prevention,

        20,

        200,

        {

            maxWidth:170

        }

    );

    doc.save(

        "LeafCare_AI_Report.pdf"

    );

}

);
// =========================================
// Prediction History
// =========================================

function addHistory(disease, confidence) {

    const item = {

        disease,

        confidence,

        date: new Date().toLocaleString()

    };

    predictionHistory.unshift(item);

    localStorage.setItem(

        "leafcare_history",

        JSON.stringify(predictionHistory)

    );

    loadHistory();

}



// =========================================
// Load Prediction History
// =========================================

function loadHistory() {

    predictionHistory = JSON.parse(

        localStorage.getItem("leafcare_history")

    ) || [];

    historyDiv.innerHTML = "";

    if (predictionHistory.length === 0) {

        historyDiv.innerHTML = `

        <p class="empty-history">

        No predictions yet.

        </p>

        `;

        updateDashboard();

        return;

    }

    predictionHistory.forEach(item => {

        historyDiv.innerHTML += `

        <div class="history-card">

            <h3>${item.disease}</h3>

            <p>

            Confidence :

            ${item.confidence}%

            </p>

            <p>

            ${item.date}

            </p>

        </div>

        `;

    });

    updateDashboard();

}



// =========================================
// Statistics Dashboard
// =========================================

function updateDashboard() {

    totalPredictions.textContent = predictionHistory.length;

    let healthy = 0;

    let disease = 0;

    let confidence = 0;

    predictionHistory.forEach(item => {

        confidence += Number(item.confidence);

        if (

            item.disease

            .toLowerCase()

            .includes("healthy")

        ) {

            healthy++;

        }

        else {

            disease++;

        }

    });

    healthyCount.textContent = healthy;

    diseaseCount.textContent = disease;

    if (predictionHistory.length > 0) {

        avgConfidence.textContent = (

            confidence /

            predictionHistory.length

        ).toFixed(1) + "%";

    }

    else {

        avgConfidence.textContent = "0%";

    }

}



// =========================================
// Load History on Startup
// =========================================

loadHistory();



// =========================================
// End of Script
// =========================================