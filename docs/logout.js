function showMessage(text, type) {
  message.textContent = text;
  message.className = "message";
  
  if (type) {
    message.classList.add(type);
  }
}

async function handleLogout() {
  const message = document.getElementById("message");

  try {
    const response = await fetch(`${BASE_URL}/logout`, {
      method: "POST",
      credentials: "include"
    });

    if (response.ok) {
      window.location.href = "login.html";
    } else if (message) {
      showMessage("Logout failed", "error");
    }
  } catch (error) {
    if (message) {
      showMessage("Could not connect to the server.", "error");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
});