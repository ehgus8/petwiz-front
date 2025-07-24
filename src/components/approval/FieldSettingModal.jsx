import React, { useState, useEffect } from 'react';
import styles from './FieldSettingModal.module.scss'; // A dedicated style file would be better

const FieldSettingModal = ({ isOpen, onClose, onSave, fieldData }) => {
  const [header, setHeader] = useState('');
  const [description, setDescription] = useState('');
  const [required, setRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState('');
  // '최대 지정수'는 아직 백엔드 모델에 없으므로 일단 보류합니다.

  useEffect(() => {
    if (fieldData) {
      setHeader(fieldData.header || '');
      setDescription(fieldData.description || '');
      setRequired(fieldData.required || false);
      setDefaultValue(fieldData.defaultValue || '');
    }
  }, [fieldData]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave({ 
      ...fieldData, 
      header, 
      description,
      required,
      defaultValue,
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>사용자 설정</h3>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label htmlFor="fieldHeader">* 정보명</label>
            <input
              type="text"
              id="fieldHeader"
              value={header}
              onChange={(e) => setHeader(e.target.value)}
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
          <div className={styles.formGroup}>
            <label>필수 여부</label>
            <div className={styles.radioGroup}>
                <label>
                    <input type="radio" name="required" value="true" checked={required === true} onChange={() => setRequired(true)} />
                    필수
                </label>
                <label>
                    <input type="radio" name="required" value="false" checked={required === false} onChange={() => setRequired(false)} />
                    미필수
                </label>
            </div>
          </div>
           <div className={styles.formGroup}>
            <label htmlFor="fieldDefault">기본값</label>
            <input
              type="text"
              id="fieldDefault"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelButton}>취소</button>
          <button onClick={handleSave} className={styles.submitButton}>수정</button>
        </div>
      </div>
    </div>
  );
};

export default FieldSettingModal; 