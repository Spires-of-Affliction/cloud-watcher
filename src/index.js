const WebSocket = require('ws');
const chokidar = require('chokidar');
const { copy } = require('fs-extra');

require('dotenv').config(); // Load .env into process.env

const {
  FOLDER_PATH: folderPath,
  BACKUP_PATH: backupPath,
  SERVER_URL: url,
} = process.env;

let ws = new WebSocket(url);
let pool = [];

ws.onopen = () => console.log('Established connection with the Discord bot.\n');

const eventSymbol = (event) => {
  switch (event) {
    case 'unlink': // Removed
    case 'unlinkDir':
      return '-';
    case 'add': // Created
    case 'addDir':
      return '+';
    default:
      return '@';
  }
};

function checkIfPooled(event, file) {
  if (pool.length === 0) return false;

  console.log(pool);

  const name = `${eventSymbol(event)} ${file}`;
  const index = pool.findIndex((v) => v === name);

  if (index === -1) return false;

  pool.splice(index, 1);

  return true;
}

function generateName(stamp = Date.now()) {
  const d = new Date(stamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}-${d.getMilliseconds()}`;
}

function backup() {
  // TODO: Implement removal of old backups
  const path = `${backupPath}\\${generateName()}`;

  copy(folderPath, path, () => console.log(`Backup complete:\n${path}`));
}

console.log('Watcher started\nWaiting for backup calls...\n');

chokidar.watch(folderPath, { ignoreInitial: true }).on('all', (event, file) => {
  file = file.replace(`${folderPath}\\`, '');

  const isPooled = checkIfPooled(event, file);

  if (isPooled) return;

  if (/(.lnk)|(.tmp)|(.TMP)|(.mega)|(Rubbish)/g.test(file)) return; // Break if unwanted file
  console.log(event, file);

  ws.send(`${event}::${file}`);
});

ws.on('message', (msg) => {
  switch (msg) {
    case 'backup':
      backup();
      break;
    default:
      // Inbound JSON
      try {
        pool = JSON.parse(msg);
        break;
      } catch (error) {
        return console.error("ws.on('message')", error);
      }
  }
});

// Heroku idle connection override
setInterval(() => {
  ws.send('ping');
}, 10000);
