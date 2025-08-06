import React from 'react';
import styles from './VisualApprovalLine.module.scss';

const VisualApprovalLine = ({ approvalLine, reportStatus, mode = 'full' }) => {
  // --- 이 부분은 그대로 유지 ---
  if (!approvalLine || approvalLine.length === 0) {
    if (mode === 'summary') return <div className={styles.summaryText}>결재선 없음</div>;
    return <div className={styles.noApprovers}>결재선 정보 없음</div>;
  }
  const MAX_VISIBLE_APPROVERS = 3;
  const visibleApprovers = approvalLine.slice(0, MAX_VISIBLE_APPROVERS);
  const hiddenCount = approvalLine.length - MAX_VISIBLE_APPROVERS;
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
      {visibleApprovers.map((approver, index) => (
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
            {(approver.position || approver.role) && (
              <span className={styles.approverPositionRole}>
                ({[approver.position, approver.role].filter(Boolean).join(' / ')})
              </span>
            )}
          </div>
          {(index < visibleApprovers.length - 1 || hiddenCount > 0) && (
            <div className={styles.arrow}>→</div>
          )}
        </React.Fragment>
      ))}
      {hiddenCount > 0 && (
        <div className={styles.ellipsis} title={`${approvalLine.length}명 중 ${hiddenCount + 1}번째 결재자부터 숨김`}>
          ... (+{hiddenCount})
        </div>
      )}
    </>
  );

  // ★★★ 여기가 핵심 수정 부분입니다 ★★★
  const renderSummaryLine = () => {
    const totalApprovers = approvalLine.length;
    const firstApprover = approvalLine[0];
    const lastApprover = approvalLine[totalApprovers - 1];
    
    // 전체 결재선을 보여주는 툴팁 텍스트
    const fullLineTitle = approvalLine.map(a => a.employeeName || a.name).join(' → ');

    // 1. 결재자가 1명일 경우, 그 사람 이름만 표시
    if (totalApprovers === 1) {
      return (
        <div className={styles.summaryText} title={fullLineTitle}>
          <span>{firstApprover.employeeName || firstApprover.name}</span>
        </div>
      );
    }

    // 2. 결재자가 2명 이상일 경우
    return (
      <div className={styles.summaryText} title={fullLineTitle}>
        {/* 첫 번째 결재자 */}
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {firstApprover.employeeName || firstApprover.name}
        </span>
        
        <span style={{ margin: '0 8px', color: '#bbb' }}>→</span>
        
        {/* 결재자가 3명 이상일 때만 '...' 표시 */}
        {totalApprovers > 2 && (
          <>
            <span className={styles.ellipsis}>...</span>
            <span style={{ margin: '0 8px', color: '#bbb' }}>→</span>
          </>
        )}
        
        {/* 마지막 결재자 */}
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {lastApprover.employeeName || lastApprover.name}
        </span>
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