const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('restaurantDemoAPI', {
  validateLicense: (payload) => ipcRenderer.invoke('validate-license', payload),
  platform: process.platform,
})
