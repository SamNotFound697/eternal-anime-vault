// vault.js — FINAL FIX: PERMANENT SUBFOLDERS + FILES SHOW + NO ERRORS
let currentRealm = '';
let currentPath = [];

// Realm rules
const realmRules = {
  Visuals: ['jpg','jpeg','png','gif','webp','bmp','mp4','mkv','webm','avi','mov'],
  Games: ['apk','exe','zip','rar','7z'],
  Movies: ['mp4','mkv','webm','avi','mov','wmv','flv'],
  Music: ['mp3','wav','flac','aac','ogg','m4a'],
  Memes: ['jpg','jpeg','png','gif','webp','mp4','webm','mov'],
  Secrets: []
};

function getRealmFromURL() {
  return window.location.pathname.split('/')[1]?.replace('.html', '') || '';
}

// Update URL hash for permanent subfolders
function updateURL() {
  if (currentPath.length > 0) {
    location.hash = currentPath.join('/');
  } else {
    location.hash = '';
  }
}

// Load subfolder from hash on page load/refresh
function loadFromHash() {
  if (location.hash) {
    currentPath = decodeURIComponent(location.hash.slice(1)).split('/').filter(p => p);
    if (currentPath.length > 0) {
      updateBreadcrumb();
      loadFiles();
      return true;
    }
  }
  return false;
}

// Breadcrumb click to navigate
window.navigateTo = function(path) {
  currentPath = path ? path.split('/').filter(p => p) : [];
  updateBreadcrumb();
  loadFiles();
  updateURL();
};

function initRealmPage(realm) {
  currentRealm = realm;
  document.body.classList.add('realm-page');

  // Safe breadcrumb creation
  let bc = document.querySelector('.breadcrumb');
  if (!bc) {
    bc = document.createElement('div');
    bc.className = 'breadcrumb';
    document.body.appendChild(bc);
  }
  bc.innerHTML = `<a href="index.html">Home</a> > <span>${realm}</span>`;

  // New folder button
  let btn = document.querySelector('.new-folder-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.className = 'new-folder-btn';
    btn.textContent = '+ New Subfolder';
    btn.onclick = createSubfolder;
    document.body.appendChild(btn);
  }

  // Upload zone
  let zone = document.querySelector('.upload-zone');
  if (!zone) {
    zone = document.createElement('div');
    zone.className = 'upload-zone';
    zone.innerHTML = '<div style="pointer-events:none">Drop files here<br><small style="opacity:0.7;font-size:1rem">or click</small></div>';
    zone.onclick = () => document.getElementById('file-input')?.click();
    document.body.appendChild(zone);
  }

  // File input
  let input = document.getElementById('file-input');
  if (!input) {
    input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.id = 'file-input'; input.style.display = 'none';
    input.onchange = e => handleFiles(e.target.files);
    document.body.appendChild(input);
  }

  // Drag & drop
  zone.ondragover = zone.ondragenter = e => { e.preventDefault(); zone.classList.add('dragover'); };
  zone.ondragleave = zone.ondrop = e => { e.preventDefault(); zone.classList.remove('dragover'); };
  zone.ondrop = e => handleFiles(e.dataTransfer.files);

  // Load
  loadFromHash(); // Restore subfolder
  loadRealSubfolders(); // Show all folders
  if (currentPath.length === 0) loadFiles(); // Show root
}

function createSubfolder() {
  const name = prompt('Subfolder name (e.g. Shrek 2025, Goa Trip):');
  if (!name?.trim()) return;

  const cleanName = name.trim()
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();

  if (!cleanName) return showToast('Invalid name');

  currentPath = [cleanName];
  updateBreadcrumb();
  updateURL();
  showToast(`Folder "${name}" ready! Drop files now.`);
  loadFiles(); // Show empty subfolder
}

function isAllowed(file) {
  if (!realmRules[currentRealm] || realmRules[currentRealm].length === 0) return true;
  return realmRules[currentRealm].includes(file.name.split('.').pop().toLowerCase());
}

async function handleFiles(files) {
  if (!files?.length) return;
  if (currentPath.length === 0) return showToast('Create a subfolder first!');

  let uploaded = 0;
  for (const file of files) {
    if (!isAllowed(file)) { showToast(`Blocked ${file.name} not allowed`); continue; }

    const form = new FormData();
    form.append('file', file);
    form.append('realm', currentRealm);
    form.append('subfolder', currentPath.join('/'));

    const res = await fetch('/.netlify/functions/upload', { method: 'POST', body: form });
    if (res.ok) uploaded++;
  }

  if (uploaded) {
    showToast(`Uploaded ${uploaded} file${uploaded > 1 ? 's' : ''}!`);
    setTimeout(() => {
      loadRealSubfolders();
      loadFiles();
    }, 1500);
  }
}

async function loadRealSubfolders() {
  const container = document.getElementById('subfolders') || document.createElement('div');
  container.id = 'subfolders';
  container.className = 'subfolders';
  container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#0ff;margin:4rem">No subfolders yet — create one!</p>';

  try {
    const res = await fetch(`/uploads/${currentRealm}/`);
    if (!res.ok) throw new Error('No uploads folder');
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const folders = Array.from(doc.querySelectorAll('a[href]'))
      .map(a => a.href.match(/([^/]+)\/$/))
      .filter(m => m)
      .map(m => m[1]);

    container.innerHTML = '';
    folders.forEach(f => {
      const el = document.createElement('div');
      el.className = 'folder-icon';
      el.innerHTML = '📁';
      el.onclick = () => { currentPath = [f]; updateBreadcrumb(); loadFiles(); updateURL(); };
      el.title = f;
      container.appendChild(el);
    });
  } catch(e) {
    console.log('No subfolders yet');
  }

  if (!document.getElementById('subfolders')) document.body.appendChild(container);
}

function updateBreadcrumb() {
  const parts = [`<a href="index.html">Home</a>`, ` > <a href="${currentRealm}.html">${currentRealm}</a>`];
  currentPath.forEach((p, i) => {
    const pathSoFar = currentPath.slice(0, i + 1).join('/');
    parts.push(` > <span style="cursor:pointer;color:#0ff" onclick="navigateTo('${pathSoFar}')">${p}</span>`);
  });
  document.querySelector('.breadcrumb').innerHTML = parts.join('');
  updateURL();
}

async function loadFiles() {
  const container = document.getElementById('file-grid') || document.createElement('div');
  container.id = 'file-grid';
  container.className = 'file-grid';
  container.innerHTML = '';

  const path = currentPath.length ? currentPath.join('/') + '/' : '';
  const url = `/uploads/${currentRealm}/${path}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('No files');
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const files = Array.from(doc.querySelectorAll('a[href]:not([href$="/"])'))
      .map(a => a.href.split('/').pop());

    files.forEach(file => {
      const item = document.createElement('div');
      item.className = 'file-item';
      const ext = file.split('.').pop().toLowerCase();

      if (['jpg','jpeg','png','gif','webp','bmp'].includes(ext)) {
        item.innerHTML = `<img src="${url}${file}" loading="lazy">`;
      } else if (['mp4','webm','mov','mkv','avi','flv'].includes(ext)) {
        item.innerHTML = `<video src="${url}${file}" controls preload="metadata"></video>`;
      } else {
        item.innerHTML = `<a href="${url}${file}" download>${file}</a>`;
      }
      container.appendChild(item);
    });
  } catch(e) {
    container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#ccc">No files yet — drop some!</p>';
  }

  if (!document.getElementById('file-grid')) document.body.appendChild(container);
}

function showToast(msg) {
  const t = document.getElementById('toast') || document.createElement('div');
  t.id = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  t.style.opacity = '1';
  t.style.bottom = '2rem';
  setTimeout(() => { t.style.opacity = '0'; t.style.bottom = '0'; }, 3000);
}

// Auto-start
if (location.pathname.includes('.html') && !location.pathname.includes('index')) {
  initRealmPage(getRealmFromURL());
}
