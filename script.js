// ===================== CONFIG =====================
  // ✅ Đúng
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// ===================== STATE =====================
// Dòng 8 - SAU
// ✅ Sửa lại dòng 8
let apiKey = localStorage.getItem("gemini_api_key") || "";
let conversationHistory = []; // { role: "user"|"model", parts: [{text}] }

// ===================== ELEMENTS =====================
const apiSetup    = document.getElementById("apiSetup");
const apiKeyInput = document.getElementById("apiKeyInput");
const saveApiBtn  = document.getElementById("saveApiBtn");
const chatMessages = document.getElementById("chatMessages");
const userInput   = document.getElementById("userInput");
const sendBtn     = document.getElementById("sendBtn");
const clearBtn    = document.getElementById("clearBtn");

// ===================== INIT =====================
function init() {
  if (apiKey) {
    apiSetup.classList.add("hidden");
    apiKeyInput.value = apiKey;
  }
  userInput.focus();
}

// ===================== API KEY =====================
saveApiBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    shake(apiKeyInput);
    return;
  }
  apiKey = key;
  localStorage.setItem("gemini_api_key", key);
  apiSetup.classList.add("hidden");
  userInput.focus();
});

apiKeyInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveApiBtn.click();
});

// ===================== SEND MESSAGE =====================
sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Auto resize textarea
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 140) + "px";
});

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  if (!apiKey) {
    apiSetup.classList.remove("hidden");
    shake(apiKeyInput);
    return;
  }

  // Clear welcome message if present
  const welcome = chatMessages.querySelector(".welcome-msg");
  if (welcome) welcome.remove();

  // Append user message
  appendMessage("user", text);
  conversationHistory.push({ role: "user", parts: [{ text }] });

  // Reset input
  userInput.value = "";
  userInput.style.height = "auto";
  sendBtn.disabled = true;

  // Show typing indicator
  const typingEl = showTyping();

  try {
    const response = await callGeminiAPI(conversationHistory);
    typingEl.remove();

    const aiText = response?.candidates?.[0]?.content?.parts?.[0]?.text
      || "Xin lỗi, tôi không thể trả lời lúc này.";

    appendMessage("ai", aiText);
    conversationHistory.push({ role: "model", parts: [{ text: aiText }] });

  } catch (err) {
    typingEl.remove();
    let errorMsg = "❌ Có lỗi xảy ra: " + err.message;

    if (err.message.includes("API_KEY_INVALID") || err.message.includes("400")) {
      errorMsg = "❌ API Key không hợp lệ. Vui lòng kiểm tra lại.";
      apiSetup.classList.remove("hidden");
    }

    appendMessage("ai", errorMsg);
  }

  sendBtn.disabled = false;
  userInput.focus();
  scrollToBottom();
}

// ===================== GEMINI API CALL =====================
async function callGeminiAPI(history) {
  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: history,
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// ===================== DOM HELPERS =====================
function appendMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "Bạn" : "✦";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  chatMessages.appendChild(msg);
  scrollToBottom();
}

function showTyping() {
  const wrap = document.createElement("div");
  wrap.className = "message ai";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "✦";

  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  indicator.innerHTML = "<span></span><span></span><span></span>";

  wrap.appendChild(avatar);
  wrap.appendChild(indicator);
  chatMessages.appendChild(wrap);
  scrollToBottom();
  return wrap;
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function shake(el) {
  el.style.animation = "none";
  el.offsetHeight; // reflow
  el.style.animation = "shakeInput 0.4s ease";
  setTimeout(() => { el.style.animation = ""; }, 400);
}

// ===================== CLEAR CHAT =====================
clearBtn.addEventListener("click", () => {
  conversationHistory = [];
  chatMessages.innerHTML = "";

  const welcome = document.createElement("div");
  welcome.className = "welcome-msg";
  welcome.innerHTML = `
    <div class="welcome-icon">✦</div>
    <p>Xin chào! Tôi là Gemini. Hãy hỏi tôi bất cứ điều gì.</p>
  `;
  chatMessages.appendChild(welcome);
});

// ===================== SHAKE KEYFRAME (dynamic) =====================
const styleEl = document.createElement("style");
styleEl.textContent = `
  @keyframes shakeInput {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    40%       { transform: translateX(6px); }
    60%       { transform: translateX(-4px); }
    80%       { transform: translateX(4px); }
  }
`;
document.head.appendChild(styleEl);

// ===================== START =====================
init();