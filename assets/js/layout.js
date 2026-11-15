/**
 * BookBuddy Layout & Client-Side State Manager
 * Handles mock database seeding in localStorage, shared template injection,
 * and role-based UI switching between Student and Admin views.
 */

const STORAGE_KEYS = {
  DB_INITIALIZED: 'bookbuddy_db_v1',
  CURRENT_ROLE: 'bookbuddy_active_role',
  ROOMS: 'bookbuddy_rooms',
  STUDENT_BOOKINGS: 'bookbuddy_student_bookings',
  PAST_BOOKINGS: 'bookbuddy_past_bookings',
  ADMIN_BOOKINGS: 'bookbuddy_admin_bookings',
  EVENTS: 'bookbuddy_events',
  PROFILES: 'bookbuddy_profiles'
};

// Fallback seed data in case the browser blocks fetch() on local file:// protocol
const FALLBACK_DATA = {
  profiles: {
    student: { id: "USR-01", name: "AMINU Farouk", initials: "AM", email: "faroukabdullahi.aminu@edu.ece.fr", studentId: "ECE-2025-8492", role: "student", roleLabel: "Student", stats: { hoursBooked: 14, sessionsCompleted: 8 } },
    tutor: { id: "USR-02", name: "Lina Moreau", initials: "LM", email: "lina.moreau@edu.ece.fr", studentId: "ECE-2024-3104", role: "tutor", roleLabel: "Tutor & Club Lead", stats: { hoursBooked: 22, sessionsCompleted: 12 } },
    admin: { id: "USR-99", name: "ECE Administrator", initials: "AD", email: "admin.operations@ece.fr", studentId: "ADM-001", role: "admin", roleLabel: "Super Admin" }
  },
  rooms: [
    { id: "E1-204", name: "Room E1-204", campus: "Campus Eiffel 1", floor: "Floor 2", category: "Group Work", capacity: 6, occupiedSeats: 2, status: "available", statusText: "Available", amenities: ["Whiteboard", "TV"], image: "assets/images/room-e1-204.jpg", fallbackGradient: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)" },
    { id: "E1-108", name: "Room E1-108", campus: "Campus Eiffel 1", floor: "Floor 1", category: "Silent Study", capacity: 4, occupiedSeats: 4, status: "full", statusText: "Full", amenities: ["Whiteboard", "Monitor"], image: "assets/images/room-e1-108.jpg", fallbackGradient: "linear-gradient(135deg, #7C2D12 0%, #B45309 100%)" },
    { id: "E1-302", name: "Room E1-302", campus: "Campus Eiffel 1", floor: "Floor 3", category: "Group Work", capacity: 10, occupiedSeats: 5, status: "available", statusText: "Available", amenities: ["Projector", "Whiteboard"], image: "assets/images/room-e1-302.jpg", fallbackGradient: "linear-gradient(135deg, #0F172A 0%, #334155 100%)" },
    { id: "E1-G04", name: "Lab E1-G04", campus: "Campus Eiffel 1", floor: "Ground floor", category: "Lab", capacity: 8, occupiedSeats: 1, status: "available", statusText: "Available", amenities: ["PC stations", "TV"], image: "assets/images/lab-e1-g04.jpg", fallbackGradient: "linear-gradient(135deg, #064E3B 0%, #10B981 100%)" },
    { id: "E1-211", name: "Room E1-211", campus: "Campus Eiffel 1", floor: "Floor 2", category: "Silent Study", capacity: 2, occupiedSeats: 2, status: "full", statusText: "Full", amenities: ["Monitor", "Quiet zone"], image: "assets/images/room-e1-211.jpg", fallbackGradient: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)" },
    { id: "E1-315", name: "Room E1-315", campus: "Campus Eiffel 1", floor: "Floor 3", category: "Group Work", capacity: 6, occupiedSeats: 0, status: "available", statusText: "Available", amenities: ["Projector", "Conference"], image: "assets/images/room-e1-315.jpg", fallbackGradient: "linear-gradient(135deg, #1E293B 0%, #475569 100%)" }
  ],
  events: [
    { id: "EVT-01", type: "EVENT", title: "Robotics Club: Open Lab", schedule: "Today · 17:30 · Innovation Lab G12", iconType: "calendar" },
    { id: "EVT-02", type: "TUTORING", title: "Calculus II Study Clinic", schedule: "Tomorrow · 12:00 · Room E1-108", iconType: "tutor" },
    { id: "EVT-03", type: "EVENT", title: "Debate Society Meetup", schedule: "Wed, May 28 · 18:00 · Auditorium A", iconType: "calendar" }
  ],
  studentBookings: [
    { id: "BK-2048-STU", roomId: "E1-204", roomName: "Room E1-204", badgeLabel: "TODAY · NEXT UP", dateLabel: "May 24, 2025", timeSlot: "14:00 – 16:00", startsIn: "Starts in 1h 24m", locationMeta: "Floor 2 · Campus Eiffel 1 · Group Work", capacity: 6, amenities: ["Whiteboard", "TV display"], status: "Confirmed", isPrimary: true, purpose: "Software Architecture Front-End Sprint" },
    { id: "BK-2047", roomId: "E1-302", roomName: "Room E1-302", badgeLabel: "TUESDAY, MAY 27", dateLabel: "May 27, 2025", timeSlot: "10:00 – 12:00", startsIn: "", locationMeta: "Floor 3 · Campus Eiffel 1", capacity: 10, amenities: ["Projector", "Whiteboard"], status: "Confirmed", isPrimary: false, purpose: "Database SQL Join Review" }
  ],
  pastBookings: [
    { id: "BK-1982", date: "May 19, 2025", roomId: "E1-G04", roomName: "Lab E1-G04", timeSlot: "16:00 – 17:00", status: "Completed" },
    { id: "BK-1940", date: "May 14, 2025", roomId: "E1-108", roomName: "Room E1-108", timeSlot: "11:00 – 13:00", status: "Completed" }
  ],
  adminBookings: [
    { id: "BK-2048", studentName: "Lina Moreau", initials: "LM", email: "lina.moreau@edu.ece.fr", roomName: "Room E1-204", campus: "Campus Eiffel 1", date: "May 24, 2025", timeSlot: "14:00–16:00", status: "In progress", statusKey: "progress" },
    { id: "BK-2047", studentName: "AMINU Farouk", initials: "AM", email: "faroukabdullahi.aminu@edu.ece.fr", roomName: "Room E1-302", campus: "Campus Eiffel 1", date: "May 27, 2025", timeSlot: "10:00–12:00", status: "Confirmed", statusKey: "available" },
    { id: "BK-2046", studentName: "Hugo Bernard", initials: "HB", email: "hugo.bernard@edu.ece.fr", roomName: "Lab E1-G04", campus: "Campus Eiffel 1", date: "May 24, 2025", timeSlot: "16:00–18:00", status: "Confirmed", statusKey: "available" },
    { id: "BK-2045", studentName: "Sarah Cohen", initials: "SC", email: "sarah.cohen@edu.ece.fr", roomName: "Room E2-118", campus: "Campus Eiffel 2", date: "May 25, 2025", timeSlot: "09:00–11:00", status: "Confirmed", statusKey: "available" },
    { id: "BK-2044", studentName: "Noah Laurent", initials: "NL", email: "noah.laurent@edu.ece.fr", roomName: "Room E1-108", campus: "Campus Eiffel 1", date: "May 24, 2025", timeSlot: "12:00–14:00", status: "Pending", statusKey: "event" },
    { id: "BK-2043", studentName: "Inès Petit", initials: "IP", email: "ines.petit@edu.ece.fr", roomName: "Room E2-206", campus: "Campus Eiffel 2", date: "May 26, 2025", timeSlot: "15:00–17:00", status: "Confirmed", statusKey: "available" }
  ]
};

/**
 * Seeds localStorage with mockData.json if not already initialized
 */
async function initBookBuddyStore() {
  if (localStorage.getItem(STORAGE_KEYS.DB_INITIALIZED)) {
    return;
  }

  let seed = FALLBACK_DATA;
  try {
    const response = await fetch('data/mockData.json');
    if (response.ok) {
      seed = await response.json();
    }
  } catch (err) {
    // Uses FALLBACK_DATA when opened directly via file://
  }

  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(seed.profiles));
  localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(seed.rooms));
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(seed.events));
  localStorage.setItem(STORAGE_KEYS.STUDENT_BOOKINGS, JSON.stringify(seed.studentBookings));
  localStorage.setItem(STORAGE_KEYS.PAST_BOOKINGS, JSON.stringify(seed.pastBookings));
  localStorage.setItem(STORAGE_KEYS.ADMIN_BOOKINGS, JSON.stringify(seed.adminBookings));

  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, 'student');
  }

  localStorage.setItem(STORAGE_KEYS.DB_INITIALIZED, 'true');
}

/**
 * Helper API exposed globally on window.BookBuddyStore for all pages
 */
window.BookBuddyStore = {
  init: initBookBuddyStore,
  getRooms: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.ROOMS) || '[]'),
  saveRooms: (rooms) => localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms)),
  getEvents: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]'),
  getStudentBookings: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENT_BOOKINGS) || '[]'),
  saveStudentBookings: (list) => localStorage.setItem(STORAGE_KEYS.STUDENT_BOOKINGS, JSON.stringify(list)),
  getPastBookings: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.PAST_BOOKINGS) || '[]'),
  getAdminBookings: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_BOOKINGS) || '[]'),
  saveAdminBookings: (list) => localStorage.setItem(STORAGE_KEYS.ADMIN_BOOKINGS, JSON.stringify(list)),
  getActiveRole: () => localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE) || 'student',
  setActiveRole: (role) => localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, role),
  getCurrentProfile: () => {
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
    const role = localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE) || 'student';
    return profiles[role] || FALLBACK_DATA.profiles.student;
  },
  resetDemoData: async () => {
    localStorage.clear();
    await initBookBuddyStore();
    window.location.reload();
  }
};

/**
 * Loads Sidebar and Navbar into #sidebar-slot and #navbar-slot
 */
async function initLayout(pageConfig = {}) {
  await initBookBuddyStore();

  const sidebarSlot = document.getElementById('sidebar-slot');
  const navbarSlot = document.getElementById('navbar-slot');

  if (sidebarSlot) {
    try {
      const res = await fetch('templates/sidebar.html');
      if (res.ok) {
        sidebarSlot.innerHTML = await res.text();
      } else {
        throw new Error('Fallback to inline sidebar');
      }
    } catch (e) {
      sidebarSlot.innerHTML = getInlineSidebarHTML();
    }
  }

  if (navbarSlot) {
    try {
      const res = await fetch('templates/navbar.html');
      if (res.ok) {
        navbarSlot.innerHTML = await res.text();
      } else {
        throw new Error('Fallback to inline navbar');
      }
    } catch (e) {
      navbarSlot.innerHTML = getInlineNavbarHTML();
    }
  }

  configureShellUI(pageConfig);
}

/**
 * Configures active links, user profile info, and admin dark theme
 */
function configureShellUI(config) {
  const {
    activePage = 'dashboard',
    title = 'Explore rooms',
    subtitle = 'Find your perfect study space.',
    searchPlaceholder = 'Search room number or amenities...',
    isAdminPage = false
  } = config;

  if (isAdminPage) {
    window.BookBuddyStore.setActiveRole('admin');
  } else if (window.BookBuddyStore.getActiveRole() === 'admin' && activePage !== 'style-guide') {
    window.BookBuddyStore.setActiveRole('student');
  }

  const profile = window.BookBuddyStore.getCurrentProfile();
  const sidebarEl = document.getElementById('app-sidebar');
  const studentNav = document.getElementById('student-nav-links');
  const adminNav = document.getElementById('admin-nav-links');
  const adminBanner = document.getElementById('admin-context-banner');

  if (sidebarEl && isAdminPage) {
    sidebarEl.classList.add('sidebar-dark');
    if (studentNav) studentNav.style.display = 'none';
    if (adminNav) adminNav.style.display = 'flex';
    if (adminBanner) adminBanner.style.display = 'block';
  }

  // Highlight active navigation link
  document.querySelectorAll('.sidebar-nav .nav-item').forEach((link) => {
    link.classList.toggle('active', link.dataset.page === activePage);
  });

  // Update badge counts dynamically from localStorage
  const stuCountEl = document.getElementById('sidebar-booking-count');
  if (stuCountEl) {
    stuCountEl.textContent = window.BookBuddyStore.getStudentBookings().length;
  }

  // Populate bottom user card
  const avatarEl = document.getElementById('sidebar-user-avatar');
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  if (avatarEl && profile) avatarEl.textContent = profile.initials;
  if (nameEl && profile) nameEl.textContent = profile.name;
  if (roleEl && profile) roleEl.textContent = profile.roleLabel;

  // Populate top navbar
  const titleEl = document.getElementById('navbar-page-title');
  const subEl = document.getElementById('navbar-page-subtitle');
  const searchEl = document.getElementById('global-search-input');
  const superLabel = document.getElementById('navbar-super-label');
  const pillText = document.getElementById('navbar-pill-text');

  if (titleEl) titleEl.textContent = title;
  if (subEl) {
    subEl.textContent = subtitle;
    subEl.style.display = subtitle ? 'block' : 'none';
  }
  if (searchEl) searchEl.placeholder = searchPlaceholder;
  if (superLabel && isAdminPage) {
    superLabel.style.display = 'block';
    if (pillText) pillText.textContent = 'All campuses';
  }

  // Bind Role Switcher
  const roleSwitcher = document.getElementById('role-switcher');
  if (roleSwitcher) {
    roleSwitcher.value = isAdminPage ? 'admin' : window.BookBuddyStore.getActiveRole();
    roleSwitcher.addEventListener('change', (e) => {
      const targetRole = e.target.value;
      if (targetRole === 'guest') {
        window.location.href = 'index.html';
        return;
      }
      window.BookBuddyStore.setActiveRole(targetRole);
      if (targetRole === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    });
  }

  // Bind Logout button
  const logoutBtn = document.getElementById('sidebar-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.location.href = 'auth.html';
    });
  }

  // Mobile Menu Drawer Toggle
  const mobileBtn = document.getElementById('mobile-menu-toggle');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (mobileBtn && sidebarEl) {
    mobileBtn.addEventListener('click', () => {
      sidebarEl.classList.toggle('open');
      if (backdrop) backdrop.classList.toggle('open');
    });
  }
  if (backdrop && sidebarEl) {
    backdrop.addEventListener('click', () => {
      sidebarEl.classList.remove('open');
      backdrop.classList.remove('open');
    });
  }
}

// Inline template fallbacks so opening HTML directly without Live Server still renders the navigation
function getInlineSidebarHTML() {
  return `
  <aside id="app-sidebar" class="sidebar" aria-label="Main Sidebar Navigation">
    <div class="sidebar-top">
      <div class="sidebar-brand-box">
        <a href="index.html" class="brand-logo">
          <span class="brand-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
          </span>
          <span>BookBuddy</span>
        </a>
      </div>
      <div id="admin-context-banner" class="admin-badge-box" style="display: none;">
        <div class="admin-badge-title">ADMINISTRATION</div>
        <div class="admin-badge-sub">Campus Eiffel network</div>
      </div>
      <nav id="student-nav-links" class="sidebar-nav">
        <a href="dashboard.html" class="nav-item" data-page="dashboard"><span class="nav-item-left">Explore Rooms</span></a>
        <a href="bookings.html" class="nav-item" data-page="bookings"><span class="nav-item-left">My Bookings</span><span id="sidebar-booking-count" class="nav-count-pill">2</span></a>
        <a href="dashboard.html#tutoring" class="nav-item" data-page="tutoring"><span class="nav-item-left">Tutoring Sessions</span></a>
        <a href="dashboard.html#events" class="nav-item" data-page="events"><span class="nav-item-left">Club Events</span></a>
      </nav>
      <nav id="admin-nav-links" class="sidebar-nav" style="display: none;">
        <a href="admin.html#overview" class="nav-item" data-page="admin-overview"><span class="nav-item-left">Overview</span></a>
        <a href="admin.html" class="nav-item active" data-page="admin"><span class="nav-item-left">All Bookings</span><span id="admin-booking-count" class="nav-count-pill">128</span></a>
        <a href="admin.html#rooms" class="nav-item" data-page="admin-rooms"><span class="nav-item-left">Room Management</span></a>
        <a href="admin.html#students" class="nav-item" data-page="admin-students"><span class="nav-item-left">Students & Access</span></a>
        <a href="style-guide.html" class="nav-item" data-page="style-guide"><span class="nav-item-left">System Settings</span></a>
      </nav>
    </div>
    <div class="sidebar-footer">
      <div class="user-profile-mini">
        <div id="sidebar-user-avatar" class="avatar-circle">AM</div>
        <div class="user-info-text">
          <div id="sidebar-user-name" class="user-info-name">AMINU Farouk</div>
          <div id="sidebar-user-role" class="user-info-role">Student</div>
        </div>
      </div>
      <button id="sidebar-logout-btn" class="logout-btn" title="Log out">↪</button>
    </div>
  </aside>
  <div id="sidebar-backdrop" class="sidebar-backdrop"></div>`;
}

function getInlineNavbarHTML() {
  return `
  <header class="top-navbar">
    <div class="navbar-left">
      <button id="mobile-menu-toggle" class="mobile-menu-btn" aria-label="Toggle Menu">☰</button>
      <div class="page-title-group">
        <div id="navbar-super-label" style="display:none; font-size:0.68rem; font-weight:700; color:var(--color-primary);">ADMINISTRATION / All campuses</div>
        <h1 id="navbar-page-title">Explore rooms</h1>
        <p id="navbar-page-subtitle">Find your perfect study space.</p>
      </div>
    </div>
    <div class="navbar-search">
      <div class="input-wrapper">
        <input type="search" id="global-search-input" class="form-input" placeholder="Search room number or amenities..." />
      </div>
    </div>
    <div class="navbar-right">
      <select id="role-switcher" class="role-switcher-select">
        <option value="student">Role: Student (AMINU Farouk)</option>
        <option value="tutor">Role: Tutor (Lina Moreau)</option>
        <option value="admin">Role: Super Admin</option>
        <option value="guest">View: Public Guest Landing</option>
      </select>
      <button type="button" id="navbar-context-pill" class="btn btn-outline btn-sm"><span id="navbar-pill-text">Sat, May 24</span></button>
    </div>
  </header>`;
}