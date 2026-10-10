// ── Auth State Management ────────────────────────────────────

const Auth = {
  getToken: () => localStorage.getItem('token'),
  getUser: () => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },
  isLoggedIn: () => !!localStorage.getItem('token'),
  save: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  requireAuth: () => {
    if (!Auth.isLoggedIn()) {
      window.location.href = '/auth.html?next=' + encodeURIComponent(window.location.pathname + window.location.search);
      return false;
    }
    return true;
  }
};

// ── Toast Notifications ──────────────────────────────────────
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', info: '◆' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || '◆'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(8px)'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ── Relative Time ────────────────────────────────────────────
function timeAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Avatar ───────────────────────────────────────────────────
function makeAvatar(username, color, size = 32) {
  const letter = (username || '?')[0].toUpperCase();
  return `<div class="avatar" style="background:${color || '#7c3aed'};width:${size}px;height:${size}px;font-size:${size * 0.4}px">${letter}</div>`;
}

// ── Render Navbar ────────────────────────────────────────────
function renderNavbar(activeLink = '') {
  const user = Auth.getUser();
  const nav = document.getElementById('navbar');
  if (!nav) return;

  nav.innerHTML = `
    <div class="container">
      <a href="/" class="navbar-brand">
        <div class="logo-icon">✦</div>
        <span>Inkwell</span>
      </a>
      <nav class="navbar-links">
        <a href="/" class="nav-link${activeLink === 'home' ? ' active' : ''}">Explore</a>
        ${user ? `<a href="/editor.html" class="nav-link${activeLink === 'write' ? ' active' : ''}">Write</a>` : ''}
        ${user
          ? `<div style="display:flex;align-items:center;gap:8px;">
               <button id="logout-btn" class="nav-btn nav-btn-outline">Logout</button>
               <div class="nav-avatar" style="background:${user.avatarColor || '#7c3aed'}" title="${user.username}">${user.username[0].toUpperCase()}</div>
             </div>`
          : `<a href="/auth.html" class="nav-btn nav-btn-outline">Sign in</a>
             <a href="/auth.html?tab=register" class="nav-btn nav-btn-primary">Get Started</a>`
        }
      </nav>
    </div>
  `;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Auth.clear();
      showToast('Logged out successfully', 'info');
      setTimeout(() => window.location.href = '/', 600);
    });
  }
}

// ── Page Loader ──────────────────────────────────────────────
function hideLoader() {
  const loader = document.getElementById('page-loader');
  if (loader) { loader.classList.add('hidden'); }
}

window.Auth = Auth;
window.showToast = showToast;
window.timeAgo = timeAgo;
window.makeAvatar = makeAvatar;
window.renderNavbar = renderNavbar;
window.hideLoader = hideLoader;
