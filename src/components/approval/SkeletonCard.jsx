// /src/components/approval/SkeletonCard.jsx (신규 파일)
import React from 'react';
import styles from './SkeletonCard.module.scss';

const SkeletonCard = () => {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.left}>
        <div className={`${styles.line} ${styles.short}`}></div>
        <div className={`${styles.line} ${styles.long}`}></div>
      </div>
      <div className={styles.right}>
        <div className={`${styles.line} ${styles.medium}`}></div>
      </div>
    </div>
  );
};

export default SkeletonCard;