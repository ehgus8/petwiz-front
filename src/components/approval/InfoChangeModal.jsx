import React, { useState, useEffect } from 'react';
import styles from './InfoChangeModal.module.scss';

const InfoChangeModal = ({ isOpen, onClose, onSave, field }) => {
  const [formData, setFormData] = useState({ name: '', desc: '' });

  useEffect(() => {
    if (isOpen && field) {
      setFormData({
        name: field.name || '',
        desc: field.desc || '',
      });
    }
  }, [isOpen, field]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(field.id, formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h2>정보명 변경</h2>
        
        <div className={styles.formGroup}>
          <label htmlFor="name">정보명</label>
          <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="desc">정보설명</label>
          <textarea id="desc" name="desc" value={formData.desc} onChange={handleChange}></textarea>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelButton} onClick={onClose}>취소</button>
          <button className={styles.saveButton} onClick={handleSave}>확인</button>
        </div>
      </div>
    </div>
  );
};

export default InfoChangeModal; 