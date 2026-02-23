// ===== Genius Space — App Logic =====
// Configuration is loaded from config.js

const API_URL = `https://api.github.com/users/${GITHUB_USER}/repos?sort=${DISPLAY_SETTINGS.sortBy}&per_page=${DISPLAY_SETTINGS.perPage}`;

let allRepos = [];
let activeLang = 'all';

// ===== Language Colors =====
const langColors = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  HTML: '#e34c26', CSS: '#563d7c', Shell: '#89e051', Rust: '#dea584',
  Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d', C: '#555555',
  'C#': '#178600', PHP: '#4F5D95', Ruby: '#701516', Swift: '#F05138',
  Kotlin: '#A97BFF', Dart: '#00B4AB', Vue: '#41b883', Svelte: '#ff3e00',
  Lua: '#000080', SCSS: '#c6538c', Dockerfile: '#384d54',
  Nix: '#7e7eff', Jupyter: '#DA5B0B', Makefile: '#427819',
};

// ===== Cursor Glow & Particles =====
const glow = document.getElementById('cursorGlow');
let glowActive = false;
let lastParticleTime = 0;
const particleInterval = 50; // ms between particles

document.addEventListener('mousemove', (e) => {
  if (!glowActive) { glow.classList.add('active'); glowActive = true; }
  glow.style.left = e.clientX + 'px';
  glow.style.top = e.clientY + 'px';

  // Create particle trail
  const now = Date.now();
  if (now - lastParticleTime > particleInterval) {
    createCursorParticle(e.clientX, e.clientY);
    lastParticleTime = now;
  }
});

document.addEventListener('mouseleave', () => {
  glow.classList.remove('active');
  glowActive = false;
});

function createCursorParticle(x, y) {
  const particle = document.createElement('div');
  particle.className = 'cursor-particle';

  // Random color from palette
  const colors = [
    'rgba(108, 92, 231, 0.6)',
    'rgba(253, 121, 168, 0.6)',
    'rgba(162, 155, 254, 0.6)'
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];

  particle.style.left = x + 'px';
  particle.style.top = y + 'px';
  particle.style.background = color;
  particle.style.boxShadow = `0 0 10px ${color}`;

  document.body.appendChild(particle);

  // Remove after animation
  setTimeout(() => particle.remove(), 1000);
}

// ===== Random Background Particles =====
const ambg = document.getElementById('ambg');

function createBgParticle() {
  const particle = document.createElement('div');
  particle.className = 'bg-particle';

  // Random size
  const size = Math.random() * 100 + 50;
  particle.style.width = size + 'px';
  particle.style.height = size + 'px';

  // Random position
  particle.style.left = Math.random() * 100 + '%';

  // Random color
  const colors = [
    'rgba(108, 92, 231, 0.03)',
    'rgba(253, 121, 168, 0.03)',
    'rgba(162, 155, 254, 0.03)'
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];
  particle.style.background = `radial-gradient(circle, ${color}, transparent 70%)`;

  // Random duration
  const duration = Math.random() * 20 + 15; // 15-35s
  particle.style.animationDuration = duration + 's';

  // Random delay
  const delay = Math.random() * -20; // start at different points
  particle.style.animationDelay = delay + 's';

  ambg.appendChild(particle);

  // Remove after animation
  setTimeout(() => particle.remove(), (duration + Math.abs(delay)) * 1000);
}

// Create initial particles
for (let i = 0; i < 8; i++) {
  createBgParticle();
}

// Add new particles periodically
setInterval(() => {
  if (document.querySelectorAll('.bg-particle').length < 12) {
    createBgParticle();
  }
}, 5000);

// Mobile: use touch for glow-like ambient effect (via CSS ambient bg only)
// The cursor-glow is hidden on mobile via CSS

// ===== Fetch Repos =====
async function fetchRepos() {
  const grid = document.getElementById('repoGrid');
  const loading = document.getElementById('loadingState');
  const error = document.getElementById('errorState');
  const empty = document.getElementById('emptyState');

  loading.classList.remove('hidden');
  error.classList.add('hidden');
  empty.classList.add('hidden');
  grid.innerHTML = '';
  grid.appendChild(loading);

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allRepos = await res.json();

    // Filter out forks if configured
    if (!DISPLAY_SETTINGS.showForks) {
      allRepos = allRepos.filter(r => !r.fork);
    }

    // Filter by allowed repos if specified
    if (ALLOWED_REPOS.length > 0) {
      const allowedList = ALLOWED_REPOS.map(name => name.trim().toLowerCase());
      allRepos = allRepos.filter(r => allowedList.includes(r.name.toLowerCase()));
    }

    updateStats();
    buildLangFilters();
    renderRepos();
    loading.classList.add('hidden');
  } catch (err) {
    console.error('Failed to fetch repos:', err);
    loading.classList.add('hidden');
    error.classList.remove('hidden');
  }
}

// ===== Stats =====
function updateStats() {
  document.getElementById('repoCount').textContent = allRepos.length;
  const stars = allRepos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  document.getElementById('starCount').textContent = stars;
  const langs = new Set(allRepos.map(r => r.language).filter(Boolean));
  document.getElementById('langCount').textContent = langs.size;
}

// ===== Language Filters =====
function buildLangFilters() {
  const container = document.getElementById('langFilters');
  const langs = {};
  allRepos.forEach(r => {
    if (r.language) langs[r.language] = (langs[r.language] || 0) + 1;
  });

  // Sort by count
  const sorted = Object.entries(langs).sort((a, b) => b[1] - a[1]);

  container.innerHTML = '<button class="chip active" data-lang="all">All</button>';
  sorted.forEach(([lang, count]) => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.dataset.lang = lang;
    btn.textContent = `${lang} (${count})`;
    container.appendChild(btn);
  });

  // Click handlers
  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeLang = chip.dataset.lang;
      renderRepos();
    });
  });
}

// ===== Render Repos =====
function renderRepos() {
  const grid = document.getElementById('repoGrid');
  const empty = document.getElementById('emptyState');
  const query = document.getElementById('searchInput').value.toLowerCase().trim();

  grid.innerHTML = '';
  empty.classList.add('hidden');

  let filtered = allRepos;
  if (activeLang !== 'all') {
    filtered = filtered.filter(r => r.language === activeLang);
  }
  if (query) {
    filtered = filtered.filter(r =>
      (r.name || '').toLowerCase().includes(query) ||
      (r.description || '').toLowerCase().includes(query) ||
      (r.language || '').toLowerCase().includes(query)
    );
  }

  if (filtered.length === 0) {
    empty.classList.remove('hidden');
    return;
  }

  filtered.forEach((repo, i) => {
    const card = createRepoCard(repo, i);
    grid.appendChild(card);
  });
}

// ===== Build Repo Card =====
function createRepoCard(repo, index) {
  const card = document.createElement('div');
  card.className = 'repo-card';
  card.style.animationDelay = `${index * 0.05}s`;

  const hasPages = repo.has_pages;
  const pagesUrl = hasPages ? `https://${GITHUB_USER.toLowerCase()}.github.io/${repo.name}/` : null;
  const langColor = langColors[repo.language] || '#888';
  const updatedDate = new Date(repo.updated_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  // Preview section
  let previewHTML = '';
  if (hasPages && pagesUrl) {
    previewHTML = `
      <div class="card-preview">
        <span class="live-badge">LIVE</span>
        <iframe src="${pagesUrl}" loading="lazy" sandbox="allow-scripts allow-same-origin" scrolling="no" title="${repo.name} preview"></iframe>
      </div>`;
  } else {
    previewHTML = `
      <div class="card-preview">
        <div class="card-preview-placeholder">
          <i class="fa-solid fa-code"></i>
          <span>${repo.language || 'Repository'}</span>
        </div>
      </div>`;
  }

  // Actions
  let actionsHTML = `
    <a class="card-btn" href="${repo.html_url}" target="_blank" rel="noopener">
      <i class="fa-brands fa-github"></i> Source
    </a>`;
  if (hasPages && pagesUrl) {
    actionsHTML += `
    <a class="card-btn primary" href="${pagesUrl}" target="_blank" rel="noopener">
      <i class="fa-solid fa-arrow-up-right-from-square"></i> Visit Site
    </a>`;
  }

  card.innerHTML = `
    ${previewHTML}
    <div class="card-body">
      <div class="card-name">
        <i class="fa-solid fa-cube"></i>
        ${escapeHTML(repo.name)}
      </div>
      <div class="card-desc">${escapeHTML(repo.description || 'No description provided.')}</div>
      <div class="card-meta">
        ${repo.language ? `<span class="card-meta-item"><span class="lang-dot" style="background:${langColor}"></span> ${escapeHTML(repo.language)}</span>` : ''}
        ${repo.stargazers_count > 0 ? `<span class="card-meta-item"><i class="fa-solid fa-star" style="color:var(--warn)"></i> ${repo.stargazers_count}</span>` : ''}
        ${repo.forks_count > 0 ? `<span class="card-meta-item"><i class="fa-solid fa-code-fork"></i> ${repo.forks_count}</span>` : ''}
        <span class="card-meta-item"><i class="fa-regular fa-clock"></i> ${updatedDate}</span>
      </div>
    </div>
    <div class="card-actions">
      ${actionsHTML}
    </div>`;

  return card;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== Search =====
document.getElementById('searchInput').addEventListener('input', () => {
  renderRepos();
});

// ===== Update Footer Year =====
function updateFooterYear() {
  const yearEl = document.getElementById('footerCopy');
  const currentYear = new Date().getFullYear();
  yearEl.innerHTML = `&copy; ${currentYear} NUCL3ARN30N &amp; friends`;
}

// ===== PWA Install =====
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

console.log('[PWA] Install button element:', installBtn);
console.log('[PWA] Waiting for beforeinstallprompt event...');

// Check if already installed
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('[PWA] App is already installed');
} else {
  console.log('[PWA] App is not installed yet');
}

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] beforeinstallprompt event fired!');
  // Prevent the mini-infobar from appearing
  e.preventDefault();
  // Store the event for later use
  deferredPrompt = e;
  // Show the install button
  if (installBtn) {
    installBtn.style.display = 'flex';
    console.log('[PWA] Install button shown');
  } else {
    console.error('[PWA] Install button element not found!');
  }
});

// Handle install button click
if (installBtn) {
  installBtn.addEventListener('click', async () => {
    console.log('[PWA] Install button clicked');
    if (!deferredPrompt) {
      console.log('[PWA] No deferred prompt available');
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);

    // Clear the deferredPrompt
    deferredPrompt = null;
    installBtn.style.display = 'none';
  });
}

// Hide install button if already installed
window.addEventListener('appinstalled', () => {
  console.log('[PWA] App was installed');
  if (installBtn) {
    installBtn.style.display = 'none';
  }
  deferredPrompt = null;
});

// ===== Service Worker Registration =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// ===== Init =====
updateFooterYear();
fetchRepos();
