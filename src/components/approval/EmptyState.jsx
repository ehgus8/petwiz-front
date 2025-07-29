import React from 'react';

const EmptyState = ({ icon = '🗂️', message = '데이터가 없습니다.' }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
    color: '#6c757d',
  }}>
    <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 18 }}>{message}</div>
  </div>
);

export default EmptyState; 