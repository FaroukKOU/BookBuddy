# BookBuddy — Campus Study Room Reservation Web App

**BookBuddy** is a frontend web application designed for **ECE Paris (Eiffel Campuses 1, 2, and 3)** to streamline study room discovery, reservations, tutoring sessions, and club event scheduling.

Built as part of our Software Architecture & Web Development lab, this prototype translates our UML Use Case and Class diagrams into a responsive, interactive multi-page interface.

---

## Key Features

* **Public Room Discovery (`index.html`):** Unauthenticated guests can browse available study rooms across Eiffel campuses, filter by date/time/capacity, and view upcoming open club events and tutoring clinics.
* **Student & Role Authentication (`auth.html`):** Split-screen Login and Registration interface supporting institutional `@edu.ece.fr` email validation, student ID verification, and Tutor/Club Manager role applications.
* **Student Room Explorer (`dashboard.html`):** Live search by room code or amenities, multi-criteria filtering (campus, floor, capacity, room type), availability toggles, and real-time seat occupancy indicators.
* **Interactive Booking Flow:** Dynamic reservation modal pre-filled with room details, time slot selection (`10:00–20:00`), session categories (*General Study*, *Tutoring Session*, *Club Meeting*), and attendee capacity validation.
* **Schedule Management (`bookings.html`):** View upcoming and past reservations, edit existing bookings, or cancel slots (automatically freeing room capacity).
* **Administrator Control Panel (`admin.html`):** Campus-wide KPI overview, master reservations table with override/force-cancel moderation controls, and a form to add new rooms to the system.
* **Client-Side Role Switcher:** Built-in simulation switcher allowing evaluators to test **Guest**, **Student**, **Tutor / Club Manager**, and **Administrator** views seamlessly.

---

## Tech Stack & Architectural Decisions

* **HTML5 & Semantic Structure:** Multi-page architecture separated cleanly into root views and reusable HTML layout fragments (`/templates`).
* **Pure CSS3 (Design Token System):** Styled using custom CSS variables (`:root`) for typography (`Plus Jakarta Sans` & `Inter`), spacing, semantic status badges, and responsive breakpoints (Desktop, Tablet, Mobile) without external framework bloat.
* **Modular Vanilla ES6 JavaScript:** Handles dynamic DOM rendering, client-side filtering, modal state, and layout injection.
* **Mock Data & Persistence (`/data/mockData.json` + `localStorage`):** Initial campus rooms, bookings, events, and users are loaded from structured JSON files and persisted in `localStorage` so reservations, edits, cancellations, and new rooms update dynamically across all pages without a backend server.

---

## Project Structure

```text
bookbuddy/
├── index.html              # Public landing & guest room discovery
├── auth.html               # Login & ECE student registration
├── dashboard.html          # Authenticated student room explorer & booking modal
├── bookings.html           # Personal reservation management & history
├── admin.html              # Administrator moderation & room management
├── assets/
│   ├── css/                # Design tokens (variables.css), global styles & page CSS
│   ├── js/                 # Layout loader, role switcher & page-specific logic
│   └── images/             # Logos, room thumbnails & user avatars
├── data/
│   └── mockData.json       # Seed data for rooms, users, bookings & campus events
├── templates/
│   ├── navbar.html         # Reusable top navigation bar
│   └── sidebar.html        # Reusable authenticated dashboard sidebar
└── README.md
