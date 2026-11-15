document.addEventListener("DOMContentLoaded", async () => {
  await initLayout({
    activePage: "admin",
    title: "Booking control center",
    subtitle: "",
    searchPlaceholder: "Search bookings or students...",
    isAdminPage: true,
  });

  // DOM References
  const tbody = document.getElementById("admin-bookings-tbody");
  const statusFilter = document.getElementById("admin-status-filter");
  const campusFilter = document.getElementById("admin-campus-filter");
  const globalSearchInput = document.getElementById("global-search-input");
  const showingLabel = document.getElementById("table-showing-label");
  const kpiTotalRooms = document.getElementById("kpi-total-rooms");
  const kpiTodaysBookings = document.getElementById("kpi-todays-bookings");
  const kpiPending = document.getElementById("kpi-pending");
  const toastEl = document.getElementById("admin-toast");

  // Add Room Modal Elements
  const addRoomModal = document.getElementById("add-room-modal");
  const openAddRoomBtn = document.getElementById("open-add-room-btn");
  const closeAddRoomBtn = document.getElementById("close-add-room-btn");
  const cancelAddRoomBtn = document.getElementById("cancel-add-room-btn");
  const addRoomForm = document.getElementById("add-room-form");

  // Override Modal Elements
  const overrideModal = document.getElementById("override-modal");
  const closeOverrideBtn = document.getElementById("close-override-btn");
  const cancelOverrideBtn = document.getElementById("cancel-override-btn");
  const overrideForm = document.getElementById("override-booking-form");
  const overrideSub = document.getElementById("override-modal-sub");
  const overrideRoomInput = document.getElementById("override-room");
  const overrideStatusSelect = document.getElementById("override-status");
  const overrideSlotInput = document.getElementById("override-slot");

  let searchTerm = "";
  let activeOverrideId = null;

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
      toastEl.hidden = true;
    }, 3400);
  }

  function mapStatusToBadgeClass(status) {
    if (status === "In progress") return "badge-progress";
    if (status === "Confirmed") return "badge-available";
    if (status === "Pending") return "badge-event";
    return "badge-full";
  }

  function updateKpiCounters() {
    const rooms = window.BookBuddyStore.getRooms();
    const adminBookings = window.BookBuddyStore.getAdminBookings();

    const extraRooms = Math.max(0, rooms.length - 6);
    const extraBookings = adminBookings.length - 6;
    const pendingCount = adminBookings.filter(
      (b) => b.status === "Pending",
    ).length;

    if (kpiTotalRooms) kpiTotalRooms.textContent = 42 + extraRooms;
    if (kpiTodaysBookings)
      kpiTodaysBookings.textContent = Math.max(0, 128 + extraBookings);
    if (kpiPending) kpiPending.textContent = 5 + pendingCount;

    const sidebarCountPill = document.getElementById("admin-booking-count");
    if (sidebarCountPill)
      sidebarCountPill.textContent = Math.max(0, 128 + extraBookings);
  }

  function forceCancelBooking(bookingId) {
    const adminBookings = window.BookBuddyStore.getAdminBookings();
    const target = adminBookings.find((b) => b.id === bookingId);
    if (!target || target.status === "Cancelled") return;

    target.status = "Cancelled";
    target.statusKey = "full";
    window.BookBuddyStore.saveAdminBookings(adminBookings);

    t;
    const studentBookings = window.BookBuddyStore.getStudentBookings();
    const updatedStudent = studentBookings.filter((sb) => sb.id !== bookingId);
    if (updatedStudent.length !== studentBookings.length) {
      window.BookBuddyStore.saveStudentBookings(updatedStudent);
    }

    const rooms = window.BookBuddyStore.getRooms();
    const roomObj = rooms.find((r) => r.name === target.roomName);
    if (roomObj) {
      roomObj.occupiedSeats = Math.max(0, roomObj.occupiedSeats - 2);
      if (roomObj.occupiedSeats < roomObj.capacity) {
        roomObj.status = "available";
        roomObj.statusText = "Available";
      }
      window.BookBuddyStore.saveRooms(rooms);
    }

    renderAdminTable();
    showToast(`Force-cancelled booking ${bookingId} (${target.roomName}).`);
  }

  function openOverrideModal(bookingId) {
    const adminBookings = window.BookBuddyStore.getAdminBookings();
    const booking = adminBookings.find((b) => b.id === bookingId);
    if (!booking) return;

    activeOverrideId = booking.id;
    overrideSub.textContent = `${booking.id} · ${booking.studentName} (${booking.email})`;
    overrideRoomInput.value = booking.roomName;
    overrideStatusSelect.value = booking.status;
    overrideSlotInput.value = booking.timeSlot;
    overrideModal.hidden = false;
  }

  function renderAdminTable() {
    updateKpiCounters();

    const allBookings = window.BookBuddyStore.getAdminBookings();
    const selectedStatus = statusFilter.value;
    const selectedCampus = campusFilter.value;

    const filtered = allBookings.filter((b) => {
      if (selectedStatus !== "all" && b.status !== selectedStatus) return false;
      if (selectedCampus !== "all" && b.campus !== selectedCampus) return false;

      if (searchTerm) {
        const hay =
          `${b.id} ${b.studentName} ${b.email} ${b.roomName} ${b.campus}`.toLowerCase();
        if (!hay.includes(searchTerm)) return false;
      }
      return true;
    });

    if (showingLabel) {
      const totalDisplay = kpiTodaysBookings
        ? kpiTodaysBookings.textContent
        : "128";
      showingLabel.textContent = `Showing ${filtered.length} of ${totalDisplay} bookings`;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 36px; color: var(--color-text-secondary);">
            No campus bookings match the selected filters.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered
      .map((b) => {
        const badgeClass = mapStatusToBadgeClass(b.status);
        const isCancelled = b.status === "Cancelled";

        return `
        <tr>
          <td>
            <div class="student-cell">
              <span class="student-initials">${b.initials}</span>
              <div>
                <div class="student-name">${b.studentName}</div>
                <div class="student-email">${b.email}</div>
                <span class="booking-id-tag">${b.id}</span>
              </div>
            </div>
          </td>
          <td>
            <div class="room-cell-name">${b.roomName}</div>
            <div class="room-cell-campus">🏢 ${b.campus}</div>
          </td>
          <td>
            <div class="date-cell-main">${b.date}</div>
            <div class="date-cell-time">${b.timeSlot}</div>
          </td>
          <td>
            <span class="badge ${badgeClass}">
              <span class="status-dot"></span>
              ${b.status}
            </span>
          </td>
          <td class="admin-actions-cell">
            <div class="admin-action-group">
              <button type="button" class="btn-override js-override-btn" data-id="${b.id}">Override / Edit</button>
              <button type="button" class="btn-force-cancel js-force-cancel-btn" data-id="${b.id}" ${isCancelled ? "disabled" : ""}>
                ${isCancelled ? "Cancelled" : "Force Cancel"}
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join("");

    document.querySelectorAll(".js-override-btn").forEach((btn) => {
      btn.addEventListener("click", () => openOverrideModal(btn.dataset.id));
    });

    document.querySelectorAll(".js-force-cancel-btn").forEach((btn) => {
      btn.addEventListener("click", () => forceCancelBooking(btn.dataset.id));
    });
  }

  overrideForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!activeOverrideId) return;

    const adminBookings = window.BookBuddyStore.getAdminBookings();
    const target = adminBookings.find((b) => b.id === activeOverrideId);
    if (target) {
      target.roomName = overrideRoomInput.value.trim() || target.roomName;
      target.status = overrideStatusSelect.value;
      target.timeSlot = overrideSlotInput.value.trim() || target.timeSlot;
      window.BookBuddyStore.saveAdminBookings(adminBookings);
    }

    overrideModal.hidden = true;
    activeOverrideId = null;
    renderAdminTable();
    showToast("Administrator override applied.");
  });

  closeOverrideBtn.addEventListener("click", () => {
    overrideModal.hidden = true;
  });
  cancelOverrideBtn.addEventListener("click", () => {
    overrideModal.hidden = true;
  });

  openAddRoomBtn.addEventListener("click", () => {
    addRoomForm.reset();
    addRoomModal.hidden = false;
  });
  closeAddRoomBtn.addEventListener("click", () => {
    addRoomModal.hidden = true;
  });
  cancelAddRoomBtn.addEventListener("click", () => {
    addRoomModal.hidden = true;
  });

  addRoomForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const nameVal = document.getElementById("new-room-name").value.trim();
    const campusVal = document.getElementById("new-room-campus").value;
    const floorVal = document.getElementById("new-room-floor").value;
    const categoryVal = document.getElementById("new-room-category").value;
    const capacityVal =
      parseInt(document.getElementById("new-room-capacity").value, 10) || 6;

    const checkedAmenities = [
      ...document.querySelectorAll(
        '#add-room-form input[type="checkbox"]:checked',
      ),
    ].map((cb) => cb.value);

    const rooms = window.BookBuddyStore.getRooms();
    const cleanId =
      nameVal.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase() || `RM-${Date.now()}`;

    rooms.unshift({
      id: cleanId,
      name: nameVal,
      campus: campusVal,
      floor: floorVal,
      category: categoryVal,
      capacity: capacityVal,
      occupiedSeats: 0,
      status: "available",
      statusText: "Available",
      amenities: checkedAmenities.length ? checkedAmenities : ["Whiteboard"],
      image: "assets/images/room-e1-204.png",
      fallbackGradient: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)",
    });

    window.BookBuddyStore.saveRooms(rooms);
    addRoomModal.hidden = true;
    updateKpiCounters();
    showToast(
      `${nameVal} added! It is now visible on Explore Rooms & Landing.`,
    );
  });

  statusFilter.addEventListener("change", renderAdminTable);
  campusFilter.addEventListener("change", renderAdminTable);
  if (globalSearchInput) {
    globalSearchInput.addEventListener("input", (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      renderAdminTable();
    });
  }

  renderAdminTable();
});
