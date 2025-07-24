import React from 'react';
import styles from './ApprovalNew.module.scss'; // 동일한 스타일 사용
import QuillEditor from '../../components/editor/QuillEditor';

const FormField = ({ field, value, onChange, fieldKey }) => {
  const renderField = () => {
    switch (field.type) {
      case 'editor':
        return (
          <div className={styles.editorContainer}>
            <QuillEditor
              value={value[fieldKey] || field.value || ""}
              onChange={(content) => onChange(fieldKey, content)}
              placeholder="내용을 입력하세요..."
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
        return (
          <div className={styles.periodContainer}>
            <input
              type="date"
              id={`${fieldKey}_start`}
              value={value?.[`${fieldKey}_start`] || ''}
              onChange={(e) => onChange(`${fieldKey}_start`, e.target.value)}
              required={field.required}
              className={styles.formInput}
            />
            <span>~</span>
            <input
              type="date"
              id={`${fieldKey}_end`}
              value={value?.[`${fieldKey}_end`] || ''}
              onChange={(e) => onChange(`${fieldKey}_end`, e.target.value)}
              required={field.required}
              className={styles.formInput}
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