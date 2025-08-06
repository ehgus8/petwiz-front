import React from 'react';
import styles from './TemplateSelectionModal.module.scss';

const TemplateFormSkeleton = () => {
  return (
    <div className={styles.skeletonContainer}>
      <div className={styles.section}>
        <div className={`${styles.line} ${styles.title}`}></div>
        <div className={styles.formGroup}>
          <div className={`${styles.line} ${styles.label}`}></div>
          <div className={`${styles.line} ${styles.input}`}></div>
        </div>
        <div className={styles.formGroup}>
          <div className={`${styles.line} ${styles.label}`}></div>
          <div className={`${styles.line} ${styles.input}`}></div>
        </div>
        <div className={styles.formGroup}>
          <div className={`${styles.line} ${styles.label}`}></div>
          <div className={`${styles.line} ${styles.textarea}`}></div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={`${styles.line} ${styles.title}`}></div>
        <div className={`${styles.line} ${styles.field}`}></div>
        <div className={`${styles.line} ${styles.field}`}></div>
        <div className={`${styles.line} ${styles.buttonPlaceholder}`}></div>
      </div>
    </div>
  );
};

export default TemplateFormSkeleton;