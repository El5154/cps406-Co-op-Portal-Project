const form = document.getElementById("registerForm");
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

  const name = document.getElementById("name").value.trim();
  const studentID = document.getElementById("studentID").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!name || !studentID || !email) {
    return showMessage("All fields are required.", "error");
  }

  if (!/^\d{9}$/.test(studentID)) {
    return showMessage("Student ID must be exactly 9 digits.", "error");
  }

  if (!email.endsWith("@torontomu.ca")) {
    return showMessage("Email must end with @torontomu.ca.", "error");
  }

  if (password.length < 6) {
    return showMessage("Password must be at least 6 characters long.", "error");
  }

  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        name,
        studentID,
        email,
        password
      })
    });

    const data = await response.json();

    if (response.ok) {
      showMessage(data.message || "Registration successful.", "success");
      form.reset();
    } else {
      showMessage(data.error || "Registration failed.", "error")
    }
  } catch (error) {
    showMessage("Could not connect to the server.", "error");
  }
});

backBtn.addEventListener("click", async () => {
    window.location.href = "index.html";
});