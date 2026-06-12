// public/js/main.js — shared behaviour across all pages.

// API helper
async function api(path, method = 'GET', body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }

  // Auth-aware nav: swap Login/Register for the user's name + Logout
  refreshAuthNav();
});

async function refreshAuthNav() {
  const slot = document.getElementById('navAuth');
  if (!slot) return;
  try {
    const { user } = await api('/api/me');
    if (user) {
      const adminLink = user.role === 'admin'
        ? `<a href="/pages/admin.html" class="btn btn-ghost on-dark">Admin</a>` : '';
      slot.innerHTML = `
        ${adminLink}
        <span style="color:rgba(247,243,236,.85);font-size:.9rem;">Hi, ${escapeHtml(user.name.split(' ')[0])}</span>
        <button class="btn btn-gold" id="logoutBtn">Log out</button>`;
      document.getElementById('logoutBtn').addEventListener('click', async () => {
        await api('/api/logout', 'POST');
        location.href = '/';
      });
    } else {
      slot.innerHTML = `
        <a href="/pages/login.html" class="btn btn-ghost on-dark">Log in</a>
        <a href="/pages/register.html" class="btn btn-gold">Get started</a>`;
    }
  } catch {
    slot.innerHTML = `
      <a href="/pages/login.html" class="btn btn-ghost on-dark">Log in</a>
      <a href="/pages/register.html" class="btn btn-gold">Get started</a>`;
  }
}

function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function showAlert(el, type, msg) {
  el.className = `alert ${type} show`;
  el.textContent = msg;
}
