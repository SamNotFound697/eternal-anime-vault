// vault.js — ONE SUBFOLDER = ONE REAL .HTML PAGE (IMMORTAL)
let currentRealm = '';
let currentSubfolder = '';

function getRealm() {
  const file = location.pathname.split('/').pop();
  return file.split('-')[0] || file.replace('.html', '');
}

function initRealmPage(realm) {
  currentRealm = realm;
  document.body.classList.add('realm-page');

  // Main realm page
  if (!location.pathname.includes('-')) {
    document.querySelector('.breadcrumb').innerHTML = `<a href="index.html">Home</a> > ${realm}`;
    document.querySelector('.new-folder-btn').onclick = createSubPage;
    loadSubPages();
    return;
  }

  // This is a subfolder page (e.g. visuals-goa-2025.html)
  const title = decodeURIComponent(
    location.pathname.split('-').slice(1).join('-').replace('.html', '').replace(/-/g, ' ')
  );
  document.querySelector('.breadcrumb').innerHTML = 
    `<a href="index.html">Home</a> > <a href="${realm}.html">${realm}</a> > ${title}`;
  document.querySelector('.new-folder-btn').remove();

  currentSubfolder = location.pathname.split('/').pop()
    .replace('.html', '')
    .replace(realm + '-', '');

  loadFiles();
}

async function createSubPage() {
  const name = prompt('Subfolder name (e.g. Goa Trip 2025, Shrek Pack):');
  if (!name?.trim()) return;

  const clean = name.trim()
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();

  const filename = `${currentRealm}-${clean}.html`;

  const res = await fetch('/.netlify/functions/create-page', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ realm: currentRealm, slug: clean, title: name })
  });

  if (res.ok) {
    showToast(`"${name}" created! Opening...`);
    setTimeout(() => location.href = filename, 1000);
  } else {
    showToast('Failed — check logs');
  }
}

async function loadSubPages() {
  const container = document.getElementById('subfolders');
  container.innerHTML = '<p style="grid-column:1/-1;color:#0ff;text-align:center;margin:4rem">No subfolders yet — create one!</p>';

  const res = await fetch('/');
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const pages = [...doc.querySelectorAll('a[href]')]
    .map(a => a.href.split('/').pop())
    .filter(f => f.startsWith(currentRealm + '-') && f.endsWith('.html'));

  container.innerHTML = '';
  pages.forEach(file => {
    const title = file.replace(currentRealm + '-', '').replace('.html', '').replace(/-/g, ' ');
    const div = document.createElement('div');
    div.className = 'folder-icon';
    div.innerHTML = 'Folder';
    div.title = title;
    div.onclick = () => location.href = file;
    container.appendChild(div);
  });
}

async function loadFiles() {
  const grid = document.getElementById('file-grid');
  grid.innerHTML = '';
  const url = `/uploads/${currentRealm}/${currentSubfolder}/`;

  try {
    const res = await fetch(url);
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const files = [...doc.querySelectorAll('a[href]:not([href$="/"])')]
      .map(a => a.href.split('/').pop());

    files.forEach(f => {
      const ext = f.split('.').pop().toLowerCase();
      const el = document.createElement('div');
      el.className = 'file-item';
      if (['jpg','jpeg','png','gif','webp','bmp'].includes(ext))
        el.innerHTML = `<img src="${url}${f}" loading="lazy">`;
      else if (['mp4','webm','mov','mkv','avi','flv'].includes(ext))
        el.innerHTML = `<video src="${url}${f}" controls preload="metadata"></video>`;
      else
        el.innerHTML = `<a href="${url}${f}" download>${f}</a>`;
      grid.appendChild(el);
    });
  } catch (e) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center">No files yet — drop some!</p>';
  }
}

function showToast(msg) {
  const t = document.createElement('div');
  t.id = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  t.style.opacity = '1'; t.style.bottom = '2rem';
  setTimeout(() => t.remove(), 3000);
}

// START
if (location.pathname.includes('.html') && !location.pathname.includes('index.html')) {
  initRealmPage(getRealm());
}
