// CodeBridge AI - Desktop Application Logic with Patching, Command Execution & Sidebar

// Application State
const state = {
  projectDir: null,
  projectInfo: null,
  config: {
    recentProjects: [],
    lastProjectDir: null,
    ignoreMd: true,
    ignoreShadcn: true,
    ignoreNodeModules: true,
    customIgnore: '',
    theme: 'dark'
  },
  parsedFiles: [],
  parsedCommands: [],
  appliedHistory: [],
  currentCodeTxt: null,
  currentChanges: null,
  currentTree: null,
  promptPreset: 'delimiter',
  terminalOpen: true,
  terminalHeight: 260
};

// Terminal Instance
let term = null;
let fitAddon = null;

// DOM Elements
const elements = {
  // Theme & Controls
  btnThemeToggle: document.getElementById('btnThemeToggle'),
  themeIcon: document.getElementById('themeIcon'),
  themeText: document.getElementById('themeText'),
  btnToggleTerminal: document.getElementById('btnToggleTerminal'),

  // Header & Project
  currentProjectPath: document.getElementById('currentProjectPath'),
  breadcrumbPath: document.getElementById('breadcrumbPath'),
  statusShadcnText: document.getElementById('statusShadcnText'),
  statusSnapshotText: document.getElementById('statusSnapshotText'),
  btnBrowseFolder: document.getElementById('btnBrowseFolder'),
  recentProjectsSelect: document.getElementById('recentProjectsSelect'),

  // Core 4 Action Buttons
  btnCreateCodeTxt: document.getElementById('btnCreateCodeTxt'),
  codeTxtStatusDesc: document.getElementById('codeTxtStatusDesc'),
  btnExportChanges: document.getElementById('btnExportChanges'),
  changesCountBadge: document.getElementById('changesCountBadge'),
  btnGenerateTree: document.getElementById('btnGenerateTree'),
  btnCopyPrompt: document.getElementById('btnCopyPrompt'),

  // Navigation
  navTabs: document.querySelectorAll('.nav-tab'),
  tabContents: document.querySelectorAll('.tab-content'),
  tabParsedCount: document.getElementById('tabParsedCount'),

  // Tab 1: Paste & Apply
  pasteInput: document.getElementById('pasteInput'),
  btnAutoFormat: document.getElementById('btnAutoFormat'),
  btnPasteClipboard: document.getElementById('btnPasteClipboard'),
  btnClearPaste: document.getElementById('btnClearPaste'),
  parseStatusText: document.getElementById('parseStatusText'),
  btnApplyAllFiles: document.getElementById('btnApplyAllFiles'),
  applyCountNumber: document.getElementById('applyCountNumber'),
  detectedFilesCount: document.getElementById('detectedFilesCount'),
  parsedFilesList: document.getElementById('parsedFilesList'),
  detectedCommandsBox: document.getElementById('detectedCommandsBox'),
  detectedCommandsCount: document.getElementById('detectedCommandsCount'),
  detectedCommandsList: document.getElementById('detectedCommandsList'),
  btnRunAllCommands: document.getElementById('btnRunAllCommands'),
  appliedHistoryList: document.getElementById('appliedHistoryList'),
  btnClearHistory: document.getElementById('btnClearHistory'),

  // Tab 2: code.txt
  btnTriggerCodeTxtGen: document.getElementById('btnTriggerCodeTxtGen'),
  btnCopyCodeTxt: document.getElementById('btnCopyCodeTxt'),
  btnOpenCodeTxtLocation: document.getElementById('btnOpenCodeTxtLocation'),
  codeTxtStatFiles: document.getElementById('codeTxtStatFiles'),
  codeTxtStatSize: document.getElementById('codeTxtStatSize'),
  codeTxtStatChars: document.getElementById('codeTxtStatChars'),
  codeTxtStatTokens: document.getElementById('codeTxtStatTokens'),
  codeTxtStatTime: document.getElementById('codeTxtStatTime'),
  codeTxtViewer: document.getElementById('codeTxtViewer'),
  codeTxtViewerNotice: document.getElementById('codeTxtViewerNotice'),

  // Tab 3: Changes
  btnRefreshChanges: document.getElementById('btnRefreshChanges'),
  btnCopyChanges: document.getElementById('btnCopyChanges'),
  btnOpenChangesLocation: document.getElementById('btnOpenChangesLocation'),
  changesSummaryBanner: document.getElementById('changesSummaryBanner'),
  changesSummaryText: document.getElementById('changesSummaryText'),
  changesSubText: document.getElementById('changesSubText'),
  changesViewer: document.getElementById('changesViewer'),
  changesViewerStats: document.getElementById('changesViewerStats'),

  // Tab 4: Tree
  btnRefreshTree: document.getElementById('btnRefreshTree'),
  btnCopyTree: document.getElementById('btnCopyTree'),
  treeStatFolders: document.getElementById('treeStatFolders'),
  treeStatFiles: document.getElementById('treeStatFiles'),
  treeStatShadcn: document.getElementById('treeStatShadcn'),
  treeViewer: document.getElementById('treeViewer'),

  // Tab 5: Prompt & Settings
  btnCopyPromptInTab: document.getElementById('btnCopyPromptInTab'),
  promptFormatRadios: document.querySelectorAll('input[name="promptFormat"]'),
  promptViewer: document.getElementById('promptViewer'),
  chkIgnoreMd: document.getElementById('chkIgnoreMd'),
  chkIgnoreShadcn: document.getElementById('chkIgnoreShadcn'),
  chkIgnoreNodeModules: document.getElementById('chkIgnoreNodeModules'),
  txtCustomIgnore: document.getElementById('txtCustomIgnore'),

  // Terminal Drawer
  terminalDrawer: document.getElementById('terminalDrawer'),
  terminalResizer: document.getElementById('terminalResizer'),
  terminalCwdBadge: document.getElementById('terminalCwdBadge'),
  bottomTerminalContainer: document.getElementById('bottomTerminalContainer'),
  fullTerminalContainer: document.getElementById('fullTerminalContainer'),
  btnTermDev: document.getElementById('btnTermDev'),
  btnTermGit: document.getElementById('btnTermGit'),
  btnTermClear: document.getElementById('btnTermClear'),
  btnTermRestart: document.getElementById('btnTermRestart'),
  btnMinimizeTerminal: document.getElementById('btnMinimizeTerminal'),

  // Toast
  toast: document.getElementById('toast')
};

// Refresh Lucide Icons helper
function refreshIcons() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
let toastTimer = null;
function showToast(message, type = 'info') {
  if (toastTimer) clearTimeout(toastTimer);

  elements.toast.textContent = message;
  elements.toast.className = 'toast show ' + type;

  toastTimer = setTimeout(() => {
    elements.toast.className = 'toast';
  }, 3200);
}

// ==========================================
// FORMAT UTILITIES
// ==========================================
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ==========================================
// THEME MANAGEMENT (OKLCH PALETTE)
// ==========================================
function getTerminalTheme(isDark) {
  if (isDark) {
    return {
      background: '#242426',
      foreground: '#ececec',
      cursor: '#ececec',
      selectionBackground: 'rgba(255, 255, 255, 0.18)',
      black: '#242426',
      red: '#f87171',
      green: '#4ade80',
      yellow: '#facc15',
      blue: '#60a5fa',
      magenta: '#c084fc',
      cyan: '#38bdf8',
      white: '#ececec',
      brightBlack: '#52525b',
      brightRed: '#ef4444',
      brightGreen: '#22c55e',
      brightYellow: '#eab308',
      brightBlue: '#3b82f6',
      brightMagenta: '#a855f7',
      brightCyan: '#06b6d4',
      brightWhite: '#ffffff'
    };
  } else {
    return {
      background: '#f3f3f2',
      foreground: '#2f2f31',
      cursor: '#2f2f31',
      selectionBackground: 'rgba(0, 0, 0, 0.15)',
      black: '#2f2f31',
      red: '#dc2626',
      green: '#16a34a',
      yellow: '#ca8a04',
      blue: '#2563eb',
      magenta: '#9333ea',
      cyan: '#0891b2',
      white: '#f3f3f2',
      brightBlack: '#71717a',
      brightRed: '#b91c1c',
      brightGreen: '#15803d',
      brightYellow: '#a16207',
      brightBlue: '#1d4ed8',
      brightMagenta: '#7e22ce',
      brightCyan: '#0e7490',
      brightWhite: '#ffffff'
    };
  }
}

function applyTheme(themeName) {
  state.config.theme = themeName;
  const isDark = themeName === 'dark';

  if (isDark) {
    document.documentElement.classList.add('dark');
    if (elements.themeText) elements.themeText.textContent = 'Light';
    if (elements.themeIcon) elements.themeIcon.setAttribute('data-lucide', 'sun');
    elements.btnThemeToggle.title = 'Switch to Light Mode';
  } else {
    document.documentElement.classList.remove('dark');
    if (elements.themeText) elements.themeText.textContent = 'Dark';
    if (elements.themeIcon) elements.themeIcon.setAttribute('data-lucide', 'moon');
    elements.btnThemeToggle.title = 'Switch to Dark Mode';
  }

  refreshIcons();

  if (term) {
    term.options.theme = getTerminalTheme(isDark);
  }

  window.api.setConfig({ theme: themeName });
}

function toggleTheme() {
  const current = state.config.theme === 'dark' ? 'light' : 'dark';
  applyTheme(current);
  showToast(`Switched to ${current} theme`, 'info');
}

// ==========================================
// INTEGRATED TERMINAL
// ==========================================
function initTerminal() {
  if (typeof Terminal === 'undefined') {
    console.warn('Terminal library not loaded yet');
    return;
  }

  const isDark = document.documentElement.classList.contains('dark');
  term = new Terminal({
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: 13,
    lineHeight: 1.3,
    letterSpacing: 0.5,
    cursorBlink: true,
    cursorStyle: 'bar',
    theme: getTerminalTheme(isDark),
    allowProposedApi: true
  });

  if (typeof FitAddon !== 'undefined' && FitAddon.FitAddon) {
    fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
  }

  term.open(elements.bottomTerminalContainer);

  setTimeout(() => {
    if (fitAddon) fitAddon.fit();
    startPtySession();
  }, 100);

  term.onData((data) => {
    window.api.terminal.write(data);
  });

  window.api.terminal.onData((incoming) => {
    term.write(incoming);
  });

  window.api.terminal.onExit((code) => {
    term.writeln(`\r\n\x1b[33m[Shell exited with code ${code}]\x1b[0m`);
  });

  window.addEventListener('resize', () => {
    resizeTerminal();
  });
}

function startPtySession() {
  if (!term) return;
  const targetDir = state.projectDir || '';
  const cols = term.cols || 80;
  const rows = term.rows || 24;

  window.api.terminal.init(targetDir, cols, rows);
  elements.terminalCwdBadge.textContent = targetDir ? targetDir.split('/').pop() : '~';
  elements.terminalCwdBadge.title = targetDir || 'Home directory';
}

function resizeTerminal() {
  if (term && fitAddon && elements.terminalDrawer && !elements.terminalDrawer.classList.contains('collapsed')) {
    try {
      fitAddon.fit();
      window.api.terminal.resize(term.cols, term.rows);
    } catch (e) {}
  }
}

function toggleTerminalDrawer(forceState = null) {
  const drawer = elements.terminalDrawer;
  const willOpen = forceState !== null ? forceState : drawer.classList.contains('collapsed');

  if (willOpen) {
    drawer.classList.remove('collapsed');
    drawer.style.height = (state.terminalHeight || 260) + 'px';
    elements.btnToggleTerminal.classList.add('active');
    setTimeout(() => {
      resizeTerminal();
      if (term) term.focus();
    }, 50);
  } else {
    drawer.classList.add('collapsed');
    elements.btnToggleTerminal.classList.remove('active');
  }
}

function runCommandInTerminal(commandStr) {
  if (!commandStr) return;
  toggleTerminalDrawer(true);
  setTimeout(() => {
    window.api.terminal.write(commandStr.trim() + '\n');
    if (term) term.focus();
    showToast(`Ran in terminal: ${commandStr.trim()}`, 'success');
  }, 100);
}

function setupTerminalResizer() {
  const resizer = elements.terminalResizer;
  const drawer = elements.terminalDrawer;
  let isResizing = false;
  let startY = 0;
  let startHeight = 0;

  resizer.addEventListener('mousedown', (e) => {
    if (drawer.classList.contains('collapsed')) {
      toggleTerminalDrawer(true);
    }
    isResizing = true;
    resizer.classList.add('resizing');
    startY = e.clientY;
    startHeight = drawer.offsetHeight;

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const diff = startY - e.clientY;
    const newHeight = Math.min(Math.max(startHeight + diff, 90), window.innerHeight - 180);
    drawer.style.height = newHeight + 'px';
    state.terminalHeight = newHeight;
    resizeTerminal();
  });

  window.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      resizer.classList.remove('resizing');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      resizeTerminal();
    }
  });
}

// ==========================================
// COMMANDS PARSER
// ==========================================
function parsePastedCommands(text) {
  const commands = [];
  if (!text || !text.trim()) return commands;

  // 1. Delimiter style
  // ========================================
  // COMMAND: or RUN: or EXEC:
  //     npm install something
  // ========================================
  const delimCmdRegex = /={5,}\s*\r?\n(?:COMMAND|RUN|EXEC):\s*(?:[\r\n]+)?\s*([\s\S]*?)\r?\n={5,}/gi;
  let match;
  while ((match = delimCmdRegex.exec(text)) !== null) {
    const lines = match[1].split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    lines.forEach(cmd => {
      if (!commands.includes(cmd)) commands.push(cmd);
    });
  }

  // 2. Fenced code block: ```bash ... ``` or ```sh ... ``` or ```shell ... ```
  const bashFenceRegex = /```(?:bash|sh|shell|zsh)\r?\n([\s\S]*?)\r?\n```/gi;
  while ((match = bashFenceRegex.exec(text)) !== null) {
    const lines = match[1].split('\n').map(l => l.trim().replace(/^\$\s*/, '')).filter(l => l && !l.startsWith('#'));
    lines.forEach(cmd => {
      if (!commands.includes(cmd)) commands.push(cmd);
    });
  }

  // 3. Single line COMMAND: ... or RUN: ...
  const singleLineCmdRegex = /^(?:COMMAND|RUN|EXEC):\s*(.+)$/gim;
  while ((match = singleLineCmdRegex.exec(text)) !== null) {
    const cmd = match[1].trim().replace(/^\$\s*/, '');
    if (cmd && !commands.includes(cmd)) commands.push(cmd);
  }

  return commands;
}

// ==========================================
// SMART AUTO-FORMATTER & INPUT CLEANER
// ==========================================
function autoFormatPastedText(rawText) {
  if (!rawText || !rawText.trim()) return rawText;

  const files = [];
  const commands = [];

  function findPrecedingPath(preText) {
    if (!preText) return null;
    const lines = preText.trim().split('\n').slice(-4);
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      const m = line.match(/(?:File|In|Update|Create|Edit|Path)?[:\s*`]*([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]{1,10})[`*:]*/i);
      if (m && m[1] && (m[1].includes('/') || m[1].includes('.')) && !m[1].startsWith('http')) {
        return m[1].replace(/^[\\\/]+/, '');
      }
    }
    return null;
  }

  // 1. Extract bash/sh command blocks
  const bashRegex = /```(?:bash|sh|shell|zsh)\r?\n([\s\S]*?)\r?\n```/gi;
  let bashMatch;
  while ((bashMatch = bashRegex.exec(rawText)) !== null) {
    const lines = bashMatch[1].split('\n').map(l => l.trim().replace(/^\$\s*/, '')).filter(l => l && !l.startsWith('#'));
    lines.forEach(cmd => {
      if (!commands.includes(cmd)) commands.push(cmd);
    });
  }

  // 2. Extract code blocks and find their preceding file paths
  const fenceRegex = /```([a-zA-Z0-9_\-\.\/:]*)\r?\n([\s\S]*?)\r?\n```/g;
  let fenceMatch;
  while ((fenceMatch = fenceRegex.exec(rawText)) !== null) {
    const langTag = fenceMatch[1].trim();
    const code = fenceMatch[2];
    const startIndex = fenceMatch.index;

    if (['bash', 'sh', 'shell', 'zsh'].includes(langTag.toLowerCase())) continue;

    let targetPath = null;
    if (langTag.includes('/') || langTag.includes('.')) {
      targetPath = langTag.replace(/^[a-zA-Z0-9_-]+[:\s]+/, '');
    } else {
      const preText = rawText.slice(0, startIndex);
      targetPath = findPrecedingPath(preText);
    }

    if (targetPath) {
      files.push({ path: targetPath.trim(), content: code.trim() });
    }
  }

  // 3. Extract search & replace blocks
  const srRegex = /<{5,}\s*(?:SEARCH|ORIGINAL)?\s*\r?\n([\s\S]*?)\r?\n={5,}\s*\r?\n([\s\S]*?)\r?\n>{5,}\s*(?:REPLACE|UPDATED)?/gi;
  let srMatch;
  while ((srMatch = srRegex.exec(rawText)) !== null) {
    const startIndex = srMatch.index;
    const preText = rawText.slice(0, startIndex);
    const targetPath = findPrecedingPath(preText);
    if (targetPath && !files.some(f => f.path === targetPath)) {
      const fullSrBlock = `<<<<<<< SEARCH\n${srMatch[1]}\n=======\n${srMatch[2]}\n>>>>>>> REPLACE`;
      files.push({ path: targetPath.trim(), content: fullSrBlock });
    }
  }

  if (files.length === 0 && commands.length === 0) {
    return rawText;
  }

  // Build clean standard output
  let output = '';
  for (const f of files) {
    output += `========================================\n`;
    output += `FILE:\n    ${f.path}\n`;
    output += `========================================\n`;
    output += f.content + '\n\n';
  }

  if (commands.length > 0) {
    output += '```bash\n' + commands.join('\n') + '\n```\n';
  }

  return output.trimEnd() + '\n';
}

// ==========================================
// CODE & PATCH PARSER
// ==========================================
function parseCodeInput(rawText) {
  const files = [];
  if (!rawText || !rawText.trim()) return files;

  // Helper to detect if content is a patch
  function detectPatchInfo(content) {
    if (content.includes('<<<<<<<')) {
      return { isPatch: true, patchType: 'search-replace' };
    }
    if (content.includes('@@') && (content.includes('--- ') || content.includes('+++ '))) {
      return { isPatch: true, patchType: 'unified' };
    }
    return { isPatch: false, patchType: null };
  }

  // PATTERN 1: Delimiter style (website.txt style)
  // ========================================
  // FILE:
  //     src/app/page.tsx
  // ========================================
  const delimRegex = /={5,}\s*\r?\n(?:FILE:\s*)?(?:[ \t]*\r?\n)?([^\r\n=]+?)\s*\r?\n={5,}\s*\r?\n([\s\S]*?)(?=(?:={5,}\s*\r?\n(?:FILE:\s*)?(?:[ \t]*\r?\n)?[^\r\n=]+?\s*\r?\n={5,})|$)/gi;

  let match;
  while ((match = delimRegex.exec(rawText)) !== null) {
    let filePath = match[1].trim().replace(/^FILE:\s*/i, '').trim();
    let content = match[2];
    if (filePath && !filePath.includes('\n') && (filePath.includes('/') || filePath.includes('.'))) {
      content = content.replace(/\r?\n={5,}.*$/, '').trimEnd();
      const patchInfo = detectPatchInfo(content);
      files.push({
        path: filePath.replace(/^[\\\/]+/, ''),
        content: content + '\n',
        isPatch: patchInfo.isPatch,
        patchType: patchInfo.patchType
      });
    }
  }

  if (files.length > 0) return files;

  // PATTERN 2: Raw Git Diff or Unified Diff
  // diff --git a/src/app/page.tsx b/src/app/page.tsx
  // --- a/src/app/page.tsx
  // +++ b/src/app/page.tsx
  if (rawText.includes('diff --git') || (rawText.includes('--- a/') && rawText.includes('+++ b/'))) {
    const diffBlocks = rawText.split(/(?=diff --git|--- [ab]\/)/);
    for (const block of diffBlocks) {
      const pathMatch = block.match(/(?:\+\+\+ [ab]\/|--- [ab]\/)([^\r\n\t ]+)/);
      if (pathMatch) {
        const filePath = pathMatch[1].trim().replace(/^[ab]\//, '');
        if (filePath && !filePath.includes('\n')) {
          files.push({
            path: filePath.replace(/^[\\\/]+/, ''),
            content: block.trim() + '\n',
            isPatch: true,
            patchType: 'unified'
          });
        }
      }
    }
    if (files.length > 0) return files;
  }

  // PATTERN 3: Markdown headers with code block
  // ### File: `src/app/page.tsx`
  // ```tsx
  // ...
  // ```
  const mdRegex = /(?:###?|####|\*\*)\s*(?:File:\s*|FILE:\s*)?`?([a-zA-Z0-9_\-\.\/\\]+\.[a-zA-Z0-9]+)`?\s*\r?\n(?:[^\n]*\n)?```[a-zA-Z0-9_-]*\r?\n([\s\S]*?)\r?\n```/gi;
  while ((match = mdRegex.exec(rawText)) !== null) {
    let filePath = match[1].trim();
    let content = match[2];
    const patchInfo = detectPatchInfo(content);
    files.push({
      path: filePath.replace(/^[\\\/]+/, ''),
      content: content + '\n',
      isPatch: patchInfo.isPatch,
      patchType: patchInfo.patchType
    });
  }

  if (files.length > 0) return files;

  // PATTERN 4: Fenced code block with filename: ```tsx:src/app/page.tsx
  const fenceRegex = /```[a-zA-Z0-9_-]*[:\s]+([a-zA-Z0-9_\-\.\/\\]+\.[a-zA-Z0-9]+)\r?\n([\s\S]*?)\r?\n```/gi;
  while ((match = fenceRegex.exec(rawText)) !== null) {
    let filePath = match[1].trim();
    let content = match[2];
    const patchInfo = detectPatchInfo(content);
    files.push({
      path: filePath.replace(/^[\\\/]+/, ''),
      content: content + '\n',
      isPatch: patchInfo.isPatch,
      patchType: patchInfo.patchType
    });
  }

  if (files.length > 0) return files;

  // PATTERN 5: Top comment // File: src/app/page.tsx
  const commentRegex = /^(?:\/\/|#|\/\*)\s*(?:File|FILE):\s*([a-zA-Z0-9_\-\.\/\\]+\.[a-zA-Z0-9]+)(?:\s*\*\/)?\r?\n([\s\S]+)$/i;
  const commentMatch = rawText.trim().match(commentRegex);
  if (commentMatch) {
    const content = commentMatch[2] + '\n';
    const patchInfo = detectPatchInfo(content);
    files.push({
      path: commentMatch[1].trim().replace(/^[\\\/]+/, ''),
      content,
      isPatch: patchInfo.isPatch,
      patchType: patchInfo.patchType
    });
  }

  return files;
}

async function handlePasteInputChange() {
  const text = elements.pasteInput.value;
  const parsedFiles = parseCodeInput(text);
  const parsedCommands = parsePastedCommands(text);

  state.parsedFiles = parsedFiles;
  state.parsedCommands = parsedCommands;

  elements.detectedFilesCount.textContent = parsedFiles.length;
  elements.applyCountNumber.textContent = parsedFiles.length;

  // Render Commands Box
  renderDetectedCommands();

  if (parsedFiles.length > 0) {
    elements.tabParsedCount.textContent = parsedFiles.length;
    elements.tabParsedCount.style.display = 'inline-block';
    elements.btnApplyAllFiles.disabled = false;

    let statusMsg = `✓ Detected ${parsedFiles.length} file/patch(es)`;
    if (parsedCommands.length > 0) {
      statusMsg += ` and ${parsedCommands.length} command(s)`;
    }
    elements.parseStatusText.innerHTML = `<span style="color:var(--foreground);font-weight:700">${statusMsg} ready</span>`;

    await updateFileStatuses();
    renderParsedFiles();
  } else {
    elements.tabParsedCount.style.display = 'none';
    elements.btnApplyAllFiles.disabled = true;

    if (parsedCommands.length > 0) {
      elements.parseStatusText.innerHTML = `<span style="color:var(--foreground);font-weight:700">✓ Detected ${parsedCommands.length} terminal command(s) ready to run</span>`;
    } else if (text.trim().length > 0) {
      elements.parseStatusText.innerHTML = `<span style="color:var(--destructive)">⚠ Unformatted code detected. Click <strong>"Auto-Format & Clean"</strong> above to convert into file blocks!</span>`;
    } else {
      elements.parseStatusText.innerHTML = `<span>Ready for code paste</span>`;
    }
    renderParsedFiles();
  }
}

function renderDetectedCommands() {
  const box = elements.detectedCommandsBox;
  const list = elements.detectedCommandsList;
  const count = elements.detectedCommandsCount;

  if (state.parsedCommands.length === 0) {
    box.style.display = 'none';
    return;
  }

  box.style.display = 'flex';
  count.textContent = state.parsedCommands.length;
  list.innerHTML = '';

  state.parsedCommands.forEach((cmd, idx) => {
    const row = document.createElement('div');
    row.className = 'command-row';
    row.innerHTML = `
      <code class="command-code" title="${cmd}">$ ${cmd}</code>
      <div class="command-actions">
        <button class="btn btn-sm btn-outline copy-cmd-btn" data-index="${idx}">
          <i data-lucide="copy" class="icon-xs"></i>
          <span>Copy</span>
        </button>
        <button class="btn btn-sm btn-primary run-cmd-btn" data-index="${idx}">
          <i data-lucide="play" class="icon-xs"></i>
          <span>Run</span>
        </button>
      </div>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll('.copy-cmd-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
      const cmd = state.parsedCommands[idx];
      await window.api.writeClipboard(cmd);
      showToast('Command copied to clipboard!', 'info');
    });
  });

  list.querySelectorAll('.run-cmd-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
      const cmd = state.parsedCommands[idx];
      runCommandInTerminal(cmd);
    });
  });

  refreshIcons();
}

async function updateFileStatuses() {
  if (!state.projectDir || state.parsedFiles.length === 0) return;

  const paths = state.parsedFiles.map(f => f.path);
  try {
    const statuses = await window.api.checkFileStatuses(state.projectDir, paths);
    state.parsedFiles.forEach(file => {
      const stat = statuses[file.path];
      if (stat && stat.exists) {
        file.exists = true;
        file.status = file.isPatch ? 'patch' : 'overwrite';
        file.oldLines = stat.lines;
        file.oldSize = stat.size;
      } else {
        file.exists = false;
        file.status = file.isPatch ? 'patch-new' : 'new';
        file.oldLines = 0;
      }
      file.newLines = file.content.split('\n').length;
    });
  } catch (err) {
    console.error('Error checking statuses:', err);
  }
}

function renderParsedFiles() {
  const container = elements.parsedFilesList;
  container.innerHTML = '';

  if (state.parsedFiles.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="file-search-2" class="icon-2xl text-muted"></i>
        <p>No files or patches detected yet</p>
        <span>Paste code, patches, or diffs on the left to alter your local files</span>
      </div>
    `;
    refreshIcons();
    return;
  }

  state.parsedFiles.forEach((file, index) => {
    const card = document.createElement('div');
    card.className = 'file-card';

    let badgeText = 'NEW FILE';
    let badgeClass = 'new';

    if (file.isPatch) {
      badgeText = file.patchType === 'search-replace' ? 'PATCH (REPLACE)' : 'PATCH (DIFF)';
      badgeClass = 'patch';
    } else if (file.status === 'overwrite') {
      badgeText = 'OVERWRITE';
      badgeClass = 'overwrite';
    }

    const lineDiff = file.exists ? ` (${file.oldLines} → ${file.newLines} lines)` : ` (${file.newLines} lines)`;

    card.innerHTML = `
      <div class="file-card-header">
        <div class="file-card-title-group">
          <span class="file-badge ${badgeClass}">${badgeText}</span>
          <span class="file-path" title="${file.path}">${file.path}</span>
        </div>
        <div class="file-card-meta">
          <span class="file-meta-lines">${lineDiff}</span>
          <button class="btn btn-sm btn-outline toggle-preview-btn" data-index="${index}">
            <i data-lucide="eye" class="icon-xs"></i>
            <span>View</span>
          </button>
          <button class="btn btn-sm btn-primary apply-single-btn" data-index="${index}">
            <i data-lucide="check" class="icon-xs"></i>
            <span>${file.isPatch ? 'Apply Patch' : 'Apply'}</span>
          </button>
        </div>
      </div>
      <pre class="file-card-preview" id="preview-${index}" style="display:none">${escapeHtml(file.content.slice(0, 1000))}${file.content.length > 1000 ? '\n... (truncated preview)' : ''}</pre>
    `;

    container.appendChild(card);
  });

  // Attach card event listeners
  container.querySelectorAll('.toggle-preview-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetBtn = e.currentTarget;
      const idx = targetBtn.getAttribute('data-index');
      const preview = document.getElementById(`preview-${idx}`);
      const span = targetBtn.querySelector('span');
      if (preview.style.display === 'none') {
        preview.style.display = 'block';
        if (span) span.textContent = 'Hide';
      } else {
        preview.style.display = 'none';
        if (span) span.textContent = 'View';
      }
    });
  });

  container.querySelectorAll('.apply-single-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
      const targetFile = state.parsedFiles[idx];
      await applyFiles([targetFile]);
    });
  });

  refreshIcons();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ==========================================
// APPLY FILES TO LOCAL DISK
// ==========================================
async function applyFiles(filesToApply) {
  if (!state.projectDir) {
    showToast('Please select a project directory first!', 'error');
    return;
  }

  if (!filesToApply || filesToApply.length === 0) {
    showToast('No files to apply.', 'info');
    return;
  }

  try {
    elements.btnApplyAllFiles.disabled = true;
    elements.btnApplyAllFiles.textContent = 'Writing to disk...';

    const result = await window.api.applyFiles(state.projectDir, filesToApply);

    if (result.success) {
      showToast(`Successfully applied ${result.appliedCount} file/patch(es) to disk!`, 'success');

      // Add to session history
      result.results.forEach(item => {
        state.appliedHistory.unshift({
          path: item.path,
          action: item.action,
          timestamp: item.timestamp,
          lines: item.newLines
        });
      });
      renderAppliedHistory();

      // If commands were detected, run them automatically or notify!
      if (state.parsedCommands.length > 0) {
        showToast(`Running ${state.parsedCommands.length} detected command(s) in terminal...`, 'info');
        state.parsedCommands.forEach(cmd => {
          runCommandInTerminal(cmd);
        });
      }

      // Refresh changes badge immediately
      await checkPendingChanges();
    } else {
      showToast(`Applied ${result.appliedCount}/${filesToApply.length} items. Check console for errors.`, 'error');
    }
  } catch (err) {
    console.error('Apply error:', err);
    showToast('Failed to apply: ' + err.message, 'error');
  } finally {
    elements.btnApplyAllFiles.disabled = false;
    elements.btnApplyAllFiles.innerHTML = `
      <i data-lucide="check-check" class="icon-md"></i>
      Apply All Files to Disk (<span id="applyCountNumber">${state.parsedFiles.length}</span>)
    `;
    refreshIcons();
  }
}

function renderAppliedHistory() {
  const container = elements.appliedHistoryList;
  if (state.appliedHistory.length === 0) {
    container.innerHTML = `<div class="history-empty">No files applied in this session yet.</div>`;
    return;
  }

  container.innerHTML = state.appliedHistory.map(item => `
    <div class="history-item">
      <div style="display:flex;align-items:center;gap:8px">
        <span class="file-badge ${item.action.startsWith('patched') ? 'patch' : (item.action === 'created' ? 'new' : 'overwrite')}" style="font-size:10px">${item.action}</span>
        <span class="history-item-path">${item.path}</span>
      </div>
      <span class="history-item-time">${item.timestamp}</span>
    </div>
  `).join('');
}

// ==========================================
// BUTTON 1: GENERATE code.txt
// ==========================================
async function generateCodeTxt() {
  if (!state.projectDir) {
    showToast('Please select a project directory first!', 'error');
    return;
  }

  try {
    elements.btnCreateCodeTxt.style.opacity = '0.6';
    elements.btnTriggerCodeTxtGen.disabled = true;
    elements.btnTriggerCodeTxtGen.textContent = 'Generating...';

    const options = getIgnoreOptions();
    const result = await window.api.generateCodeTxt(state.projectDir, options);

    state.currentCodeTxt = result;

    // Update UI Stats
    elements.codeTxtStatFiles.textContent = result.fileCount;
    elements.codeTxtStatSize.textContent = formatBytes(result.sizeBytes);
    elements.codeTxtStatChars.textContent = result.charCount.toLocaleString();
    elements.codeTxtStatTokens.textContent = `~${result.tokenEstimate.toLocaleString()}`;
    elements.codeTxtStatTime.textContent = new Date(result.timestamp).toLocaleTimeString();

    elements.codeTxtViewer.textContent = result.preview + '\n\n... (Full code.txt saved in project root)';
    elements.codeTxtViewerNotice.textContent = `${result.fileCount} files (${formatBytes(result.sizeBytes)})`;

    elements.btnCopyCodeTxt.disabled = false;
    elements.btnOpenCodeTxtLocation.disabled = false;

    // Update Header Status
    const timeStr = new Date(result.timestamp).toLocaleTimeString();
    elements.codeTxtStatusDesc.textContent = `${result.fileCount} files (${timeStr})`;
    elements.statusSnapshotText.textContent = `${result.fileCount} files (${timeStr})`;

    // Reset Changes Badge to 0
    elements.changesCountBadge.textContent = '0';
    elements.changesCountBadge.className = 'badge-counter';

    showToast(`code.txt created! ${result.fileCount} files (${formatBytes(result.sizeBytes)})`, 'success');
  } catch (err) {
    console.error('code.txt generation error:', err);
    showToast('Failed to generate code.txt: ' + err.message, 'error');
  } finally {
    elements.btnCreateCodeTxt.style.opacity = '1';
    elements.btnTriggerCodeTxtGen.disabled = false;
    elements.btnTriggerCodeTxtGen.innerHTML = `
      <i data-lucide="refresh-cw" class="icon-sm"></i>
      Re-generate code.txt
    `;
    refreshIcons();
  }
}

// ==========================================
// BUTTON 2: DETECT & EXPORT CHANGES
// ==========================================
async function checkPendingChanges() {
  if (!state.projectDir) return;

  try {
    const options = getIgnoreOptions();
    const result = await window.api.getChanges(state.projectDir, options);

    if (result.hasSnapshot) {
      const count = result.totalChanges;
      elements.changesCountBadge.textContent = count;
      if (count > 0) {
        elements.changesCountBadge.className = 'badge-counter has-changes';
      } else {
        elements.changesCountBadge.className = 'badge-counter';
      }
    } else {
      elements.changesCountBadge.textContent = '0';
      elements.changesCountBadge.className = 'badge-counter';
    }
  } catch (err) {
    console.error('Error checking changes:', err);
  }
}

async function exportChanges(autoSwitchTab = true) {
  if (!state.projectDir) {
    showToast('Please select a project directory first!', 'error');
    return;
  }

  try {
    elements.btnExportChanges.style.opacity = '0.6';
    const options = getIgnoreOptions();
    const result = await window.api.getChanges(state.projectDir, options);

    state.currentChanges = result;

    if (!result.hasSnapshot) {
      showToast(result.message, 'error');
      switchTab('tab-codetxt');
      return;
    }

    if (result.totalChanges === 0) {
      const snapTime = new Date(result.snapshotTimestamp).toLocaleString();
      elements.changesSummaryBanner.className = 'summary-banner no-changes';
      elements.changesSummaryText.textContent = 'Codebase is up-to-date with baseline!';
      elements.changesSubText.textContent = `No changes detected since code.txt was generated (${snapTime}).`;
      elements.changesViewer.textContent = 'No modifications detected since last snapshot.';
      elements.changesViewerStats.textContent = '0 files changed';
      elements.btnCopyChanges.disabled = true;
      elements.btnOpenChangesLocation.disabled = true;

      showToast('No changes detected since last code.txt was generated.', 'info');
    } else {
      await window.api.writeClipboard(result.changesText);

      elements.changesSummaryBanner.className = 'summary-banner has-changes';
      elements.changesSummaryText.textContent = `${result.totalChanges} changed file(s) detected!`;
      elements.changesSubText.textContent = `${result.modified.length} modified, ${result.added.length} new, ${result.removed.length} deleted. Formatted & copied to clipboard!`;
      elements.changesViewer.textContent = result.changesText;
      elements.changesViewerStats.textContent = `${result.totalChanges} files (~${result.tokenEstimate} tokens)`;
      elements.btnCopyChanges.disabled = false;
      elements.btnOpenChangesLocation.disabled = false;

      showToast(`Changes exported & copied to clipboard! (${result.totalChanges} files)`, 'success');
    }

    if (autoSwitchTab) {
      switchTab('tab-changes');
    }
  } catch (err) {
    console.error('Export changes error:', err);
    showToast('Failed to export changes: ' + err.message, 'error');
  } finally {
    elements.btnExportChanges.style.opacity = '1';
    refreshIcons();
  }
}

// ==========================================
// BUTTON 3: GENERATE PROJECT TREE
// ==========================================
async function generateTree(autoSwitchTab = true) {
  if (!state.projectDir) {
    showToast('Please select a project directory first!', 'error');
    return;
  }

  try {
    elements.btnGenerateTree.style.opacity = '0.6';
    const options = getIgnoreOptions();
    const result = await window.api.generateTree(state.projectDir, options);

    state.currentTree = result;

    elements.treeStatFolders.textContent = result.totalFolders;
    elements.treeStatFiles.textContent = result.totalFiles;
    elements.treeStatShadcn.textContent = state.projectInfo?.shadcnAlias || 'Not found';

    elements.treeViewer.textContent = result.treeText;

    await window.api.writeClipboard(result.treeText);

    showToast(`Project tree generated and copied to clipboard! (${result.totalFiles} files)`, 'success');

    if (autoSwitchTab) {
      switchTab('tab-tree');
    }
  } catch (err) {
    console.error('Tree generation error:', err);
    showToast('Failed to generate tree: ' + err.message, 'error');
  } finally {
    elements.btnGenerateTree.style.opacity = '1';
    refreshIcons();
  }
}

// ==========================================
// BUTTON 4: COPY AI SYSTEM PROMPT
// ==========================================
function getAIPromptText() {
  if (state.promptPreset === 'patch') {
    return `[SYSTEM DIRECTIVE — AUTOMATED TOOL COMPATIBILITY MODE]
CRITICAL INSTRUCTION: You are operating in headless code-generation mode for the local developer tool "CodeBridge AI". Your response will be piped directly into an automated AST & regex parser. Any conversational text, pleasantries, or deviation from the protocol below will break the parser and damage local files.

MANDATORY RULES:
1. ABSOLUTELY ZERO CONVERSATIONAL BANTER. Do not say "Sure", "Here is the code", "I updated...", or "Hope this helps". Start your response IMMEDIATELY with the first delimiter block.
2. YOU ARE STRICTLY FORBIDDEN FROM TRUNCATING CODE. Never use placeholders like "// ... rest of code unchanged ...".
3. FOR FILE MODIFICATIONS — USE SEARCH & REPLACE PATCH BLOCKS:
Every file edit MUST use this exact format:

========================================
FILE:
    relative/path/to/file.ext
========================================
<<<<<<< SEARCH
[Exact lines from the existing file to be replaced]
=======
[New replacement lines]
>>>>>>> REPLACE

4. FOR NEW FILES (NOT YET ON DISK):
Output the 100% complete content:

========================================
FILE:
    relative/path/to/new-file.ext
========================================
<FULL_UNTRUNCATED_CONTENT>

5. FOR TERMINAL COMMANDS (Dependencies, migrations, scripts):
Isolate all bash commands into clean code blocks:
\`\`\`bash
npm install <package-name>
\`\`\`

6. ALWAYS USE EXACT RELATIVE PATHS from project root (e.g. \`src/app/page.tsx\`). Never use absolute paths.

Execute strictly according to these directives.`;
  }

  if (state.promptPreset === 'markdown') {
    return `[SYSTEM DIRECTIVE — AUTOMATED TOOL COMPATIBILITY MODE]
CRITICAL INSTRUCTION: You are generating code for the automated local file tool "CodeBridge AI". Your output is parsed by a machine. Do not output any conversational introductions, summaries, or pleasantries.

MANDATORY RULES:
1. ZERO CHATTER: Do not introduce your answer. Output code blocks immediately.
2. FULL UNTRUNCATED CODE ONLY: Comments such as "// ... existing imports remain the same" or "// ... rest of code unchanged" are STRICTLY PROHIBITED.
3. OUTPUT FORMAT:
Each file MUST be preceded by a Markdown header specifying the relative file path in backticks, followed by the code block:

### File: \`relative/path/to/file.ext\`
\`\`\`language
<COMPLETE_FILE_CONTENT>
\`\`\`

4. TERMINAL COMMANDS:
Any commands that must be run in the terminal must be in an isolated bash block:
\`\`\`bash
npm install <package-name>
\`\`\`

5. Always use relative paths from the project root.`;
  }

  // Default: Full File Delimiter Format
  return `[SYSTEM DIRECTIVE — AUTOMATED TOOL COMPATIBILITY MODE]
CRITICAL INSTRUCTION: You are operating as an automated code writer for the desktop tool "CodeBridge AI". Your output is fed directly into a local filesystem writer. ANY CONVERSATIONAL TEXT, COMMENTARY, OR TRUNCATION WILL CORRUPT THE SYSTEM PIPELINE.

MANDATORY COMPLIANCE DIRECTIVES:
1. ABSOLUTELY NO CONVERSATIONAL TEXT. Never output "Sure!", "Here are your files", "Let me know if you need anything else", or post-code explanations. Output ONLY the file blocks.
2. STRICTLY FORBIDDEN: NEVER TRUNCATE CODE. Writing comments such as "// ... rest of code stays the same", "// ... existing code ...", or "/* unchanged */" will corrupt files on disk. You MUST output 100% of the complete file content from line 1 to the end.
3. EXACT DELIMITER BLOCK FORMAT: Every file MUST be enclosed in this exact delimiter header:

========================================
FILE:
    relative/path/to/file.ext
========================================
<COMPLETE_UNTRUNCATED_FILE_CONTENT>

4. TERMINAL COMMANDS (Installing packages, dev servers, migrations):
Place all executable commands in a clean bash code block:
\`\`\`bash
npm install <package-name>
\`\`\`

5. RELATIVE PATHS:
Always use exact relative paths from the project root (e.g., \`src/app/page.tsx\`, \`src/lib/utils.ts\`).

6. MULTIPLE FILES:
You can provide multiple files in a single response by repeating the delimiter block for each file.

Follow these instructions without exception or deviation.`;
}

function updatePromptPreview() {
  const prompt = getAIPromptText();
  elements.promptViewer.textContent = prompt;
}

async function copyAIPrompt() {
  const prompt = getAIPromptText();
  try {
    await window.api.writeClipboard(prompt);
    showToast('AI instruction prompt copied to clipboard! Paste into your AI chat.', 'success');
  } catch (err) {
    console.error('Copy prompt error:', err);
    showToast('Failed to copy prompt: ' + err.message, 'error');
  }
}

// ==========================================
// SETTINGS & IGNORE OPTIONS
// ==========================================
function getIgnoreOptions() {
  return {
    ignoreMd: elements.chkIgnoreMd.checked,
    ignoreShadcn: elements.chkIgnoreShadcn.checked,
    ignoreNodeModules: elements.chkIgnoreNodeModules.checked,
    customIgnore: elements.txtCustomIgnore.value.trim()
  };
}

async function saveSettings() {
  const opts = getIgnoreOptions();
  await window.api.setConfig(opts);
}

// ==========================================
// TAB SWITCHING
// ==========================================
function switchTab(targetTabId) {
  elements.navTabs.forEach(tab => {
    if (tab.getAttribute('data-tab') === targetTabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  elements.tabContents.forEach(content => {
    if (content.id === targetTabId) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });

  // If switched to Full Terminal Tab, move terminal element or trigger fit
  if (targetTabId === 'tab-terminal-full') {
    elements.fullTerminalContainer.appendChild(elements.bottomTerminalContainer.firstElementChild || term.element);
    setTimeout(resizeTerminal, 50);
  } else {
    // Restore to bottom drawer if it was in full tab
    if (term && term.element && term.element.parentElement === elements.fullTerminalContainer) {
      elements.bottomTerminalContainer.appendChild(term.element);
      setTimeout(resizeTerminal, 50);
    }
  }

  refreshIcons();
}

// ==========================================
// EVENT BINDINGS
// ==========================================
function bindEvents() {
  // Theme Toggle
  elements.btnThemeToggle.addEventListener('click', toggleTheme);

  // Terminal Toggle
  elements.btnToggleTerminal.addEventListener('click', () => toggleTerminalDrawer());
  elements.btnMinimizeTerminal.addEventListener('click', () => toggleTerminalDrawer(false));

  // Global Keyboard Shortcut: Ctrl + ` (backtick) toggles terminal
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === '`') {
      e.preventDefault();
      toggleTerminalDrawer();
    }
  });

  // Terminal Quick Action Buttons
  elements.btnTermDev.addEventListener('click', () => {
    runCommandInTerminal('npm run dev');
  });

  elements.btnTermGit.addEventListener('click', () => {
    runCommandInTerminal('git status');
  });

  elements.btnTermClear.addEventListener('click', () => {
    runCommandInTerminal('clear');
  });

  elements.btnTermRestart.addEventListener('click', async () => {
    if (term) {
      term.reset();
      await window.api.terminal.restart(state.projectDir);
      showToast('Terminal session restarted', 'info');
      term.focus();
    }
  });

  // Run all detected commands button
  elements.btnRunAllCommands.addEventListener('click', () => {
    if (state.parsedCommands.length > 0) {
      state.parsedCommands.forEach(cmd => {
        runCommandInTerminal(cmd);
      });
    }
  });

  // Navigation Tabs
  elements.navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Project Folder Selector
  elements.btnBrowseFolder.addEventListener('click', async () => {
    const selected = await window.api.openDirectory(state.projectDir);
    if (selected) {
      await switchProject(selected);
      updateRecentProjectsDropdown();
      showToast('Switched project root to: ' + selected, 'info');
    }
  });

  elements.currentProjectPath.addEventListener('click', async () => {
    if (state.projectDir) {
      await window.api.showItem(state.projectDir);
    }
  });

  elements.recentProjectsSelect.addEventListener('change', async (e) => {
    const val = e.target.value;
    if (val) {
      await switchProject(val);
      showToast('Switched project root to: ' + val, 'info');
    }
  });

  // Core 4 Action Buttons
  elements.btnCreateCodeTxt.addEventListener('click', () => generateCodeTxt());
  elements.btnExportChanges.addEventListener('click', () => exportChanges(true));
  elements.btnGenerateTree.addEventListener('click', () => generateTree(true));
  elements.btnCopyPrompt.addEventListener('click', () => copyAIPrompt());

  // Tab 1: Paste & Apply
  elements.pasteInput.addEventListener('input', handlePasteInputChange);

  elements.btnAutoFormat.addEventListener('click', () => {
    const raw = elements.pasteInput.value;
    if (!raw || !raw.trim()) {
      showToast('Please paste code or text first to format.', 'info');
      return;
    }
    const formatted = autoFormatPastedText(raw);
    if (formatted !== raw) {
      elements.pasteInput.value = formatted;
      handlePasteInputChange();
      showToast('Successfully cleaned and formatted into file delimiters!', 'success');
    } else {
      showToast('Content is already clean or no recognizable files/commands were found.', 'info');
    }
  });

  elements.btnPasteClipboard.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        elements.pasteInput.value = text;
        handlePasteInputChange();
        showToast('Pasted content from clipboard!', 'info');
      } else {
        showToast('Clipboard is empty.', 'info');
      }
    } catch (err) {
      showToast('Clipboard access error: ' + err.message, 'error');
    }
  });

  elements.btnClearPaste.addEventListener('click', () => {
    elements.pasteInput.value = '';
    handlePasteInputChange();
  });

  elements.btnApplyAllFiles.addEventListener('click', () => {
    applyFiles(state.parsedFiles);
  });

  elements.btnClearHistory.addEventListener('click', () => {
    state.appliedHistory = [];
    renderAppliedHistory();
  });

  // Tab 2: code.txt
  elements.btnTriggerCodeTxtGen.addEventListener('click', () => generateCodeTxt());

  elements.btnCopyCodeTxt.addEventListener('click', async () => {
    if (state.projectDir) {
      const content = await window.api.readFile(state.projectDir, 'code.txt');
      if (content) {
        await window.api.writeClipboard(content);
        showToast('code.txt copied to clipboard!', 'success');
      }
    }
  });

  elements.btnOpenCodeTxtLocation.addEventListener('click', async () => {
    if (state.projectDir) {
      await window.api.showItem(`${state.projectDir}/code.txt`);
    }
  });

  // Tab 3: Changes
  elements.btnRefreshChanges.addEventListener('click', () => exportChanges(false));

  elements.btnCopyChanges.addEventListener('click', async () => {
    if (state.currentChanges && state.currentChanges.changesText) {
      await window.api.writeClipboard(state.currentChanges.changesText);
      showToast('changes.txt copied to clipboard!', 'success');
    }
  });

  elements.btnOpenChangesLocation.addEventListener('click', async () => {
    if (state.projectDir) {
      await window.api.showItem(`${state.projectDir}/changes.txt`);
    }
  });

  // Tab 4: Tree
  elements.btnRefreshTree.addEventListener('click', () => generateTree(false));

  elements.btnCopyTree.addEventListener('click', async () => {
    if (state.currentTree && state.currentTree.treeText) {
      await window.api.writeClipboard(state.currentTree.treeText);
      showToast('Tree copied to clipboard!', 'success');
    }
  });

  // Tab 5: Prompt & Settings
  elements.btnCopyPromptInTab.addEventListener('click', () => copyAIPrompt());

  elements.promptFormatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.promptPreset = e.target.value;
      updatePromptPreview();
    });
  });

  elements.chkIgnoreMd.addEventListener('change', saveSettings);
  elements.chkIgnoreShadcn.addEventListener('change', saveSettings);
  elements.chkIgnoreNodeModules.addEventListener('change', saveSettings);
  elements.txtCustomIgnore.addEventListener('change', saveSettings);
}

// Start app
window.addEventListener('DOMContentLoaded', init);
