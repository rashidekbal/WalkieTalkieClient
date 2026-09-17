import React, { useRef } from 'react';

export default function ChatInput({
  messageText,
  setMessageText,
  selectedFile,
  setSelectedFile,
  onSendMessage,
  onTyping,
  isUploading = false,
  onFileError
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isVideo = file.type && file.type.startsWith('video/');
      const maxLimitBytes = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      const maxLimitMb = isVideo ? 100 : 10;

      if (file.size > maxLimitBytes) {
        const selectedMb = (file.size / (1024 * 1024)).toFixed(1);
        if (onFileError) {
          onFileError(
            `"${file.name}" (${selectedMb} MB) exceeds the ${maxLimitMb} MB limit for ${isVideo ? 'videos' : 'images and documents'}. Please select a file under ${maxLimitMb} MB.`
          );
        }
        e.target.value = '';
        setSelectedFile(null);
        return;
      }

      if (onFileError) onFileError('');
      setSelectedFile(file);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSendMessage();
  };

  return (
    <form className="chat-input-area" onSubmit={handleFormSubmit}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      <button
        type="button"
        className="btn-attach"
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        title="Attach image or file"
        disabled={isUploading}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
      </button>

      <input
        type="text"
        placeholder={isUploading ? "Uploading file, please wait..." : "Type a message..."}
        autoComplete="off"
        value={messageText}
        disabled={isUploading}
        onChange={(e) => {
          setMessageText(e.target.value);
          onTyping();
        }}
      />

      <button
        type="submit"
        className="btn btn-primary btn-send"
        disabled={isUploading || (!messageText.trim() && !selectedFile)}
      >
        {isUploading ? (
          <>
            <span className="btn-spinner" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <span>Send</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </>
        )}
      </button>
    </form>
  );
}
