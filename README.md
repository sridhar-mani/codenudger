# CodeNudger

**CodeNudger** is a VS Code extension that scans your source code for reminder annotations and alerts you when it’s time to update your code. It works seamlessly in both desktop VS Code and web-based environments (vscode.dev, GitHub Codespaces).

## Features

- **Workspace Scanning:**  
  Automatically scans all source files in your active workspace for reminder annotations while excluding common folders such as:
  - `node_modules`
  - `venv`
  - `.git`
  - `__pycache__`
  - `dist`, `out`, `build`, `target`
  - `.idea`

- **Annotation Parsing:**  
  Detects annotations written in the following format:
  ```js
  // @reminder YYYY-MM-DD [HH:MM]: Reminder message.
