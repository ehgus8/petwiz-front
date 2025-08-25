import React from 'react';
import styles from './ApprovalNew.module.scss'; // 동일한 스타일 사용
import Editor from '../../components/Editor'; // TipTap 에디터로 변경

// 불필요한 기본값들을 필터링하는 함수
const sanitizeValue = (val) => {
  if (!val) return '';
  
  // "ㅁㄴㅇㄹ" 같은 불필요한 기본값들 제거
  const unwantedDefaults = ['ㅁㄴㅇㄹ', 'test', '테스트', '내용을 입력하세요'];
  const trimmedValue = val.trim();
  
  if (unwantedDefaults.some(defaultVal => trimmedValue.includes(defaultVal))) {
    return '';
  }
  
  return val;
};

const FormField = ({ field, value, onChange, fieldKey }) => {
  const renderField = () => {
    switch (field.type) {
      case 'editor':
        return (
          <div className={styles.editorContainer}>
            <Editor
              content={sanitizeValue(value[fieldKey] || field.value || "")}
              onChange={(content) => onChange(fieldKey, content)}
            />
          </div>
        );
      case 'date':
      case 'date_ymd':
        return (
          <input
            type="date"
            id={fieldKey}
            value={value[fieldKey] || ''}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            required={field.required}
            className={styles.formInput}
          />
        );
      case 'period':
        // 기간 타입은 두 개의 값을 사용하므로, value가 객체라고 가정합니다.
        const startDate = value?.[`${fieldKey}_start`] || '';
        const endDate = value?.[`${fieldKey}_end`] || '';

        return (
          <div className={styles.periodContainer}>
            <input
              type="date"
              id={`${fieldKey}_start`}
              value={startDate}
              onChange={(e) => onChange(`${fieldKey}_start`, e.target.value)}
              required={field.required}
              className={styles.formInput}
            />
            <span>~</span>
            <input
              type="date"
              id={`${fieldKey}_end`}
              value={endDate}
              onChange={(e) => onChange(`${fieldKey}_end`, e.target.value)}
              required={field.required}
              className={styles.formInput}
              min={startDate}
            />
          </div>
        );
      case 'textarea':
        return (
          <textarea
            id={fieldKey}
            value={value[fieldKey] || ''}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            required={field.required}
            placeholder={field.description}
            rows={5}
            className={styles.formInput}
          />
        );
      default: // 'text', 'number' 등
        return (
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            id={fieldKey}
            value={value[fieldKey] || ''}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            required={field.required}
            placeholder={field.description}
            className={styles.formInput}
          />
        );
    }
  };

  return (
    <div className={styles.formRow}>
      <div className={styles.formLabel}>
        {field.header || field.label}
        {field.required && <span className={styles.required}>*</span>}
      </div>
      <div className={styles.formField}>{renderField()}</div>
    </div>
  );
};

export default FormField; 