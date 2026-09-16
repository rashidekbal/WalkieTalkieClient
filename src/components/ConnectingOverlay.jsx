import React from 'react';

export default function ConnectingOverlay({ isConnecting, isError, onRetry }) {
  if (!isConnecting && !isError) return null;

  return (
    <div class="connecting-overlay">
      <div class="connecting-card">
        <div class="brand-logo-anim">
          <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="22"></line>
            <line x1="8" y1="22" x2="16" y2="22"></line>
          </svg>
        </div>

        {isError ? (
          <div class="connecting-body">
            <h3>Server Connection Failed</h3>
            <p class="subtitle">Unable to reach the backend service at /api/health.</p>
            <button class="btn btn-primary btn-sm" onClick={onRetry} style={{ marginTop: '12px' }}>
              Retry Connection
            </button>
          </div>
        ) : (
          <div class="connecting-body">
            <h3>Connecting to Server</h3>
            <p class="subtitle">Initializing secure connection to WalkieTalkie...</p>
            <div class="spinner-bar">
              <div class="spinner-progress"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
