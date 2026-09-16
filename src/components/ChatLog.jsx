import React, { useEffect, useRef } from 'react';
import { downloadFile } from '../utils/downloadHelper';

export default function ChatLog({ messages, currentSenderName, currentSocketId, onOpenImageModal }) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chat-log" ref={logRef}>
      <div className="system-message">Joined room timeline. Start typing or share media files below.</div>
      
      {messages.map((msg, index) => {
        if (msg.isSystem) {
          return (
            <div key={index} className="system-message">
              {msg.text}
            </div>
          );
        }

        const sender = msg.sender_name || msg.senderName || 'Guest';
        const msgSocketId = msg.sender_socket_id || msg.senderSocketId;

        // Associate user message with socket ID to prevent same-name collisions ("Guest", "Alex", etc.)
        let isSelf = false;
        if (msgSocketId && currentSocketId) {
          isSelf = msgSocketId === currentSocketId;
        } else {
          isSelf = sender === currentSenderName;
        }
        const mediaUrl = msg.media_url || msg.mediaUrl;
        const defaultFileName = msg.type === 'image' ? 'image.png' : 'attachment';
        const fileName = (msg.fileMeta && msg.fileMeta.fileName) || msg.file_name || defaultFileName;
        const fileSize = (msg.fileMeta && msg.fileMeta.fileSize) || msg.file_size || 0;
        const mimeType = (msg.fileMeta && msg.fileMeta.mimeType) || msg.mime_type || '';
        const sizeFormatted = fileSize ? `${(fileSize / 1024).toFixed(1)} KB` : '';
        const dateObj = msg.created_at ? new Date(msg.created_at) : new Date();
        const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
          <div key={msg.id || index} className={`msg-item ${isSelf ? 'self' : 'other'}`}>
            <span className="msg-sender">{sender}</span>
            <div className="msg-bubble">
              {msg.type === 'image' && mediaUrl ? (
                <div>
                  <img
                    src={mediaUrl}
                    alt="Uploaded media"
                    className="msg-image"
                    onClick={() => onOpenImageModal(mediaUrl, fileName)}
                  />
                  {msg.content && <p style={{ marginTop: '6px' }}>{msg.content}</p>}
                </div>
              ) : msg.type === 'file' && mediaUrl ? (
                <div>
                  <div className="file-attachment-card">
                    <span className="file-icon">📄</span>
                    <div className="file-details">
                      <span className="file-name">{fileName}</span>
                      <span className="file-size">{sizeFormatted}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadFile(mediaUrl, fileName, mimeType)}
                      className="btn btn-secondary btn-sm"
                      style={{ marginLeft: 'auto' }}
                    >
                      Download
                    </button>
                  </div>
                  {msg.content && <p style={{ marginTop: '6px' }}>{msg.content}</p>}
                </div>
              ) : (
                msg.content
              )}
            </div>
            <span className="msg-timestamp">{timeFormatted}</span>
          </div>
        );
      })}
    </div>
  );
}

