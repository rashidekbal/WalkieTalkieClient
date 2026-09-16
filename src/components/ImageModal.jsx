import React from 'react';
import { downloadFile } from '../utils/downloadHelper';

export default function ImageModal({ imageUrl, onClose }) {
  if (!imageUrl) return null;

  const url = typeof imageUrl === 'object' ? imageUrl?.url : imageUrl;
  const fileName = (typeof imageUrl === 'object' ? imageUrl?.fileName : null) || 'image.png';

  const handleDownload = (e) => {
    e.preventDefault();
    downloadFile(url, fileName);
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <img id="modalImg" src={url} alt="Enlarged view" />
        <div className="modal-footer">
          <button type="button" onClick={handleDownload} className="btn btn-secondary btn-sm">
            Download Original
          </button>
        </div>
      </div>
    </div>
  );
}

