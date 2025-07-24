import React, { useState, useEffect } from 'react';
import styles from './CustomFieldModal.module.scss';

const CustomFieldModal = ({ isOpen, onClose, onSave, field }) => {
  const isEditMode = !!field;
  const [formData, setFormData] = useState({});

  useEffect(() => {
    // 모달이 열릴 때 상태를 초기화
    if (isOpen) {
      setFormData({
        header: field?.header || '',
        description: field?.description || '',
        required: field?.required || false,
        type: field?.type || 'text', // 기본 타입을 text로 설정
        // 기획서의 다른 필드들 (최대 지정수, 기본값 등)은 추후 추가
      });
    }
  }, [isOpen, field]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = () => {
    // onSave 콜백으로 현재 필드 정보와 수정된 데이터를 함께 넘김
    onSave({ ...field, ...formData });
    onClose(); // 저장 후 모달 닫기
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h2>{isEditMode ? '사용자 설정 수정' : '사용자 설정 추가'}</h2>
        
        <div className={styles.formGroup}>
            <label htmlFor="header">정보명</label>
            <input id="header" type="text" name="header" value={formData.header} onChange={handleChange} />
        </div>

        <div className={styles.formGroup}>
            <label htmlFor="description">정보설명</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange}></textarea>
        </div>

        <div className={styles.formGroup}>
            <label>
                <input type="checkbox" name="required" checked={formData.required} onChange={handleChange} />
                필수여부
            </label>
        </div>

        {/* 여기에 다른 설정들 (최대 지정수, 기본값 등)이 추가될 수 있습니다. */}

        <div className={styles.modalActions}>
          <button className={styles.cancelButton} onClick={onClose}>취소</button>
          <button className={styles.saveButton} onClick={handleSave}>
            {isEditMode ? '수정' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomFieldModal; 