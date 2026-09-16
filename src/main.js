import { io } from 'socket.io-client';

// State
let socket = null;
let currentRoomCode = null;
let currentSenderName = 'Guest';
let selectedFile = null;
let typingTimeout = null;

// DOM Elements
const landingCard = document.getElementById('landingCard');
const chatCard = document.getElementById('chatCard');
const tabJoin = document.getElementById('tabJoin');
const tabCreate = document.getElementById('tabCreate');
const joinForm = document.getElementById('joinForm');
const createForm = document.getElementById('createForm');
const alertBanner = document.getElementById('alertBanner');

const roomTitleDisplay = document.getElementById('roomTitleDisplay');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const chatLog = document.getElementById('chatLog');
const messageInput = document.getElementById('messageInput');
const fileInput = document.getElementById('fileInput');
const uploadPreviewBar = document.getElementById('uploadPreviewBar');
const previewFileName = document.getElementById('previewFileName');
const previewFileSize = document.getElementById('previewFileSize');
const typingIndicator = document.getElementById('typingIndicator');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');

const btnCopyCode = document.getElementById('btnCopyCode');
const btnLeaveRoom = document.getElementById('btnLeaveRoom');
const btnAttach = document.getElementById('btnAttach');
const btnClearAttachment = document.getElementById('btnClearAttachment');
const chatForm = document.getElementById('chatForm');

const imageModal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImg');
const modalDownloadLink = document.getElementById('modalDownloadLink');
const modalCloseBtn = document.getElementById('modalCloseBtn');

// Event Listeners Initialization
function initEventListeners() {
  tabJoin.addEventListener('click', () => switchTab('join'));
  tabCreate.addEventListener('click', () => switchTab('create'));

  joinForm.addEventListener('submit', handleJoinRoom);
  createForm.addEventListener('submit', handleCreateRoom);
  chatForm.addEventListener('submit', handleSendMessage);

  btnCopyCode.addEventListener('click', copyRoomCode);
  btnLeaveRoom.addEventListener('click', leaveRoom);
  btnAttach.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelected);
  btnClearAttachment.addEventListener('click', clearSelectedFile);

  messageInput.addEventListener('input', handleTyping);

  modalCloseBtn.addEventListener('click', closeImageModal);
  imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) closeImageModal();
  });
}

// Tab Switcher
function switchTab(tab) {
  hideAlert();
  if (tab === 'join') {
    tabJoin.classList.add('active');
    tabCreate.classList.remove('active');
    joinForm.classList.remove('hidden');
    joinForm.classList.add('active');
    createForm.classList.add('hidden');
    createForm.classList.remove('active');
  } else {
    tabCreate.classList.add('active');
    tabJoin.classList.remove('active');
    createForm.classList.remove('hidden');
    createForm.classList.add('active');
    joinForm.classList.add('hidden');
    joinForm.classList.remove('active');
  }
}

function showAlert(msg) {
  alertBanner.textContent = msg;
  alertBanner.classList.remove('hidden');
}

function hideAlert() {
  alertBanner.classList.add('hidden');
  alertBanner.textContent = '';
}

// Join Room Handler
async function handleJoinRoom(e) {
  e.preventDefault();
  hideAlert();
  const code = document.getElementById('joinCodeInput').value.trim();
  const name = document.getElementById('joinNameInput').value.trim() || 'Guest';

  if (!code || code.length !== 8) {
    showAlert('Please enter a valid 8-character room code.');
    return;
  }

  try {
    const res = await fetch(`/api/rooms/${code}`);
    const data = await res.json();

    if (!data.success) {
      showAlert(data.message || 'Room not found.');
      return;
    }

    enterChatWorkspace(data.data.code, data.data.title, name);
  } catch (err) {
    showAlert('Failed to connect to server.');
  }
}

// Create Room Handler
async function handleCreateRoom(e) {
  e.preventDefault();
  hideAlert();
  const title = document.getElementById('createTitleInput').value.trim() || 'WalkieTalkie Room';
  const name = document.getElementById('createNameInput').value.trim() || 'Guest';

  try {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    const data = await res.json();

    if (!data.success) {
      showAlert(data.message || 'Failed to create room.');
      return;
    }

    enterChatWorkspace(data.data.code, data.data.title, name);
  } catch (err) {
    showAlert('Failed to create room.');
  }
}

// Enter Workspace
function enterChatWorkspace(code, title, senderName) {
  currentRoomCode = code;
  currentSenderName = senderName;

  roomCodeDisplay.textContent = code;
  roomTitleDisplay.textContent = title;

  landingCard.classList.add('hidden');
  chatCard.classList.remove('hidden');

  initSocket();
}

// Initialize Socket.io Connection
function initSocket() {
  if (socket) socket.disconnect();

  // Connects to origin or dev server proxy
  socket = io();

  socket.on('connect', () => {
    updateStatus(true);
    socket.emit('join_room', {
      roomCode: currentRoomCode,
      senderName: currentSenderName
    });
  });

  socket.on('disconnect', () => {
    updateStatus(false);
  });

  socket.on('room_history', ({ history }) => {
    chatLog.innerHTML = '';
    appendSystemMessage(`Joined room ${currentRoomCode}.`);
    if (history && history.length > 0) {
      history.forEach(msg => appendMessage(msg));
    }
  });

  socket.on('new_message', (message) => {
    appendMessage(message);
  });

  socket.on('user_joined', ({ senderName }) => {
    appendSystemMessage(`${senderName} joined the room.`);
  });

  socket.on('user_left', ({ senderName }) => {
    appendSystemMessage(`${senderName} left the room.`);
  });

  socket.on('user_typing', ({ senderName, isTyping }) => {
    if (isTyping && senderName !== currentSenderName) {
      typingIndicator.textContent = `${senderName} is typing...`;
      typingIndicator.classList.remove('hidden');
    } else {
      typingIndicator.classList.add('hidden');
    }
  });

  socket.on('error_message', ({ message }) => {
    appendSystemMessage(`Error: ${message}`);
  });
}

function updateStatus(isOnline) {
  const dot = statusIndicator.querySelector('.dot');
  if (isOnline) {
    dot.className = 'dot online';
    statusText.textContent = 'Live';
  } else {
    dot.className = 'dot offline';
    statusText.textContent = 'Disconnected';
  }
}

// Messaging Logic
async function handleSendMessage(e) {
  e.preventDefault();
  const text = messageInput.value.trim();

  if (!text && !selectedFile) return;

  if (selectedFile) {
    await uploadAndSendMedia(text);
  } else {
    socket.emit('send_message', {
      roomCode: currentRoomCode,
      senderName: currentSenderName,
      type: 'text',
      content: text
    });
  }

  messageInput.value = '';
  clearSelectedFile();
  socket.emit('typing', { roomCode: currentRoomCode, senderName: currentSenderName, isTyping: false });
}

// Media Upload
async function uploadAndSendMedia(caption) {
  const formData = new FormData();
  formData.append('file', selectedFile);

  try {
    appendSystemMessage('Uploading media file to Cloudinary...');

    const res = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (!data.success) {
      appendSystemMessage(`Media upload failed: ${data.message}`);
      return;
    }

    const { mediaUrl, mediaPublicId, fileMeta } = data.data;
    const isImage = fileMeta.mimeType && fileMeta.mimeType.startsWith('image/');

    socket.emit('send_message', {
      roomCode: currentRoomCode,
      senderName: currentSenderName,
      type: isImage ? 'image' : 'file',
      content: caption || '',
      mediaUrl,
      mediaPublicId,
      fileMeta
    });
  } catch (err) {
    appendSystemMessage('Error uploading file. Please try again.');
  }
}

// Message Rendering
function appendMessage(msg) {
  const isSelf = msg.sender_name === currentSenderName || msg.senderName === currentSenderName;
  const msgDiv = document.createElement('div');
  msgDiv.className = `msg-item ${isSelf ? 'self' : 'other'}`;

  const senderSpan = document.createElement('span');
  senderSpan.className = 'msg-sender';
  senderSpan.textContent = msg.sender_name || msg.senderName || 'Guest';

  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'msg-bubble';

  if (msg.type === 'image' && (msg.media_url || msg.mediaUrl)) {
    const imgUrl = msg.media_url || msg.mediaUrl;
    const img = document.createElement('img');
    img.src = imgUrl;
    img.className = 'msg-image';
    img.onclick = () => openImageModal(imgUrl);
    bubbleDiv.appendChild(img);

    if (msg.content) {
      const captionP = document.createElement('p');
      captionP.style.marginTop = '6px';
      captionP.textContent = msg.content;
      bubbleDiv.appendChild(captionP);
    }
  } else if (msg.type === 'file' && (msg.media_url || msg.mediaUrl)) {
    const fileUrl = msg.media_url || msg.mediaUrl;
    const fileName = (msg.fileMeta && msg.fileMeta.fileName) || msg.file_name || 'Download Attachment';
    const fileSize = (msg.fileMeta && msg.fileMeta.fileSize) || msg.file_size || 0;
    const sizeFormatted = fileSize ? `${(fileSize / 1024).toFixed(1)} KB` : '';

    const fileCard = document.createElement('div');
    fileCard.className = 'file-attachment-card';
    fileCard.innerHTML = `
      <span class="file-icon">📄</span>
      <div class="file-details">
        <span class="file-name">${escapeHtml(fileName)}</span>
        <span class="file-size">${sizeFormatted}</span>
      </div>
      <a href="${fileUrl}" target="_blank" download class="btn btn-secondary btn-sm" style="margin-left:auto;">Download</a>
    `;
    bubbleDiv.appendChild(fileCard);

    if (msg.content) {
      const captionP = document.createElement('p');
      captionP.style.marginTop = '6px';
      captionP.textContent = msg.content;
      bubbleDiv.appendChild(captionP);
    }
  } else {
    bubbleDiv.textContent = msg.content;
  }

  const timeSpan = document.createElement('span');
  timeSpan.className = 'msg-timestamp';
  const dateObj = msg.created_at ? new Date(msg.created_at) : new Date();
  timeSpan.textContent = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  msgDiv.appendChild(senderSpan);
  msgDiv.appendChild(bubbleDiv);
  msgDiv.appendChild(timeSpan);

  chatLog.appendChild(msgDiv);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function appendSystemMessage(text) {
  const sysDiv = document.createElement('div');
  sysDiv.className = 'system-message';
  sysDiv.textContent = text;
  chatLog.appendChild(sysDiv);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function handleFileSelected(e) {
  if (e.target.files && e.target.files[0]) {
    selectedFile = e.target.files[0];
    previewFileName.textContent = selectedFile.name;
    previewFileSize.textContent = `(${(selectedFile.size / 1024).toFixed(1)} KB)`;
    uploadPreviewBar.classList.remove('hidden');
  }
}

function clearSelectedFile() {
  selectedFile = null;
  fileInput.value = '';
  uploadPreviewBar.classList.add('hidden');
}

function handleTyping() {
  if (!socket) return;
  socket.emit('typing', { roomCode: currentRoomCode, senderName: currentSenderName, isTyping: true });

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing', { roomCode: currentRoomCode, senderName: currentSenderName, isTyping: false });
  }, 2000);
}

function copyRoomCode() {
  if (!currentRoomCode) return;
  navigator.clipboard.writeText(currentRoomCode);
  const copyText = document.getElementById('copyText');
  copyText.textContent = 'Copied!';
  setTimeout(() => {
    copyText.textContent = 'Copy';
  }, 2000);
}

function leaveRoom() {
  if (socket) socket.disconnect();
  currentRoomCode = null;
  chatCard.classList.add('hidden');
  landingCard.classList.remove('hidden');
}

function openImageModal(url) {
  modalImg.src = url;
  modalDownloadLink.href = url;
  imageModal.classList.remove('hidden');
}

function closeImageModal() {
  imageModal.classList.add('hidden');
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Start
document.addEventListener('DOMContentLoaded', initEventListeners);
