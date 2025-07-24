import React, { useState, useEffect } from 'react';
import styles from './FieldSettingModal.module.scss';

const DefaultFieldSettingModal = ({ isOpen, onClose, onSave, fieldData }) => {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (fieldData) {
      setLabel(fieldData.label || '');
      setDescription(fieldData.description || '');
    }
  }, [fieldData]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave({ 
      ...fieldData, 
      label,
      description,
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>정보명 변경</h3>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label htmlFor="fieldLabel">* 정보명</label>
            <input
              type="text"
              id="fieldLabel"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="fieldDesc">정보설명</label>
            <textarea
              id="fieldDesc"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelButton}>취소</button>
          <button onClick={handleSave} className={styles.submitButton}>확인</button>
        </div>
      </div>
    </div>
  );
};

export default DefaultFieldSettingModal; 