import { writeFile } from 'fs/promises';
import { join } from 'path';

export const handler = async (event) => {
  const { realm, name, title } = JSON.parse(event.body);
  const filename = `${realm}-${name}.html`;
  const path = join(process.cwd(), 'public', filename);

  const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <title>${title} - ${realm} - Eternal Anime Vault</title>
  <link rel="stylesheet" href="style.css">
</head><body>
  <div class="stars"></div>
  <div class="breadcrumb"><a href="index.html">Home</a> > <a href="${realm}.html">${realm}</a> > ${title}</div>
  <div class="upload-zone">Drop files here — they go to /uploads/${realm}/${name}/</div>
  <div id="file-grid" class="file-grid"></div>
  <script src="vault.js"></script>
  <script>currentRealm="${realm}"; currentPath=["${name}"]; loadFiles();</script>
</body></html>`;

  await writeFile(path, html);
  return { statusCode: 200 };
};
