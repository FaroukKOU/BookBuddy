document.addEventListener('DOMContentLoaded', async () => {
  await initLayout({
    activePage: 'bookings',
    title: 'My bookings',
    subtitle: 'Manage your upcoming and past reservations.',
    searchPlaceholder: 'Search room number or amenities...',
    isAdminPage: false
  });

  const upcomingListEl = document.getElementById('upcoming-bookings-list');
  const pastCardEl = document.getElementById('past-bookings-card');
  const upcomingSubtitle = document.getElementById('upcoming-count-subtitle');
  const globalSearchInput = document.getElementById('global-search-input');
  const toastEl = document.getElementById('bookings-toast');

  // Stats elements
  const statsGreetingTitle = document.getElementById('stats-greeting-title');
  const statsGreetingSub = document.getElementById('stats-greeting-sub');
  const statHoursVal = document.getElementById('stat-hours-value');
  const statSessionsVal = document.getElementById('stat-sessions-value');

  // Modal elements
  const detailModal = document.getElementById('booking-detail-modal');
  const detailCloseBtn = document.getElementById('detail-modal-close');
  const detailDoneBtn = document.getElementById('detail-modal-done');
  const editForm = document.getElementById('edit-booking-form');
  const detailTitle = document.getElementById('detail-modal-title');
  const detailMeta = document.getElementById('detail-modal-meta');
  const detailBookingId = document.getElementById('detail-booking-id');
  const detailAmenities = document.getElementById('detail-amenities');
  const editDateSelect = document.getElementById('edit-booking-date');
  const editSlotSelect = document.getElementById('edit-booking-slot');
  const editPurposeInput = document.getElementById('edit-booking-purpose');
  const modalCancelBtn = document.getElementById('modal-cancel-reservation-btn');

  let activeEditBookingId = null;
  let searchFilter = '';

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
      toastEl.hidden = true;
    }, 3200);
  }

  // Personalize right-hand study stats card using active user profile
  const profile = window.BookBuddyStore.getCurrentProfile();
  if (profile && statsGreetingTitle) {
    const firstName = profile.name.split(' ')[0] || 'AMINU';
    statsGreetingTitle.textContent = `Good study habits, ${firstName}.`;
    const sessions = profile.stats ? profile.stats.sessionsCompleted : 8;
    const hours = profile.stats ? profile.stats.hoursBooked : 14;
    if (statsGreetingSub) {
      statsGreetingSub.textContent = `You've completed ${sessions} focused study sessions this month.`;
    }
    if (statHoursVal) statHoursVal.textContent = `${hours}h`;
    if (statSessionsVal) statSessionsVal.textContent = sessions;
  }

  /**
   * Cancels a reservation, updates admin records, and frees room seats
   */
  function cancelReservation(bookingId) {
    const bookings = window.BookBuddyStore.getStudentBookings();
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;

    const remaining = bookings.filter((b) => b.id !== bookingId);
    window.BookBuddyStore.saveStudentBookings(remaining);

    // Update matching admin booking status to Cancelled
    const adminBookings = window.BookBuddyStore.getAdminBookings();
    const adminRecord = adminBookings.find((ab) => ab.id === bookingId || ab.roomName === target.roomName);
    if (adminRecord) {
      adminRecord.status = 'Cancelled';
      adminRecord.statusKey = 'full';
      window.BookBuddyStore.saveAdminBookings(adminBookings);
    }

    // Free occupied seats on the room in localStorage
    const rooms = window.BookBuddyStore.getRooms();
    const roomObj = rooms.find((r) => r.id === target.roomId || r.name === target.roomName);
    if (roomObj) {
      roomObj.occupiedSeats = Math.max(0, roomObj.occupiedSeats - 2);
      if (roomObj.occupiedSeats < roomObj.capacity) {
        roomObj.status = 'available';
        roomObj.statusText = 'Available';
      }
      window.BookBuddyStore.saveRooms(rooms);
    }

    // Update sidebar pill counter
    const countPill = document.getElementById('sidebar-booking-count');
    if (countPill) countPill.textContent = remaining.length;

    renderBookings();
    showToast(`Reservation for ${target.roomName} cancelled. Room capacity released.`);
  }

  /**
   * Opens the pre-filled View Details / Edit modal
   */
  function openDetailModal(bookingId) {
    const bookings = window.BookBuddyStore.getStudentBookings();
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    activeEditBookingId = booking.id;
    detailTitle.textContent = booking.roomName;
    detailMeta.textContent = booking.locationMeta;
    detailBookingId.textContent = booking.id;
    detailAmenities.textContent = (booking.amenities || ['Whiteboard', 'TV display']).join(', ');
    editPurposeInput.value = booking.purpose || '';

    // Match existing date/time option if present
    if ([...editDateSelect.options].some((o) => o.value === booking.dateLabel)) {
      editDateSelect.value = booking.dateLabel;
    }
    if ([...editSlotSelect.options].some((o) => o.value === booking.timeSlot)) {
      editSlotSelect.value = booking.timeSlot;
    }

    detailModal.hidden = false;
  }

  function closeDetailModal() {
    detailModal.hidden = true;
    activeEditBookingId = null;
  }

  /**
   * Renders both Upcoming Reservations and Past Bookings
   */
  function renderBookings() {
    const allUpcoming = window.BookBuddyStore.getStudentBookings();
    const filteredUpcoming = allUpcoming.filter((b) => {
      if (!searchFilter) return true;
      const hay = `${b.roomName} ${b.locationMeta} ${(b.amenities || []).join(' ')}`.toLowerCase();
      return hay.includes(searchFilter);
    });

    if (upcomingSubtitle) {
      const count = allUpcoming.length;
      upcomingSubtitle.textContent = count === 1
        ? 'You have 1 room booked this week.'
        : `You have ${count} rooms booked this week.`;
    }

    if (filteredUpcoming.length === 0) {
      upcomingListEl.innerHTML = `
        <div class="reservation-card" style="text-align: center; padding: 36px 20px;">
          <h3 style="margin-bottom: 6px;">No upcoming reservations</h3>
          <p class="text-secondary" style="margin-bottom: 16px;">Book a study room or lab across Campus Eiffel to get started.</p>
          <a href="dashboard.html" class="btn btn-primary btn-sm">Explore Study Rooms</a>
        </div>
      `;
    } else {
      upcomingListEl.innerHTML = filteredUpcoming.map((booking, idx) => {
        const isFeatured = idx === 0;
        const amenitiesMarkup = (booking.amenities || []).map((item) => `
          <span class="res-amenity-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            ${item}
          </span>
        `).join('');

        if (isFeatured) {
          return `
            <article class="reservation-card is-primary">
              <div class="res-card-top">
                <div class="res-card-left">
                  <div class="res-room-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="4" y="3" width="16" height="18" rx="2"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
                    </svg>
                  </div>
                  <div>
                    <div class="res-eyebrow-row">
                      <span class="res-eyebrow">${booking.badgeLabel}</span>
                      <span class="badge badge-available">✓ ${booking.status}</span>
                    </div>
                    <h3 class="res-room-name">${booking.roomName}</h3>
                    <p class="res-location-meta">${booking.locationMeta}</p>
                  </div>
                </div>

                <div class="res-card-right">
                  <div class="res-time-slot">${booking.timeSlot}</div>
                  <div class="res-starts-in">${booking.startsIn || booking.dateLabel}</div>
                </div>
              </div>

              <div class="res-card-footer">
                <div class="res-amenities-row">
                  <span class="res-amenity-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    </svg>
                    Capacity ${booking.capacity}
                  </span>
                  ${amenitiesMarkup}
                </div>

                <div class="res-actions-row">
                  <button type="button" class="btn btn-outline btn-sm js-view-edit" data-id="${booking.id}">View details</button>
                  <button type="button" class="btn btn-outline btn-sm js-view-edit" data-id="${booking.id}">Edit</button>
                  <button type="button" class="btn-text-cancel js-cancel-booking" data-id="${booking.id}">Cancel</button>
                </div>
              </div>
            </article>
          `;
        }

        return `
          <article class="reservation-card">
            <div class="res-card-top" style="align-items: center;">
              <div class="res-card-left">
                <div class="res-room-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="4" y="3" width="16" height="18" rx="2"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
                  </svg>
                </div>
                <div>
                  <div class="res-eyebrow-row">
                    <span class="res-eyebrow">${booking.badgeLabel}</span>
                  </div>
                  <h3 class="res-room-name">${booking.roomName}</h3>
                  <p class="res-location-meta">${booking.locationMeta}</p>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
                <div class="res-card-right">
                  <div class="res-time-slot">${booking.timeSlot}</div>
                  <span class="badge badge-available" style="margin-top: 4px;">✓ ${booking.status}</span>
                </div>
                <div class="res-actions-row">
                  <button type="button" class="btn btn-outline btn-sm js-view-edit" data-id="${booking.id}">Edit</button>
                  <button type="button" class="btn-text-cancel js-cancel-booking" data-id="${booking.id}">Cancel</button>
                </div>
              </div>
            </div>
          </article>
        `;
      }).join('');
    }

    // Bind action buttons on upcoming cards
    document.querySelectorAll('.js-view-edit').forEach((btn) => {
      btn.addEventListener('click', () => openDetailModal(btn.dataset.id));
    });

    document.querySelectorAll('.js-cancel-booking').forEach((btn) => {
      btn.addEventListener('click', () => cancelReservation(btn.dataset.id));
    });

    // Render Past Bookings list
    const pastList = window.BookBuddyStore.getPastBookings();
    pastCardEl.innerHTML = pastList.map((item) => `
      <div class="past-booking-row">
        <span class="past-date">${item.date}</span>
        <span class="past-room">${item.roomName}</span>
        <span class="past-status">${item.timeSlot} · ${item.status}</span>
        <a href="dashboard.html?book=${encodeURIComponent(item.roomId)}" class="book-again-link">Book again</a>
      </div>
    `).join('');
  }

  // Modal Form Save Handler
  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!activeEditBookingId) return;

    const bookings = window.BookBuddyStore.getStudentBookings();
    const target = bookings.find((b) => b.id === activeEditBookingId);
    if (target) {
      target.dateLabel = editDateSelect.value;
      target.badgeLabel = editDateSelect.value.toUpperCase();
      target.timeSlot = editSlotSelect.value;
      target.purpose = editPurposeInput.value.trim();
      window.BookBuddyStore.saveStudentBookings(bookings);
    }

    closeDetailModal();
    renderBookings();
    showToast('Reservation updated successfully.');
  });

  modalCancelBtn.addEventListener('click', () => {
    if (activeEditBookingId) {
      const idToCancel = activeEditBookingId;
      closeDetailModal();
      cancelReservation(idToCancel);
    }
  });

  detailCloseBtn.addEventListener('click', closeDetailModal);
  detailDoneBtn.addEventListener('click', closeDetailModal);
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeDetailModal();
  });

  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', (e) => {
      searchFilter = e.target.value.trim().toLowerCase();
      renderBookings();
    });
  }

  renderBookings();
});