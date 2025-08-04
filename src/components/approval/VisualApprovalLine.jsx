// /src/components/approval/VisualApprovalLine.jsx (최종 완성본)

import React from 'react';
import styles from './VisualApprovalLine.module.scss';

const VisualApprovalLine = ({ approvalLine, reportStatus, mode = 'full' }) => {
  if (!approvalLine || approvalLine.length === 0) {
    if (mode === 'summary') return null;
    return <div className={styles.noApprovers}>결재선 정보 없음</div>;
  }
   // 화면에 보여줄 최대 결재자 수
  const MAX_VISIBLE_APPROVERS = 3;

  // 실제 화면에 표시될 결재자 목록 (최대 3명)
  const visibleApprovers = approvalLine.slice(0, MAX_VISIBLE_APPROVERS);
  
  // 숨겨진 결재자 수 계산
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
      {/* 3명까지만 렌더링하도록 visibleApprovers 사용 */}
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
          {/* 마지막 결재자가 아니거나, 뒤에 숨겨진 결재자가 더 있을 경우에만 화살표 표시 */}
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

  const renderSummaryLine = () => {
    const summaryStr = approvalLine.map(a => `${a.employeeName || a.name}(${a.approvalStatus})`).join(' → ');
    const summaryVisible = approvalLine.slice(0, 2); // 요약 모드는 2명 + '...'
    const summaryHidden = approvalLine.length - 2;

      return (
      <div className={styles.summaryText} title={approvalLine.map(a => a.employeeName || a.name).join(' → ')}>
        {summaryVisible.map((a, idx) => (
          <React.Fragment key={a.employeeId || a.id || idx}>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              {a.employeeName || a.name}
            </span>
            {(idx < summaryVisible.length - 1 || summaryHidden > 0) && (
              <span style={{ margin: '0 8px', color: '#bbb' }}>→</span>
            )}
          </React.Fragment>
        ))}
        {summaryHidden > 0 && (
          <span className={styles.ellipsis}>...</span>
        )}
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