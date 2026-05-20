const invitation = {
  coupleName: "Aylin & Deniz",
  eventDate: "Saturday, 21 June 2026",
  eventTime: "18:30",
  venueName: "The Garden Hall, Istanbul",
  dressCode: "Elegant garden formal",
  story:
    "We built this first page as a clean foundation for the future wedding invitation system. The couple story, event details, RSVP settings, and design theme can later become editable from an admin panel.",
  locationNote:
    "The venue address, parking notes, transport options, and map embed can be managed from the invitation configuration in later versions.",
  schedule: [
    {
      time: "18:30",
      title: "Welcome reception",
      description: "Guests arrive, meet the families, and enjoy welcome drinks."
    },
    {
      time: "19:30",
      title: "Ceremony",
      description: "The couple exchanges vows in the garden ceremony area."
    },
    {
      time: "20:30",
      title: "Dinner and celebration",
      description: "Dinner service, music, cake, and the evening celebration."
    }
  ]
};

const STORAGE_KEY = "weddingInvitationSystem.rsvps";

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getStoredRsvps = () => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.warn("Unable to read stored RSVP responses.", error);
    return [];
  }
};

const setStoredRsvps = (responses) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
};

const renderInvitation = () => {
  document.querySelectorAll("[data-invitation]").forEach((element) => {
    const key = element.getAttribute("data-invitation");
    if (key && invitation[key]) {
      element.textContent = invitation[key];
    }
  });
};

const renderSchedule = () => {
  const scheduleList = document.querySelector("[data-schedule-list]");
  if (!scheduleList) {
    return;
  }

  scheduleList.innerHTML = invitation.schedule
    .map(
      (item) => `
        <article class="timeline-card">
          <time>${escapeHtml(item.time)}</time>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </article>
      `
    )
    .join("");
};

const renderRsvpTable = () => {
  const tableBody = document.querySelector("[data-rsvp-table]");
  if (!tableBody) {
    return;
  }

  const responses = getStoredRsvps();
  if (responses.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4">No responses yet.</td></tr>';
    return;
  }

  tableBody.innerHTML = responses
    .map(
      (response) => `
        <tr>
          <td>${escapeHtml(response.fullName)}</td>
          <td>${response.attendance === "yes" ? "Attending" : "Not attending"}</td>
          <td>${escapeHtml(response.guestCount)}</td>
          <td>${escapeHtml(response.mealPreference)}</td>
        </tr>
      `
    )
    .join("");
};

const bindRsvpForm = () => {
  const form = document.querySelector("[data-rsvp-form]");
  const status = document.querySelector("[data-form-status]");
  if (!form || !status) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const response = {
      id: crypto.randomUUID(),
      fullName: String(formData.get("fullName") || "").trim(),
      attendance: String(formData.get("attendance") || ""),
      guestCount: Number(formData.get("guestCount") || 1),
      mealPreference: String(formData.get("mealPreference") || "standard"),
      note: String(formData.get("note") || "").trim(),
      submittedAt: new Date().toISOString()
    };

    const responses = getStoredRsvps();
    responses.unshift(response);
    setStoredRsvps(responses);

    form.reset();
    status.textContent = "Thank you. Your RSVP has been saved for this demo.";
    renderRsvpTable();
  });
};

renderInvitation();
renderSchedule();
renderRsvpTable();
bindRsvpForm();
