// /src/components/approval/VisualApprovalLine.jsx (최종 완성본)

import React from 'react';
import styles from './VisualApprovalLine.module.scss';

const VisualApprovalLine = ({ approvalLine, reportStatus, mode = 'full' }) => {
  if (!approvalLine || approvalLine.length === 0) {
    if (mode === 'summary') return null;
    return <div className={styles.noApprovers}>결재선 정보 없음</div>;
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'APPROVED': return styles.approved;
      case 'REJECTED': return styles.rejected;
      default: return styles.pending;
    }
  };

  const isNewDraft = !approvalLine.some(a => a.approvalStatus);

  const renderLine = () => (
    <>
      {approvalLine.map((approver, index) => (
        <React.Fragment key={approver.id || approver.employeeId}>
          <div className={`${styles.approverNode} ${getStatusClass(approver.approvalStatus)}`}>
            {!isNewDraft && (
              <span className={styles.statusIcon}>
                {approver.approvalStatus === 'APPROVED' && '✔'}
                {approver.approvalStatus === 'REJECTED' && '✖'}
                {approver.approvalStatus === 'PENDING' && '✎'}
              </span>
            )}
            <span className={styles.approverName}>{approver.employeeName || approver.name}</span>
            {/* ★★★ full 모드: 직급/직책 정보 추가 ★★★ */}
            {(approver.position || approver.role) && (
              <span className={styles.approverPositionRole}>
                ({[approver.position, approver.role].filter(Boolean).join(' / ')})
              </span>
            )}
          </div>
          {index < approvalLine.length - 1 && <div className={styles.arrow}>→</div>}
        </React.Fragment>
      ))}
    </>
  );

  const renderSummaryLine = () => {
    const summaryStr = approvalLine.map(a => `${a.employeeName || a.name}(${a.approvalStatus})`).join(' → ');
    return (
      <div className={styles.summaryText} title={summaryStr}>
        {approvalLine.map((a, idx) => {
          let icon = '✎';
          let color = '#1976d2';
          if (a.approvalStatus === 'APPROVED') { icon = '✔'; color = '#16a34a'; }
          else if (a.approvalStatus === 'REJECTED') { icon = '✖'; color = '#dc2626'; }
          return (
            <span key={a.employeeId || a.id || idx} style={{ display: 'inline-flex', alignItems: 'center', fontWeight: a.approvalStatus === 'PENDING' ? 700 : 400, color, fontSize: 15 }}>
              <span style={{ marginRight: 4 }}>{icon}</span>
              {a.employeeName || a.name}
              {idx < approvalLine.length - 1 && <span style={{ margin: '0 8px', color: '#bbb' }}>→</span>}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.approvalLineContainer}>
      {mode === 'full' ? renderLine() : renderSummaryLine()}
    </div>
  );
};

export default VisualApprovalLine;