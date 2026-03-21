const form = document.getElementById("loginForm");
const message = document.getElementById("message");
const BASE_URL = "http://localhost:3000";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  message.textContent = "";
  message.className = "message";

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    message.textContent = "Username and password are required.";
    message.classList.add("error");
    return;
  }

  try {
    const response = await fetch(BASE_URL + "/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      message.textContent = data.message || "Login successful.";
      message.classList.add("success");

      if (data.role === "coordinator") {
        window.location.href = "coordinator.html";
      } else if (data.role === "applicant") {
        window.location.href = "applicant-status.html";
      }
    } else {
      message.textContent = data.error || "Login failed.";
      message.classList.add("error");
    }
  } catch (error) {
    message.textContent = "Could not connect to the server.";
    message.classList.add("error");
  }
});