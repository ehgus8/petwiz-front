import React from 'react';
import styles from './Skeleton.module.scss';

export const SkeletonBlock = ({ height = 16, width = '100%', style = {} }) => (
  <div className={styles.skeleton} style={{ height, width, ...style }} />
);

export const FullPageSkeleton = ({ lines = 6 }) => (
  <div className={styles.fullPage}>
    <div className={styles.center}>
      {Array.from({ length: lines }).map((_, idx) => (
        <SkeletonBlock key={idx} height={16} style={{ width: `${80 - idx * 5}%` }} />
      ))}
    </div>
  </div>
);

const ListSkeleton = ({ items = 5 }) => (
  <div style={{ display: 'grid', gap: 12 }}>
    {Array.from({ length: items }).map((_, idx) => (
      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 16, alignItems: 'center', padding: '16px 20px', border: '1px solid #e9ecef', borderRadius: 8, background: '#fff' }}>
        <div>
          <SkeletonBlock height={14} style={{ width: '40%', marginBottom: 8 }} />
          <SkeletonBlock height={14} style={{ width: '75%', marginBottom: 6 }} />
          <SkeletonBlock height={14} style={{ width: '60%' }} />
        </div>
        <SkeletonBlock height={32} style={{ width: 96 }} />
      </div>
    ))}
  </div>
);

export default ListSkeleton; 