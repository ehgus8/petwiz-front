// src/components/approval/NewPendingModal.jsx
import React, { useState, useEffect } from 'react';
import './NewPendingModal.module.scss';

const NewPendingModal = ({ reportId, onClose, duration = 5 }) => {
  const [seconds, setSeconds] = useState(duration);

  useEffect(() => {
    if (seconds <= 0) {
      onClose();
      return;
    }
    const timer = setTimeout(() => setSeconds((sec) => sec - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, onClose]);

  return (
    <div className='new-pending-modal'>
      <p className='message'>새로운 결재 문서가 도착했습니다!</p>
      <button
        className='view-btn'
        onClick={() => {
          onClose();
          window.location.href = `/approval/reports/${reportId}`;
        }}
      >
        보러 가기
      </button>
      <div className='auto-close-info'>
        이 창은 <strong>{seconds}초</strong> 후에 자동으로 닫힙니다.
      </div>
    </div>
  );
};

export default NewPendingModal;
