const nameSpan = document.getElementById("name");
const studentIDSpan = document.getElementById("studentID");
const provisionalStatusSpan = document.getElementById("provisionalStatus");
const finalStatusSpan = document.getElementById("finalStatus");
const message = document.getElementById("message");
const logoutBtn = document.getElementById("logoutBtn");
const BASE_URL = "http://localhost:3000";

function showMessage(text, type) {
  message.textContent = text;
  message.className = "message";

  if (type) {
    message.classList.add(type);
  }
}

async function loadApplicantStatus() {
  
  showMessage("", "");

  try {
    const response = await fetch(BASE_URL + "/applicants/status", {
      method: "GET",
      credentials: "include"
    });

    const data = await response.json();

    if (response.ok) {
      nameSpan.textContent = data.name || "-";
      studentIDSpan.textContent = data.studentID || "-";
      provisionalStatusSpan.textContent = data.provisional_status || "-";
      finalStatusSpan.textContent = data.final_status || "-";
    } else {
      showMessage(data.error || "Failed to load application status.", "error");
    }
  } catch (error) {
    showMessage("Could not connect to the server.", "error");
  }
}

logoutBtn.addEventListener("click", async () => {
  try {
    const response = await fetch(BASE_URL + "/logout", {
      method: "POST",
      credentials: "include"
    });

    if (response.ok) {
      window.location.href = "login.html";
    } else {
      showMessage("Logout failed.", "error");
    }
  } catch (error) {
    showMessage("Could not connect to the server.", "error");
  }
});

loadApplicantStatus();