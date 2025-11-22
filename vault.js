// vault.js — SUBFOLDERS = REAL .HTML PAGES (UNBREAKABLE)
let currentRealm = '';

function getRealm() {
  return location.pathname.split('/')[1].replace('.html', '');
}

function initRealmPage(realm) {
  currentRealm = realm;
  document.body.classList.add('realm-page');

  // UI
  document.querySelector('.breadcrumb').innerHTML = `<a href="index.html">Home</a> > ${realm}`;
  document.querySelector('.new-folder-btn').onclick = createSubfolderPage;
  document.querySelector('.upload-zone').ondrop = e => handleDrop(e);
  document.querySelector('.upload-zone').ondragover = e => e.preventDefault();

  loadSubfolderPages();
}

async function createSubfolderPage() {
  const name = prompt('Subfolder name (e.g. Shrek 2025):');
  if (!name) return;

  const clean = name.trim()
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

  if (!clean) return alert('Invalid name');

  const pageURL = `${currentRealm}-${clean}.html`;

  // Auto-generate the .html page via Netlify function
  const res = await fetch('/.netlify/functions/create-page', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ realm: currentRealm, name: clean, title: name })
  });

  if (res.ok) {
    showToast(`Created ${name}! Reloading...`);
    setTimeout(() => location.href = pageURL, 1000);
  }
}

async function loadSubfolderPages() {
  const container = document.getElementById('subfolders') || document.createElement('div');
  container.id = 'subfolders'; container.className = 'subfolders'; container.innerHTML = '';

  try {
    const res = await fetch(`/uploads/${currentRealm}/`);
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const links = doc.querySelectorAll('a[href$=".html"]');

    links.forEach(link => {
      const href = link.href.split('/').pop();
      const title = href.replace(currentRealm + '-', '').replace('.html', '').replace(/-/g, ' ');

      const el = document.createElement('div');
      el.className = 'folder-icon';
      el.innerHTML = 'Folder';
      el.onclick = () => location.href = href;
      el.title = title;
      container.appendChild(el);
    });
  } catch(e) {}

  if (!document.getElementById('subfolders')) document.body.appendChild(container);
}

function handleDrop(e) {
  e.preventDefault();
  const files = e.dataTransfer.files;
  // upload logic stays same
}

// Start
if (location.pathname.includes('.html') && location.pathname !== '/index.html') {
  initRealmPage(getRealm());
}
