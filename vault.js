// vault.js — FINAL: YouTube-style grid + clean real folders + immortal
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

function getRealm() { return location.pathname.split('/')[1]?.replace('.html','') || ''; }

function updateURL() {
  location.hash = currentPath.length ? currentPath.join('/') : '';
}

function loadFromHash() {
  if (location.hash) {
    currentPath = decodeURIComponent(location.hash.slice(1)).split('/').filter(Boolean);
    updateBreadcrumb();
    loadFiles();
    return true;
  }
  return false;
}

window.navigateTo = function(p) {
  currentPath = p ? p.split('/').filter(Boolean) : [];
  updateBreadcrumb();
  loadFiles();
  updateURL();
};

function initRealmPage(realm) {
  currentRealm = realm;
  document.body.classList.add('realm-page');

  // Breadcrumb
  let bc = document.querySelector('.breadcrumb') || document.createElement('div');
  bc.className = 'breadcrumb';
  bc.innerHTML = `<a href="index.html">Home</a> > <span>${realm}</span>`;
  document.body.appendChild(bc);

  // + New Subfolder
  const btn = document.createElement('button');
  btn.className = 'new-folder-btn';
  btn.textContent = '+ New Subfolder';
  btn.onclick = () => {
    const name = prompt('Subfolder name:');
    if (!name?.trim()) return;
    const clean = name.trim().replace(/[^a-zA-Z0-9\s-]/g,'').replace(/\s+/g,'-').toLowerCase();
    currentPath = [clean];
    updateBreadcrumb();
    updateURL();
    showToast(`Drop files → goes to /${clean}/`);
    loadFiles();
  };
  document.body.appendChild(btn);

  // Upload zone
  const zone = document.createElement('div');
  zone.className = 'upload-zone';
  zone.innerHTML = '<div style="pointer-events:none">Drop files anywhere<br><small>They go into current folder</small></div>';
  zone.onclick = () => document.getElementById('filein')?.click();
  document.body.appendChild(zone);

  const input = document.createElement('input');
  input.type = 'file'; input.multiple = true; input.id = 'filein'; input.style.display = 'none';
  input.onchange = e => handleFiles(e.target.files);
  document.body.appendChild(input);

  zone.ondragover = e => { e.preventDefault(); zone.classList.add('dragover'); };
  zone.ondragleave = zone.ondrop = e => { e.preventDefault(); zone.classList.remove('dragover'); };
  zone.ondrop = e => handleFiles(e.dataTransfer.files);

  loadFromHash() || loadRealSubfolders();
  if (currentPath.length === 0) loadFiles();
}

function isAllowed(f) {
  if (!realmRules[currentRealm]?.length) return true;
  return realmRules[currentRealm].includes(f.name.split('.').pop().toLowerCase());
}

async function handleFiles(files) {
  if (!files?.length) return;
  if (currentPath.length === 0) return showToast('Create a subfolder first!');

  let up = 0;
  for (const f of files) {
    if (!isAllowed(f)) continue;
    const form = new FormData();
    form.append('file', f);
    form.append('realm', currentRealm);
    form.append('subfolder', currentPath.join('/'));
    if (await fetch('/.netlify/functions/upload',{method:'POST',body:form}).then(r=>r.ok)) up++;
  }
  if (up) {
    showToast(`Uploaded ${up} file${up>1?'s':''}!`);
    setTimeout(() => { loadRealSubfolders(); loadFiles(); }, 1500);
  }
}

async function loadRealSubfolders() {
  const c = document.getElementById('subfolders') || document.createElement('div');
  c.id = 'subfolders'; c.className = 'subfolders'; c.innerHTML = '';
  try {
    const res = await fetch(`/uploads/${currentRealm}/`);
    const txt = await res.text();
    const doc = new DOMParser().parseFromString(txt,'text/html');
    const folders = [...doc.querySelectorAll('a[href]')]
      .map(a => a.href.match(/([^/]+)\/$/))
      .filter(Boolean).map(m => m[1]);

    folders.forEach(f => {
      const d = document.createElement('div');
      d.className = 'folder-thumb';
      d.innerHTML = `Folder<br><small>${f}</small>`;
      d.onclick = () => { currentPath=[f]; updateBreadcrumb(); loadFiles(); updateURL(); };
      c.appendChild(d);
    });
  } catch(e) {}
  if (!document.getElementById('subfolders')) document.body.appendChild(c);
}

function updateBreadcrumb() {
  const parts = [`<a href="index.html">Home</a>`, ` > <a href="${currentRealm}.html">${currentRealm}</a>`];
  currentPath.forEach((p,i) => {
    const path = currentPath.slice(0,i+1).join('/');
    parts.push(` > <span onclick="navigateTo('${path}')">${p}</span>`);
  });
  document.querySelector('.breadcrumb').innerHTML = parts.join('');
  updateURL();
}

// YouTube-style perfect grid
async function loadFiles() {
  const grid = document.getElementById('file-grid') || document.createElement('div');
  grid.id = 'file-grid';
  grid.className = 'youtube-grid';
  grid.innerHTML = '';

  const path = currentPath.length ? currentPath.join('/') + '/' : '';
  const url = `/uploads/${currentRealm}/${path}`;

  try {
    const res = await fetch(url);
    const txt = await res.text();
    const doc = new DOMParser().parseFromString(txt,'text/html');
    const files = [...doc.querySelectorAll('a[href]:not([href$="/"])')].map(a => a.href.split('/').pop());

    files.forEach(f => {
      const ext = f.split('.').pop().toLowerCase();
      const div = document.createElement('div');
      div.className = 'yt-item';

      if (['jpg','jpeg','png','gif','webp','bmp'].includes(ext)) {
        div.innerHTML = `<img src="${url}${f}" loading="lazy" alt="${f}">`;
      } else if (['mp4','webm','mov'].includes(ext)) {
        div.innerHTML = `<video src="${url}${f}" preload="metadata" poster="${url}${f}#t=0.5"></video>`;
      } else {
        div.innerHTML = `<a href="${url}${f}" download>${f}</a>`;
      }
      grid.appendChild(div);
    });
  } catch(e) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#aaa">No files yet — drop some!</p>';
  }

  if (!document.getElementById('file-grid')) document.body.appendChild(grid);
}

function showToast(m) {
  const t = document.createElement('div');
  t.id = 'toast'; t.textContent = m;
  document.body.appendChild(t);
  t.style.opacity = '1'; t.style.bottom = '2rem';
  setTimeout(() => t.remove(), 3000);
}

if (location.pathname.includes('.html') && !location.pathname.includes('index')) {
  initRealmPage(getRealm());
}
