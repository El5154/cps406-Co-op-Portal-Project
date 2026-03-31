const username = document.getElementById("username");
const password = document.getElementById("password");
const registerBtn = document.getElementById("submit");
const backBtn = document.getElementById("backBtn");
const message = document.getElementById("message");

function showMessage(text, type) {
    message.textContent = text;
    message.className = "message";
    if (type) {
        message.classList.add(type);
    }
}

registerBtn.addEventListener("click", async() => {
    const usernameValue = username.value.trim();
    const passwordValue = password.value;

    if (!usernameValue || !passwordValue) {
        return showMessage("Username and password are required.", "error");
    }

    try {
        const response = await fetch(`${BASE_URL}/register/supervisor`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: usernameValue,
                password: passwordValue
            })
        })

        const data = await response.json();

        if (response.ok) {
            showMessage(data.message || "Registration successful.", "success");
        } else {
            showMessage(data.error || "Registration failed.", "error");
        }
    } catch (error) {
        showMessage("An error occured during registration.", "error");
    }
})

backBtn.addEventListener("click", async () => {
    window.location.href = "index.html";
});