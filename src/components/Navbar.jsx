import React from 'react';

export default function Navbar({ isOnline, theme, onToggleTheme }) {
  return (
    <header class="navbar">
      <div class="brand">
        <div class="brand-icon-wrapper">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="22"></line>
            <line x1="8" y1="22" x2="16" y2="22"></line>
          </svg>
        </div>
        <span class="brand-name">WalkieTalkie</span>
        <span class="badge-tag">Open Source</span>
      </div>

      <div class="nav-actions">
        <button class="theme-toggle-btn" onClick={onToggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>

        <div class="status-indicator">
          <span class={`dot ${isOnline ? 'online' : 'offline'}`}></span>
          <span>{isOnline ? 'Live' : 'Offline'}</span>
        </div>
      </div>
    </header>
  );
}
