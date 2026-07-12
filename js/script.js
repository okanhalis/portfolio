// ===========================================================
// OKAN95 — window manager for the retro desktop
// ===========================================================

const APPS = {
  about:    { title: 'Hakkımda',        icon: 'assets/icon-user.svg',   tpl: 'tpl-about',    w: 420, h: 300 },
  projects: { title: 'Projeler',        icon: 'assets/icon-folder.svg', tpl: 'tpl-projects', w: 460, h: 320 },
  resume:   { title: 'Özgeçmiş.txt',    icon: 'assets/icon-doc.svg',    tpl: 'tpl-resume',   w: 440, h: 360 },
  contact:  { title: 'İletişim',        icon: 'assets/icon-mail.svg',   tpl: 'tpl-contact',  w: 380, h: 260 },
  browser:  { title: 'Sosyal - Internet Explorer', icon: 'assets/icon-globe.svg', tpl: 'tpl-browser', w: 520, h: 380 },
  bin:      { title: 'Geri Dönüşüm Kutusu', icon: 'assets/icon-bin.svg', tpl: 'tpl-bin', w: 360, h: 240 },
};

// Placeholder project detail data — fill in later.
const PROJECTS = {
  1: { title: 'Proje 1' },
  2: { title: 'Proje 2' },
  3: { title: 'Proje 3' },
  4: { title: 'Proje 4' },
};

let zTop = 10;
let winCount = 0;
const openWindows = new Map(); // id -> element

function bringToFront(win) {
  document.querySelectorAll('.win').forEach(w => w.classList.remove('active'));
  document.querySelectorAll('.task-btn').forEach(b => b.classList.remove('active'));
  zTop += 1;
  win.style.zIndex = zTop;
  win.classList.add('active');
  const btn = document.querySelector(`.task-btn[data-target="${win.dataset.winId}"]`);
  if (btn) btn.classList.add('active');
}

function openApp(appId, opts = {}) {
  const app = APPS[appId] || {};
  if (!app.tpl && !opts.tpl) return;

  // If already open (and not multi-instance), just focus/restore it.
  if (openWindows.has(appId) && !opts.forceNew) {
    const existing = openWindows.get(appId);
    existing.classList.remove('minimized');
    bringToFront(existing);
    return existing;
  }

  const icon = opts.icon || app.icon;
  const title = opts.title || app.title;

  winCount += 1;
  const winId = opts.winId || appId;
  const win = document.createElement('section');
  win.className = 'win active';
  win.dataset.winId = winId;
  win.style.width = (opts.w || app.w || 400) + 'px';
  win.style.height = (opts.h || app.h || 300) + 'px';
  win.style.left = (40 + (winCount % 6) * 24) + 'px';
  win.style.top = (30 + (winCount % 6) * 24) + 'px';

  win.innerHTML = `
    <div class="win-titlebar">
      <img src="${icon}" alt="">
      <span class="title-text">${title}</span>
      <div class="win-btns">
        <button class="min-btn" title="Simge durumuna küçült">_</button>
        <button class="max-btn" title="Büyüt">▢</button>
        <button class="close-btn" title="Kapat">✕</button>
      </div>
    </div>
    <div class="win-body"></div>
    <div class="win-resize-handle"></div>
  `;

  const body = win.querySelector('.win-body');
  const tplId = opts.tpl || app.tpl;
  const tpl = document.getElementById(tplId);
  if (tpl) body.appendChild(tpl.content.cloneNode(true));

  document.getElementById('windows-layer').appendChild(win);
  openWindows.set(winId, win);

  addTaskButton(winId, title, icon);
  wireWindow(win, winId);
  bringToFront(win);

  // Project detail wiring (event delegation inside projects window)
  if (appId === 'projects') {
    body.querySelectorAll('.file-icon[data-project]').forEach(el => {
      el.addEventListener('dblclick', () => {
        const pid = el.dataset.project;
        const proj = PROJECTS[pid];
        openApp('project-' + pid, {
          forceNew: true,
          winId: 'project-' + pid,
          title: proj.title,
          icon: 'assets/icon-image.svg',
          tpl: 'tpl-project-detail',
          w: 420, h: 320,
        });
      });
    });
  }

  return win;
}

function addTaskButton(winId, title, icon) {
  const btn = document.createElement('button');
  btn.className = 'task-btn active';
  btn.dataset.target = winId;
  btn.innerHTML = `<img src="${icon}" alt=""><span>${title}</span>`;
  btn.addEventListener('click', () => {
    const win = openWindows.get(winId);
    if (!win) return;
    const isActive = win.classList.contains('active') && !win.classList.contains('minimized');
    if (isActive) {
      win.classList.add('minimized');
      btn.classList.remove('active');
    } else {
      win.classList.remove('minimized');
      bringToFront(win);
    }
  });
  document.getElementById('task-buttons').appendChild(btn);
  APPS_TASKBTN_MAP.set(winId, btn);
}
const APPS_TASKBTN_MAP = new Map();

function closeWindow(winId) {
  const win = openWindows.get(winId);
  if (!win) return;
  win.remove();
  openWindows.delete(winId);
  const btn = APPS_TASKBTN_MAP.get(winId);
  if (btn) btn.remove();
  APPS_TASKBTN_MAP.delete(winId);
}

function wireWindow(win, winId) {
  const titlebar = win.querySelector('.win-titlebar');
  const closeBtn = win.querySelector('.close-btn');
  const minBtn = win.querySelector('.min-btn');
  const maxBtn = win.querySelector('.max-btn');
  const resizeHandle = win.querySelector('.win-resize-handle');

  win.addEventListener('mousedown', () => bringToFront(win));

  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeWindow(winId); });
  minBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    win.classList.add('minimized');
    const btn = APPS_TASKBTN_MAP.get(winId);
    if (btn) btn.classList.remove('active');
  });
  maxBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    win.classList.toggle('maximized');
  });
  titlebar.addEventListener('dblclick', () => win.classList.toggle('maximized'));

  // Dragging
  let dragging = false, offX = 0, offY = 0;
  titlebar.addEventListener('mousedown', (e) => {
    if (e.target.closest('button')) return;
    if (win.classList.contains('maximized')) return;
    dragging = true;
    offX = e.clientX - win.offsetLeft;
    offY = e.clientY - win.offsetTop;
    bringToFront(win);
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    let x = e.clientX - offX;
    let y = e.clientY - offY;
    x = Math.max(-win.offsetWidth + 60, Math.min(x, window.innerWidth - 60));
    y = Math.max(0, Math.min(y, window.innerHeight - 40));
    win.style.left = x + 'px';
    win.style.top = y + 'px';
  });
  window.addEventListener('mouseup', () => dragging = false);

  // Touch dragging (basic)
  titlebar.addEventListener('touchstart', (e) => {
    if (e.target.closest('button')) return;
    if (win.classList.contains('maximized')) return;
    const t = e.touches[0];
    dragging = true;
    offX = t.clientX - win.offsetLeft;
    offY = t.clientY - win.offsetTop;
    bringToFront(win);
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const t = e.touches[0];
    win.style.left = (t.clientX - offX) + 'px';
    win.style.top = (t.clientY - offY) + 'px';
  }, { passive: true });
  window.addEventListener('touchend', () => dragging = false);

  // Resizing
  let resizing = false, startW = 0, startH = 0, startX = 0, startY = 0;
  resizeHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    resizing = true;
    startW = win.offsetWidth; startH = win.offsetHeight;
    startX = e.clientX; startY = e.clientY;
  });
  window.addEventListener('mousemove', (e) => {
    if (!resizing) return;
    win.style.width = Math.max(260, startW + (e.clientX - startX)) + 'px';
    win.style.height = Math.max(160, startH + (e.clientY - startY)) + 'px';
  });
  window.addEventListener('mouseup', () => resizing = false);
}

// ---------- Desktop icon selection / open ----------
document.querySelectorAll('#icons .icon').forEach(icon => {
  icon.addEventListener('click', (e) => {
    document.querySelectorAll('#icons .icon').forEach(i => i.classList.remove('selected'));
    icon.classList.add('selected');
  });
  icon.addEventListener('dblclick', () => openApp(icon.dataset.window));
});
document.getElementById('desktop').addEventListener('click', (e) => {
  if (!e.target.closest('.icon')) {
    document.querySelectorAll('#icons .icon').forEach(i => i.classList.remove('selected'));
  }
});

// ---------- Start menu ----------
const startBtn = document.getElementById('start-btn');
const startMenu = document.getElementById('start-menu');
startBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startMenu.classList.toggle('open');
  startBtn.classList.toggle('active');
});
startMenu.querySelectorAll('li[data-window]').forEach(li => {
  li.addEventListener('click', () => {
    openApp(li.dataset.window);
    startMenu.classList.remove('open');
    startBtn.classList.remove('active');
  });
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) {
    startMenu.classList.remove('open');
    startBtn.classList.remove('active');
  }
});

// ---------- Shutdown ----------
document.getElementById('shutdown-item').addEventListener('click', () => {
  startMenu.classList.remove('open');
  const overlay = document.createElement('div');
  overlay.id = 'shutdown-screen';
  overlay.className = 'show';
  overlay.innerHTML = 'Bilgisayarınızı kapatabilirsiniz.<br><br><span style="font-size:12px;color:#aaa;">(Sekmeyi kapatabilir ya da sayfayı yenileyebilirsiniz)</span>';
  document.body.appendChild(overlay);
});

// ---------- Clock ----------
function tickClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('clock').textContent = `${hh}:${mm}`;
}
tickClock();
setInterval(tickClock, 1000 * 15);

// ---------- Boot: remove overlay from flow after animation ----------
setTimeout(() => {
  const boot = document.getElementById('boot-screen');
  if (boot) boot.style.display = 'none';
}, 2400);

// ---------- Open "about" by default on first load ----------
window.addEventListener('load', () => {
  openApp('about');
});
