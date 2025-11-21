// vault.js — FINAL VERSION — REAL SUBFOLDERS + NO FAKES
let currentRealm = '';
let currentPath = [];

// Realm rules (Visuals = images + videos)
const realmRules = {
  Visuals: ['jpg','jpeg','png','gif','webp','bmp','mp4','mkv','webm','avi','mov'],
  Games: ['apk','exe','zip','rar','7z'],
  Movies: ['mp4','mkv','webm','avi','mov','wmv','flv'],
  Music: ['mp3','wav','flac','aac','ogg','m4a'],
  Memes: ['jpg','jpeg','png','gif','webp','mp4','webm','mov'],
  Secrets: [] // any
};

function getRealmFromURL() {
  return window.location.pathname.split('/')[1]?.replace('.html', '') || '';
}

// INIT REALM PAGE
function initRealmPage(realm) {
  currentRealm = realm;
  document.body.classList.add('realm-page');

  // Clean breadcrumb
  const breadcrumb = document.createElement('div');
  breadcrumb.className = 'breadcrumb';
  breadcrumb.innerHTML = `<a href="index.html">Home</a> > <span>${realm}</span>`;
  document.body.appendChild(breadcrumb);

  // + New Subfolder button
  const btn = document.createElement('button');
  btn.className = 'new-folder-btn';
  btn.textContent = '+ New Subfolder';
  btn.onclick = createRealSubfolder;
  document.body.appendChild(btn);

  // Clean upload zone
  const zone = document.createElement('div');
  zone.className = 'upload-zone';
  zone.textContent = 'Drop files here';
  zone.onclick = () => document.getElementById('file-input')?.click();
  document.body.appendChild(zone);

  // Hidden input
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.id = 'file-input';
  input.style.display = 'none';
  input.onchange = (e) => handleFiles(e.target.files);
  document.body.appendChild(input);

  // Drag & drop
  zone.ondragover = zone.ondragenter = (e) => { e.preventDefault(); zone.classList.add('dragover'); };
  zone.ondragleave = zone.ondrop = (e) => { e.preventDefault(); zone.classList.remove('dragover'); };
  zone.ondrop = (e) => handleFiles(e.dataTransfer.files);

  // Load REAL subfolders (from actual uploads folder)
  loadRealSubfolders();
}

async function createRealSubfolder() {
  const name = prompt('Subfolder name (e.g. Shrek 2025, Goa Trip):');
  if (!name) return;

  const cleanName = name.trim().replace(/[^a-zA-Z0-9-]/g, '_');
  const subfolderPath = `uploads/${currentRealm}/${cleanName}`;

  // Create empty .gitkeep so folder appears
  await fetch('/.netlify/functions/create-folder', {
    method: 'POST',
    body: JSON.stringify({ path: subfolderPath })
  });

  showToast(`Folder "${name}" created!`);
  setTimeout(loadRealSubfolders, 1000);
}

function isAllowed(file) {
  if (realmRules[currentRealm].length === 0) return true;
  const ext = file.name.split('.').pop().toLowerCase();
  return realmRules[currentRealm].includes(ext);
}

async function handleFiles(files) {
  if (!files || files.length === 0) return;
  if (currentPath.length === 0) return showToast('Create a subfolder first!');

  let uploaded = 0;
  for (const file of files) {
    if (!isAllowed(file)) {
      showToast(`❌ ${file.name} not allowed here`);
      continue;
    }

    const form = new FormData();
    form.append('file', file);
    form.append('realm', currentRealm);
    form.append('subfolder', currentPath.join('/'));

    const res = await fetch('/.netlify/functions/upload', {method: 'POST', body: form});
    if (res.ok) uploaded++;
  }

  if (uploaded) {
    showToast(`Uploaded ${uploaded} file${uploaded>1?'s':''}!`);
    setTimeout(loadFiles, 1500);
  }
}

// Load REAL subfolders from server
async function loadRealSubfolders() {
  const container = document.getElementById('subfolders') || document.createElement('div');
  container.id = 'subfolders';
  container.className = 'subfolders';
  container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#0ff;margin:2rem">No subfolders yet — create one!</p>';

  try {
    const res = await fetch(`/uploads/${currentRealm}/`);
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const links = doc.querySelectorAll('a[href]');
    
    const folders = Array.from(links)
      .map(a => a.href.match(/\/([^\/]+)\/$/))
      .filter(m => m)
      .map(m => m[1]);

    container.innerHTML = '';
    folders.forEach(folder => {
      const el = document.createElement('div');
      el.className = 'folder-icon';
      el.innerHTML = '📁';
      el.onclick = () => openSubfolder(folder);
      container.appendChild(el);
    });
  } catch(e) {}

  if (!document.getElementById('subfolders')) document.body.appendChild(container);
}

function openSubfolder(folder) {
  currentPath = [folder];
  updateBreadcrumb();
  loadFiles();
}

function updateBreadcrumb() {
  document.querySelector('.breadcrumb').innerHTML = 
    `<a href="index.html">Home</a> > <a href="${currentRealm}.html">${currentRealm}</a> > <span>${currentPath.join(' > ')}</span>`;
}

async function loadFiles() {
  const container = document.getElementById('file-grid') || document.createElement('div');
  container.id = 'file-grid';
  container.className = 'file-grid';
  container.innerHTML = '';

  const path = currentPath.length ? currentPath.join('/') : '';
  const url = `/uploads/${currentRealm}/${path}/`;

  try {
    const res = await fetch(url);
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const links = Array.from(doc.querySelectorAll('a[href]'))
      .filter(a => !a.href.endsWith('/'))
      .map(a => a.href.split('/').pop());

    links.forEach(file => {
      const item = document.createElement('div');
      item.className = 'file-item';
      const ext = file.split('.').pop().toLowerCase();

      if (['jpg','jpeg','png','gif','webp'].includes(ext)) {
        item.innerHTML = `<img src="${url}${file}" loading="lazy">`;
      } else if (['mp4','webm','mov'].includes(ext)) {
        item.innerHTML = `<video src="${url}${file}" controls preload="metadata"></video>`;
      } else {
        item.innerHTML = `<a href="${url}${file}" download>${file}</a>`;
      }
      container.appendChild(item);
    });
  } catch(e) {
    container.innerHTML = '<p style="grid-column:1/-1;text-align:center">No files yet</p>';
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

// Auto-init on realm pages
if (location.pathname.includes('.html') && !location.pathname.includes('index')) {
  initRealmPage(getRealmFromURL());
}
