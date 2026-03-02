/**
 * Simple Messaging Demo — Frontend Logic
 * Manages conversations, SSE streaming, and message sending.
 */

(function () {
  "use strict";

  // ── DOM References ──────────────────────────────────────
  const conversationList = document.getElementById("conversationList");
  const emptyState = document.getElementById("emptyState");
  const chatPlaceholder = document.getElementById("chatPlaceholder");
  const activeChat = document.getElementById("activeChat");
  const chatPhoneDisplay = document.getElementById("chatPhoneDisplay");
  const chatStatus = document.getElementById("chatStatus");
  const messagesContainer = document.getElementById("messagesContainer");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const newPhoneInput = document.getElementById("newPhoneInput");
  const newConvoBtn = document.getElementById("newConvoBtn");
  const connectionStatus = document.getElementById("connectionStatus");

  // ── State ───────────────────────────────────────────────
  /** @type {string|null} Currently selected phone number */
  let selectedPhone = null;

  /** @type {Map<string, {phone:string, lastMessage:string, lastTimestamp:string, messageCount:number}>} */
  const conversationsMap = new Map();

  /** @type {Map<string, Array<{id:string, phone:string, direction:string, text:string, timestamp:string}>>} */
  const messagesCache = new Map();

  // ── SSE Connection ──────────────────────────────────────
  function connectSSE() {
    const evtSource = new EventSource("/api/messages/stream");

    evtSource.onopen = () => {
      connectionStatus.textContent = "🟢 Connected";
    };

    evtSource.onerror = () => {
      connectionStatus.textContent = "🔴 Disconnected — retrying…";
    };

    evtSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleNewMessage(message);
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };
  }

  // ── Handle New Message (from SSE) ───────────────────────
  function handleNewMessage(message) {
    const { phone } = message;

    // Update conversations map
    conversationsMap.set(phone, {
      phone,
      lastMessage: message.text,
      lastTimestamp: message.timestamp,
      messageCount: (conversationsMap.get(phone)?.messageCount ?? 0) + 1,
    });

    // Update messages cache
    if (!messagesCache.has(phone)) {
      messagesCache.set(phone, []);
    }
    const msgs = messagesCache.get(phone);
    // Avoid duplicates
    if (!msgs.find((m) => m.id === message.id)) {
      msgs.push(message);
    }

    // Re-render sidebar
    renderConversationList();

    // If this conversation is currently active, append the message
    if (selectedPhone === phone) {
      renderMessages(phone);
      scrollToBottom();
    }
  }

  // ── Load Initial Conversations ──────────────────────────
  async function loadConversations() {
    try {
      const res = await fetch("/api/messages");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        json.data.forEach((conv) => conversationsMap.set(conv.phone, conv));
        renderConversationList();
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  }

  // ── Load Messages for a Phone ───────────────────────────
  async function loadMessages(phone) {
    try {
      const res = await fetch(`/api/messages/${encodeURIComponent(phone)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        messagesCache.set(phone, json.data);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }

  // ── Send Message ────────────────────────────────────────
  async function sendMessage() {
    if (!selectedPhone) return;
    const text = messageInput.value.trim();
    if (!text) return;

    sendBtn.disabled = true;
    messageInput.value = "";

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: selectedPhone, text }),
      });
      const json = await res.json();

      if (!json.success) {
        showToast(json.error?.message || "Failed to send message", true);
      }
      // The SSE stream will deliver the message back to the UI
    } catch (err) {
      showToast("Network error — could not send message", true);
      console.error("Send failed:", err);
    } finally {
      sendBtn.disabled = false;
      messageInput.focus();
    }
  }

  // ── Render: Conversation List ───────────────────────────
  function renderConversationList() {
    // Clear existing items (keep emptyState node)
    const items = conversationList.querySelectorAll(".sidebar__item");
    items.forEach((item) => item.remove());

    if (conversationsMap.size === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    // Sort by most recent
    const sorted = [...conversationsMap.values()].sort(
      (a, b) =>
        new Date(b.lastTimestamp).getTime() -
        new Date(a.lastTimestamp).getTime()
    );

    sorted.forEach((conv) => {
      const li = document.createElement("li");
      li.className = "sidebar__item";
      if (conv.phone === selectedPhone) {
        li.classList.add("sidebar__item--active");
      }

      const time = formatTime(conv.lastTimestamp);
      li.innerHTML = `
        <span class="sidebar__time">${time}</span>
        <div class="sidebar__phone">${escapeHtml(conv.phone)}</div>
        <div class="sidebar__preview">${escapeHtml(conv.lastMessage)}</div>
      `;

      li.addEventListener("click", () => selectConversation(conv.phone));
      conversationList.appendChild(li);
    });
  }

  // ── Render: Messages ────────────────────────────────────
  function renderMessages(phone) {
    messagesContainer.innerHTML = "";
    const msgs = messagesCache.get(phone) ?? [];

    msgs.forEach((msg) => {
      const div = document.createElement("div");
      div.className = `message message--${msg.direction}`;

      const time = formatTime(msg.timestamp);
      div.innerHTML = `
        <div class="message__text">${escapeHtml(msg.text)}</div>
        <div class="message__time">${time}</div>
      `;

      messagesContainer.appendChild(div);
    });
  }

  // ── Select a Conversation ──────────────────────────────
  async function selectConversation(phone) {
    selectedPhone = phone;

    // Show active chat panel
    chatPlaceholder.style.display = "none";
    activeChat.style.display = "flex";
    activeChat.style.flexDirection = "column";
    chatPhoneDisplay.textContent = phone;
    chatStatus.textContent = "";

    // Load messages if not cached
    if (!messagesCache.has(phone) || messagesCache.get(phone).length === 0) {
      chatStatus.textContent = "Loading…";
      await loadMessages(phone);
      chatStatus.textContent = "";
    }

    renderConversationList();
    renderMessages(phone);
    scrollToBottom();
    messageInput.focus();
  }

  // ── Start New Conversation ──────────────────────────────
  function startNewConversation() {
    let phone = newPhoneInput.value.trim();
    if (!phone) return;

    // Auto-add + prefix if missing
    if (!phone.startsWith("+")) {
      phone = "+" + phone;
    }

    // Basic E.164 validation
    if (!/^\+\d{10,15}$/.test(phone)) {
      showToast("Enter a valid phone number (E.164 format, e.g., +5511999990001)", true);
      return;
    }

    newPhoneInput.value = "";

    // Add to conversations map if not present
    if (!conversationsMap.has(phone)) {
      conversationsMap.set(phone, {
        phone,
        lastMessage: "",
        lastTimestamp: new Date().toISOString(),
        messageCount: 0,
      });
      messagesCache.set(phone, []);
    }

    renderConversationList();
    selectConversation(phone);
  }

  // ── Helpers ─────────────────────────────────────────────
  function scrollToBottom() {
    requestAnimationFrame(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
  }

  function formatTime(isoString) {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function showToast(message, isError = false) {
    const toast = document.createElement("div");
    toast.className = `toast${isError ? " toast--error" : ""}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // ── Event Bindings ──────────────────────────────────────
  sendBtn.addEventListener("click", sendMessage);

  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  newConvoBtn.addEventListener("click", startNewConversation);

  newPhoneInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      startNewConversation();
    }
  });

  // ── Initialize ──────────────────────────────────────────
  loadConversations();
  connectSSE();
})();
