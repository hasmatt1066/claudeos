import React, { useState } from 'react';

export interface OperationData {
  id: string;
  type: 'read' | 'write' | 'edit' | 'bash' | 'search' | 'glob' | 'tool';
  description: string;
  details?: string;
  timestamp: Date;
  status: 'pending' | 'complete' | 'error';
}

interface OperationProps {
  operation: OperationData;
}

const typeIcons: Record<OperationData['type'], string> = {
  read: '\u{1F4D6}',    // open book
  write: '\u{1F4DD}',   // memo
  edit: '\u{270F}\u{FE0F}',     // pencil
  bash: '\u{26A1}',     // lightning
  search: '\u{1F50D}',  // magnifying glass
  glob: '\u{1F4C2}',    // open folder
  tool: '\u{1F527}'     // wrench
};

const typeLabels: Record<OperationData['type'], string> = {
  read: 'Read',
  write: 'Create',
  edit: 'Edit',
  bash: 'Command',
  search: 'Search',
  glob: 'Find',
  tool: 'Tool'
};

function Operation({ operation }: OperationProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const icon = typeIcons[operation.type] || '\u{2699}\u{FE0F}';
  const label = typeLabels[operation.type] || 'Operation';

  const statusClass = operation.status === 'error' ? 'operation-error' :
                      operation.status === 'pending' ? 'operation-pending' : '';

  return (
    <div
      className={`operation ${statusClass}`}
      onClick={() => operation.details && setExpanded(!expanded)}
    >
      <div className="operation-header">
        <span className="operation-icon">{icon}</span>
        <span className="operation-label">{label}</span>
        <span className="operation-time">
          {operation.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
      <div className="operation-description">{operation.description}</div>
      {expanded && operation.details && (
        <div className="operation-details">
          <pre>{operation.details}</pre>
        </div>
      )}
      {operation.status === 'pending' && (
        <div className="operation-spinner"></div>
      )}
    </div>
  );
}

export default Operation;
