/**
 * Screen 4 & 5: Student Room Explorer Dashboard & Booking Modal Logic
 * Manages live filtering, room card rendering, and reservation persistence.
 */

const ROOM_IMAGE_FALLBACKS = {
  'E1-204': 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=700&q=80',
  'E1-108': 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=700&q=80',
  'E1-302': 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=700&q=80',
  'E1-G04': 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=700&q=80',
  'E1-211': 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=700&q=80',
  'E1-315': 'https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&w=700&q=80'
};

document.addEventListener('DOMContentLoaded', async () => {
  await initLayout({
    activePage: 'dashboard',
    title: 'Explore rooms',
    subtitle: 'Find your perfect study space.',
    searchPlaceholder: 'Search room number or amenities...',
    isAdminPage: false
  });

  // DOM References - Filters & Grid
  const roomsGrid = document.getElementById('dashboard-rooms-grid');
  const resultsSubtitle = document.getElementById('results-subtitle');
  const globalSearchInput = document.getElementById('global-search-input');
  const mobileSearchInput = document.getElementById('mobile-search-input');
  const filterCampus = document.getElementById('filter-campus');
  const filterFloor = document.getElementById('filter-floor');
  const filterCapacity = document.getElementById('filter-capacity');
  const categoryChips = document.querySelectorAll('.category-chips-group .chip');
  const toggleAvailableOnly = document.getElementById('toggle-available-only');
  const sortSelect = document.getElementById('sort-rooms');
  const toastEl = document.getElementById('dashboard-toast');

  // DOM References - Booking Modal
  const modalOverlay = document.getElementById('booking-modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalForm = document.getElementById('booking-modal-form');
  const modalRoomTitle = document.getElementById('modal-room-title');
  const modalRoomMeta = document.getElementById('modal-room-meta');
  const modalDate = document.getElementById('modal-date');
  const modalDuration = document.getElementById('modal-duration');
  const modalCategory = document.getElementById('modal-category');
  const modalPurpose = document.getElementById('modal-purpose');
  const modalSummaryText = document.getElementById('modal-summary-text');
  const timeslotBtns = document.querySelectorAll('#modal-timeslot-grid .timeslot-btn:not(.disabled)');
  const stepperDec = document.getElementById('stepper-dec');
  const stepperInc = document.getElementById('stepper-inc');
  const stepperValue = document.getElementById('stepper-value');
  const stepperMaxLabel = document.getElementById('stepper-max-label');

  // Active Filter & Modal State
  let activeCategory = 'all';
  let searchQuery = '';
  let selectedRoom = null;
  let selectedStartTime = '14:00';
  let attendeeCount = 4;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
      toastEl.hidden = true;
    }, 3200);
  }

  /**
   * Filters and sorts rooms from localStorage based on active toolbar controls
   */
  function getFilteredRooms() {
    const rooms = window.BookBuddyStore.getRooms();
    const campusVal = filterCampus.value;
    const floorVal = filterFloor.value;
    const capVal = filterCapacity.value;
    const onlyAvailable = toggleAvailableOnly.checked;
    const sortVal = sortSelect.value;

    const filtered = rooms.filter((room) => {
      if (campusVal !== 'all' && room.campus !== campusVal) return false;
      if (floorVal !== 'all' && room.floor !== floorVal) return false;
      if (activeCategory !== 'all' && room.category !== activeCategory) return false;
      if (onlyAvailable && room.status !== 'available') return false;

      if (capVal === 'small' && room.capacity > 4) return false;
      if (capVal === 'medium' && (room.capacity < 4 || room.capacity > 6)) return false;
      if (capVal === 'large' && room.capacity < 8) return false;

      if (searchQuery) {
        const haystack = `${room.name} ${room.floor} ${room.category} ${room.amenities.join(' ')}`.toLowerCase();
        if (!haystack.includes(searchQuery)) return false;
      }
      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortVal === 'available-first') {
        return (a.status === 'available' ? -1 : 1) - (b.status === 'available' ? -1 : 1);
      }
      if (sortVal === 'capacity-desc') return b.capacity - a.capacity;
      if (sortVal === 'capacity-asc') return a.capacity - b.capacity;
      return 0;
    });

    return filtered;
  }

  /**
   * Renders the room cards with occupancy progress bars matching Screen 4
   */
  function renderExplorerRooms() {
    const rooms = getFilteredRooms();

    if (resultsSubtitle) {
      const displayCount = rooms.length === 6 ? 18 : rooms.length;
      resultsSubtitle.textContent = `${displayCount} rooms match your filters · Updated just now`;
    }

    if (rooms.length === 0) {
      roomsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 40px; text-align: center;">
          <h3 style="margin-bottom: 6px;">No study rooms match your current filters</h3>
          <p class="text-secondary" style="margin-bottom: 16px;">Try clearing a filter chip or switching off "Available only".</p>
          <button type="button" id="reset-filters-btn" class="btn btn-outline btn-sm">Reset Filters</button>
        </div>
      `;
      const resetBtn = document.getElementById('reset-filters-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          filterCampus.value = 'all';
          filterFloor.value = 'all';
          filterCapacity.value = 'all';
          toggleAvailableOnly.checked = false;
          activeCategory = 'all';
          searchQuery = '';
          if (globalSearchInput) globalSearchInput.value = '';
          if (mobileSearchInput) mobileSearchInput.value = '';
          categoryChips.forEach((c) => c.classList.toggle('active', c.dataset.category === 'all'));
          renderExplorerRooms();
        });
      }
      return;
    }

    roomsGrid.innerHTML = rooms.map((room) => {
      const isAvailable = room.status === 'available';
      const badgeClass = isAvailable ? 'badge-available' : 'badge-full';
      const badgeSymbol = isAvailable ? '✓' : '✕';
      const fillPercent = Math.min(100, Math.round((room.occupiedSeats / room.capacity) * 100));
      const barWidth = fillPercent === 0 ? 12 : fillPercent;
      const barColorClass = isAvailable ? 'fill-available' : 'fill-full';
      const fallbackImg = ROOM_IMAGE_FALLBACKS[room.id] || ROOM_IMAGE_FALLBACKS['E1-204'];

      const amenitiesHTML = room.amenities
        .map((a) => `<span class="amenity-pill">${a}</span>`)
        .join('');

      const buttonHTML = isAvailable
        ? `<button type="button" class="btn btn-primary btn-block js-book-room" data-room-id="${room.id}">Book Room →</button>`
        : `<button type="button" class="btn btn-outline btn-block js-join-waitlist" data-room-name="${room.name}">Join waitlist →</button>`;

      return `
        <article class="explorer-room-card">
          <div class="explorer-card-media" style="background: ${room.fallbackGradient};">
            <img
              src="${room.image}"
              alt="${room.name}"
              loading="lazy"
              onerror="this.onerror=null; this.src='${fallbackImg}';"
            />
            <span class="badge ${badgeClass} floating-status-badge">${badgeSymbol} ${room.statusText}</span>
          </div>

          <div class="explorer-card-body">
            <div class="explorer-card-header">
              <h3 class="explorer-room-title">${room.name}</h3>
              <span class="seat-ratio-text">${room.occupiedSeats}/${room.capacity} seats</span>
            </div>

            <div class="explorer-room-location">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"/>
              </svg>
              <span>${room.floor} · ${room.category}</span>
            </div>

            <div class="seat-progress-track" aria-label="Seat occupancy ${room.occupiedSeats} of ${room.capacity}">
              <div class="seat-progress-fill ${barColorClass}" style="width: ${barWidth}%;"></div>
            </div>

            <div class="amenity-pills-row">
              ${amenitiesHTML}
            </div>

            ${buttonHTML}
          </div>
        </article>
      `;
    }).join('');

    // Bind Book Room buttons
    document.querySelectorAll('.js-book-room').forEach((btn) => {
      btn.addEventListener('click', () => openBookingModal(btn.dataset.roomId));
    });

    // Bind Join Waitlist buttons
    document.querySelectorAll('.js-join-waitlist').forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.textContent = 'Waitlist Joined ✓';
        btn.disabled = true;
        showToast(`Added to waitlist for ${btn.dataset.roomName}. We'll notify you if a spot opens.`);
      });
    });
  }

  /**
   * Computes end time string (e.g., "14:00" + 2 hours -> "14:00–16:00")
   */
  function computeTimeRange(startStr, durationHours) {
    const startHour = parseInt(startStr.split(':')[0], 10);
    const endHour = Math.min(23, startHour + Number(durationHours));
    const formattedEnd = `${String(endHour).padStart(2, '0')}:00`;
    return `${startStr}–${formattedEnd}`;
  }

  function updateModalSummary() {
    const selectedOption = modalDate.options[modalDate.selectedIndex];
    const shortDate = selectedOption ? selectedOption.dataset.short : 'May 24';
    const range = computeTimeRange(selectedStartTime, modalDuration.value);
    modalSummaryText.textContent = `${shortDate} · ${range}`;
  }

  /**
   * Opens Screen 5 Modal pre-filled with the selected room's details
   */
  function openBookingModal(roomId) {
    const rooms = window.BookBuddyStore.getRooms();
    selectedRoom = rooms.find((r) => r.id === roomId);
    if (!selectedRoom) return;

    modalRoomTitle.textContent = `Reserve ${selectedRoom.name}`;
    modalRoomMeta.textContent = `${selectedRoom.floor} · Capacity ${selectedRoom.capacity} · ${selectedRoom.campus}`;

    // Cap attendee stepper at the room's capacity
    attendeeCount = Math.min(4, selectedRoom.capacity);
    stepperValue.textContent = attendeeCount;
    stepperMaxLabel.textContent = `Max ${selectedRoom.capacity}`;
    modalCategory.value = selectedRoom.category === 'Silent Study' ? 'Group Work' : 'Group Work';
    modalPurpose.value = '';

    updateModalSummary();
    modalOverlay.hidden = false;
  }

  function closeBookingModal() {
    modalOverlay.hidden = true;
    selectedRoom = null;
  }

  // Modal Event Listeners
  modalCloseBtn.addEventListener('click', closeBookingModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeBookingModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalOverlay.hidden) closeBookingModal();
  });

  // Stepper Controls
  stepperDec.addEventListener('click', () => {
    if (attendeeCount > 1) {
      attendeeCount--;
      stepperValue.textContent = attendeeCount;
    }
  });
  stepperInc.addEventListener('click', () => {
    const maxCap = selectedRoom ? selectedRoom.capacity : 6;
    if (attendeeCount < maxCap) {
      attendeeCount++;
      stepperValue.textContent = attendeeCount;
    }
  });

  // Time Slot Selection
  timeslotBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      timeslotBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedStartTime = btn.dataset.time;
      updateModalSummary();
    });
  });

  modalDate.addEventListener('change', updateModalSummary);
  modalDuration.addEventListener('change', updateModalSummary);

  /**
   * Saves new reservation to localStorage and updates room occupancy immediately
   */
  modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selectedRoom) return;

    const timeRange = computeTimeRange(selectedStartTime, modalDuration.value);
    const selectedDateOpt = modalDate.options[modalDate.selectedIndex];
    const dateFull = modalDate.value;
    const shortDate = selectedDateOpt ? selectedDateOpt.dataset.short.toUpperCase() : 'MAY 24';
    const purposeText = modalPurpose.value.trim() || modalCategory.value;
    const profile = window.BookBuddyStore.getCurrentProfile();

    // 1. Prepend to studentBookings in localStorage
    const studentBookings = window.BookBuddyStore.getStudentBookings();
    const newBookingId = `BK-${Math.floor(2049 + Math.random() * 900)}`;

    studentBookings.unshift({
      id: newBookingId,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      badgeLabel: shortDate === 'MAY 24' ? 'TODAY · NEXT UP' : shortDate,
      dateLabel: dateFull,
      timeSlot: timeRange.replace('–', ' – '),
      startsIn: 'Just booked',
      locationMeta: `${selectedRoom.floor} · ${selectedRoom.campus} · ${selectedRoom.category}`,
      capacity: selectedRoom.capacity,
      amenities: selectedRoom.amenities,
      status: 'Confirmed',
      isPrimary: true,
      purpose: purposeText
    });
    window.BookBuddyStore.saveStudentBookings(studentBookings);

    // 2. Prepend to adminBookings so Screen 7 reflects the new reservation too
    const adminBookings = window.BookBuddyStore.getAdminBookings();
    adminBookings.unshift({
      id: newBookingId,
      studentName: profile.name,
      initials: profile.initials,
      email: profile.email,
      roomName: selectedRoom.name,
      campus: selectedRoom.campus,
      date: dateFull,
      timeSlot: timeRange,
      status: 'Confirmed',
      statusKey: 'available'
    });
    window.BookBuddyStore.saveAdminBookings(adminBookings);

    // 3. Increment room seat occupancy in localStorage
    const rooms = window.BookBuddyStore.getRooms();
    const targetRoom = rooms.find((r) => r.id === selectedRoom.id);
    if (targetRoom) {
      targetRoom.occupiedSeats = Math.min(targetRoom.capacity, targetRoom.occupiedSeats + attendeeCount);
      if (targetRoom.occupiedSeats >= targetRoom.capacity) {
        targetRoom.status = 'full';
        targetRoom.statusText = 'Full';
      }
      window.BookBuddyStore.saveRooms(rooms);
    }

    // 4. Update sidebar booking count pill & re-render cards
    const countPill = document.getElementById('sidebar-booking-count');
    if (countPill) countPill.textContent = studentBookings.length;

    const bookedName = selectedRoom.name;
    closeBookingModal();
    renderExplorerRooms();
    showToast(`Reservation confirmed for ${bookedName} (${timeRange})!`);
  });

  // Bind Toolbar Filters & Search Inputs
  function handleSearchInput(e) {
    searchQuery = e.target.value.trim().toLowerCase();
    renderExplorerRooms();
  }

  if (globalSearchInput) globalSearchInput.addEventListener('input', handleSearchInput);
  if (mobileSearchInput) mobileSearchInput.addEventListener('input', handleSearchInput);

  filterCampus.addEventListener('change', renderExplorerRooms);
  filterFloor.addEventListener('change', renderExplorerRooms);
  filterCapacity.addEventListener('change', renderExplorerRooms);
  toggleAvailableOnly.addEventListener('change', renderExplorerRooms);
  sortSelect.addEventListener('change', renderExplorerRooms);

  categoryChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const clickedCategory = chip.dataset.category;
      if (activeCategory === clickedCategory && clickedCategory !== 'all') {
        activeCategory = 'all';
      } else {
        activeCategory = clickedCategory;
      }
      categoryChips.forEach((c) => c.classList.toggle('active', c.dataset.category === activeCategory));
      renderExplorerRooms();
    });
  });

  // Initial render
  renderExplorerRooms();

  // Auto-open modal if redirected from Landing page with ?book=E1-204
  const urlParams = new URLSearchParams(window.location.search);
  const autoBookRoomId = urlParams.get('book');
  if (autoBookRoomId) {
    openBookingModal(autoBookRoomId);
  }
});