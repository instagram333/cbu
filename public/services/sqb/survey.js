const SURVEY_STORAGE_KEY = "sqb-survey-answers";
const form = document.querySelector(".survey-form");
const statusMessage = document.getElementById("statusMessage");
const submitButton = form ? form.querySelector("button[type='submit']") : null;

const setStatus = (message, type = "") => {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  statusMessage.className = "status";
  if (type) statusMessage.classList.add(`is-${type}`);
};

const getSurveyValue = () => {
  const selected = form.querySelector("input[name='answer']:checked");
  if (selected) {
    return selected.value;
  }

  const quantityInput = form.querySelector("input[name='quantity']");
  if (quantityInput) {
    const value = quantityInput.value.trim();
    if (!value) return "";

    const numericValue = Number(value);
    if (!Number.isInteger(numericValue) || numericValue < 1 || numericValue > 10) {
      return null;
    }

    return String(numericValue);
  }

  return "";
};

const syncSubmitState = () => {
  if (!submitButton) return;

  const value = getSurveyValue();
  const isReady = value !== "" && value !== null;

  submitButton.disabled = !isReady;
  submitButton.classList.toggle("is-inactive", !isReady);
  submitButton.classList.toggle("is-ready", isReady);
};

if (form) {
  form.addEventListener("change", () => {
    setStatus("");
    syncSubmitState();
  });

  form.addEventListener("input", () => {
    setStatus("");
    syncSubmitState();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const value = getSurveyValue();
    if (value === "") {
      setStatus("Iltimos, javoblardan birini tanlang.", "error");
      return;
    }

    if (value === null) {
      setStatus("Iltimos, 1 dan 10 gacha raqam kiriting.", "error");
      return;
    }

    const step = document.body.dataset.surveyStep;
    const nextUrl = form.dataset.next;
    const answers = JSON.parse(localStorage.getItem(SURVEY_STORAGE_KEY) || "{}");
    answers[`step_${step}`] = value;
    localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(answers));

    window.location.href = nextUrl;
  });

  syncSubmitState();
}
