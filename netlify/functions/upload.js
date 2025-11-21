import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const form = await parseForm(event);
  const file = form.file;
  const path = form.path;

  const full = join(process.cwd(), 'public', 'uploads', path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, Buffer.from(file.data, 'base64'));

  // r4ven log
  const ip = event.headers['x-nf-client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
  const log = `${new Date().toISOString()} | ${ip} | ${path}\n`;
  await appendFile(join(process.cwd(), 'logs', 'r4ven.txt'), log);

  return { statusCode: 200 };
};

async function parseForm(event) {
  const boundary = event.headers['content-type'].split('boundary=')[1];
  const parts = Buffer.from(event.body, 'base64').toString().split(`--${boundary}`);
  const data = {};
  for(const part of parts){
    if(!part.includes('filename')) continue;
    const name = part.match(/name="([^"]+)"/)[1];
    const filename = part.match(/filename="([^"]+)"/)[1];
    const content = part.split('\r\n\r\n')[1].split('\r\n--')[0];
    data[name] = { data: content, filename };
  }
  return data;
}

async function appendFile(path, data){
  try{ await writeFile(path, data, {flag:'a'}); }catch{}
}
