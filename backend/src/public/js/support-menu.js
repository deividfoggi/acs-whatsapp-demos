/**
 * Support Menu (URA) Demo — Frontend Logic
 * Monitors conversations and controls the auto-reply toggle.
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
  const connectionStatus = document.getElementById("connectionStatus");
  const autoReplyToggle = document.getElementById("autoReplyToggle");
  const toggleStatusText = document.getElementById("toggleStatusText");

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

  // ── Toggle Auto-Reply ───────────────────────────────────
  async function toggleAutoReply() {
    const enabled = autoReplyToggle.checked;

    try {
      const res = await fetch("/api/support-menu/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const json = await res.json();

      if (json.success) {
        updateToggleUI(json.data.enabled);
      } else {
        // Revert toggle on error
        autoReplyToggle.checked = !enabled;
        showToast(json.error?.message || "Failed to toggle", true);
      }
    } catch (err) {
      autoReplyToggle.checked = !enabled;
      showToast("Network error — could not toggle auto-reply", true);
      console.error("Toggle failed:", err);
    }
  }

  /** Check the current status of the auto-reply mode. */
  async function loadToggleStatus() {
    try {
      const res = await fetch("/api/support-menu/status");
      const json = await res.json();
      if (json.success) {
        autoReplyToggle.checked = json.data.enabled;
        updateToggleUI(json.data.enabled);
      }
    } catch (err) {
      console.error("Failed to load toggle status:", err);
    }
  }

  function updateToggleUI(enabled) {
    toggleStatusText.textContent = enabled ? "Auto-reply ON" : "Auto-reply OFF";
    toggleStatusText.style.color = enabled ? "var(--success)" : "var(--text-secondary)";
  }

  // ── Render: Conversation List ───────────────────────────
  function renderConversationList() {
    const items = conversationList.querySelectorAll(".sidebar__item");
    items.forEach((item) => item.remove());

    if (conversationsMap.size === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

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
        <div class="sidebar__preview">${escapeHtml(truncate(conv.lastMessage, 40))}</div>
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
        <div class="message__text">${formatWhatsAppText(msg.text)}</div>
        <div class="message__time">${time}</div>
      `;

      messagesContainer.appendChild(div);
    });
  }

  // ── Select a Conversation ──────────────────────────────
  async function selectConversation(phone) {
    selectedPhone = phone;

    chatPlaceholder.style.display = "none";
    activeChat.style.display = "flex";
    activeChat.style.flexDirection = "column";
    chatPhoneDisplay.textContent = phone;
    chatStatus.textContent = "";

    if (!messagesCache.has(phone) || messagesCache.get(phone).length === 0) {
      chatStatus.textContent = "Loading…";
      await loadMessages(phone);
      chatStatus.textContent = "";
    }

    renderConversationList();
    renderMessages(phone);
    scrollToBottom();
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

  function truncate(text, maxLen) {
    if (!text) return "";
    return text.length > maxLen ? text.substring(0, maxLen) + "…" : text;
  }

  /**
   * Converts basic WhatsApp formatting (* for bold) and newlines to HTML.
   */
  function formatWhatsAppText(text) {
    if (!text) return "";
    let html = escapeHtml(text);
    // Bold: *text* → <strong>text</strong>
    html = html.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
    // Line breaks
    html = html.replace(/\n/g, "<br>");
    return html;
  }

  function showToast(message, isError = false) {
    const toast = document.createElement("div");
    toast.className = `toast${isError ? " toast--error" : ""}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // ── Event Bindings ──────────────────────────────────────
  autoReplyToggle.addEventListener("change", toggleAutoReply);

  // ── Initialize ──────────────────────────────────────────
  loadConversations();
  loadToggleStatus();
  connectSSE();
})();
