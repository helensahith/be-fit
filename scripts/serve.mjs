import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist');
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.ttf': 'font/ttf', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' };
http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent((req.url ?? '/').split('?')[0]));
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  const target = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(root, 'index.html');
  res.setHeader('Content-Type', types[path.extname(target)] ?? 'application/octet-stream');
  fs.createReadStream(target).on('error', () => res.writeHead(404).end()).pipe(res);
}).listen(Number(process.env.PORT ?? 8082), '127.0.0.1', () => process.stdout.write(`Be Fit preview: http://127.0.0.1:${process.env.PORT ?? 8082}\n`));
