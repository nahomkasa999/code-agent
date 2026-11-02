# CodeBridge AI — Desktop Local File Sync, Patching & Terminal

**CodeBridge AI** is an Electron desktop application designed to bridge AI coding assistants (Claude, ChatGPT, Gemini, DeepSeek, Cursor) and your local filesystem, featuring:
- Full file alterations & **intelligent code patching** (Search & Replace + Unified Diffs)
- **Automatic command detection & 1-click execution** in the embedded bash terminal
- **Left sidebar layout** with tripled spacing (3×) and 16px base font
- Modern **OKLCH theme** & **Lucide icon library**

---

## 🚀 Key Features

### 1. Intelligent Patching & Full File Alteration
- **Search & Replace Blocks**: Supports exact search-and-replace patches:
  ```
  ========================================
  FILE:
      src/app/page.tsx
  ========================================
  <<<<<<< SEARCH
  <h1>Old Title</h1>
  =======
  <h1>New Patched Title</h1>
  >>>>>>> REPLACE
  ```
- **Unified & Git Diffs**: Directly parses and applies standard diff patches (`--- a/file` / `+++ b/file`).
- **Full File Rewrites**: Automatically creates missing folders (`mkdir -p`) and writes full file content if you paste entire files.
- **Visual Badges**: Preview cards clearly indicate `[PATCH (REPLACE)]`, `[PATCH (DIFF)]`, `[NEW FILE]`, or `[OVERWRITE]`.

---

### 2. Terminal Commands Detection & Run
- When an AI provides shell commands (e.g., `npm install`, `npx shadcn add ...`, `git commit`):
  - In a bash code block:
    ````bash
    npm install lucide-react
    npm run dev
    ````
  - Or with a delimiter:
    ```
    COMMAND: npm install @phosphor-icons/react
    ```
- **CodeBridge automatically extracts the commands** into a dedicated **"Detected Commands"** card.
- Click **"Run in Terminal"** to send them directly into the embedded interactive terminal, or click **"Apply All Files to Disk"** to alter code and execute commands in one go!

---

### 3. Embedded Interactive Terminal
- **Full-featured Bash shell** powered by `node-pty` and `@xterm/xterm`.
- Interactive CLI tools, ANSI colors, tab auto-completion, and arrow keys.
- **Resizable Bottom Drawer** + Fullscreen Terminal tab.
- Quick buttons: `npm run dev`, `git status`, `clear`, `restart`.
- Keyboard shortcut: <kbd>Ctrl</kbd> + <kbd>`</kbd> toggles terminal anytime.

---

### 4. The 4 Workflow Actions
1. **Create `code.txt`**: Aggregates all project code into `code.txt` (excluding `.md` files, Shadcn UI primitives, and `node_modules`) and saves a baseline snapshot.
2. **Export Changes**: Compares codebase against the baseline snapshot, exports only modified/new files to `changes.txt`, and copies directly to clipboard.
3. **Tree View**: Generates a clean ASCII tree (compacting Shadcn UI primitives) and copies it to clipboard.
4. **Copy AI Prompt**: Copies a system prompt instructing any AI how to format full files, patches, and commands for CodeBridge.

---

## How to Run

```bash
cd /home/nahomkasa/Documents/coding/code-bridge
npm start
```
