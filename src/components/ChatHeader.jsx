import React, { useState } from 'react';

export default function ChatHeader({ roomTitle, roomCode, onLeaveRoom }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div class="chat-header">
      <div class="room-info">
        <h2>{roomTitle}</h2>
        <div class="room-code-badge">
          <span class="label">CODE:</span>
          <code>{roomCode}</code>
          <button type="button" class="btn-copy" onClick={handleCopyCode} title="Copy room code">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" onClick={onLeaveRoom}>Leave Room</button>
    </div>
  );
}
