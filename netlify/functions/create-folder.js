export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };
  const { path } = JSON.parse(event.body);
  const fullPath = require('path').join(process.cwd(), 'public', path);
  await require('fs').promises.mkdir(fullPath, { recursive: true });
  await require('fs').promises.writeFile(`${fullPath}/.gitkeep`, '');
  return { statusCode: 200 };
};
