const WebSocket = require('ws');
const { copy, watch, readdirSync, remove } = require('fs-extra');

require('dotenv').config(); // Load .env into process.env

const {
  FOLDER_PATH: folderPath,
  BACKUP_PATH: backupPath,
  SERVER_URL: url,
  BACKUP_AMOUNT: backupAmount,
} = process.env;

const ws = new WebSocket(url);

function generateName(stamp = Date.now()) {
  const d = new Date(stamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}-${d.getMilliseconds()}`;
}

const dirNameToDate = (dirName) => {
  const [date, time] = dirName.split('_');

  return new Date(generateName(`${date}-${time.split('-').join(':')}`));
};

function backup() {
  // Get old backup directories and sort by date
  const directories = readdirSync(backupPath)
    .filter((d) => d !== 'desktop.ini')
    .sort((a, b) => dirNameToDate(b) - dirNameToDate(a));

  if (directories.length > backupAmount) {
    const delimiter = directories.length - backupAmount;

    for (let i = 0; i < delimiter; i++)
      remove(`${backupPath}\\${directories[i]}`, (e) => console.log(e));
  }

  copy(folderPath, `${backupPath}\\${generateName()}`, () =>
    console.log('Backup complete.')
  );
}

console.log('Watcher started\nWaiting for backup calls...');

watch(folderPath, () => {
  ws.send('cloud::modified');
  backup();
});
