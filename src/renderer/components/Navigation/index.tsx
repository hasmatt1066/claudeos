import React from 'react';
import './Navigation.css';

export type View = 'chat' | 'gallery';

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

interface NavItem {
  id: View;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'chat', icon: '\u{1F4AC}', label: 'Chat' },
  { id: 'gallery', icon: '\u{1F9F0}', label: 'Tools' }
];

function Navigation({ currentView, onViewChange }: NavigationProps): React.JSX.Element {
  return (
    <nav className="navigation">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${currentView === item.id ? 'nav-item-active' : ''}`}
          onClick={() => onViewChange(item.id)}
          title={item.label}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default Navigation;
