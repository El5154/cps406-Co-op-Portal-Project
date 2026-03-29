const tableBody = document.getElementById("applicantTableBody");
const message = document.getElementById("message");
const logoutBtn = document.getElementById("logoutBtn");

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
    const response = await fetch(`${BASE_URL}/applicants`, {
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
    const evaluationStatus = applicant.evaluation_status ?? "Not Evaluated";
    const finalized = applicant.final_status !== "Pending";
    const submissionDone = reportStatus !== "Not Submitted";

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

          <button onclick="window.location.href = 'reviewReport.html?applicantId=${applicant.id}'" ${!submissionDone ? "disabled" : ""}>
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
      loadApplicants();
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
      loadApplicants();
    } else {
      showMessage(data.error || "Failed to finalize decision.", "error");
    }
  } catch (error) {
    showMessage("Could not connect to the server.", "error");
  }
}

async function createAccount(applicantId) {
  const passwordInput = document.getElementById(`password-${applicantId}`);
  const password = passwordInput.value.trim();

  if (!password) {
    showMessage("Please enter a password for the new account.", "error");
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/applicants/${applicantId}/create-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ password })
    });

    const data = await response.json();

    if (response.ok) {
      showMessage(
        data.message
          ? `${data.message} Username: ${data.username}`
          : "Account created successfully.",
        "success"
      );
      passwordInput.value = "";
      loadApplicants();
    } else {
      showMessage(data.error || "Failed to create account.", "error");
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

loadApplicants();