import React, { useState } from 'react';

export default function LandingCard({ onJoinRoom, onCreateRoom, alertMessage }) {
  const [activeTab, setActiveTab] = useState('join');
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createName, setCreateName] = useState('');

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    onJoinRoom(joinCode.trim(), joinName.trim() || 'Guest');
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    onCreateRoom(createTitle.trim() || 'WalkieTalkie Room', createName.trim() || 'Guest');
  };

  return (
    <main class="card landing-card">
      <div class="card-header">
        <h1>Private Real-Time Messaging</h1>
        <p class="subtitle">Join with an 8-character room code or generate a new room instantly.</p>
      </div>

      <div class="tab-switcher">
        <button
          class={`tab-btn ${activeTab === 'join' ? 'active' : ''}`}
          onClick={() => setActiveTab('join')}
        >
          Join Room
        </button>
        <button
          class={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Room
        </button>
      </div>

      {alertMessage && <div class="alert-banner">{alertMessage}</div>}

      {activeTab === 'join' ? (
        <form class="form-section" onSubmit={handleJoinSubmit}>
          <div class="form-group">
            <label htmlFor="joinCodeInput">8-Character Room Code</label>
            <input
              type="text"
              id="joinCodeInput"
              class="code-input"
              placeholder="e.g. k9X2mP7q"
              maxLength={8}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              required
              autoComplete="off"
              spellCheck="false"
            />
            <span class="field-hint">Enter the exact 8-character alphanumeric room key</span>
          </div>

          <div class="form-group">
            <label htmlFor="joinNameInput">Your Display Name (Optional)</label>
            <input
              type="text"
              id="joinNameInput"
              placeholder="Guest"
              maxLength={24}
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block">
            <span>Join Chat Room</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </form>
      ) : (
        <form class="form-section" onSubmit={handleCreateSubmit}>
          <div class="form-group">
            <label htmlFor="createTitleInput">Room Name (Optional)</label>
            <input
              type="text"
              id="createTitleInput"
              placeholder="WalkieTalkie Room"
              maxLength={32}
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
            />
          </div>

          <div class="form-group">
            <label htmlFor="createNameInput">Your Display Name (Optional)</label>
            <input
              type="text"
              id="createNameInput"
              placeholder="Guest"
              maxLength={24}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block">
            <span>Generate Room & Join</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </form>
      )}
    </main>
  );
}
