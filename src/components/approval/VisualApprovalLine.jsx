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

  // 결재선 렌더링 로직 통일
  const renderLine = () => (
    <>
      {approvalLine.map((approver, index) => (
        <React.Fragment key={approver.id || approver.employeeId}>
          <div className={`${styles.approverNode} ${getStatusClass(approver.approvalStatus)}`}>
            {/* 새 문서 작성 시에는 아이콘 숨김 */}
            {!isNewDraft && (
              <span className={styles.statusIcon}>
                {approver.approvalStatus === 'APPROVED' && '✔'}
                {approver.approvalStatus === 'REJECTED' && '✖'}
                {approver.approvalStatus === 'PENDING' && '✎'}
              </span>
            )}
            <span className={styles.approverName}>{approver.employeeName || approver.name}</span>
          </div>
          {index < approvalLine.length - 1 && <div className={styles.arrow}>→</div>}
        </React.Fragment>
      ))}
    </>
  );

  // 요약 모드는 추후 필요 시 확장 (현재는 전체 라인만 사용)
  const renderSummaryLine = () => {
    // 결재자별 상태 아이콘/색상/이름/흐름 표시, 길면 ... 처리 + 툴팁
    const summaryStr = approvalLine.map(a => `${a.employeeName || a.name}(${a.approvalStatus})`).join(' → ');
    return (
      <div
        className={styles.summaryText}
        style={{
          maxWidth: 250,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={summaryStr}
      >
        {approvalLine.map((a, idx) => {
          let icon = '✎';
          let color = '#1976d2';
          if (a.approvalStatus === 'APPROVED') {
            icon = '✔';
            color = '#16a34a';
          } else if (a.approvalStatus === 'REJECTED') {
            icon = '✖';
            color = '#dc2626';
          }
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