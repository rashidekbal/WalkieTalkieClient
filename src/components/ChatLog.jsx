import React, { useEffect, useRef } from 'react';

export default function ChatLog({ messages, currentSenderName, onOpenImageModal }) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div class="chat-log" ref={logRef}>
      <div class="system-message">Joined room timeline. Start typing or share media files below.</div>
      
      {messages.map((msg, index) => {
        if (msg.isSystem) {
          return (
            <div key={index} class="system-message">
              {msg.text}
            </div>
          );
        }

        const sender = msg.sender_name || msg.senderName || 'Guest';
        const isSelf = sender === currentSenderName;
        const mediaUrl = msg.media_url || msg.mediaUrl;
        const fileName = (msg.fileMeta && msg.fileMeta.fileName) || msg.file_name || 'Download Attachment';
        const fileSize = (msg.fileMeta && msg.fileMeta.fileSize) || msg.file_size || 0;
        const sizeFormatted = fileSize ? `${(fileSize / 1024).toFixed(1)} KB` : '';
        const dateObj = msg.created_at ? new Date(msg.created_at) : new Date();
        const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
          <div key={msg.id || index} class={`msg-item ${isSelf ? 'self' : 'other'}`}>
            <span class="msg-sender">{sender}</span>
            <div class="msg-bubble">
              {msg.type === 'image' && mediaUrl ? (
                <div>
                  <img
                    src={mediaUrl}
                    alt="Uploaded media"
                    class="msg-image"
                    onClick={() => onOpenImageModal(mediaUrl)}
                  />
                  {msg.content && <p style={{ marginTop: '6px' }}>{msg.content}</p>}
                </div>
              ) : msg.type === 'file' && mediaUrl ? (
                <div>
                  <div class="file-attachment-card">
                    <span class="file-icon">📄</span>
                    <div class="file-details">
                      <span class="file-name">{fileName}</span>
                      <span class="file-size">{sizeFormatted}</span>
                    </div>
                    <a href={mediaUrl} target="_blank" rel="noopener noreferrer" download class="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
                      Download
                    </a>
                  </div>
                  {msg.content && <p style={{ marginTop: '6px' }}>{msg.content}</p>}
                </div>
              ) : (
                msg.content
              )}
            </div>
            <span class="msg-timestamp">{timeFormatted}</span>
          </div>
        );
      })}
    </div>
  );
}
