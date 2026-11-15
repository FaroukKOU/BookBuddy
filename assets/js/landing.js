// Fallback room photography if local /assets/images/*.png files are not yet added
const DEMO_ROOM_PHOTOS = {
  "E1-204":
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=700&q=80",
  "E1-108":
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=700&q=80",
  "E1-302":
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=700&q=80",
  "E1-G04":
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=700&q=80",
  "E1-211":
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=700&q=80",
  "E1-315":
    "https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&w=700&q=80",
};

document.addEventListener("DOMContentLoaded", async () => {
  await window.BookBuddyStore.init();

  const roomsGrid = document.getElementById("landing-rooms-grid");
  const eventsGrid = document.getElementById("landing-events-grid");
  const campusSelect = document.getElementById("header-campus-select");
  const campusHeading = document.getElementById("campus-heading");
  const searchForm = document.getElementById("hero-search-form");
  const capacitySelect = document.getElementById("filter-capacity");

  const allRooms = window.BookBuddyStore.getRooms();
  const allEvents = window.BookBuddyStore.getEvents();

  /**
   * Renders the guest room cards matching Screen 2 mockup
   */
  function renderGuestRooms(rooms) {
    if (!roomsGrid) return;

    if (rooms.length === 0) {
      roomsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 36px; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg);">
          <p class="text-secondary">No rooms match this capacity filter. Try selecting "All sizes".</p>
        </div>
      `;
      return;
    }

    roomsGrid.innerHTML = rooms
      .map((room) => {
        const isAvailable = room.status === "available";
        const badgeClass = isAvailable ? "badge-available" : "badge-full";
        const badgeSymbol = isAvailable ? "✓" : "✕";
        const fallbackUrl =
          DEMO_ROOM_PHOTOS[room.id] || DEMO_ROOM_PHOTOS["E1-204"];

        const amenitiesMarkup = room.amenities
          .map((item) => `<span class="amenity-text">${item}</span>`)
          .join("");

        const actionButton = isAvailable
          ? `<a href="auth.html?mode=login&room=${encodeURIComponent(room.id)}" class="btn btn-outline btn-block">Log in to reserve</a>`
          : `<button type="button" class="btn btn-disabled btn-block" disabled>Currently unavailable</button>`;

        return `
        <article class="guest-room-card">
          <div class="room-card-media" style="background: ${room.fallbackGradient};">
            <img
              src="${room.image}"
              alt="${room.name}"
              loading="lazy"
              onerror="this.onerror=null; this.src='${fallbackUrl}';"
            />
          </div>
          <div class="room-card-body">
            <div class="room-card-top">
              <h3 class="room-card-title">${room.name}</h3>
              <span class="badge ${badgeClass}">${badgeSymbol} ${room.statusText}</span>
            </div>
            <div class="room-card-floor">${room.floor}</div>
            <div class="room-card-meta">
              <span class="capacity-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
                Up to ${room.capacity}
              </span>
              ${amenitiesMarkup}
            </div>
            ${actionButton}
          </div>
        </article>
      `;
      })
      .join("");
  }

  /**
   * Renders the 3 Campus Happenings cards at the bottom of Screen 2
   */
  function renderEvents(events) {
    if (!eventsGrid) return;

    eventsGrid.innerHTML = events
      .map((evt) => {
        const iconSvg =
          evt.iconType === "tutor"
            ? `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`
            : `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;

        return `
        <article class="event-card">
          <div class="event-icon-box">
            ${iconSvg}
          </div>
          <div>
            <div class="event-type-label">${evt.type}</div>
            <h3 class="event-title">${evt.title}</h3>
            <p class="event-schedule">${evt.schedule}</p>
          </div>
        </article>
      `;
      })
      .join("");
  }

  // Initial render
  renderGuestRooms(allRooms);
  renderEvents(allEvents);

  // Update heading when Campus dropdown changes
  if (campusSelect && campusHeading) {
    campusSelect.addEventListener("change", (e) => {
      campusHeading.textContent = `Spaces at ${e.target.value}`;
    });
  }

  // Filter rooms when user clicks "Find Available Rooms"
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const capValue = capacitySelect ? capacitySelect.value : "all";

      const filtered = allRooms.filter((room) => {
        if (capValue === "all") return true;
        if (capValue === "2") return room.capacity <= 4;
        if (capValue === "6") return room.capacity >= 4 && room.capacity <= 6;
        if (capValue === "8") return room.capacity >= 8;
        return true;
      });

      renderGuestRooms(filtered);
      document
        .getElementById("spaces-section")
        .scrollIntoView({ behavior: "smooth" });
    });
  }
});
