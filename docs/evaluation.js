const message = document.getElementById("message");
const uploadMessage = document.getElementById("uploadMessage");
const submitMessage = document.getElementById("submitMessage");
const logoutBtn = document.getElementById("logoutBtn");
const uploadBtn = document.getElementById("uploadBtn");
const submitBtn = document.getElementById("submitBtn");

const studentNameSpan = document.getElementById("studentName");
const studentIdSpan = document.getElementById("studentID");
const studentEmailSpan = document.getElementById("studentEmail");
const evaluationStatusSpan = document.getElementById("evaluationStatus");
const supervisorNameSpan = document.getElementById("supervisorName");
const supervisorEmailSpan = document.getElementById("supervisorEmail");
const performanceSpan = document.getElementById("overallPerformance");

function showMessage(text, type) {
  message.textContent = text;
  message.className = "message";
  if (type) {
    message.classList.add(type);
  }
}

async function loadEvaluation() {
    showMessage("", "");

    try {
        const response = await fetch(`${BASE_URL}/evaluation`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            if (response.status === 401) {
                return showMessage("You must be logged in", "error");
            }

            if (response.status === 403) {
                return showMessage("Access denied. Supervisor only.", "error");
            }

            return showMessage("Failed to load evaluation.", "error");
        }

        const evaluation = await response.json();

        renderEvaluation(evaluation);
    } catch (error) {
        showMessage("Could not connect to the server.", "error");
    }
}

function renderEvaluation(evaluation) {
    studentNameSpan.textContent = evaluation.student.name;
    studentIdSpan.textContent = evaluation.student.studentID;
    studentEmailSpan.textContent = evaluation.student.email;
    evaluationStatusSpan.textContent = evaluation.evaluation_status ?? "Not Evaluated";
    supervisorNameSpan.textContent = evaluation.supervisor.name;
    supervisorEmailSpan.textContent = evaluation.supervisor.email;
    performanceSpan.textContent = evaluation.overall_performance ?? "N/A";
}

submitBtn.addEventListener("click", async () => {
  const performance = performanceSpan.value;

  if (!performance) {
    showMessage("Please select an overall performance rating before uploading.", "error");
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/uploadEvaluation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ overallPerformance: performance })
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || "Failed to submit evaluation.", "error");
      return;
    }

    showMessage(data.message || "Evaluation submitted successfully.", "success");
  } catch (error) {
    showMessage("Could not connect to the server.", "error");
  }
});

