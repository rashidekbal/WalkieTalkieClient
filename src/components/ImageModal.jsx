import React from 'react';

export default function ImageModal({ imageUrl, onClose }) {
  if (!imageUrl) return null;

  return (
    <div class="modal" onClick={onClose}>
      <div class="modal-content" onClick={(e) => e.stopPropagation()}>
        <button class="modal-close" onClick={onClose}>&times;</button>
        <img id="modalImg" src={imageUrl} alt="Enlarged view" />
        <div class="modal-footer">
          <a href={imageUrl} download class="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer">
            Download Original
          </a>
        </div>
      </div>
    </div>
  );
}
