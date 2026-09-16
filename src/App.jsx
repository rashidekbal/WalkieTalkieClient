import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Navbar from './components/Navbar';
import LandingCard from './components/LandingCard';
import ChatHeader from './components/ChatHeader';
import ChatLog from './components/ChatLog';
import ChatInput from './components/ChatInput';
import ImageModal from './components/ImageModal';
import ConnectingOverlay from './components/ConnectingOverlay';

// Backend Server URL (Vite environment variable or relative for dev proxy)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function App() {
  // Theme State (Default: light)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('walkietalkie_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('walkietalkie_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const [isHealthError, setIsHealthError] = useState(false);

  const [isJoined, setIsJoined] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [roomTitle, setRoomTitle] = useState('WalkieTalkie Room');
  const [senderName, setSenderName] = useState('Guest');
  const [currentSocketId, setCurrentSocketId] = useState('');
  
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [typingNotice, setTypingNotice] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [activeModalImage, setActiveModalImage] = useState(null);

  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initial Health Check on Application Mount
  const checkHealth = async () => {
    setIsCheckingHealth(true);
    setIsHealthError(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      const data = await res.json();
      if (data && data.status === 'ok') {
        setTimeout(() => {
          setIsCheckingHealth(false);
        }, 400);
      } else {
        setIsCheckingHealth(false);
        setIsHealthError(true);
      }
    } catch (err) {
      setIsCheckingHealth(false);
      setIsHealthError(true);
    }
  };

  useEffect(() => {
    checkHealth();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const connectSocket = (code, user) => {
    if (socketRef.current) socketRef.current.disconnect();

    const socket = API_BASE_URL ? io(API_BASE_URL) : io();
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsOnline(true);
      setCurrentSocketId(socket.id);
      socket.emit('join_room', { roomCode: code, senderName: user });
    });

    socket.on('disconnect', () => {
      setIsOnline(false);
    });

    socket.on('room_history', ({ history }) => {
      if (history && Array.isArray(history)) {
        setMessages(history);
      }
    });

    socket.on('new_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user_joined', ({ senderName: joinedUser }) => {
      setMessages((prev) => [...prev, { isSystem: true, text: `${joinedUser} joined the room.` }]);
    });

    socket.on('user_left', ({ senderName: leftUser }) => {
      setMessages((prev) => [...prev, { isSystem: true, text: `${leftUser} left the room.` }]);
    });

    socket.on('user_typing', ({ senderName: typingUser, senderSocketId, isTyping }) => {
      if (isTyping && senderSocketId !== socket.id) {
        setTypingNotice(`${typingUser} is typing...`);
      } else {
        setTypingNotice('');
      }
    });

    socket.on('error_message', ({ message }) => {
      setAlertMessage(message || 'Socket error occurred');
    });
  };

  const handleJoinRoom = async (code, name) => {
    setAlertMessage('');
    if (!code || code.length !== 8) {
      setAlertMessage('Please enter a valid 8-character room code.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${code}`);
      const data = await res.json();

      if (!data.success) {
        setAlertMessage(data.message || 'Room not found.');
        return;
      }

      setRoomCode(data.data.code);
      setRoomTitle(data.data.title);
      setSenderName(name);
      setIsJoined(true);
      connectSocket(data.data.code, name);
    } catch (err) {
      setAlertMessage('Failed to connect to server.');
    }
  };

  const handleCreateRoom = async (title, name) => {
    setAlertMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      const data = await res.json();

      if (!data.success) {
        setAlertMessage(data.message || 'Failed to create room.');
        return;
      }

      setRoomCode(data.data.code);
      setRoomTitle(data.data.title);
      setSenderName(name);
      setIsJoined(true);
      connectSocket(data.data.code, name);
    } catch (err) {
      setAlertMessage('Failed to create room.');
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedFile) return;

    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);

      setMessages((prev) => [...prev, { isSystem: true, text: 'Uploading file...' }]);

      try {
        const res = await fetch(`${API_BASE_URL}/api/media/upload`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (!data.success) {
          setMessages((prev) => [...prev, { isSystem: true, text: `Upload failed: ${data.message}` }]);
          return;
        }

        const { mediaUrl, mediaPublicId, fileMeta } = data.data;
        const isImage = fileMeta.mimeType && fileMeta.mimeType.startsWith('image/');

        socketRef.current.emit('send_message', {
          roomCode,
          senderName,
          type: isImage ? 'image' : 'file',
          content: messageText.trim() || '',
          mediaUrl,
          mediaPublicId,
          fileMeta
        });
      } catch (err) {
        setMessages((prev) => [...prev, { isSystem: true, text: 'Error uploading file.' }]);
      }

      setSelectedFile(null);
    } else {
      socketRef.current.emit('send_message', {
        roomCode,
        senderName,
        type: 'text',
        content: messageText.trim()
      });
    }

    setMessageText('');
    socketRef.current.emit('typing', { roomCode, senderName, isTyping: false });
  };

  const handleTyping = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('typing', { roomCode, senderName, isTyping: true });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('typing', { roomCode, senderName, isTyping: false });
      }
    }, 2000);
  };

  const handleLeaveRoom = () => {
    if (socketRef.current) socketRef.current.disconnect();
    setIsJoined(false);
    setRoomCode('');
    setMessages([]);
  };

  return (
    <div class="app-container">
      <ConnectingOverlay
        isConnecting={isCheckingHealth}
        isError={isHealthError}
        onRetry={checkHealth}
      />

      <Navbar
        isOnline={isOnline}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {!isJoined ? (
        <LandingCard
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
          alertMessage={alertMessage}
        />
      ) : (
        <main class="card chat-card">
          <ChatHeader
            roomTitle={roomTitle}
            roomCode={roomCode}
            onLeaveRoom={handleLeaveRoom}
          />

          <ChatLog
            messages={messages}
            currentSenderName={senderName}
            currentSocketId={currentSocketId}
            onOpenImageModal={(url, fileName) => setActiveModalImage({ url, fileName })}
          />

          {typingNotice && <div class="typing-indicator">{typingNotice}</div>}

          {selectedFile && (
            <div class="upload-preview-bar">
              <div class="preview-info">
                <span class="preview-icon">📎</span>
                <span class="preview-filename">{selectedFile.name}</span>
                <span class="preview-filesize">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button class="btn-remove-attachment" onClick={() => setSelectedFile(null)}>
                &times;
              </button>
            </div>
          )}

          <ChatInput
            messageText={messageText}
            setMessageText={setMessageText}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
          />
        </main>
      )}

      <ImageModal
        imageUrl={activeModalImage}
        onClose={() => setActiveModalImage(null)}
      />
    </div>
  );
}
