import React from 'react';
import type { FileTab } from '../../shared/types';

interface TabBarProps {
  tabs: FileTab[];
  activeTabId: string | null;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabId, onTabClick, onTabClose }) => {
  if (tabs.length === 0) return <div className="tab-bar" />;

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab-item ${tab.id === activeTabId ? 'active' : ''} ${tab.dirty ? 'dirty' : ''}`}
          onClick={() => onTabClick(tab.id)}
          title={tab.path}
        >
          <span className="tab-name">{tab.name}</span>
          <button
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
            title="关闭"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default TabBar;
