const { watch } = require('fs');
const { copy } = require('fs-extra');

require('dotenv').config(); // Load .env into process.env

const { FOLDER_PATH: folderPath, BACKUP_PATH: backupPath } = process.env;

function generateName() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}-${d.getMilliseconds()}`;
}

function backup() {
  copy(folderPath, `${backupPath}\\${generateName()}`, () =>
    console.log('Backup complete.')
  );
}

console.log('Watcher started\nWaiting for backup calls...');

watch(folderPath, (event, file) => {
  // Connect to the bot
  console.log(event, file);
  backup();
});
