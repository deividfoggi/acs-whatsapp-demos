/**
 * Template Messaging — Frontend Logic
 * WhatsApp Communication Demos
 *
 * Handles: template browsing, sending predefined templates, SSE for
 * delivery status + inbound replies (including interactive button taps),
 * and follow-up free-form messaging within the 24-hour window.
 */
(function () {
  "use strict";

  // ── DOM References ──────────────────────────────────────────────────
  const connectionStatus = document.getElementById("connectionStatus");
  const templateList = document.getElementById("templateList");
  const refreshBtn = document.getElementById("refreshBtn");
  const phoneInput = document.getElementById("phoneInput");
  const templateSelect = document.getElementById("templateSelect");
  const templateDescription = document.getElementById("templateDescription");
  const paramFields = document.getElementById("paramFields");
  const buttonsPreview = document.getElementById("buttonsPreview");
  const buttonLabels = document.getElementById("buttonLabels");
  const sendBtn = document.getElementById("sendBtn");
  const sendResult = document.getElementById("sendResult");
  const conversationSection = document.getElementById("conversationSection");
  const convoPlaceholder = document.getElementById("convoPlaceholder");
  const convoMessages = document.getElementById("convoMessages");
  const convoCompose = document.getElementById("convoCompose");
  const convoPhone = document.getElementById("convoPhone");
  const followUpInput = document.getElementById("followUpInput");
  const followUpBtn = document.getElementById("followUpBtn");

  // ── State ───────────────────────────────────────────────────────────
  let predefinedTemplates = [];
  let acsTemplates = [];      // Templates fetched from the ACS channel
  let currentPhone = null;
  let messages = []; // Messages for the active conversation

  // ── Initialization ──────────────────────────────────────────────────
  loadTemplates();
  loadPredefinedTemplates();
  connectSSE();

  templateSelect.addEventListener("change", onTemplateSelected);
  sendBtn.addEventListener("click", sendTemplate);
  followUpBtn.addEventListener("click", sendFollowUp);
  refreshBtn.addEventListener("click", loadTemplates);
  followUpInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendFollowUp();
    }
  });

  // ── Template Browser ────────────────────────────────────────────────
  function loadTemplates() {
    templateList.innerHTML =
      '<p class="tmpl-browser__loading">Loading templates…</p>';
    templateSelect.innerHTML = '<option value="">— Loading templates… —</option>';

    fetch("/api/templates")
      .then(function (res) {
        return res.json();
      })
      .then(function (result) {
        if (!result.success) {
          templateList.innerHTML =
            '<p class="tmpl-browser__error">Failed to load templates.</p>';
          templateSelect.innerHTML = '<option value="">— Failed to load —</option>';
          return;
        }
        acsTemplates = result.data || [];
        renderTemplateList(acsTemplates);
        populateTemplateSelect();
      })
      .catch(function () {
        templateList.innerHTML =
          '<p class="tmpl-browser__error">Error fetching templates.</p>';
        templateSelect.innerHTML = '<option value="">— Error loading —</option>';
      });
  }

  function renderTemplateList(templates) {
    if (!templates || templates.length === 0) {
      templateList.innerHTML =
        '<p class="tmpl-browser__empty">No templates found on this channel.</p>';
      return;
    }

    var html = "";
    templates.forEach(function (t) {
      var statusClass =
        t.status === "approved"
          ? "tmpl-card__status--approved"
          : "tmpl-card__status--other";
      html +=
        '<div class="tmpl-card">' +
        '<div class="tmpl-card__name">' +
        escapeHtml(t.name) +
        "</div>" +
        '<div class="tmpl-card__meta">' +
        '<span class="tmpl-card__lang">' +
        escapeHtml(t.language || "—") +
        "</span>" +
        '<span class="tmpl-card__status ' +
        statusClass +
        '">' +
        escapeHtml(t.status || "unknown") +
        "</span>" +
        "</div>" +
        (t.content
          ? '<div class="tmpl-card__content">' +
            escapeHtml(
              typeof t.content === "string"
                ? t.content.substring(0, 120)
                : ""
            ) +
            "</div>"
          : "") +
        "</div>";
    });
    templateList.innerHTML = html;
  }

  // ── Predefined Templates ───────────────────────────────────────────
  function loadPredefinedTemplates() {
    fetch("/api/templates/predefined")
      .then(function (res) {
        return res.json();
      })
      .then(function (result) {
        if (!result.success) return;
        predefinedTemplates = result.data;
        populateTemplateSelect();
      })
      .catch(function (err) {
        console.error("Failed to load predefined templates:", err);
      });
  }

  function populateTemplateSelect() {
    var html = '<option value="">— Select a template —</option>';
    acsTemplates.forEach(function (t, index) {
      var isApproved = (t.status || "").toLowerCase() === "approved";
      var label = escapeHtml(t.name || "Unnamed");
      if (t.language) {
        label += " (" + escapeHtml(t.language) + ")";
      }
      if (!isApproved) {
        label += " — " + escapeHtml(t.status || "unknown");
      }
      html +=
        '<option value="' + index + '"' +
        (!isApproved ? ' disabled class="tmpl-select__option--disabled"' : '') +
        ">" + label + "</option>";
    });
    templateSelect.innerHTML = html;
  }

  function onTemplateSelected() {
    var selectedIndex = templateSelect.value;
    paramFields.innerHTML = "";
    buttonsPreview.style.display = "none";
    templateDescription.textContent = "";
    sendBtn.disabled = true;

    if (selectedIndex === "" || selectedIndex == null) return;

    var acsTmpl = acsTemplates[parseInt(selectedIndex, 10)];
    if (!acsTmpl) return;

    // Try to find a matching predefined template for parameter definitions
    var tmpl = predefinedTemplates.find(function (t) {
      return t.templateName === acsTmpl.name && t.language === acsTmpl.language;
    });

    if (tmpl) {
      templateDescription.textContent = tmpl.description;

      // Render parameter input fields (skip fixed-value params)
      tmpl.parameterDefinitions.forEach(function (param) {
        if (param.fixedValue) return;

        var fieldDiv = document.createElement("div");
        fieldDiv.className = "tmpl-send__field";

        var label = document.createElement("label");
        label.setAttribute("for", "param_" + param.name);
        label.textContent = param.label;

        var input = document.createElement("input");
        input.type = "text";
        input.id = "param_" + param.name;
        input.name = param.name;
        input.className = "tmpl-send__input";
        input.placeholder = param.placeholder;

        fieldDiv.appendChild(label);
        fieldDiv.appendChild(input);
        paramFields.appendChild(fieldDiv);
      });

      // Show Quick Reply button preview if applicable
      if (tmpl.hasQuickReply && tmpl.quickReplyButtons) {
        buttonLabels.innerHTML = "";
        tmpl.quickReplyButtons.forEach(function (label) {
          var badge = document.createElement("span");
          badge.className = "tmpl-send__button-badge";
          badge.textContent = label;
          buttonLabels.appendChild(badge);
        });
        buttonsPreview.style.display = "block";
      }
    } else {
      templateDescription.textContent =
        "No predefined parameter definition found for this template. " +
        "It will be sent without custom parameters.";
    }

    sendBtn.disabled = false;
  }

  // ── Send Template ──────────────────────────────────────────────────
  function sendTemplate() {
    var phone = phoneInput.value.trim();
    var selectedIndex = templateSelect.value;

    if (!phone || selectedIndex === "" || selectedIndex == null) {
      showResult("Please enter a phone number and select a template.", true);
      return;
    }

    // Validate E.164
    if (!/^\+\d{10,15}$/.test(phone)) {
      showResult("Phone must be E.164 format (e.g., +5511999990001)", true);
      return;
    }

    var acsTmpl = acsTemplates[parseInt(selectedIndex, 10)];
    if (!acsTmpl) return;

    // Find matching predefined template for parameter definitions
    var tmpl = predefinedTemplates.find(function (t) {
      return t.templateName === acsTmpl.name && t.language === acsTmpl.language;
    });

    var templateId = tmpl ? tmpl.id : null;

    // Collect parameter values (skip fixed-value params — backend handles them)
    var parameters = {};
    if (tmpl) {
      tmpl.parameterDefinitions.forEach(function (param) {
        if (param.fixedValue) return;
        var input = document.getElementById("param_" + param.name);
        parameters[param.name] = input ? input.value : "";
      });
    }

    if (!templateId) {
      showResult(
        "No predefined definition for this template — cannot send without parameter mapping.",
        true
      );
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending…";

    fetch("/api/templates/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone, templateId: templateId, parameters: parameters }),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (result) {
        if (result.success) {
          showResult(
            "✓ Template sent! Message ID: " + result.data.messageId,
            false
          );
          activateConversation(phone, tmpl || { displayName: acsTmpl.name, parameterDefinitions: [] }, parameters, result.data.messageId);
        } else {
          showResult(
            "✗ " + (result.error ? result.error.message : "Failed to send"),
            true
          );
        }
      })
      .catch(function (err) {
        showResult("✗ Network error: " + err.message, true);
      })
      .finally(function () {
        sendBtn.disabled = false;
        sendBtn.textContent = "Send Template";
      });
  }

  function showResult(text, isError) {
    sendResult.textContent = text;
    sendResult.className =
      "tmpl-send__result" + (isError ? " tmpl-send__result--error" : "");
    // Auto-clear after 8s
    setTimeout(function () {
      sendResult.textContent = "";
    }, 8000);
  }

  // ── Conversation Panel ─────────────────────────────────────────────
  function activateConversation(phone, tmpl, parameters, messageId) {
    currentPhone = phone;
    convoPhone.textContent = phone;
    convoPlaceholder.style.display = "none";
    convoMessages.style.display = "flex";
    convoCompose.style.display = "flex";

    // Build display text for the sent template
    var paramSummary = tmpl.parameterDefinitions
      .map(function (p) {
        return p.label + ": " + (parameters[p.name] || "—");
      })
      .join(", ");

    messages = [
      {
        id: messageId,
        phone: phone,
        direction: "outbound",
        text: "[Template: " + tmpl.displayName + "] " + paramSummary,
        timestamp: new Date().toISOString(),
        templateName: tmpl.templateName,
        status: "sent",
      },
    ];
    renderMessages();
  }

  function renderMessages() {
    var html = "";
    messages.forEach(function (msg) {
      var dirClass =
        msg.direction === "outbound"
          ? "message--outbound"
          : "message--inbound";
      var time = new Date(msg.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      var textContent = escapeHtml(msg.text);

      // Highlight interactive button replies
      if (msg.interactiveReply) {
        textContent =
          '<span class="interactive-reply__badge">🔘 ' +
          escapeHtml(msg.interactiveReply.title) +
          "</span>" +
          (msg.text && msg.text !== "[Button: " + msg.interactiveReply.title + "]"
            ? "<br/>" + escapeHtml(msg.text)
            : "");
      }

      // Template message badge
      if (msg.templateName) {
        textContent =
          '<span class="tmpl-msg-badge">📋 Template</span> ' + textContent;
      }

      // Delivery status badge (outbound only)
      var statusBadge = "";
      if (msg.direction === "outbound" && msg.status) {
        var statusClass = "delivery-status--" + msg.status;
        statusBadge =
          ' <span class="delivery-status ' +
          statusClass +
          '">' +
          msg.status +
          "</span>";
      }

      html +=
        '<div class="message ' +
        dirClass +
        '" data-msg-id="' +
        escapeHtml(msg.id) +
        '">' +
        '<div class="message__text">' +
        textContent +
        "</div>" +
        '<div class="message__time">' +
        time +
        statusBadge +
        "</div>" +
        "</div>";
    });

    convoMessages.innerHTML = html;
    convoMessages.scrollTop = convoMessages.scrollHeight;
  }

  // ── Follow-Up Messaging ────────────────────────────────────────────
  function sendFollowUp() {
    var text = followUpInput.value.trim();
    if (!text || !currentPhone) return;

    followUpBtn.disabled = true;
    followUpInput.value = "";

    fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: currentPhone, text: text }),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (result) {
        if (!result.success) {
          console.error("Failed to send follow-up:", result.error);
        }
        // Message will arrive via SSE — no optimistic update needed
      })
      .catch(function (err) {
        console.error("Follow-up send error:", err);
      })
      .finally(function () {
        followUpBtn.disabled = false;
      });
  }

  // ── SSE Connection ─────────────────────────────────────────────────
  function connectSSE() {
    var evtSource = new EventSource("/api/messages/stream");

    evtSource.onopen = function () {
      connectionStatus.textContent = "● Connected";
      connectionStatus.style.color = "#107c10";
    };

    // Default "message" event — new inbound/outbound messages
    evtSource.onmessage = function (event) {
      try {
        var msg = JSON.parse(event.data);
        handleNewMessage(msg);
      } catch (e) {
        // Ignore keep-alive pings and malformed data
      }
    };

    // Named "status" event — delivery status updates
    evtSource.addEventListener("status", function (event) {
      try {
        var update = JSON.parse(event.data);
        handleStatusUpdate(update);
      } catch (e) {
        // Ignore malformed data
      }
    });

    evtSource.onerror = function () {
      connectionStatus.textContent = "● Disconnected";
      connectionStatus.style.color = "#d13438";
    };
  }

  function handleNewMessage(msg) {
    // Only show messages for the active conversation phone
    if (!currentPhone || msg.phone !== currentPhone) return;

    // Avoid duplicates
    var exists = messages.some(function (m) {
      return m.id === msg.id;
    });
    if (exists) return;

    messages.push(msg);
    renderMessages();
  }

  function handleStatusUpdate(update) {
    if (!currentPhone || update.phone !== currentPhone) return;

    // Find the message and update its status badge
    var found = messages.find(function (m) {
      return m.id === update.messageId;
    });
    if (found) {
      found.status = update.status;
      renderMessages();
    }
  }

  // ── Utilities ──────────────────────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return "";
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
})();
