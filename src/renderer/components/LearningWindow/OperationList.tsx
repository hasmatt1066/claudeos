import React, { useEffect, useRef } from 'react';
import Operation, { OperationData } from './Operation';

interface OperationListProps {
  operations: OperationData[];
}

function OperationList({ operations }: OperationListProps): React.JSX.Element {
  const listEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [operations]);

  if (operations.length === 0) {
    return (
      <div className="operation-list operation-list-empty">
        <div className="empty-state">
          No operations yet. Claude's file operations will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="operation-list">
      {operations.map((op) => (
        <Operation key={op.id} operation={op} />
      ))}
      <div ref={listEndRef} />
    </div>
  );
}

export default OperationList;
