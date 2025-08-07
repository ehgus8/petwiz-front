// src/components/approval/NewPendingModal.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NewPendingModal.module.scss';

const NewPendingModal = ({ reportId, onClose }) => {
  const navigate = useNavigate();

  const handleGo = () => {
    onClose();
    navigate(`/approval/reports/${reportId}`);
  };

  return (
    <div className={styles.toast}>
      <button className={styles.closeBtn} onClick={onClose}>×</button>
      <div className={styles.message}>
        새로운 결재 문서가 도착했습니다!
      </div>
      <button className={styles.goBtn} onClick={handleGo}>
        보러 가기
      </button>
    </div>
  );
};

export default NewPendingModal;
