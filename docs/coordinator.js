const tableBody = document.getElementById("applicantTableBody");
const message = document.getElementById("message");
const logoutBtn = document.getElementById("logoutBtn");

const showAllBtn = document.getElementById("showAllBtn");
const showLateBtn = document.getElementById("showLateBtn");

const mailBtn = document.getElementById("mail");
const closeBtn = document.getElementById("closeBtn");
const sendBtn = document.getElementById("sendBtn");

const popup = document.getElementById("popup");
const overlay = document.getElementById("overlay");

let currentView = `${BASE_URL}/applicants`;

function showMessage(text, type) {
  message.textContent = text;
  message.className = "message";
  if (type) {
    message.classList.add(type);
  }
}

async function loadApplicants() {
  showMessage("", "");

  try {
    const response = await fetch(currentView, {
      method: "GET",
      credentials: "include"
    });

    if (!response.ok) {
      if (response.status === 401) {
        showMessage("You must be logged in.", "error");
        return;
      }

      if (response.status === 403) {
        showMessage("Access denied. Coordinator only.", "error");
        return;
      }

      showMessage("Failed to load applicants.", "error");
      return;
    }

    const applicants = await response.json();
    renderApplicants(applicants);
  } catch (error) {
    showMessage("Could not connect to the server.", "error");
  }
}

function renderApplicants(applicants) {
  tableBody.innerHTML = "";

  applicants.forEach((applicant) => {
    const row = document.createElement("tr");

    const reportStatus = applicant.report_status ?? "Not Submitted";
    const finalized = applicant.final_status !== "Pending";

    row.innerHTML = `
      <td>${applicant.name}</td>
      <td>${applicant.studentID}</td>
      <td>${applicant.email}</td>
      <td>${applicant.provisional_status}</td>
      <td>${applicant.final_status}</td>
      <td>${reportStatus}</td>
      <td>
        <div class="actions">
          <select id="status-${applicant.id}" ${finalized ? "disabled" : ""}>
            <option value="">Select Status</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>

          <button onclick="updateStatus(${applicant.id})" ${finalized ? "disabled" : ""}>
            Update Status
          </button>

          <button onclick="finalizeDecision(${applicant.id})" ${finalized ? "disabled" : ""}>
            Finalize
          </button>

          <button onclick="window.location.href = 'reviewReport.html?applicantId=${applicant.id}'" ${!finalized ? "disabled" : ""}>
            Review Reports
          </button>
        </div>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

async function updateStatus(applicantId) {
  const select = document.getElementById(`status-${applicantId}`);
  const provisional_status = select.value;

  if (!provisional_status) {
    showMessage("Please select Accepted or Rejected.", "error");
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/applicants/${applicantId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ provisional_status })
    });

    const data = await response.json();

    if (response.ok) {
      showMessage(data.message || "Status updated successfully.", "success");
      loadApplicants(currentView);
    } else {
      showMessage(data.error || "Failed to update status.", "error");
    }
  } catch (error) {
    showMessage("Could not connect to the server.", "error");
  }
}

async function finalizeDecision(applicantId) {
  try {
    const response = await fetch(`${BASE_URL}/applicants/${applicantId}/finalize`, {
      method: "PATCH",
      credentials: "include"
    });

    const data = await response.json();

    if (response.ok) {
      showMessage(data.message || "Decision finalized successfully.", "success");
      loadApplicants(currentView);
    } else {
      showMessage(data.error || "Failed to finalize decision.", "error");
    }
  } catch (error) {
    showMessage("Could not connect to the server.", "error");
  }
}

logoutBtn.addEventListener("click", async () => {
  try {
    const response = await fetch(`${BASE_URL}/logout`, {
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

function setActiveButton(activeBtn) {
  showAllBtn.classList.remove("active");
  showLateBtn.classList.remove("active");
  activeBtn.classList.add("active");
}

showAllBtn.addEventListener("click", () => {
  setActiveButton(showAllBtn);
  currentView = `${BASE_URL}/applicants`;
  loadApplicants();
});

showLateBtn.addEventListener("click", () => {
  setActiveButton(showLateBtn);
  currentView = `${BASE_URL}/applicants/missed-deadlines`;
  loadApplicants();
});

mailBtn.addEventListener("click",() => {
  popup.classList.remove("hidden");
  overlay.classList.remove("hidden");
})

closeBtn.addEventListener("click", closePopup);
sendBtn.addEventListener("click", () => {
  const res = sendMail();

  if (res) {
    closePopup();
    showMessage("Emails sent successfully. Note: This is a demo, so no actual emails were sent.", "success");
  }
});
overlay.addEventListener("click", closePopup);

function closePopup() {
  popup.classList.add("hidden");
  overlay.classList.add("hidden");
}

function sendMail() {
  return true;
}

loadApplicants();