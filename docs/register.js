const form = document.getElementById("registerForm");
const message = document.getElementById("message");
const BASE_URL = "http://localhost:3000";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  message.textContent = "";
  message.className = "message";

  const name = document.getElementById("name").value.trim();
  const studentID = document.getElementById("studentID").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!name || !studentID || !email) {
    message.textContent = "All fields are required.";
    message.classList.add("error");
    return;
  }

  if (!/^\d{9}$/.test(studentID)) {
    message.textContent = "Student ID must be exactly 9 digits.";
    message.classList.add("error");
    return;
  }

  if (!email.endsWith("@torontomu.ca")) {
    message.textContent = "Email must end with @torontomu.ca.";
    message.classList.add("error");
    return;
  }

  try {
    const response = await fetch(BASE_URL + "/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, studentID, email })
    });

    const data = await response.json();

    if (response.ok) {
      message.textContent = data.message || "Registration successful.";
      message.classList.add("success");
      form.reset();
    } else {
      message.textContent = data.error || "Registration failed.";
      message.classList.add("error");
    }
  } catch (error) {
    message.textContent = "Could not connect to the server.";
    message.classList.add("error");
  }
});