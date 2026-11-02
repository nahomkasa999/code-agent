const { app, BrowserWindow, ipcMain, dialog, shell, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Diff = require('diff');

// Command line switches to ensure smooth execution across Linux environments
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-zygote');
app.commandLine.appendSwitch('in-process-gpu');

let mainWindow;
let ptyProcess = null;

function setupTerminal(webContents, cwd, cols = 80, rows = 24) {
  if (ptyProcess) {
    try {
      ptyProcess.kill();
    } catch (e) {}
    ptyProcess = null;
  }

  const shellCmd = process.env.SHELL || '/bin/bash';
  try {
    const pty = require('node-pty');
    const targetCwd = cwd && fs.existsSync(cwd) ? cwd : (process.env.HOME || '/');

    ptyProcess = pty.spawn(shellCmd, [], {
      name: 'xterm-256color',
      cols: Math.max(cols, 20),
      rows: Math.max(rows, 10),
      cwd: targetCwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor'
      }
    });

    ptyProcess.onData((data) => {
      if (!webContents.isDestroyed()) {
        webContents.send('terminal:incoming', data);
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      if (!webContents.isDestroyed()) {
        webContents.send('terminal:exit', exitCode);
      }
    });
  } catch (err) {
    console.error('Failed to spawn terminal PTY:', err);
    if (!webContents.isDestroyed()) {
      webContents.send('terminal:incoming', `\r\n\x1b[31mError launching terminal: ${err.message}\x1b[0m\r\n`);
    }
  }
}

// Binary & media file extensions to ignore in code exports
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.avif', '.bmp', '.tiff',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp4', '.webm', '.ogg', '.mp3', '.wav', '.flac',
  '.pdf', '.zip', '.tar', '.gz', '.7z', '.rar',
  '.exe', '.bin', '.iso', '.dmg', '.sqlite', '.db'
]);

// Ignored folders
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.nuxt',
  '.turbo',
  'dist',
  'build',
  'out',
  '.cache',
  'coverage',
  '.codebridge'
]);

// Ignored filenames
const IGNORED_FILES = new Set([
  'code.txt',
  'changes.txt',
  'website.txt',
  'bun.lock',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.DS_Store'
]);

// Config storage
function getConfigFilePath() {
  try {
    return path.join(app.getPath('userData'), 'codebridge-config.json');
  } catch (e) {
    return path.join(__dirname, '.config.json');
  }
}

function loadConfig() {
  const configFilePath = getConfigFilePath();
  try {
    if (fs.existsSync(configFilePath)) {
      return JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    }
  } catch (err) {
    console.error('Failed to load config:', err);
  }
  return {
    recentProjects: [],
    lastProjectDir: null,
    ignoreMd: true,
    ignoreShadcn: true,
    ignoreNodeModules: true,
    customIgnore: ''
  };
}

function saveConfig(config) {
  const configFilePath = getConfigFilePath();
  try {
    fs.mkdirSync(path.dirname(configFilePath), { recursive: true });
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save config:', err);
  }
}

function detectShadcnPath(projectDir) {
  try {
    const compJsonPath = path.join(projectDir, 'components.json');
    if (fs.existsSync(compJsonPath)) {
      const parsed = JSON.parse(fs.readFileSync(compJsonPath, 'utf8'));
      if (parsed.aliases && parsed.aliases.ui) {
        let uiAlias = parsed.aliases.ui.replace(/^[@~]\//, '');
        return uiAlias; // e.g. "shared/components/ui" or "components/ui"
      }
    }
  } catch (err) {
    console.error('Error reading components.json:', err);
  }
  return null;
}

function isPathIgnored(relPath, options = {}, shadcnAlias = null) {
  const norm = relPath.replace(/\\/g, '/');
  const parts = norm.split('/');
  const filename = parts[parts.length - 1];
  const ext = path.extname(filename).toLowerCase();

  // Basic folder ignores
  for (const part of parts.slice(0, -1)) {
    if (IGNORED_DIRS.has(part)) return true;
  }

  // Node modules
  if (options.ignoreNodeModules !== false && parts.includes('node_modules')) {
    return true;
  }

  // Markdown files
  if (options.ignoreMd !== false) {
    if (ext === '.md' || ext === '.mdx' || ext === '.markdown') {
      return true;
    }
  }

  // Shadcn UI components
  if (options.ignoreShadcn !== false) {
    if (shadcnAlias && norm.includes(shadcnAlias)) {
      return true;
    }
    if (norm.includes('components/ui/') || norm.startsWith('components/ui/')) {
      return true;
    }
    if (norm.includes('shared/components/ui/') || norm.startsWith('shared/components/ui/')) {
      return true;
    }
  }

  // Ignored file names and lock files
  if (IGNORED_FILES.has(filename)) return true;
  if (norm.endsWith('.lock')) return true;

  // Binary/media files
  if (BINARY_EXTENSIONS.has(ext)) return true;

  // Custom user ignores (comma or newline separated)
  if (options.customIgnore) {
    const customPatterns = options.customIgnore
      .split(/[,\n]/)
      .map(p => p.trim())
      .filter(Boolean);
    for (const pattern of customPatterns) {
      if (norm.includes(pattern)) return true;
    }
  }

  return false;
}

function scanProjectFiles(dir, base = '', options = {}, shadcnAlias = null) {
  let fileList = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = base ? `${base}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        const normDir = relPath.replace(/\\/g, '/');
        const parts = normDir.split('/');
        const dirName = parts[parts.length - 1];

        if (IGNORED_DIRS.has(dirName)) continue;
        if (options.ignoreNodeModules !== false && dirName === 'node_modules') continue;
        if (options.ignoreShadcn !== false && shadcnAlias && normDir.includes(shadcnAlias)) continue;
        if (options.ignoreShadcn !== false && (normDir.endsWith('components/ui') || normDir.includes('components/ui/'))) continue;

        fileList = fileList.concat(scanProjectFiles(fullPath, relPath, options, shadcnAlias));
      } else if (entry.isFile()) {
        if (!isPathIgnored(relPath, options, shadcnAlias)) {
          fileList.push(relPath);
        }
      }
    }
  } catch (err) {
    console.error('Scan error at ' + dir + ':', err);
  }
  return fileList;
}

function computeFileHash(fullPath) {
  try {
    const data = fs.readFileSync(fullPath);
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch (err) {
    return null;
  }
}

function getSnapshotPath(projectDir) {
  return path.join(projectDir, '.codebridge', 'snapshot.json');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 650,
    title: 'CodeBridge AI — Desktop Local File Sync',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Disable hardware acceleration to ensure compatibility across Linux desktop environments
app.disableHardwareAcceleration();

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (ptyProcess) {
    try { ptyProcess.kill(); } catch (e) {}
    ptyProcess = null;
  }
  if (process.platform !== 'darwin') app.quit();
});

// Terminal IPC Handlers
ipcMain.handle('terminal:init', async (event, { cwd, cols, rows }) => {
  setupTerminal(event.sender, cwd, cols, rows);
  return true;
});

ipcMain.on('terminal:write', (event, data) => {
  if (ptyProcess) {
    try {
      ptyProcess.write(data);
    } catch (e) {}
  }
});

ipcMain.on('terminal:resize', (event, { cols, rows }) => {
  if (ptyProcess && cols > 0 && rows > 0) {
    try {
      ptyProcess.resize(cols, rows);
    } catch (e) {}
  }
});

ipcMain.handle('terminal:restart', async (event, cwd) => {
  setupTerminal(event.sender, cwd);
  return true;
});

// ==========================================
// IPC HANDLERS
// ==========================================

// Config / Store
ipcMain.handle('config:get', async () => {
  const config = loadConfig();
  // If no lastProjectDir, check if mtgypsum exists in parent folder
  if (!config.lastProjectDir) {
    const defaultMt = path.resolve(__dirname, '..', 'mtgypsum');
    if (fs.existsSync(defaultMt)) {
      config.lastProjectDir = defaultMt;
      if (!config.recentProjects.includes(defaultMt)) {
        config.recentProjects.unshift(defaultMt);
      }
      saveConfig(config);
    }
  }
  return config;
});

ipcMain.handle('config:set', async (event, newConfig) => {
  const current = loadConfig();
  const merged = { ...current, ...newConfig };
  saveConfig(merged);
  return merged;
});

// Folder Dialog
ipcMain.handle('dialog:openDirectory', async (event, defaultPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Project Root Directory',
    defaultPath: defaultPath || undefined,
    properties: ['openDirectory']
  });

  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return null;
  }

  const selectedDir = result.filePaths[0];
  const config = loadConfig();
  config.lastProjectDir = selectedDir;
  if (!config.recentProjects) config.recentProjects = [];
  config.recentProjects = [selectedDir, ...config.recentProjects.filter(p => p !== selectedDir)].slice(0, 8);
  saveConfig(config);

  return selectedDir;
});

// Project info
ipcMain.handle('project:getInfo', async (event, projectDir) => {
  if (!projectDir || !fs.existsSync(projectDir)) {
    return { exists: false };
  }

  const shadcnAlias = detectShadcnPath(projectDir);
  const snapshotPath = getSnapshotPath(projectDir);
  let snapshot = null;
  if (fs.existsSync(snapshotPath)) {
    try {
      snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
    } catch (e) {}
  }

  const codeTxtPath = path.join(projectDir, 'code.txt');
  const codeTxtExists = fs.existsSync(codeTxtPath);
  let codeTxtStats = null;
  if (codeTxtExists) {
    const st = fs.statSync(codeTxtPath);
    codeTxtStats = {
      size: st.size,
      mtime: st.mtime
    };
  }

  return {
    exists: true,
    name: path.basename(projectDir),
    path: projectDir,
    shadcnAlias,
    hasSnapshot: !!snapshot,
    snapshotTimestamp: snapshot ? snapshot.timestamp : null,
    snapshotFileCount: snapshot ? snapshot.fileCount : null,
    codeTxtExists,
    codeTxtStats
  };
});

// Check status of files (whether they exist on disk or are new)
ipcMain.handle('project:checkFileStatuses', async (event, projectDir, relPaths) => {
  if (!projectDir || !fs.existsSync(projectDir)) return {};

  const statuses = {};
  for (const rel of relPaths) {
    const fullPath = path.resolve(projectDir, rel);
    // Security check: ensure path is within projectDir
    if (!fullPath.startsWith(path.resolve(projectDir))) {
      statuses[rel] = { exists: false, invalid: true };
      continue;
    }

    if (fs.existsSync(fullPath)) {
      try {
        const stats = fs.statSync(fullPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n').length;
        statuses[rel] = {
          exists: true,
          size: stats.size,
          lines,
          mtime: stats.mtime
        };
      } catch (err) {
        statuses[rel] = { exists: true, error: err.message };
      }
    } else {
      statuses[rel] = { exists: false };
    }
  }
  return statuses;
});

// ==========================================
// BUTTON 1: Generate code.txt & Save Snapshot
// ==========================================
ipcMain.handle('project:generateCodeTxt', async (event, projectDir, options = {}) => {
  if (!projectDir || !fs.existsSync(projectDir)) {
    throw new Error('Project directory does not exist: ' + projectDir);
  }

  const shadcnAlias = detectShadcnPath(projectDir);
  const files = scanProjectFiles(projectDir, '', options, shadcnAlias);
  files.sort();

  let codeTxtContent = '';
  const fileSnapshots = {};

  for (const relPath of files) {
    const fullPath = path.join(projectDir, relPath);
    try {
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
      const stat = fs.statSync(fullPath);

      fileSnapshots[relPath] = {
        hash,
        size: stat.size,
        mtime: stat.mtimeMs
      };

      // Delimiter header format:
      // ========================================
      // FILE: path/to/file.ext
      // ========================================
      codeTxtContent += `\n========================================\nFILE:\n    ${relPath}\n========================================\n\n`;
      codeTxtContent += fileContent;
      codeTxtContent += '\n';
    } catch (err) {
      console.error(`Skipping unreadable file ${relPath}:`, err.message);
    }
  }

  // Write code.txt in project root
  const codeTxtPath = path.join(projectDir, 'code.txt');
  fs.writeFileSync(codeTxtPath, codeTxtContent.trimStart(), 'utf8');

  // Save baseline snapshot in .codebridge/snapshot.json
  const snapshotData = {
    version: 1,
    timestamp: new Date().toISOString(),
    projectPath: projectDir,
    fileCount: Object.keys(fileSnapshots).length,
    totalSizeBytes: Buffer.byteLength(codeTxtContent, 'utf8'),
    files: fileSnapshots
  };

  const snapshotDir = path.join(projectDir, '.codebridge');
  fs.mkdirSync(snapshotDir, { recursive: true });
  fs.writeFileSync(path.join(snapshotDir, 'snapshot.json'), JSON.stringify(snapshotData, null, 2), 'utf8');

  const charCount = codeTxtContent.length;
  const tokenEstimate = Math.round(charCount / 4);

  return {
    success: true,
    filePath: codeTxtPath,
    fileCount: Object.keys(fileSnapshots).length,
    sizeBytes: Buffer.byteLength(codeTxtContent, 'utf8'),
    charCount,
    tokenEstimate,
    timestamp: snapshotData.timestamp,
    preview: codeTxtContent.slice(0, 1500)
  };
});

function getBaselineContent(projectDir, relPath) {
  const codeTxtPath = path.join(projectDir, 'code.txt');
  if (!fs.existsSync(codeTxtPath)) return null;

  try {
    const content = fs.readFileSync(codeTxtPath, 'utf8');
    const normRel = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
    const escapedRel = normRel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`={5,}\\s*\\r?\\n(?:FILE:\\s*)?(?:[ \\t]*\\r?\\n)?${escapedRel}\\s*\\r?\\n={5,}\\s*\\r?\\n([\\s\\S]*?)(?=(?:={5,}\\s*\\r?\\n(?:FILE:\\s*)?(?:[ \\t]*\\r?\\n)?[^\\r\\n=]+?\\s*\\r?\\n={5,})|$)`, 'i');
    const match = content.match(regex);
    if (match) {
      return match[1].replace(/^\r?\n/, '').replace(/\r?\n\s*$/, '\n');
    }
  } catch (e) {}
  return null;
}

// ==========================================
// BUTTON 2: Detect & Export Changes
// ==========================================
ipcMain.handle('project:getChanges', async (event, projectDir, options = {}) => {
  if (!projectDir || !fs.existsSync(projectDir)) {
    throw new Error('Project directory does not exist: ' + projectDir);
  }

  const snapshotPath = getSnapshotPath(projectDir);
  if (!fs.existsSync(snapshotPath)) {
    return {
      hasSnapshot: false,
      message: 'No baseline snapshot found. Click "Generate code.txt" first to create a baseline snapshot.'
    };
  }

  let snapshot;
  try {
    snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  } catch (err) {
    return {
      hasSnapshot: false,
      message: 'Failed to read snapshot file: ' + err.message
    };
  }

  const shadcnAlias = detectShadcnPath(projectDir);
  const currentFiles = scanProjectFiles(projectDir, '', options, shadcnAlias);
  const currentFileSet = new Set(currentFiles);

  const modified = [];
  const added = [];
  const removed = [];

  // Check current files against snapshot
  for (const relPath of currentFiles) {
    const fullPath = path.join(projectDir, relPath);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const currentHash = crypto.createHash('sha256').update(content).digest('hex');

      if (!snapshot.files[relPath]) {
        added.push({
          path: relPath,
          content,
          baselineContent: '',
          size: content.length,
          status: 'added'
        });
      } else if (snapshot.files[relPath].hash !== currentHash) {
        const baseline = getBaselineContent(projectDir, relPath);
        modified.push({
          path: relPath,
          content,
          baselineContent: baseline !== null ? baseline : '',
          size: content.length,
          status: 'modified'
        });
      }
    } catch (e) {}
  }

  // Check for deleted files
  for (const snapPath of Object.keys(snapshot.files)) {
    if (!currentFileSet.has(snapPath)) {
      const baseline = getBaselineContent(projectDir, snapPath);
      removed.push({
        path: snapPath,
        baselineContent: baseline !== null ? baseline : '',
        status: 'deleted'
      });
    }
  }

  const totalChanges = modified.length + added.length + removed.length;

  // Build changes text
  let changesText = '';
  if (totalChanges > 0) {
    changesText += `========================================\n`;
    changesText += `CHANGES SUMMARY\n`;
    changesText += `Baseline Snapshot: ${snapshot.timestamp}\n`;
    changesText += `Generated: ${new Date().toISOString()}\n`;
    changesText += `Modified Files: ${modified.length}\n`;
    changesText += `New Files: ${added.length}\n`;
    changesText += `Deleted Files: ${removed.length}\n`;
    changesText += `========================================\n\n`;

    if (removed.length > 0) {
      changesText += `--- DELETED FILES ---\n`;
      removed.forEach(f => {
        changesText += `- ${f.path || f}\n`;
      });
      changesText += `\n`;
    }

    for (const item of modified) {
      changesText += `========================================\n`;
      changesText += `MODIFIED FILE:\n    ${item.path}\n`;
      changesText += `========================================\n\n`;
      changesText += item.content;
      changesText += `\n\n`;
    }

    for (const item of added) {
      changesText += `========================================\n`;
      changesText += `NEW FILE:\n    ${item.path}\n`;
      changesText += `========================================\n\n`;
      changesText += item.content;
      changesText += `\n\n`;
    }

    // Write changes.txt in project root
    const changesPath = path.join(projectDir, 'changes.txt');
    fs.writeFileSync(changesPath, changesText.trimEnd() + '\n', 'utf8');
  }

  return {
    hasSnapshot: true,
    snapshotTimestamp: snapshot.timestamp,
    totalChanges,
    modified,
    added,
    removed,
    changesText,
    charCount: changesText.length,
    tokenEstimate: Math.round(changesText.length / 4)
  };
});

// Revert single file back to baseline or delete if added
ipcMain.handle('project:revertFile', async (event, projectDir, relPath) => {
  if (!projectDir || !fs.existsSync(projectDir)) {
    throw new Error('Project directory does not exist: ' + projectDir);
  }

  const cleanRel = relPath.trim().replace(/^[\/\\]+/, '');
  const fullPath = path.resolve(projectDir, cleanRel);
  if (!fullPath.startsWith(path.resolve(projectDir))) {
    throw new Error('Invalid path outside project root');
  }

  const baseline = getBaselineContent(projectDir, cleanRel);

  if (baseline !== null) {
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, baseline, 'utf8');
    return { success: true, action: 'restored', path: cleanRel };
  } else {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return { success: true, action: 'deleted', path: cleanRel };
    }
    return { success: false, error: 'File was not found in baseline snapshot' };
  }
});

// Revert all changes back to baseline
ipcMain.handle('project:revertAll', async (event, projectDir) => {
  if (!projectDir || !fs.existsSync(projectDir)) {
    throw new Error('Project directory does not exist: ' + projectDir);
  }

  const codeTxtPath = path.join(projectDir, 'code.txt');
  if (!fs.existsSync(codeTxtPath)) {
    throw new Error('No baseline code.txt found to revert from. Create code.txt first.');
  }

  const snapshotPath = getSnapshotPath(projectDir);
  if (!fs.existsSync(snapshotPath)) {
    throw new Error('No baseline snapshot found. Create code.txt first.');
  }

  const shadcnAlias = detectShadcnPath(projectDir);
  const currentFiles = scanProjectFiles(projectDir, '', {}, shadcnAlias);
  const currentFileSet = new Set(currentFiles);
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

  let revertedCount = 0;
  const revertedFiles = [];

  // 1. Delete newly added files
  for (const relPath of currentFiles) {
    if (!snapshot.files[relPath]) {
      const fullPath = path.join(projectDir, relPath);
      try {
        fs.unlinkSync(fullPath);
        revertedCount++;
        revertedFiles.push({ path: relPath, action: 'deleted' });
      } catch (e) {}
    }
  }

  // 2. Restore modified files and deleted files
  for (const [snapPath, snapInfo] of Object.entries(snapshot.files)) {
    const fullPath = path.join(projectDir, snapPath);
    const baseline = getBaselineContent(projectDir, snapPath);
    if (baseline === null) continue;

    let needsRestore = false;
    if (!fs.existsSync(fullPath)) {
      needsRestore = true;
    } else {
      const currentContent = fs.readFileSync(fullPath, 'utf8');
      const currentHash = crypto.createHash('sha256').update(currentContent).digest('hex');
      if (currentHash !== snapInfo.hash) {
        needsRestore = true;
      }
    }

    if (needsRestore) {
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, baseline, 'utf8');
      revertedCount++;
      revertedFiles.push({ path: snapPath, action: 'restored' });
    }
  }

  // Clear changes.txt
  const changesPath = path.join(projectDir, 'changes.txt');
  if (fs.existsSync(changesPath)) {
    try { fs.unlinkSync(changesPath); } catch (e) {}
  }

  return {
    success: true,
    revertedCount,
    revertedFiles
  };
});

// ==========================================
// BUTTON 3: Generate Directory Tree
// ==========================================
ipcMain.handle('project:generateTree', async (event, projectDir, options = {}) => {
  if (!projectDir || !fs.existsSync(projectDir)) {
    throw new Error('Project directory does not exist: ' + projectDir);
  }

  const shadcnAlias = detectShadcnPath(projectDir);
  let totalFiles = 0;
  let totalFolders = 0;

  function buildTreeLines(dir, prefix = '', isRoot = false) {
    let lines = [];
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      return lines;
    }

    // Filter and sort entries: directories first, then files
    const filteredEntries = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(projectDir, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        if (options.ignoreNodeModules !== false && entry.name === 'node_modules') continue;

        // Check if this directory is shadcn UI
        const isShadcn = (shadcnAlias && relPath === shadcnAlias) ||
          relPath.endsWith('components/ui') ||
          relPath.endsWith('shared/components/ui');

        if (options.ignoreShadcn !== false && isShadcn) {
          // Count shadcn component files without expanding
          try {
            const uiFiles = fs.readdirSync(fullPath).filter(f => !f.startsWith('.'));
            filteredEntries.push({
              name: entry.name + ` [shadcn UI - ${uiFiles.length} components]`,
              isDirectory: true,
              isShadcnCollapsed: true,
              fullPath
            });
          } catch (e) {
            filteredEntries.push({ name: entry.name, isDirectory: true, fullPath });
          }
          continue;
        }

        filteredEntries.push({ name: entry.name, isDirectory: true, fullPath });
      } else if (entry.isFile()) {
        if (isPathIgnored(relPath, options, shadcnAlias)) continue;
        filteredEntries.push({ name: entry.name, isDirectory: false, fullPath });
      }
    }

    filteredEntries.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    for (let i = 0; i < filteredEntries.length; i++) {
      const item = filteredEntries[i];
      const isLast = i === filteredEntries.length - 1;
      const pointer = isLast ? '└── ' : '├── ';
      const subPrefix = prefix + (isLast ? '    ' : '│   ');

      if (item.isDirectory) {
        totalFolders++;
        lines.push(`${prefix}${pointer}${item.name}/`);
        if (!item.isShadcnCollapsed) {
          const subLines = buildTreeLines(item.fullPath, subPrefix);
          lines = lines.concat(subLines);
        }
      } else {
        totalFiles++;
        lines.push(`${prefix}${pointer}${item.name}`);
      }
    }

    return lines;
  }

  const rootName = path.basename(projectDir);
  const treeLines = [`${rootName}/`].concat(buildTreeLines(projectDir));
  const treeText = treeLines.join('\n');

  return {
    treeText,
    totalFiles,
    totalFolders
  };
});

function applyPatchContent(original, patchText) {
  // 1. Search & Replace blocks
  // <<<<<<< SEARCH ... ======= ... >>>>>>> REPLACE
  const srRegex = /<{5,}\s*(?:SEARCH|ORIGINAL)?\s*\r?\n([\s\S]*?)\r?\n={5,}\s*\r?\n([\s\S]*?)\r?\n>{5,}\s*(?:REPLACE|UPDATED)?/gi;
  let matches = [];
  let match;
  while ((match = srRegex.exec(patchText)) !== null) {
    matches.push({ search: match[1], replace: match[2] });
  }

  if (matches.length > 0) {
    let current = original;
    for (const m of matches) {
      if (current.includes(m.search)) {
        current = current.replace(m.search, m.replace);
      } else {
        const normCurrent = current.replace(/\r\n/g, '\n');
        const normSearch = m.search.replace(/\r\n/g, '\n');
        const normReplace = m.replace.replace(/\r\n/g, '\n');
        if (normCurrent.includes(normSearch)) {
          current = normCurrent.replace(normSearch, normReplace);
        } else {
          return {
            success: false,
            error: 'Search block not found in target file on disk',
            failedBlock: m.search,
            expectedReplace: m.replace
          };
        }
      }
    }
    return { success: true, content: current, method: 'search-replace', blocks: matches.length };
  }

  // 2. Unified Diff
  if (patchText.includes('@@') && (patchText.includes('--- ') || patchText.includes('+++ '))) {
    const res = Diff.applyPatch(original, patchText);
    if (res !== false && typeof res === 'string') {
      return { success: true, content: res, method: 'unified-diff' };
    } else {
      return {
        success: false,
        error: 'Unified diff could not be cleanly applied to existing file',
        failedPatch: patchText
      };
    }
  }

  return { success: false, isFullFile: true };
}

// ==========================================
// APPLY FILES TO LOCAL DISK
// ==========================================
ipcMain.handle('project:applyFiles', async (event, projectDir, files) => {
  if (!projectDir || !fs.existsSync(projectDir)) {
    throw new Error('Project directory does not exist: ' + projectDir);
  }

  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('No files provided to apply.');
  }

  const results = [];
  const normalizedRoot = path.resolve(projectDir);

  for (const item of files) {
    if (!item.path) continue;

    // Clean relative path
    let cleanRelPath = item.path.trim().replace(/^[\/\\]+/, '');
    const targetFullPath = path.resolve(normalizedRoot, cleanRelPath);

    // Security check: path traversal prevention
    if (!targetFullPath.startsWith(normalizedRoot)) {
      results.push({
        path: cleanRelPath,
        success: false,
        error: 'Security violation: Path is outside project root directory.'
      });
      continue;
    }

    try {
      const targetDir = path.dirname(targetFullPath);
      fs.mkdirSync(targetDir, { recursive: true });

      const existedBefore = fs.existsSync(targetFullPath);
      let oldLines = 0;
      let originalContent = '';
      if (existedBefore) {
        try {
          originalContent = fs.readFileSync(targetFullPath, 'utf8');
          oldLines = originalContent.split('\n').length;
        } catch (e) {}
      }

      let finalContent = item.content;
      let finalAction = existedBefore ? 'updated' : 'created';

      // Check if item is a patch
      const hasPatchMarkers = item.isPatch ||
        item.content.includes('<<<<<<<') ||
        (item.content.includes('@@') && item.content.includes('+++ '));

      if (hasPatchMarkers) {
        if (!existedBefore) {
          results.push({
            path: cleanRelPath,
            success: false,
            error: 'Cannot patch: File does not exist on disk yet. Full file content is required for new files.',
            originalContent: ''
          });
          continue;
        }

        const patchResult = applyPatchContent(originalContent, item.content);
        if (patchResult.success) {
          finalContent = patchResult.content;
          finalAction = `patched (${patchResult.method === 'search-replace' ? patchResult.blocks + ' block(s)' : 'diff'})`;
        } else if (!patchResult.isFullFile) {
          results.push({
            path: cleanRelPath,
            success: false,
            error: patchResult.error || 'Failed to apply patch to file',
            failedBlock: patchResult.failedBlock || null,
            expectedReplace: patchResult.expectedReplace || null,
            failedPatch: patchResult.failedPatch || item.content,
            originalContent: originalContent ? originalContent.slice(0, 10000) : ''
          });
          continue;
        }
      }

      fs.writeFileSync(targetFullPath, finalContent, 'utf8');
      const newLines = finalContent.split('\n').length;

      results.push({
        path: cleanRelPath,
        fullPath: targetFullPath,
        success: true,
        action: finalAction,
        oldLines,
        newLines,
        sizeBytes: Buffer.byteLength(finalContent, 'utf8'),
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err) {
      results.push({
        path: cleanRelPath,
        success: false,
        error: err.message,
        originalContent: originalContent ? originalContent.slice(0, 10000) : ''
      });
    }
  }

  const errors = results.filter(r => !r.success);
  return {
    success: errors.length === 0,
    appliedCount: results.filter(r => r.success).length,
    errorCount: errors.length,
    errors,
    results
  };
});

// Read single file content from project
ipcMain.handle('project:readFile', async (event, projectDir, relPath) => {
  const fullPath = path.resolve(projectDir, relPath);
  if (!fullPath.startsWith(path.resolve(projectDir))) {
    throw new Error('Invalid path outside project root');
  }
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
});

// Shell & Clipboard
ipcMain.handle('shell:showItem', async (event, targetPath) => {
  if (fs.existsSync(targetPath)) {
    shell.showItemInFolder(targetPath);
    return true;
  }
  return false;
});

ipcMain.handle('shell:openFile', async (event, targetPath) => {
  if (fs.existsSync(targetPath)) {
    shell.openPath(targetPath);
    return true;
  }
  return false;
});

ipcMain.handle('clipboard:write', async (event, text) => {
  clipboard.writeText(text);
  return true;
});
