const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (config) => ipcRenderer.invoke('config:set', config),
  openDirectory: (defaultPath) => ipcRenderer.invoke('dialog:openDirectory', defaultPath),
  getProjectInfo: (projectDir) => ipcRenderer.invoke('project:getInfo', projectDir),
  checkFileStatuses: (projectDir, relPaths) => ipcRenderer.invoke('project:checkFileStatuses', projectDir, relPaths),
  generateCodeTxt: (projectDir, options) => ipcRenderer.invoke('project:generateCodeTxt', projectDir, options),
  getChanges: (projectDir, options) => ipcRenderer.invoke('project:getChanges', projectDir, options),
  revertFile: (projectDir, relPath) => ipcRenderer.invoke('project:revertFile', projectDir, relPath),
  revertAll: (projectDir) => ipcRenderer.invoke('project:revertAll', projectDir),
  unrevertAll: (projectDir) => ipcRenderer.invoke('project:unrevertAll', projectDir),
  hasUnrevert: (projectDir) => ipcRenderer.invoke('project:hasUnrevert', projectDir),
  generateTree: (projectDir, options) => ipcRenderer.invoke('project:generateTree', projectDir, options),
  applyFiles: (projectDir, files) => ipcRenderer.invoke('project:applyFiles', projectDir, files),
  readFile: (projectDir, relPath) => ipcRenderer.invoke('project:readFile', projectDir, relPath),
  showItem: (targetPath) => ipcRenderer.invoke('shell:showItem', targetPath),
  openFile: (targetPath) => ipcRenderer.invoke('shell:openFile', targetPath),
  writeClipboard: (text) => ipcRenderer.invoke('clipboard:write', text),

  // Terminal API
  terminal: {
    init: (cwd, cols, rows) => ipcRenderer.invoke('terminal:init', { cwd, cols, rows }),
    write: (data) => ipcRenderer.send('terminal:write', data),
    resize: (cols, rows) => ipcRenderer.send('terminal:resize', { cols, rows }),
    restart: (cwd) => ipcRenderer.invoke('terminal:restart', cwd),
    onData: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('terminal:incoming', listener);
      return () => ipcRenderer.removeListener('terminal:incoming', listener);
    },
    onExit: (callback) => {
      const listener = (event, code) => callback(code);
      ipcRenderer.on('terminal:exit', listener);
      return () => ipcRenderer.removeListener('terminal:exit', listener);
    }
  }
});
