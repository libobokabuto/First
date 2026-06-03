import { useRef, useState } from 'react';

interface TabBarProps {
  tabs: TabData[];
  activeTabId: string;
  onTabSwitch: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabReorder: (fromIndex: number, toIndex: number) => void;
  onNewTab: () => void;
}

export default function TabBar({
  tabs,
  activeTabId,
  onTabSwitch,
  onTabClose,
  onTabReorder,
  onNewTab,
}: TabBarProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverIndex.current = index;
  };

  const handleDrop = (index: number) => {
    if (dragIndex !== null && dragIndex !== index) {
      onTabReorder(dragIndex, index);
    }
    setDragIndex(null);
    dragOverIndex.current = null;
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    dragOverIndex.current = null;
  };

  return (
    <div className="tabbar">
      <div className="tabbar-tabs">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`tabbar-tab ${tab.id === activeTabId ? 'active' : ''} ${dragIndex === index ? 'dragging' : ''}`}
            onClick={() => onTabSwitch(tab.id)}
            onMouseDown={(e) => {
              // 中键关闭
              if (e.button === 1) {
                e.preventDefault();
                onTabClose(tab.id);
              }
            }}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
          >
            <span className="tabbar-tab-title">
              {tab.isModified && <span className="tabbar-modified-dot">●</span>}
              {tab.title}
            </span>
            <button
              className="tabbar-tab-close"
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
      <button className="tabbar-new" onClick={onNewTab} title="新建标签 (Ctrl+N)">
        +
      </button>
    </div>
  );
}
