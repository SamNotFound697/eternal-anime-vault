import { writeFile, mkdir, appendFile } from 'fs/promises';
import { join, dirname } from 'path';
import { createReadStream } from 'fs';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const formData = await parseMultipart(event);
    const file = formData.file;
    const realm = formData.realm || 'Misc';
    const subfolder = formData.subfolder || 'Misc';
    const fullPath = join(process.cwd(), 'public', 'uploads', realm, subfolder, file.filename);

    // Ensure directory exists
    await mkdir(dirname(fullPath), { recursive: true });

    // Write file
    const buffer = Buffer.from(file.data, 'base64');
    await writeFile(fullPath, buffer);

    // r4ven log
    const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown';
    const logEntry = `${new Date().toISOString()} | IP: ${ip} | Realm: ${realm} | Folder: ${subfolder} | File: ${file.filename}\n`;
    await appendFile(join(process.cwd(), 'logs', 'r4ven.txt'), logEntry);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, path: `/uploads/${realm}/${subfolder}/${file.filename}` })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function parseMultipart(event) {
  const contentType = event.headers['content-type'] || '';
  const boundary = contentType.split('boundary=')[1];
  if (!boundary) throw new Error('No boundary found');

  const body = Buffer.from(event.body, 'binary');
  const parts = body.toString('binary').split(`--${boundary}`);

  const formData = {};
  for (const part of parts) {
    if (part.includes('Content-Disposition: form-data')) {
      const nameMatch = part.match(/name="([^"]+)"/);
      const filenameMatch = part.match(/filename="([^"]+)"/);
      const contentMatch = part.split('\r\n\r\n')[1]?.split('\r\n--')[0];

      if (nameMatch) {
        const name = nameMatch[1];
        if (filenameMatch && contentMatch) {
          formData[name] = {
            filename: filenameMatch[1],
            data: contentMatch.toString('base64')
          };
        } else {
          formData[name] = contentMatch?.toString() || '';
        }
      }
    }
  }

  return formData;
}
