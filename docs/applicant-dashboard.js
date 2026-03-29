const nameSpan = document.getElementById("name");
const studentIDSpan = document.getElementById("studentID");
const provisionalStatusSpan = document.getElementById("provisionalStatus");
const finalStatusSpan = document.getElementById("finalStatus");
const message = document.getElementById("message");
const uploadBtn = document.getElementById("uploadBtn");
const reportFile = document.getElementById("reportFile");
const uploadMessage = document.getElementById("uploadMessage");
const logoutBtn = document.getElementById("logoutBtn");
const reportsTableBody = document.getElementById("reportsTableBody");

function showMessage(text, type) {
  message.textContent = text;
  message.className = "message";
  if (type) message.classList.add(type);
}

function formatDateTime(value) {
  if (!value) return "-";

  const normalized = value.includes("T") ? value : value.replace(" ", "T");

  return new Date(normalized).toLocaleString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function disableUpload(message) {
  uploadBtn.disabled = true;
  reportFile.disabled = true;
  uploadMessage.textContent = message;
}

function enableUpload() {
  uploadBtn.disabled = false;
  reportFile.disabled = false;
  uploadMessage.textContent = "";
}

async function loadDashboard() {
  try {
    const response = await fetch(`${BASE_URL}/applicant/dashboard`, {
      method: "GET",
      credentials: "include"
    });

    const data = await response.json();

    if (response.ok) {
      nameSpan.textContent = data.name || "-";
      studentIDSpan.textContent = data.studentID || "-";
      provisionalStatusSpan.textContent = data.provisional_status || "-";
      finalStatusSpan.textContent = data.final_status || "-";

      reportsTableBody.innerHTML = "";
      const reportStatus = data.report_status || "Not Submitted";
      const evaluationStatus = data.evaluation_status || "Not Evaluated";
      const reportFilename = data.report_filename || null;
      const submittedAt = formatDateTime(data.report_uploaded_at);
      const deadline = formatDateTime(data.deadline);

      if (reportStatus !== "Not Submitted") {
        const row = document.createElement("tr");
        row.style.borderBottom = "1px solid #ddd";

        const filenameCell = reportFilename
          ? `<a href="${BASE_URL}/reports/${reportFilename}" target="_blank" rel="noopener">${reportFilename}</a>`
          : "-";

        row.innerHTML = `
          <td style="padding: 8px;">${reportStatus}</td>
          <td style="padding: 8px;">${filenameCell}</td>
          <td style="padding: 8px;">${submittedAt}</td>
          <td style="padding: 8px;">${deadline}</td>
          <td style="padding: 8px;">${evaluationStatus}</td>
        `;
        reportsTableBody.appendChild(row);
      } else {
        reportsTableBody.innerHTML = `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px;">${reportStatus}</td>
            <td style="padding: 8px;">-</td>
            <td style="padding: 8px;">-</td>
            <td style="padding: 8px;">${deadline}</td>
            <td style="padding: 8px;">${evaluationStatus}</td>
          </tr>
        `;
      }

      const rawDeadline = data.deadline;
      const finalStatus = data.final_status;

      if (!rawDeadline) {
        disableUpload("Upload is unavailable because no deadline has been set.");
        return;
      }

      const deadlineDate = new Date(rawDeadline);
      const now = new Date();

      if (isNaN(deadlineDate.getTime())) {
        disableUpload("Upload is unavailable because the deadline is invalid.");
        return;
      }

      if (finalStatus !== "Accepted") {
        disableUpload("Upload is only available for accepted applicants.");
        return;
      }

      if (now > deadlineDate) {
        disableUpload("Upload closed. The deadline has passed.");
        return;
      }

      enableUpload();

    } else {
      disableUpload("Could not verify upload eligibility.");
      showMessage(data.error || "Failed to load dashboard.", "error");
    }
  } catch (error) {
    disableUpload("Could not verify upload eligibility.");
    showMessage("Could not connect to the server.", "error");
  }
}

uploadBtn.addEventListener("click", async () => {
  const file = reportFile.files[0];

  if (!file) {
    showMessage("No file selected.", "error");
    return;
  }

  if (file.size === 0) {
    showMessage("Selected file is empty. Please choose a non-empty PDF", "error");
    return;
  }

  const formData = new FormData();
  formData.append("report", file);

  try {
    const response = await fetch(`${BASE_URL}/uploadReport`, {
      method: "POST",
      credentials: "include",
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      showMessage(data.message || "Report uploaded successfully.", "success");
      reportFile.value = "";
      loadDashboard();
    } else {
      showMessage(data.error || "Failed to upload report.", "error");
    }
  } catch (error) {
    showMessage("Could not connect to the server.", "error");
  }
});

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

loadDashboard();