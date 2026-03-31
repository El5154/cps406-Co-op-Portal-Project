const form = document.getElementById("loginForm");
const message = document.getElementById("message");

function showMessage(text, type) {
  message.textContent = text;
  message.className = "message";
  
  if (type) {
    message.classList.add(type);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  showMessage("", "");

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    return showMessage("Username and password are required.", "error");
  }

  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      showMessage(data.message || "Login successful.", "success");

      if (data.role === "coordinator") {
        window.location.href = "coordinator.html";
      } else if (data.role === "applicant") {
        window.location.href = "applicant-dashboard.html";
      } else if (data.role === "supervisor") {
        window.location.href = "supervisor.html";
      }
    } else {
      showMessage(data.error || "Login failed.", "error");

    }
  } catch (error) {
    showMessage("Could not connect to the server.", "error");
  }
});

backBtn.addEventListener("click", async () => {
    window.location.href = "index.html";
});