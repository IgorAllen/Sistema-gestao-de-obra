import React, { useEffect } from 'react';

export default function BottomSheet({ isOpen, onClose, title, children }) {
  // Fecha ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="bottom-sheet">
        <div className="sheet-handle" />
        {title && <h2 style={{ marginBottom: '1.5rem' }}>{title}</h2>}
        {children}
      </div>
    </>
  );
}
