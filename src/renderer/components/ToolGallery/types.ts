export interface Tool {
  id: string;
  name: string;
  description: string;
  type: 'background' | 'window' | 'tray' | 'widget';
  status: 'stopped' | 'running' | 'error';
  createdAt: Date;
  icon?: string;
}

export const mockTools: Tool[] = [
  {
    id: '1',
    name: 'File Sorter',
    description: 'Watches your Downloads folder and automatically sorts files by client name into organized subfolders.',
    type: 'background',
    status: 'running',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    name: 'Budget Tracker',
    description: 'Monitors your bank CSV exports and categorizes expenses, generates weekly spending reports.',
    type: 'window',
    status: 'stopped',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    name: 'Weekly Review',
    description: 'Every Sunday at 6pm, compiles your accomplishments from git commits and task managers into a summary.',
    type: 'background',
    status: 'stopped',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    id: '4',
    name: 'Screenshot OCR',
    description: 'Watches for new screenshots and extracts text using OCR, saving to a searchable index.',
    type: 'tray',
    status: 'error',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  }
];
