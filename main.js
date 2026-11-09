const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 650,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');

  ipcMain.on('window-minimize', () => win.minimize());
  ipcMain.on('window-maximize', () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });
  ipcMain.on('window-close', () => win.close());
}

ipcMain.handle('open-file', async () => {
  const { filePaths } = await dialog.showOpenDialog(win, {
    title: 'ファイルを開く',
    filters: [
      { name: 'すべてのコードファイル', extensions: ['js', 'html', 'css', 'json', 'py', 'txt', 'md'] },
      { name: 'すべてのファイル', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (filePaths && filePaths.length > 0) {
    try {
      const content = fs.readFileSync(filePaths[0], 'utf-8');
      return { path: filePaths[0], content: content };
    } catch (err) {
      console.error(err);
      return null;
    }
  }
  return null;
});

ipcMain.handle('save-file', async (event, { filePath, text }) => {
  let targetPath = filePath;

  if (!targetPath) {
    const { filePath: dialogPath } = await dialog.showSaveDialog(win, {
      title: '名前を付けて保存',
      defaultPath: 'untitled.txt',
      filters: [
        { name: 'テキストファイル', extensions: ['txt'] },
        { name: 'JavaScript', extensions: ['js'] },
        { name: 'HTML', extensions: ['html'] },
        { name: 'すべてのファイル', extensions: ['*'] }
      ]
    });
    targetPath = dialogPath;
  }

  if (targetPath) {
    try {
      fs.writeFileSync(targetPath, text, 'utf-8');
      return { success: true, path: targetPath };
    } catch (err) {
      console.error(err);
      return { success: false, path: null };
    }
  }
  return { success: false, path: null };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});