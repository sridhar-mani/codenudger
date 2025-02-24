import * as vscode from 'vscode';
import * as path from 'path';
import { Reminder } from './types';
import { reminders } from './web/extension';



class ReminderItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly reminder: Reminder
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.tooltip = `${label}\nScheduled: ${reminder.scheduled.toLocaleString()}`;
        this.description = reminder.scheduled.toLocaleTimeString();
        this.iconPath = new vscode.ThemeIcon('clock');
    }
}

class ReminderTreeDataProvider implements vscode.TreeDataProvider<ReminderItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ReminderItem | undefined | void> =
        new vscode.EventEmitter<ReminderItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<ReminderItem | undefined | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ReminderItem): vscode.TreeItem {
        return element;
    }

    getChildren(): Thenable<ReminderItem[]> {
        const today = new Date();
        const todaysReminders = reminders.filter(r =>
            r.scheduled.getFullYear() === today.getFullYear() &&
            r.scheduled.getMonth() === today.getMonth() &&
            r.scheduled.getDate() === today.getDate()
        );

        const items = todaysReminders.map(r => {
            const label = `${path.basename(r.file)} (Line ${r.line}) - ${r.message}`;
            return new ReminderItem(label, r);
        });
        return Promise.resolve(items);
    }
}


export {ReminderTreeDataProvider};