import React, { useState, useEffect } from 'react';
import styles from './CustomFieldModal.module.scss';

const CustomFieldModal = ({ isOpen, onClose, onSave, field }) => {
  const isEditMode = !!field;
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

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
      setErrors({});
    }
  }, [isOpen, field]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    
    // 입력 시 해당 필드의 에러 제거
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // 정보명(제목) 필수 검증
    if (!formData.header.trim()) {
      newErrors.header = '정보명은 필수입니다.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }
    
    // onSave 콜백으로 현재 필드 정보와 수정된 데이터를 함께 넘김
    onSave({ ...field, ...formData });
    onClose(); // 저장 후 모달 닫기
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h2>{isEditMode ? '텍스트 수정' : '텍스트 추가'}</h2>
        
        <div className={styles.formGroup}>
            <label htmlFor="header">
              정보명 <span style={{ color: 'red' }}>*</span>
            </label>
            <input 
              id="header" 
              type="text" 
              name="header" 
              value={formData.header} 
              onChange={handleChange}
              className={errors.header ? styles.errorInput : ''}
              placeholder="필드명을 입력하세요"
            />
            {errors.header && (
              <div className={styles.errorMessage}>{errors.header}</div>
            )}
        </div>

        <div className={styles.formGroup}>
            <label htmlFor="description">정보설명</label>
            <textarea 
              id="description" 
              name="description" 
              value={formData.description} 
              onChange={handleChange}
              placeholder="필드에 대한 설명을 입력하세요"
            ></textarea>
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