import React from 'react';
import styles from './SummaryCard.module.scss';

const SummaryCard = ({ title, count, icon, onClick, active }) => {
  return (
    <div
      className={active ? `${styles.summaryCard} ${styles.active}` : styles.summaryCard}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.cardContent}>
        <div className={styles.info}>
          <span className={styles.title}>{title}</span>
          <span className={styles.count}>{count}</span>
        </div>
        <div className={styles.iconWrapper}>
          {typeof icon === 'string' ? (
            <img src={icon} alt={title} className={styles.icon} />
          ) : (
            icon
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryCard; 