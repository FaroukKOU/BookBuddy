document.addEventListener('DOMContentLoaded', async () => {
  await window.BookBuddyStore.init();

  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const authHeading = document.getElementById('auth-heading');
  const authSubheading = document.getElementById('auth-subheading');
  const fieldFullname = document.getElementById('field-fullname');
  const fieldStudentId = document.getElementById('field-studentid');
  const submitText = document.getElementById('auth-submit-text');

  const authForm = document.getElementById('auth-form');
  const inputFullname = document.getElementById('input-fullname');
  const inputEmail = document.getElementById('input-email');
  const inputStudentId = document.getElementById('input-studentid');
  const inputPassword = document.getElementById('input-password');
  const inputTutorRole = document.getElementById('input-tutor-role');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');

  let currentMode = 'register';

  function setAuthMode(mode) {
    currentMode = mode;
    const isRegister = mode === 'register';

    tabRegister.classList.toggle('active', isRegister);
    tabRegister.setAttribute('aria-selected', String(isRegister));
    tabLogin.classList.toggle('active', !isRegister);
    tabLogin.setAttribute('aria-selected', String(!isRegister));

    if (isRegister) {
      authHeading.textContent = 'Create your account';
      authSubheading.textContent = 'Join your ECE campus community.';
      fieldFullname.style.display = 'flex';
      fieldStudentId.style.display = 'flex';
      submitText.textContent = 'Create Student Account';
    } else {
      authHeading.textContent = 'Welcome back';
      authSubheading.textContent = 'Sign in with your ECE institutional credentials.';
      fieldFullname.style.display = 'none';
      fieldStudentId.style.display = 'none';
      submitText.textContent = 'Log In to BookBuddy';
    }

    emailError.style.display = 'none';
    passwordError.style.display = 'none';
    inputEmail.classList.remove('input-error');
    inputPassword.classList.remove('input-error');
  }

  // Check URL query parameters (?mode=login or ?mode=register)
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'login') {
    setAuthMode('login');
  } else {
    setAuthMode('register');
  }

  tabLogin.addEventListener('click', () => setAuthMode('login'));
  tabRegister.addEventListener('click', () => setAuthMode('register'));

  // Handle form submission
  authForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const emailVal = inputEmail.value.trim().toLowerCase();
    const passVal = inputPassword.value;

    // Validate institutional email (@edu.ece.fr or @ece.fr)
    const isValidEceEmail = emailVal.endsWith('@edu.ece.fr') || emailVal.endsWith('@ece.fr');
    if (!isValidEceEmail) {
      inputEmail.classList.add('input-error');
      emailError.style.display = 'block';
      return;
    }
    inputEmail.classList.remove('input-error');
    emailError.style.display = 'none';

    // Validate password length if typed (allow empty in demo mode for 1-click grading)
    if (passVal.length > 0 && passVal.length < 8) {
      inputPassword.classList.add('input-error');
      passwordError.style.display = 'block';
      return;
    }
    inputPassword.classList.remove('input-error');
    passwordError.style.display = 'none';

    // Determine role based on email or tutor checkbox
    let selectedRole = 'student';
    if (emailVal.includes('admin')) {
      selectedRole = 'admin';
    } else if (inputTutorRole && inputTutorRole.checked) {
      selectedRole = 'tutor';
    }

    // Update student profile if custom name/email was entered in Register mode
    if (currentMode === 'register' && selectedRole !== 'admin') {
      const profiles = JSON.parse(localStorage.getItem('bookbuddy_profiles') || '{}');
      const fullName = inputFullname.value.trim() || 'AMINU Farouk';
      const parts = fullName.split(' ').filter(Boolean);
      const initials = parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : fullName.slice(0, 2).toUpperCase();

      profiles[selectedRole] = {
        ...(profiles[selectedRole] || {}),
        name: fullName,
        initials,
        email: emailVal,
        studentId: inputStudentId.value.trim() || 'ECE-2025-8492',
        role: selectedRole,
        roleLabel: selectedRole === 'tutor' ? 'Tutor & Club Lead' : 'Student'
      };
      localStorage.setItem('bookbuddy_profiles', JSON.stringify(profiles));
    }

    window.BookBuddyStore.setActiveRole(selectedRole);

    // Redirect to target screen
    const requestedRoom = params.get('room');
    if (selectedRole === 'admin') {
      window.location.href = 'admin.html';
    } else if (requestedRoom) {
      window.location.href = `dashboard.html?book=${encodeURIComponent(requestedRoom)}`;
    } else {
      window.location.href = 'dashboard.html';
    }
  });
});