const form = document.getElementById("loginForm");
const message = document.getElementById("loginMessage");
const emailInput = document.getElementById("email");
const rememberInput = document.getElementById("lembrar");

const rememberedEmail = localStorage.getItem("metro.rememberedEmail");
if (rememberedEmail) {
  emailInput.value = rememberedEmail;
  rememberInput.checked = true;
}

if (MetroApp.getSession()) {
  window.location.href = "dashboard.html";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";

  const senha = document.getElementById("senha").value;
  let result;

  try {
    result = await MetroApp.loginRemote(emailInput.value, senha);
    if (result.remoteUnavailable) {
      result = MetroApp.login(emailInput.value, senha);
    }
  } catch (error) {
    result = MetroApp.login(emailInput.value, senha);
  }

  if (!result.ok) {
    message.textContent = result.message;
    return;
  }

  if (rememberInput.checked) {
    localStorage.setItem("metro.rememberedEmail", emailInput.value.trim());
  } else {
    localStorage.removeItem("metro.rememberedEmail");
  }

  window.location.href = "dashboard.html";
});
