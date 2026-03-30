const message = document.getElementById("message");

const studentNameSpan = document.getElementById("studentName");
const studentIdSpan = document.getElementById("studentID");
const studentEmailSpan = document.getElementById("studentEmail");
const evaluationStatusSpan = document.getElementById("evaluationStatus");
const supervisorNameSpan = document.getElementById("supervisorName");
const supervisorEmailSpan = document.getElementById("supervisorEmail");
const performanceSelect = document.getElementById("overallPerformance");

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
        showMessage("You must be logged in", "error");
        return;
      }

      if (response.status === 403) {
        showMessage("Access denied. Supervisor only.", "error");
        return;
      }

      showMessage("Failed to load evaluation.", "error");
      return;
    }

    const evaluation = await response.json();
    renderEvaluation(evaluation);
  } catch (error) {
    showMessage("Could not connect to the server.", "error");
  }
}

function renderEvaluation(evaluation) {
  studentNameSpan.textContent = evaluation.student?.name || "-";
  studentIdSpan.textContent = evaluation.student?.studentID || "-";
  studentEmailSpan.textContent = evaluation.student?.email || "-";
  evaluationStatusSpan.textContent = evaluation.evaluation_status || "Not Evaluated";
  supervisorNameSpan.textContent = evaluation.supervisor?.name || "-";
  supervisorEmailSpan.textContent = evaluation.supervisor?.email || "-";
  performanceSelect.value = evaluation.overall_performance || "";
}

loadEvaluation();