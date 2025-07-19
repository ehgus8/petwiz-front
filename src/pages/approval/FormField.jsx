import React from 'react';
import styles from './ApprovalNew.module.scss'; // 동일한 스타일 사용

const FormField = ({ field, value, onChange }) => {
  const renderField = () => {
    switch (field.type) {
      case 'date':
      case 'date_ymd':
        return (
          <input
            type="date"
            id={field.id}
            value={value[field.id] || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
          />
        );
      case 'period':
        // 기간 타입은 두 개의 값을 사용하므로, value가 객체라고 가정합니다.
        return (
          <div className={styles.periodContainer}>
            <input
              type="date"
              id={`${field.id}_start`}
              value={value?.[`${field.id}_start`] || ''}
              onChange={(e) => onChange(`${field.id}_start`, e.target.value)}
              required={field.required}
            />
            <span>~</span>
            <input
              type="date"
              id={`${field.id}_end`}
              value={value?.[`${field.id}_end`] || ''}
              onChange={(e) => onChange(`${field.id}_end`, e.target.value)}
              required={field.required}
            />
          </div>
        );
      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={value[field.id] || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
            placeholder={field.description}
            rows={5}
          />
        );
      default: // 'text', 'number' 등
        return (
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            id={field.id}
            value={value[field.id] || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
            placeholder={field.description}
          />
        );
    }
  };

  return (
    <tr>
      <th>
        {field.header || field.label}
        {field.required && <span className={styles.required}>*</span>}
      </th>
      <td>{renderField()}</td>
    </tr>
  );
};

export default FormField; 