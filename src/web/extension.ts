// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {  ReminderTreeDataProvider } from '../utils';
import { Reminder } from '../types';
import * as path from 'path';

let reminders:Reminder[] = [];

export function activate(context: vscode.ExtensionContext) {

    const treeDataProvider = new ReminderTreeDataProvider();
    vscode.window.registerTreeDataProvider('codeNudger.reminders', treeDataProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('codeNudger.scanReminders', async () => {
            await scanWorkspaceForReminders();
            treeDataProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(doc => {
            scanForRemindersInDocument(doc, true);
            treeDataProvider.refresh();
        })
    );
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(doc => {
            scanForRemindersInDocument(doc, true);
            treeDataProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { scheme: 'file' },
            {
                provideCompletionItems(document, position) {
                    const linePrefix = document.lineAt(position).text.substr(0, position.character);
                    if (!linePrefix.trim().startsWith('@rem')) {
                        return undefined;
                    }
                    const snippetCompletion = new vscode.CompletionItem(
                        '@reminder snippet',
                        vscode.CompletionItemKind.Snippet
                    );
                    snippetCompletion.insertText = new vscode.SnippetString(
                        '@reminder ${1:YYYY-MM-DD} [${2:HH:MM}]: ${3:Reminder message}'
                    );
                    snippetCompletion.detail = 'Insert a reminder annotation';
                    snippetCompletion.documentation = new vscode.MarkdownString(
                        'Annotation format: `// @reminder YYYY-MM-DD [HH:MM]: Reminder message`'
                    );
                    return [snippetCompletion];
                }
            },
            '@' 
        )
    );
}


  /**
   * Scan the entire workspace for reminder annotations.
   * Only files matching the include pattern (source file extensions) are scanned.
   * Common folders (node_modules, venv, .git, __pycache__, dist, out, build, target, .idea)
   * are excluded. Files containing the marker '// @excludeScan' are also skipped.
   */
  async function scanWorkspaceForReminders() {
    reminders = []; 
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showInformationMessage('CodeNudger: No workspace is open.');
        return;
    }
    const includePattern = '**/*.{js,ts,py,java,cs,cpp,go,rb,php}';
    const excludePattern = '**/{node_modules,venv,.git,__pycache__,dist,out,build,target,.idea}/**';
    const files = await vscode.workspace.findFiles(includePattern, excludePattern);
    for (const file of files) {
        try {
            const doc = await vscode.workspace.openTextDocument(file);
        
            if (doc.getText().includes('// @excludeScan')) {
                continue;
            }
            scanForRemindersInDocument(doc, false);
        } catch (err) {
            console.error(`Error scanning file ${file.fsPath}: ${err}`);
        }
    }
    vscode.window.showInformationMessage('CodeNudger: Workspace scan complete.');
}
  
  /**
   * Scan a single document for reminder annotations.
   * @param document The text document to scan.
   * @param notify Whether to show an info message if no reminders are found.
   * @returns true if at least one reminder was found.
   */
  function scanForRemindersInDocument(document: vscode.TextDocument, notify: boolean): boolean {
    // Annotation regex:
    // // @reminder YYYY-MM-DD [HH:MM]: Reminder message.
    const reminderRegex = /\/\/\s*@reminder\s+(\d{4}-\d{2}-\d{2})(?:\s*\[([\d:]+)\])?:\s*(.+)/;
    const today = new Date();
    let found = false;
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i).text;
        const match = line.match(reminderRegex);
        if (match) {
            found = true;
            const dateStr = match[1];
            const timeStr = match[2] || '09:00'; // Default time if not specified.
            const message = match[3].trim();
            const scheduled = new Date(`${dateStr}T${timeStr}:00`);
            // Add to global reminders array.
            reminders.push({
                file: document.uri.fsPath,
                line: i + 1,
                message: message,
                scheduled: scheduled
            });
            // Notify immediately if the reminder is due.
            if (scheduled <= today) {
                vscode.window.showWarningMessage(
                    `Reminder due in ${path.basename(document.uri.fsPath)} (Line ${i + 1}): ${message}`
                );
            }
        }
    }
    if (!found && notify) {
        vscode.window.showInformationMessage(`CodeNudger: No reminders found in ${path.basename(document.uri.fsPath)}.`);
    }
    return found;
}


export {reminders};
export function deactivate() {}