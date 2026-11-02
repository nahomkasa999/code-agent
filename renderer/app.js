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
  terminalHeight: 260,
  applyErrors: [],
  selectedErrorFile: null,
  terminalOutputHistory: '',
  sidebarCollapsed: false,
  selectedChangeFile: null,
  changeDiffViewMode: 'diff',
  changesTreeFilter: ''
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
  appSidebar: document.getElementById('appSidebar'),
  btnToggleSidebarCollapse: document.getElementById('btnToggleSidebarCollapse'),
  sidebarCollapseIcon: document.getElementById('sidebarCollapseIcon'),
  btnTopSidebarToggle: document.getElementById('btnTopSidebarToggle'),

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

  // Tab 3: Changes & Revert
  btnRefreshChanges: document.getElementById('btnRefreshChanges'),
  btnCopyChanges: document.getElementById('btnCopyChanges'),
  btnOpenChangesLocation: document.getElementById('btnOpenChangesLocation'),
  btnRevertAllChanges: document.getElementById('btnRevertAllChanges'),
  btnRevertSelectedFile: document.getElementById('btnRevertSelectedFile'),
  changesTotalCount: document.getElementById('changesTotalCount'),
  changesModifiedCount: document.getElementById('changesModifiedCount'),
  changesAddedCount: document.getElementById('changesAddedCount'),
  changesDeletedCount: document.getElementById('changesDeletedCount'),
  changesBaselineInfo: document.getElementById('changesBaselineInfo'),
  btnCollapseAllChangesTree: document.getElementById('btnCollapseAllChangesTree'),
  btnExpandAllChangesTree: document.getElementById('btnExpandAllChangesTree'),
  txtFilterChangesTree: document.getElementById('txtFilterChangesTree'),
  changesTreeContainer: document.getElementById('changesTreeContainer'),
  diffActiveFileBadge: document.getElementById('diffActiveFileBadge'),
  diffActiveFilePath: document.getElementById('diffActiveFilePath'),
  changesDiffViewer: document.getElementById('changesDiffViewer'),
  diffViewModeBtns: document.querySelectorAll('.view-mode-btn'),

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
  btnTermSendError: document.getElementById('btnTermSendError'),

  // Error Assistant & Quick Fix
  tabErrorBadge: document.getElementById('tabErrorBadge'),
  pasteErrorAlertCard: document.getElementById('pasteErrorAlertCard'),
  pasteErrorCount: document.getElementById('pasteErrorCount'),
  pasteErrorList: document.getElementById('pasteErrorList'),
  btnCopyQuickErrorPrompt: document.getElementById('btnCopyQuickErrorPrompt'),
  btnOpenFullErrorTab: document.getElementById('btnOpenFullErrorTab'),
  btnDismissQuickError: document.getElementById('btnDismissQuickError'),
  quickFixInput: document.getElementById('quickFixInput'),
  btnQuickApplyFixDisk: document.getElementById('btnQuickApplyFixDisk'),
  btnQuickMergeFixOriginal: document.getElementById('btnQuickMergeFixOriginal'),
  btnQuickApplyAndMerge: document.getElementById('btnQuickApplyAndMerge'),

  // Dedicated Error & Fix Tab
  btnCopyFullErrorPrompt: document.getElementById('btnCopyFullErrorPrompt'),
  btnLoadFromTerminal: document.getElementById('btnLoadFromTerminal'),
  btnClearErrorFixer: document.getElementById('btnClearErrorFixer'),
  errorTargetFileSelect: document.getElementById('errorTargetFileSelect'),
  errorDiagnosticText: document.getElementById('errorDiagnosticText'),
  diskFileStatusLabel: document.getElementById('diskFileStatusLabel'),
  errorCurrentFilePreview: document.getElementById('errorCurrentFilePreview'),
  btnFormatAssistantFix: document.getElementById('btnFormatAssistantFix'),
  fixAssistantInput: document.getElementById('fixAssistantInput'),
  btnAssistantApplyDisk: document.getElementById('btnAssistantApplyDisk'),
  btnAssistantMergeOriginal: document.getElementById('btnAssistantMergeOriginal'),
  btnAssistantApplyBoth: document.getElementById('btnAssistantApplyBoth'),
  assistantStatusBanner: document.getElementById('assistantStatusBanner'),
  assistantStatusText: document.getElementById('assistantStatusText'),

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
    state.terminalOutputHistory = (state.terminalOutputHistory + incoming).slice(-15000);
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
      clearApplyErrors();

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
      const failed = (result.errors && result.errors.length > 0) ? result.errors : (result.results ? result.results.filter(r => !r.success) : []);
      showToast(`Applied ${result.appliedCount}/${filesToApply.length} items. ${failed.length} error(s) occurred.`, 'error');

      // Record any successful ones into session history
      if (result.results) {
        result.results.filter(r => r.success).forEach(item => {
          state.appliedHistory.unshift({
            path: item.path,
            action: item.action,
            timestamp: item.timestamp,
            lines: item.newLines
          });
        });
        renderAppliedHistory();
      }

      handleApplyErrors(failed);
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
        <span class="history-item-path">${escapeHtml(item.path)}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="history-item-time">${item.timestamp}</span>
        <button class="btn-text-sm text-destructive revert-history-btn" data-path="${item.path}" title="Revert this file to baseline snapshot">Revert</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.revert-history-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const p = e.currentTarget.getAttribute('data-path');
      if (p) revertSingleFile(p);
    });
  });
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
    elements.btnTriggerCodeTxtGen.textContent = 'Copying...';

    const options = getIgnoreOptions();
    const result = await window.api.generateCodeTxt(state.projectDir, options);

    state.currentCodeTxt = result;

    if (result.content) {
      await window.api.writeClipboard(result.content);
    }

    // Update UI Stats
    elements.codeTxtStatFiles.textContent = result.fileCount;
    elements.codeTxtStatSize.textContent = formatBytes(result.sizeBytes);
    elements.codeTxtStatChars.textContent = result.charCount.toLocaleString();
    elements.codeTxtStatTokens.textContent = `~${result.tokenEstimate.toLocaleString()}`;
    elements.codeTxtStatTime.textContent = new Date(result.timestamp).toLocaleTimeString();

    elements.codeTxtViewer.textContent = result.preview + '\n\n... (Full code copied to clipboard!)';
    elements.codeTxtViewerNotice.textContent = `${result.fileCount} files (${formatBytes(result.sizeBytes)}) — Copied to clipboard`;

    elements.btnCopyCodeTxt.disabled = false;
    elements.btnOpenCodeTxtLocation.disabled = false;

    // Update Header Status
    const timeStr = new Date(result.timestamp).toLocaleTimeString();
    elements.codeTxtStatusDesc.textContent = `${result.fileCount} files (${timeStr})`;
    elements.statusSnapshotText.textContent = `${result.fileCount} files (${timeStr})`;

    // Reset Changes Badge to 0
    elements.changesCountBadge.textContent = '0';
    elements.changesCountBadge.className = 'badge-counter';

    showToast(`Code copied to clipboard! ${result.fileCount} files (${formatBytes(result.sizeBytes)})`, 'success');
  } catch (err) {
    console.error('code copy error:', err);
    showToast('Failed to copy project code: ' + err.message, 'error');
  } finally {
    elements.btnCreateCodeTxt.style.opacity = '1';
    elements.btnTriggerCodeTxtGen.disabled = false;
    elements.btnTriggerCodeTxtGen.innerHTML = `
      <i data-lucide="refresh-cw" class="icon-sm"></i>
      Re-generate & Copy
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

    // Update stats bar
    elements.changesTotalCount.textContent = result.totalChanges;
    elements.changesModifiedCount.textContent = result.modified.length;
    elements.changesAddedCount.textContent = result.added.length;
    elements.changesDeletedCount.textContent = result.removed.length;

    const snapTime = new Date(result.snapshotTimestamp).toLocaleTimeString();
    elements.changesBaselineInfo.textContent = `Baseline Snapshot: ${snapTime}`;

    elements.changesCountBadge.textContent = result.totalChanges;
    if (result.totalChanges > 0) {
      elements.changesCountBadge.className = 'badge-counter has-changes';
      elements.btnRevertAllChanges.disabled = false;
      elements.btnCopyChanges.disabled = false;
      elements.btnOpenChangesLocation.disabled = false;
    } else {
      elements.changesCountBadge.className = 'badge-counter';
      elements.btnRevertAllChanges.disabled = true;
      elements.btnCopyChanges.disabled = true;
      elements.btnOpenChangesLocation.disabled = true;
    }

    renderChangesTree();

    if (result.totalChanges > 0) {
      await window.api.writeClipboard(result.changesText);
      showToast(`Changes loaded & copied to clipboard! (${result.totalChanges} files)`, 'success');
    } else {
      showToast('No changes detected since baseline snapshot was generated.', 'info');
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
// CODE EDITOR CHANGES TREE & DIFF EXPLORER
// ==========================================

function buildChangesHierarchy(filesList) {
  const root = { name: '', isDir: true, children: {}, files: [] };

  filesList.forEach(fileItem => {
    const parts = fileItem.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.children[part]) {
        current.children[part] = { name: part, isDir: true, children: {}, files: [] };
      }
      current = current.children[part];
    }

    current.files.push(fileItem);
  });

  return root;
}

function renderChangesTree() {
  const container = elements.changesTreeContainer;
  if (!container) return;

  const res = state.currentChanges;
  if (!res || res.totalChanges === 0) {
    container.innerHTML = `
      <div class="tree-empty-state">
        <i data-lucide="check-circle-2" class="icon-xl text-muted"></i>
        <span>No changes detected since baseline snapshot</span>
      </div>
    `;
    elements.changesDiffViewer.innerHTML = `
      <div class="diff-empty-state">
        <i data-lucide="check-circle-2" class="icon-2xl text-primary"></i>
        <p>All files are in sync with baseline snapshot!</p>
      </div>
    `;
    elements.diffActiveFilePath.textContent = 'All clean (0 changes)';
    elements.diffActiveFileBadge.style.display = 'none';
    elements.btnRevertSelectedFile.style.display = 'none';
    refreshIcons();
    return;
  }

  let allChangedFiles = [];
  if (res.modified) res.modified.forEach(f => allChangedFiles.push({ ...f, status: 'modified' }));
  if (res.added) res.added.forEach(f => allChangedFiles.push({ ...f, status: 'added' }));
  if (res.removed) res.removed.forEach(f => allChangedFiles.push({ ...f, status: 'deleted' }));

  if (state.changesTreeFilter) {
    const q = state.changesTreeFilter.toLowerCase();
    allChangedFiles = allChangedFiles.filter(f => f.path.toLowerCase().includes(q));
  }

  if (allChangedFiles.length === 0) {
    container.innerHTML = `
      <div class="tree-empty-state">
        <i data-lucide="filter" class="icon-xl text-muted"></i>
        <span>No changed files match "${escapeHtml(state.changesTreeFilter)}"</span>
      </div>
    `;
    refreshIcons();
    return;
  }

  const rootNode = buildChangesHierarchy(allChangedFiles);
  container.innerHTML = '';

  function renderNode(node, parentEl) {
    Object.keys(node.children).sort().forEach(folderName => {
      const folder = node.children[folderName];
      const folderDiv = document.createElement('div');
      folderDiv.className = 'tree-folder-node';
      folderDiv.innerHTML = `
        <div class="tree-folder-header">
          <i data-lucide="chevron-down" class="icon-xs tree-folder-icon"></i>
          <i data-lucide="folder" class="icon-xs text-primary"></i>
          <span>${escapeHtml(folder.name)}</span>
        </div>
        <div class="tree-folder-children"></div>
      `;

      const header = folderDiv.querySelector('.tree-folder-header');
      header.addEventListener('click', () => {
        folderDiv.classList.toggle('collapsed');
      });

      const childrenContainer = folderDiv.querySelector('.tree-folder-children');
      renderNode(folder, childrenContainer);
      parentEl.appendChild(folderDiv);
    });

    node.files.sort((a, b) => a.path.localeCompare(b.path)).forEach(fileItem => {
      const fileName = fileItem.path.split('/').pop();
      const fileDiv = document.createElement('div');
      const isSelected = state.selectedChangeFile && state.selectedChangeFile.path === fileItem.path;
      fileDiv.className = `tree-file-node ${isSelected ? 'active' : ''}`;
      fileDiv.setAttribute('data-path', fileItem.path);

      let badgeLetter = 'M';
      let badgeClass = 'modified';
      if (fileItem.status === 'added') {
        badgeLetter = 'A';
        badgeClass = 'added';
      } else if (fileItem.status === 'deleted') {
        badgeLetter = 'D';
        badgeClass = 'deleted';
      }

      fileDiv.innerHTML = `
        <span class="tree-file-status-badge ${badgeClass}">${badgeLetter}</span>
        <span class="tree-file-name" title="${fileItem.path}">${escapeHtml(fileName)}</span>
        <button class="tree-revert-btn" title="Revert ${escapeHtml(fileName)} to baseline" data-path="${fileItem.path}">
          <i data-lucide="undo-2" class="icon-xs"></i>
        </button>
      `;

      fileDiv.addEventListener('click', (e) => {
        if (e.target.closest('.tree-revert-btn')) return;
        selectChangeFile(fileItem);
      });

      const revertBtn = fileDiv.querySelector('.tree-revert-btn');
      if (revertBtn) {
        revertBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          revertSingleFile(fileItem.path);
        });
      }

      parentEl.appendChild(fileDiv);
    });
  }

  renderNode(rootNode, container);
  refreshIcons();

  if (!state.selectedChangeFile || !allChangedFiles.some(f => f.path === state.selectedChangeFile.path)) {
    if (allChangedFiles.length > 0) {
      selectChangeFile(allChangedFiles[0]);
    }
  } else {
    const currentItem = allChangedFiles.find(f => f.path === state.selectedChangeFile.path);
    if (currentItem) selectChangeFile(currentItem);
  }
}

function selectChangeFile(fileItem) {
  state.selectedChangeFile = fileItem;

  document.querySelectorAll('.tree-file-node').forEach(el => {
    if (el.getAttribute('data-path') === fileItem.path) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  elements.diffActiveFilePath.textContent = fileItem.path;
  elements.diffActiveFilePath.title = fileItem.path;

  let badgeText = 'MODIFIED';
  let badgeClass = 'modified';
  if (fileItem.status === 'added') {
    badgeText = 'NEW FILE';
    badgeClass = 'new';
  } else if (fileItem.status === 'deleted') {
    badgeText = 'DELETED';
    badgeClass = 'overwrite';
  }

  elements.diffActiveFileBadge.textContent = badgeText;
  elements.diffActiveFileBadge.className = `file-badge ${badgeClass}`;
  elements.diffActiveFileBadge.style.display = 'inline-block';

  elements.btnRevertSelectedFile.style.display = 'inline-flex';
  elements.btnRevertSelectedFile.disabled = false;
  elements.btnRevertSelectedFile.setAttribute('data-path', fileItem.path);

  renderDiffContent(fileItem);
}

function renderDiffContent(fileItem) {
  const container = elements.changesDiffViewer;
  if (!container || !fileItem) return;

  const mode = state.changeDiffViewMode;

  if (mode === 'raw') {
    const raw = state.currentChanges ? state.currentChanges.changesText : 'No changes generated yet.';
    container.innerHTML = `<pre class="code-preview-block" style="height:100%;padding:16px;">${escapeHtml(raw)}</pre>`;
    return;
  }

  if (mode === 'current') {
    const current = fileItem.content || '(File is deleted or empty)';
    const lines = current.split('\n');
    let html = '';
    lines.forEach((line, idx) => {
      html += `<div class="diff-line"><span class="diff-line-num">${idx + 1}</span><span class="diff-line-code">${escapeHtml(line)}</span></div>`;
    });
    container.innerHTML = html;
    return;
  }

  const baseline = fileItem.baselineContent || '';
  const current = fileItem.content || '';

  if (typeof Diff !== 'undefined' && Diff.createPatch) {
    try {
      const patch = Diff.createPatch(fileItem.path, baseline, current, 'baseline', 'current');
      const lines = patch.split('\n');
      let html = '';
      let lineNumOld = 0;
      let lineNumNew = 0;

      lines.forEach(line => {
        if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('Index:') || line.startsWith('===')) {
          return;
        }

        if (line.startsWith('@@')) {
          html += `<div class="diff-line line-hunk"><span class="diff-line-num">...</span><span class="diff-line-code">${escapeHtml(line)}</span></div>`;
          return;
        }

        if (line.startsWith('+')) {
          lineNumNew++;
          html += `<div class="diff-line line-add"><span class="diff-line-num">+</span><span class="diff-line-code">${escapeHtml(line.slice(1))}</span></div>`;
        } else if (line.startsWith('-')) {
          lineNumOld++;
          html += `<div class="diff-line line-del"><span class="diff-line-num">-</span><span class="diff-line-code">${escapeHtml(line.slice(1))}</span></div>`;
        } else {
          lineNumOld++;
          lineNumNew++;
          html += `<div class="diff-line line-ctx"><span class="diff-line-num">${lineNumNew}</span><span class="diff-line-code">${escapeHtml(line.slice(1))}</span></div>`;
        }
      });

      if (!html) {
        html = `<div class="diff-empty-state"><i data-lucide="check" class="icon-xl text-primary"></i><span>No content difference detected</span></div>`;
      }
      container.innerHTML = html;
      refreshIcons();
      return;
    } catch (e) {
      console.warn('Diff error:', e);
    }
  }

  const curLines = current.split('\n');
  let html = '';
  curLines.forEach((l, idx) => {
    html += `<div class="diff-line line-ctx"><span class="diff-line-num">${idx + 1}</span><span class="diff-line-code">${escapeHtml(l)}</span></div>`;
  });
  container.innerHTML = html;
}

// ==========================================
// REVERT FUNCTIONS (ALL OR SOME FILES)
// ==========================================

async function revertSingleFile(relPath) {
  if (!state.projectDir) return;

  const confirmRevert = confirm(`Are you sure you want to revert "${relPath}" to baseline snapshot?\n\nAny uncommitted changes in this file will be lost.`);
  if (!confirmRevert) return;

  try {
    const res = await window.api.revertFile(state.projectDir, relPath);
    if (res.success) {
      showToast(`✓ Reverted ${relPath} (${res.action})`, 'success');
      await exportChanges(false);
      await checkPendingChanges();
    } else {
      showToast(`Failed to revert: ${res.error || 'Unknown error'}`, 'error');
    }
  } catch (err) {
    showToast(`Error reverting file: ${err.message}`, 'error');
  }
}

async function revertAllChanges() {
  if (!state.projectDir) return;
  if (!state.currentChanges || state.currentChanges.totalChanges === 0) {
    showToast('No changes to revert.', 'info');
    return;
  }

  const count = state.currentChanges.totalChanges;
  const confirmRevert = confirm(`⚠️ Are you sure you want to REVERT ALL ${count} changed files back to baseline snapshot?\n\nAll modified files will be restored from baseline snapshot and new files will be removed.`);
  if (!confirmRevert) return;

  try {
    elements.btnRevertAllChanges.disabled = true;
    elements.btnRevertAllChanges.textContent = 'Reverting...';

    const res = await window.api.revertAll(state.projectDir);
    if (res.success) {
      showToast(`✓ Reverted ${res.revertedCount} files back to baseline snapshot!`, 'success');
      await exportChanges(false);
      await checkPendingChanges();
    } else {
      showToast(`Failed to revert all: ${res.error || 'Unknown error'}`, 'error');
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    elements.btnRevertAllChanges.disabled = false;
    elements.btnRevertAllChanges.innerHTML = `
      <i data-lucide="rotate-ccw" class="icon-sm"></i>
      Revert All Changes
    `;
    refreshIcons();
  }
}

// ==========================================
// COLLAPSIBLE SIDEBAR TOGGLE
// ==========================================

function toggleSidebarCollapse(forceState = null) {
  const sidebar = elements.appSidebar;
  if (!sidebar) return;

  const willCollapse = forceState !== null ? forceState : !sidebar.classList.contains('collapsed');

  if (willCollapse) {
    sidebar.classList.add('collapsed');
    state.sidebarCollapsed = true;
    if (elements.sidebarCollapseIcon) {
      elements.sidebarCollapseIcon.setAttribute('data-lucide', 'panel-left-open');
    }
  } else {
    sidebar.classList.remove('collapsed');
    state.sidebarCollapsed = false;
    if (elements.sidebarCollapseIcon) {
      elements.sidebarCollapseIcon.setAttribute('data-lucide', 'panel-left-close');
    }
  }

  refreshIcons();
  setTimeout(resizeTerminal, 250);
}

// ==========================================
// PROJECT MANAGEMENT & RECENT DROPDOWN
// ==========================================

async function switchProject(projectPath) {
  if (!projectPath) return;
  state.projectDir = projectPath;
  elements.currentProjectPath.textContent = projectPath;
  elements.currentProjectPath.title = projectPath;
  elements.breadcrumbPath.textContent = projectPath;

  try {
    const info = await window.api.getProjectInfo(projectPath);
    state.projectInfo = info;

    if (info.shadcnAlias) {
      elements.statusShadcnText.textContent = `Shadcn (${info.shadcnAlias})`;
    } else {
      elements.statusShadcnText.textContent = 'No Shadcn UI';
    }

    if (info.hasSnapshot) {
      const timeStr = new Date(info.snapshotTimestamp).toLocaleTimeString();
      elements.statusSnapshotText.textContent = `${info.snapshotFileCount} files (${timeStr})`;
      elements.codeTxtStatusDesc.textContent = `${info.snapshotFileCount} files (${timeStr})`;
    } else {
      elements.statusSnapshotText.textContent = 'No snapshot';
      elements.codeTxtStatusDesc.textContent = 'Excludes .md, shadcn, node_modules';
    }

    const recent = state.config.recentProjects || [];
    if (!recent.includes(projectPath)) {
      recent.unshift(projectPath);
    }
    state.config.lastProjectDir = projectPath;
    state.config.recentProjects = recent.slice(0, 10);
    await window.api.setConfig({ lastProjectDir: projectPath, recentProjects: state.config.recentProjects });

    updateRecentProjectsDropdown();
    await checkPendingChanges();
  } catch (err) {
    console.error('Error switching project:', err);
  }
}

function updateRecentProjectsDropdown() {
  const select = elements.recentProjectsSelect;
  if (!select) return;
  select.innerHTML = '<option value="">Recent Projects</option>';
  (state.config.recentProjects || []).forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p.split('/').pop() + ' (' + p + ')';
    if (p === state.projectDir) opt.selected = true;
    select.appendChild(opt);
  });
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
  if (state.promptPreset === 'markdown') {
    return `[SYSTEM DIRECTIVE — AUTOMATED TOOL COMPATIBILITY MODE]
CRITICAL INSTRUCTION: You are generating code for the automated local file tool "CodeBridge AI". Your response will be parsed directly by an automated AST and regex parser into local filesystem files.

MANDATORY RULES:
1. ZERO CONVERSATIONAL BANTER:
   Do not introduce your answer. Do not say "Sure!", "Here is the code", or summarize your changes at the end. Output the code blocks IMMEDIATELY.
2. ZERO CODE TRUNCATION:
   Placeholders like "// ... existing imports unchanged", "// ... rest of code stays the same", or "/* ... */" are STRICTLY FORBIDDEN. Write 100% complete files.
3. OUTPUT FORMAT:
   Each file MUST begin with a Markdown H3 header specifying the exact relative path in backticks, followed by the code block:

### File: \`src/app/page.tsx\`
\`\`\`tsx
import React from 'react';

export default function Page() {
  return <main>Hello World</main>;
}
\`\`\`

4. TERMINAL COMMANDS:
   Place all executable bash commands in an isolated bash code block:
\`\`\`bash
npm install <package-name>
\`\`\`

5. RELATIVE PATHS ONLY:
   Always use exact relative paths from the project root (e.g., \`src/components/ui/button.tsx\`). Never use absolute paths.`;
  }

  // Comprehensive Hybrid / Patch & Delimiter Format (Default & Recommended)
  return `[SYSTEM DIRECTIVE — AUTOMATED TOOL COMPATIBILITY MODE]
CRITICAL INSTRUCTION: You are operating in headless code-generation mode for the local developer tool "CodeBridge AI". Your response will be parsed directly by an automated parser and applied to local disk files. Any conversational text, pleasantries, incomplete snippets, or syntax deviations will break the parser and damage files.

MANDATORY RULES OF ENGAGEMENT:
1. ABSOLUTELY ZERO CONVERSATIONAL BANTER:
   Never say "Sure!", "Here is the patch", "I updated the files", or add explanations after the code. Start your output IMMEDIATELY with the very first delimiter block.
2. ZERO CODE TRUNCATION:
   Never write "// ... existing code unchanged ...", "// ... rest of component ...", or omit lines. Truncating code will corrupt the project on disk.
3. RELATIVE PATHS ONLY:
   Always specify exact relative paths from the project root (e.g., \`src/app/page.tsx\`, \`src/lib/utils.ts\`). Never use absolute paths.

==================================================
WHEN TO USE PATCHES VS FULL FILES:
==================================================
- FOR EXISTING FILES WITH EDITS: Use SEARCH/REPLACE patch blocks. This preserves untouched code, avoids token waste, and prevents accidental truncation.
- FOR NEW FILES (NOT YET ON DISK): Output the 100% complete file content directly under the FILE delimiter.
- FOR MAJOR REFACTORS (>60% of file changed): Output the 100% complete file content.

==================================================
SEARCH / REPLACE PATCH SPECIFICATION:
==================================================
For editing existing files, use this exact delimiter format:

========================================
FILE:
    relative/path/to/existing-file.ext
========================================
<<<<<<< SEARCH
[Exact lines currently on disk to be replaced]
=======
[New replacement lines]
>>>>>>> REPLACE

CRITICAL PATCHING RULES (EXACT STRING MATCHING):
1. EXACT VERBATIM MATCH:
   The text in the SEARCH block must match the existing file on disk character-for-character, including whitespace, indentation (spaces or tabs), quotes, commas, and line endings.
2. ANCHOR CONTEXT (3–5 SURROUNDING LINES):
   Never provide a 1-line SEARCH block like "return false;". Always include 2 to 3 lines of unchanged surrounding code before and after the edit so the match is completely unique and unambiguous in the file.
3. MULTIPLE BLOCKS PER FILE:
   You can chain multiple SEARCH/REPLACE blocks under a single FILE header in the sequential order they appear in the file.
4. TO ADD NEW CODE:
   Include the adjacent existing lines in SEARCH, and in REPLACE include those same adjacent lines plus your new additions.
5. TO DELETE CODE:
   Include the lines you want to remove inside SEARCH along with surrounding anchor lines, and in REPLACE include only the surrounding anchor lines (omitting the deleted lines).

==================================================
CONCRETE EXAMPLES:
==================================================

### Example 1: Updating logic inside a function (Surgical edit with anchors)
========================================
FILE:
    src/utils/calc.ts
========================================
<<<<<<< SEARCH
export function calculateTotal(items: CartItem[]): number {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return subtotal;
}
=======
export function calculateTotal(items: CartItem[]): number {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.15;
  return subtotal + tax;
}
>>>>>>> REPLACE

### Example 2: Adding an import AND a new hook (Multiple patch blocks in one file)
========================================
FILE:
    src/components/Header.tsx
========================================
<<<<<<< SEARCH
import React from 'react';
import { Button } from '@/components/ui/button';
=======
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
>>>>>>> REPLACE
<<<<<<< SEARCH
export function Header() {
  return (
    <header className="site-header">
=======
export function Header() {
  const router = useRouter();

  return (
    <header className="site-header">
>>>>>>> REPLACE

### Example 3: Deleting an obsolete block of code
========================================
FILE:
    src/lib/config.ts
========================================
<<<<<<< SEARCH
export const API_VERSION = 'v1';
export const LEGACY_AUTH_ENDPOINT = 'https://old-auth.example.com';
export const BASE_URL = 'https://api.example.com';
=======
export const API_VERSION = 'v1';
export const BASE_URL = 'https://api.example.com';
>>>>>>> REPLACE

### Example 4: Creating a brand new file (Full untruncated content)
========================================
FILE:
    src/types/auth.ts
========================================
export interface UserSession {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export type AuthState = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

### Example 5: Executable Terminal Commands
\`\`\`bash
npm install lucide-react
npm run dev
\`\`\`

EXECUTE STRICTLY ACCORDING TO THESE DIRECTIVES.`;
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
// ERROR DIAGNOSTIC & FIX ASSISTANT LOGIC
// ==========================================

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clearApplyErrors() {
  state.applyErrors = [];
  if (elements.tabErrorBadge) {
    elements.tabErrorBadge.style.display = 'none';
  }
  if (elements.pasteErrorAlertCard) {
    elements.pasteErrorAlertCard.style.display = 'none';
  }
  if (elements.pasteErrorList) {
    elements.pasteErrorList.innerHTML = '';
  }
}

function handleApplyErrors(errors) {
  if (!errors || errors.length === 0) {
    clearApplyErrors();
    return;
  }

  state.applyErrors = errors;

  if (elements.tabErrorBadge) {
    elements.tabErrorBadge.textContent = errors.length;
    elements.tabErrorBadge.style.display = 'inline-block';
  }

  if (elements.pasteErrorCount) {
    elements.pasteErrorCount.textContent = errors.length;
  }

  if (elements.pasteErrorAlertCard) {
    elements.pasteErrorAlertCard.style.display = 'flex';
  }

  if (elements.pasteErrorList) {
    elements.pasteErrorList.innerHTML = errors.map((err, idx) => `
      <div class="error-alert-item">
        <div class="error-item-top">
          <span class="error-item-path">${escapeHtml(err.path || 'Unknown')}</span>
          <button class="btn-destructive-outline open-fix-btn" data-index="${idx}">
            <i data-lucide="wrench" class="icon-xs"></i>
            <span>Fix in Assistant</span>
          </button>
        </div>
        <div class="error-item-reason">${escapeHtml(err.error || 'Failed to apply changes')}</div>
        ${err.failedBlock ? `<div class="error-item-snippet">Search block not found:\n${escapeHtml(err.failedBlock.slice(0, 200))}${err.failedBlock.length > 200 ? '...' : ''}</div>` : ''}
      </div>
    `).join('');

    elements.pasteErrorList.querySelectorAll('.open-fix-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        const err = state.applyErrors[idx];
        if (err) openErrorFixAssistant(err);
      });
    });
  }

  updateErrorTargetFileSelect();
  if (errors.length > 0) {
    selectErrorTargetFile(errors[0].path);
  }
  refreshIcons();
}

function updateErrorTargetFileSelect() {
  const select = elements.errorTargetFileSelect;
  if (!select) return;

  const files = new Set();
  state.applyErrors.forEach(e => files.add(e.path));
  state.parsedFiles.forEach(f => files.add(f.path));

  select.innerHTML = '';
  if (files.size === 0) {
    select.innerHTML = '<option value="">No files available</option>';
    return;
  }

  files.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    const isErr = state.applyErrors.some(e => e.path === p);
    opt.textContent = (isErr ? '⚠ ' : '') + p;
    select.appendChild(opt);
  });
}

async function selectErrorTargetFile(filePath) {
  if (!filePath) return;
  state.selectedErrorFile = filePath;
  if (elements.errorTargetFileSelect) {
    elements.errorTargetFileSelect.value = filePath;
  }

  const err = state.applyErrors.find(e => e.path === filePath);
  if (err && elements.errorDiagnosticText) {
    let diag = `File: ${err.path}\nError: ${err.error || 'Apply failed'}\n`;
    if (err.failedBlock) {
      diag += `\nFailed Search Block:\n<<<<<<<\n${err.failedBlock}\n>>>>>>>\n`;
    }
    elements.errorDiagnosticText.value = diag;
  }

  if (state.projectDir && elements.errorCurrentFilePreview) {
    try {
      const diskContent = await window.api.readFile(state.projectDir, filePath);
      if (diskContent !== null) {
        elements.errorCurrentFilePreview.textContent = diskContent;
        if (elements.diskFileStatusLabel) {
          const lines = diskContent.split('\n').length;
          elements.diskFileStatusLabel.textContent = `On Disk (${lines} lines, ${diskContent.length} chars)`;
        }
      } else {
        elements.errorCurrentFilePreview.textContent = '// File does not exist on disk yet (New file)';
        if (elements.diskFileStatusLabel) {
          elements.diskFileStatusLabel.textContent = 'File not on disk';
        }
      }
    } catch (e) {
      elements.errorCurrentFilePreview.textContent = '// Error reading file: ' + e.message;
    }
  }
}

function openErrorFixAssistant(errorItem) {
  switchTab('tab-error-fix');
  if (errorItem && errorItem.path) {
    selectErrorTargetFile(errorItem.path);
  }
}

async function copyErrorFixPrompt(targetPath) {
  const filePath = targetPath || state.selectedErrorFile || (state.applyErrors[0] ? state.applyErrors[0].path : null);
  if (!filePath) {
    showToast('No target file selected to generate fix prompt.', 'error');
    return;
  }

  const err = state.applyErrors.find(e => e.path === filePath) || {
    error: elements.errorDiagnosticText ? elements.errorDiagnosticText.value.trim() : 'Error applying patch'
  };

  let diskContent = '';
  if (state.projectDir) {
    try {
      diskContent = await window.api.readFile(state.projectDir, filePath);
    } catch (e) {}
  }

  const prompt = generateErrorFixPrompt(filePath, err, diskContent);
  await window.api.writeClipboard(prompt);
  showToast(`Copied AI fix prompt for ${filePath} to clipboard!`, 'success');
}

function generateErrorFixPrompt(targetPath, errorInfo, fileContent) {
  let prompt = `# CODEBRIDGE ERROR FIX REQUEST\n\n`;
  prompt += `I encountered an error trying to apply changes to my project. Please fix ONLY this error.\n\n`;
  prompt += `========================================\n`;
  prompt += `TARGET FILE: ${targetPath}\n`;
  prompt += `========================================\n`;
  prompt += `ERROR DETAILS:\n`;
  prompt += `${errorInfo?.error || 'Failed to patch file'}\n`;
  if (errorInfo?.failedBlock) {
    prompt += `\nFAILED SEARCH BLOCK (NOT FOUND IN CURRENT FILE):\n<<<<<<<\n${errorInfo.failedBlock}\n>>>>>>>\n`;
  }
  prompt += `\n========================================\n`;
  prompt += `CURRENT FILE CONTENT ON DISK:\n`;
  prompt += `========================================\n`;
  prompt += (fileContent || '// [File is currently new or empty]').trimEnd() + '\n';
  prompt += `\n========================================\n`;
  prompt += `STRICT INSTRUCTIONS FOR AI:\n`;
  prompt += `1. Fix ONLY the targeted issue in "${targetPath}".\n`;
  prompt += `2. Inspect the current file content above to ensure your SEARCH block matches the exact whitespace, indentation, comments, and lines character-for-character.\n`;
  prompt += `3. Always include 2 to 3 unchanged anchor lines before and after the change so the SEARCH block matches uniquely without ambiguity.\n`;
  prompt += `4. Return ONLY a CodeBridge SEARCH/REPLACE block (or full file delimiter block if creating a new file):\n\n`;
  prompt += `========================================\n`;
  prompt += `FILE:\n    ${targetPath}\n`;
  prompt += `========================================\n`;
  prompt += `<<<<<<< SEARCH\n[exact existing lines from current file with 2-3 anchor lines]\n=======\n[replacement lines with the fix]\n>>>>>>> REPLACE\n`;

  return prompt;
}

function applySearchReplace(original, patch) {
  const srRegex = /<{5,}\s*(?:SEARCH|ORIGINAL)?\s*\r?\n([\s\S]*?)\r?\n={5,}\s*\r?\n([\s\S]*?)\r?\n>{5,}\s*(?:REPLACE|UPDATED)?/gi;
  let matches = [];
  let m;
  while ((m = srRegex.exec(patch)) !== null) {
    matches.push({ search: m[1], replace: m[2] });
  }
  if (matches.length === 0) return null;

  let current = original;
  for (const item of matches) {
    if (current.includes(item.search)) {
      current = current.replace(item.search, item.replace);
    } else {
      const normCurrent = current.replace(/\r\n/g, '\n');
      const normSearch = item.search.replace(/\r\n/g, '\n');
      const normReplace = item.replace.replace(/\r\n/g, '\n');
      if (normCurrent.includes(normSearch)) {
        current = normCurrent.replace(normSearch, normReplace);
      } else {
        return null;
      }
    }
  }
  return current;
}

async function applyFixToDiskAction(targetPath, fixText) {
  if (!state.projectDir) {
    showToast('Please select a project directory first!', 'error');
    return false;
  }
  if (!targetPath) {
    showToast('No target file selected.', 'error');
    return false;
  }
  if (!fixText || !fixText.trim()) {
    showToast('Please paste the AI fix / patch first!', 'error');
    return false;
  }

  const parsed = parseCodeInput(fixText);
  let fileToApply = null;

  if (parsed.length > 0) {
    const item = parsed.find(f => f.path === targetPath) || parsed[0];
    fileToApply = {
      path: targetPath || item.path,
      content: item.content,
      isPatch: item.isPatch,
      patchType: item.patchType
    };
  } else {
    const isPatch = fixText.includes('<<<<<<<') || (fixText.includes('@@') && fixText.includes('+++ '));
    fileToApply = {
      path: targetPath,
      content: fixText.trim() + '\n',
      isPatch
    };
  }

  try {
    const result = await window.api.applyFiles(state.projectDir, [fileToApply]);
    if (result.success) {
      showToast(`✓ Fix applied successfully to ${targetPath}!`, 'success');
      if (result.results && result.results[0]) {
        state.appliedHistory.unshift({
          path: targetPath,
          action: result.results[0].action,
          timestamp: new Date().toLocaleTimeString(),
          lines: result.results[0].newLines
        });
        renderAppliedHistory();
      }

      removeApplyError(targetPath);
      await selectErrorTargetFile(targetPath);
      await checkPendingChanges();

      if (elements.assistantStatusBanner) {
        elements.assistantStatusBanner.className = 'assistant-status-banner success';
        elements.assistantStatusText.textContent = `✓ Fix applied to disk: ${targetPath}`;
      }
      return true;
    } else {
      const err = result.errors && result.errors[0] ? result.errors[0].error : 'Failed to apply fix to disk';
      showToast(`Failed: ${err}`, 'error');
      if (elements.assistantStatusBanner) {
        elements.assistantStatusBanner.className = 'assistant-status-banner error';
        elements.assistantStatusText.textContent = `Error applying fix: ${err}`;
      }
      return false;
    }
  } catch (e) {
    showToast(`Error: ${e.message}`, 'error');
    return false;
  }
}

function mergeFixIntoOriginal(targetPath, fixText) {
  if (!fixText || !fixText.trim()) {
    showToast('Please paste the AI fix / patch first!', 'error');
    return false;
  }

  if (!targetPath) {
    const parsed = parseCodeInput(fixText);
    if (parsed.length > 0) {
      targetPath = parsed[0].path;
    } else if (state.selectedErrorFile) {
      targetPath = state.selectedErrorFile;
    } else if (state.applyErrors.length > 0) {
      targetPath = state.applyErrors[0].path;
    } else {
      showToast('Could not determine target file for merge.', 'error');
      return false;
    }
  }

  let rawPaste = elements.pasteInput.value;
  if (!rawPaste || !rawPaste.trim()) {
    elements.pasteInput.value = fixText.trim() + '\n';
    handlePasteInputChange();
    showToast('Set fix into paste input!', 'success');
    return true;
  }

  const isSearchReplace = fixText.includes('<<<<<<<');

  // Case 1: Standard Delimiter Blocks in pasteInput
  const delimHeaderRegex = new RegExp(`(={5,}\\s*\\r?\\n(?:FILE:\\s*)?(?:[ \\t]*\\r?\\n)?${escapeRegex(targetPath)}\\s*\\r?\\n={5,}\\s*\\r?\\n)([\\s\\S]*?)(?=(?:={5,}\\s*\\r?\\n(?:FILE:\\s*)?(?:[ \\t]*\\r?\\n)?[^\\r\\n=]+?\\s*\\r?\\n={5,})|$)`, 'i');
  const delimMatch = rawPaste.match(delimHeaderRegex);

  if (delimMatch) {
    const header = delimMatch[1];
    const existingBody = delimMatch[2];
    let newBody = '';

    if (isSearchReplace) {
      const patched = applySearchReplace(existingBody, fixText);
      if (patched !== null) {
        newBody = patched;
      } else {
        newBody = existingBody;
      }
    } else {
      const parsedFix = parseCodeInput(fixText);
      if (parsedFix.length > 0 && parsedFix[0].content) {
        newBody = parsedFix[0].content;
      } else {
        newBody = fixText.trim() + '\n';
      }
    }

    if (newBody && newBody !== existingBody) {
      elements.pasteInput.value = rawPaste.replace(delimHeaderRegex, `${header}${newBody.trimEnd()}\n\n`);
      handlePasteInputChange();
      showToast(`Merged fix for ${targetPath} into original pasted code!`, 'success');
      return true;
    }
  }

  // Case 2: Markdown headers in pasteInput
  const mdHeaderRegex = new RegExp(`((?:###?|####|\\*\\*)\\s*(?:File:\\s*|FILE:\\s*)?\`?${escapeRegex(targetPath)}\`?\\s*\\r?\\n(?:[^\\n]*\\n)?\`\`\`[a-zA-Z0-9_-]*\\r?\\n)([\\s\\S]*?)(\`\`\`)`, 'i');
  const mdMatch = rawPaste.match(mdHeaderRegex);

  if (mdMatch) {
    const mdHeader = mdMatch[1];
    const existingBody = mdMatch[2];
    const mdFooter = mdMatch[3];
    let newBody = '';

    if (isSearchReplace) {
      const patched = applySearchReplace(existingBody, fixText);
      if (patched !== null) newBody = patched;
    } else {
      const parsedFix = parseCodeInput(fixText);
      if (parsedFix.length > 0 && parsedFix[0].content) {
        newBody = parsedFix[0].content;
      } else {
        newBody = fixText.trim() + '\n';
      }
    }

    if (newBody) {
      elements.pasteInput.value = rawPaste.replace(mdHeaderRegex, `${mdHeader}${newBody.trimEnd()}\n${mdFooter}`);
      handlePasteInputChange();
      showToast(`Merged fix for ${targetPath} into original pasted code!`, 'success');
      return true;
    }
  }

  // Case 3: Raw single file patch
  if (isSearchReplace) {
    const patched = applySearchReplace(rawPaste, fixText);
    if (patched !== null) {
      elements.pasteInput.value = patched;
      handlePasteInputChange();
      showToast(`Applied search/replace patch directly to original pasted code!`, 'success');
      return true;
    }
  }

  // Case 4: Append standard delimiter block
  const cleanFix = autoFormatPastedText(fixText);
  elements.pasteInput.value = (rawPaste.trim() + '\n\n' + cleanFix.trim() + '\n').trimStart();
  handlePasteInputChange();
  showToast(`Appended fix for ${targetPath} to original pasted code!`, 'success');
  return true;
}

async function applyFixAndMergeBothAction(targetPath, fixText) {
  const diskSuccess = await applyFixToDiskAction(targetPath, fixText);
  const mergeSuccess = mergeFixIntoOriginal(targetPath, fixText);

  if (diskSuccess && mergeSuccess) {
    showToast(`✓ Fix applied to disk & merged into original pasted code!`, 'success');
    if (elements.assistantStatusBanner) {
      elements.assistantStatusBanner.className = 'assistant-status-banner success';
      elements.assistantStatusText.textContent = `✓ Fixed on disk & merged into original pasted code!`;
    }
  }
}

function removeApplyError(targetPath) {
  state.applyErrors = state.applyErrors.filter(e => e.path !== targetPath);
  if (state.applyErrors.length === 0) {
    clearApplyErrors();
    if (elements.assistantStatusBanner) {
      elements.assistantStatusBanner.className = 'assistant-status-banner success';
      elements.assistantStatusText.textContent = `✓ All errors resolved! Files up-to-date.`;
    }
  } else {
    handleApplyErrors(state.applyErrors);
  }
}

function loadErrorFromTerminal() {
  const rawLog = state.terminalOutputHistory || '';
  if (!rawLog.trim()) {
    showToast('No terminal output recorded yet. Run a command or trigger an error first.', 'info');
    return;
  }

  const cleanLog = rawLog.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\r/g, '');
  const lines = cleanLog.split('\n').filter(l => l.trim());
  const recentLines = lines.slice(-40).join('\n');

  if (elements.errorDiagnosticText) {
    elements.errorDiagnosticText.value = recentLines;
  }

  const pathMatch = recentLines.match(/(?:[a-zA-Z0-9_\-\.\/]+\/)?([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]{1,6})(?::\d+)?/);
  if (pathMatch) {
    let candidate = pathMatch[1].replace(/^[.\/]+/, '');
    if (candidate.includes('.') && !candidate.endsWith('.js') && !candidate.endsWith('.lock')) {
      selectErrorTargetFile(candidate);
    }
  }

  switchTab('tab-error-fix');
  showToast('Loaded recent terminal output into Error Assistant!', 'info');
}

// ==========================================
// EVENT BINDINGS
// ==========================================
function bindEvents() {
  // Theme Toggle
  elements.btnThemeToggle.addEventListener('click', toggleTheme);

  // Sidebar Collapse Toggle
  if (elements.btnToggleSidebarCollapse) {
    elements.btnToggleSidebarCollapse.addEventListener('click', () => toggleSidebarCollapse());
  }
  if (elements.btnTopSidebarToggle) {
    elements.btnTopSidebarToggle.addEventListener('click', () => toggleSidebarCollapse());
  }

  // Terminal Toggle
  elements.btnToggleTerminal.addEventListener('click', () => toggleTerminalDrawer());
  elements.btnMinimizeTerminal.addEventListener('click', () => toggleTerminalDrawer(false));

  // Global Keyboard Shortcuts: Ctrl+` (terminal), Ctrl+B (sidebar)
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === '`') {
      e.preventDefault();
      toggleTerminalDrawer();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      toggleSidebarCollapse();
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
      if (state.currentCodeTxt && state.currentCodeTxt.content) {
        await window.api.writeClipboard(state.currentCodeTxt.content);
        showToast('Code copied to clipboard!', 'success');
        return;
      }
      let content = await window.api.readFile(state.projectDir, '.codebridge/baseline.txt');
      if (!content) {
        content = await window.api.readFile(state.projectDir, 'code.txt');
      }
      if (content) {
        await window.api.writeClipboard(content);
        showToast('Code copied to clipboard!', 'success');
      } else {
        showToast('No code baseline found. Click "1) Copy code.txt" first.', 'error');
      }
    }
  });

  elements.btnOpenCodeTxtLocation.addEventListener('click', async () => {
    if (state.projectDir) {
      const baselineFile = `${state.projectDir}/.codebridge/baseline.txt`;
      const codeTxtFile = `${state.projectDir}/code.txt`;
      if (await window.api.readFile(state.projectDir, '.codebridge/baseline.txt')) {
        await window.api.showItem(baselineFile);
      } else if (await window.api.readFile(state.projectDir, 'code.txt')) {
        await window.api.showItem(codeTxtFile);
      } else {
        await window.api.showItem(`${state.projectDir}/.codebridge`);
      }
    }
  });

  // Tab 3: Changes & Code-Editor Tree
  elements.btnRefreshChanges.addEventListener('click', () => exportChanges(false));

  if (elements.btnRevertAllChanges) {
    elements.btnRevertAllChanges.addEventListener('click', revertAllChanges);
  }

  if (elements.btnRevertSelectedFile) {
    elements.btnRevertSelectedFile.addEventListener('click', () => {
      if (state.selectedChangeFile) {
        revertSingleFile(state.selectedChangeFile.path);
      }
    });
  }

  if (elements.btnCollapseAllChangesTree) {
    elements.btnCollapseAllChangesTree.addEventListener('click', () => {
      document.querySelectorAll('#changesTreeContainer .tree-folder-node').forEach(f => f.classList.add('collapsed'));
    });
  }

  if (elements.btnExpandAllChangesTree) {
    elements.btnExpandAllChangesTree.addEventListener('click', () => {
      document.querySelectorAll('#changesTreeContainer .tree-folder-node').forEach(f => f.classList.remove('collapsed'));
    });
  }

  if (elements.txtFilterChangesTree) {
    elements.txtFilterChangesTree.addEventListener('input', (e) => {
      state.changesTreeFilter = e.target.value.trim();
      renderChangesTree();
    });
  }

  if (elements.diffViewModeBtns) {
    elements.diffViewModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.diffViewModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.changeDiffViewMode = btn.getAttribute('data-mode');
        if (state.selectedChangeFile) {
          renderDiffContent(state.selectedChangeFile);
        }
      });
    });
  }

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

  // Quick Error Alert Card Listeners
  if (elements.btnCopyQuickErrorPrompt) {
    elements.btnCopyQuickErrorPrompt.addEventListener('click', () => {
      copyErrorFixPrompt(state.applyErrors[0]?.path);
    });
  }

  if (elements.btnOpenFullErrorTab) {
    elements.btnOpenFullErrorTab.addEventListener('click', () => {
      openErrorFixAssistant(state.applyErrors[0]);
    });
  }

  if (elements.btnDismissQuickError) {
    elements.btnDismissQuickError.addEventListener('click', clearApplyErrors);
  }

  if (elements.btnQuickApplyFixDisk) {
    elements.btnQuickApplyFixDisk.addEventListener('click', () => {
      const target = state.applyErrors[0]?.path || state.selectedErrorFile;
      applyFixToDiskAction(target, elements.quickFixInput.value);
    });
  }

  if (elements.btnQuickMergeFixOriginal) {
    elements.btnQuickMergeFixOriginal.addEventListener('click', () => {
      const target = state.applyErrors[0]?.path || state.selectedErrorFile;
      mergeFixIntoOriginal(target, elements.quickFixInput.value);
    });
  }

  if (elements.btnQuickApplyAndMerge) {
    elements.btnQuickApplyAndMerge.addEventListener('click', () => {
      const target = state.applyErrors[0]?.path || state.selectedErrorFile;
      applyFixAndMergeBothAction(target, elements.quickFixInput.value);
    });
  }

  // Dedicated Error & Fix Tab Listeners
  if (elements.btnCopyFullErrorPrompt) {
    elements.btnCopyFullErrorPrompt.addEventListener('click', () => {
      copyErrorFixPrompt(state.selectedErrorFile);
    });
  }

  if (elements.btnLoadFromTerminal) {
    elements.btnLoadFromTerminal.addEventListener('click', loadErrorFromTerminal);
  }

  if (elements.btnTermSendError) {
    elements.btnTermSendError.addEventListener('click', loadErrorFromTerminal);
  }

  if (elements.btnClearErrorFixer) {
    elements.btnClearErrorFixer.addEventListener('click', () => {
      elements.errorDiagnosticText.value = '';
      elements.fixAssistantInput.value = '';
      if (elements.assistantStatusBanner) {
        elements.assistantStatusBanner.className = 'assistant-status-banner neutral';
        elements.assistantStatusText.textContent = 'Cleared inputs. Ready for new error or fix.';
      }
    });
  }

  if (elements.errorTargetFileSelect) {
    elements.errorTargetFileSelect.addEventListener('change', (e) => {
      selectErrorTargetFile(e.target.value);
    });
  }

  if (elements.btnFormatAssistantFix) {
    elements.btnFormatAssistantFix.addEventListener('click', () => {
      elements.fixAssistantInput.value = autoFormatPastedText(elements.fixAssistantInput.value);
      showToast('Auto-formatted fix output!', 'info');
    });
  }

  if (elements.btnAssistantApplyDisk) {
    elements.btnAssistantApplyDisk.addEventListener('click', () => {
      applyFixToDiskAction(state.selectedErrorFile, elements.fixAssistantInput.value);
    });
  }

  if (elements.btnAssistantMergeOriginal) {
    elements.btnAssistantMergeOriginal.addEventListener('click', () => {
      mergeFixIntoOriginal(state.selectedErrorFile, elements.fixAssistantInput.value);
    });
  }

  if (elements.btnAssistantApplyBoth) {
    elements.btnAssistantApplyBoth.addEventListener('click', () => {
      applyFixAndMergeBothAction(state.selectedErrorFile, elements.fixAssistantInput.value);
    });
  }
}

// ==========================================
// INITIALIZATION
// ==========================================
async function init() {
  bindEvents();
  initTerminal();
  setupTerminalResizer();

  try {
    const config = await window.api.getConfig();
    if (config) {
      state.config = { ...state.config, ...config };
      if (config.theme) {
        applyTheme(config.theme);
      }
      if (config.sidebarCollapsed) {
        toggleSidebarCollapse(true);
      }
      if (config.ignoreMd !== undefined && elements.chkIgnoreMd) elements.chkIgnoreMd.checked = config.ignoreMd;
      if (config.ignoreShadcn !== undefined && elements.chkIgnoreShadcn) elements.chkIgnoreShadcn.checked = config.ignoreShadcn;
      if (config.ignoreNodeModules !== undefined && elements.chkIgnoreNodeModules) elements.chkIgnoreNodeModules.checked = config.ignoreNodeModules;
      if (config.customIgnore !== undefined && elements.txtCustomIgnore) elements.txtCustomIgnore.value = config.customIgnore;

      if (config.lastProjectDir) {
        await switchProject(config.lastProjectDir);
      }
    }
  } catch (err) {
    console.error('Config load error:', err);
  }

  updatePromptPreview();
  refreshIcons();
}

// Start app
window.addEventListener('DOMContentLoaded', init);
