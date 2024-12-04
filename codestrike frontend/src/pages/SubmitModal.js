import React from 'react';
import './SubmitModal.css'; // Ensure this path is correct

const ConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirm Submission</h2>
        <p>Are you sure you want to submit the code?</p>
        <div className="modal-buttons">
          <button className="no" onClick={onClose}>No</button>
          <button className="yes" onClick={onConfirm}>Yes</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
