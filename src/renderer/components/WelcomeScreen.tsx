import React from 'react';

interface WelcomeScreenProps {
  onOpenFile: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = () => {
  return (
    <div className="welcome-screen">
      <h1>First</h1>
      <p>全能文档阅读编辑器</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          ⌘O / Ctrl+O &nbsp;打开文件
        </p>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          ⌘S / Ctrl+S &nbsp;保存文件
        </p>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          ⌘⇧D / Ctrl+Shift+D &nbsp;切换暗色模式
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
