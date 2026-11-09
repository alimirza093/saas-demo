const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
}

ipcMain.handle('validate-license', async (_, payload) => {
  const baseUrl = payload.baseUrl || 'http://localhost:8000'
  const selectedOs = payload.os || (process.platform === 'win32' ? 'windows' : 'linux')
  const response = await fetch(`${baseUrl}/api/license/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      license_key: payload.licenseKey,
      os: selectedOs,
    }),
  })

  const data = await response.json().catch(() => ({ valid: false, status: 'unknown', error: 'Unable to validate license' }))
  return { status: response.status, data }
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
