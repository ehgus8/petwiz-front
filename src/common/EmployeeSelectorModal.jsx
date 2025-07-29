import React from 'react';
import styles from './EmployeeSelectorModal.module.scss';

const EmployeeSelectorModal = ({ employeeList, onSelect, onClose }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>직원 선택</h3>
        <ul className={styles.employeeList}>
          {employeeList.map((emp, idx) => (
            <li
              key={idx}
              className={styles.employeeItem}
              onClick={() => onSelect(emp)}
            >
              {emp['이름']} ({emp['부서']})
            </li>
          ))}
        </ul>
        <button className={styles.closeBtn} onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
};

export default EmployeeSelectorModal;
