import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const ConnectionErrorModal = ({ show, onRetry, onClose }) => {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Connection Error</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4">
          <i className="fas fa-exclamation-triangle text-danger fa-3x mb-3"></i>
          <h5>Cannot connect to the server</h5>
          <p>Please check if your backend server is running.</p>
          <ul className="text-left">
            <li>Make sure your backend server is running on port 8081</li>
            <li>Check your internet connection</li>
            <li>Verify that your backend service is properly configured</li>
            <li>Try restarting your backend server</li>
          </ul>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={onRetry}>
          Retry Connection
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConnectionErrorModal;
