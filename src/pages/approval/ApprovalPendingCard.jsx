import React from 'react';
import styles from './ApprovalPendingCard.module.scss';
import { useNavigate } from 'react-router-dom';

const reportStatusMap = {
  DRAFT: '임시 저장',
  IN_PROGRESS: '결재 진행 중',
  APPROVED: '최종 승인',
  REJECTED: '반려',
  RECALLED: '상신 후 회수',
};

const handleBack = () => {
  navigate(-1); // 뒤로가기
};

const approvalStatusMap = {
  PENDING: { color: '#bdbdbd', text: '대기', icon: '⏳' },
  APPROVED: { color: '#4caf50', text: '승인', icon: '✔️' },
  REJECTED: { color: '#f44336', text: '반려', icon: '❌' },
};

const ApprovalPendingCard = ({ report }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/approval/reports/${report.id}`);
  };

  return (
    <div className={styles['approvalpending-card']} onClick={handleClick}>
      <div className={styles['approvalpending-title']}>{report.title}</div>
      <div className={styles['approvalpending-info']}>
        <span className={styles['approvalpending-status']}>{reportStatusMap[report.reportStatus] || report.reportStatus}</span>
        {/* 목록(reportCreatedAt)과 상세(createdAt)에서 오는 날짜 데이터를 모두 처리 */}
        <span className={styles['approvalpending-date']}>{new Date(report.createdAt || report.reportCreatedAt).toLocaleDateString()}</span>
        <span className={styles['approvalpending-writer']}>{report.name}</span>
      </div>
      {report.approvalLine && (
        <div className={styles['approval-line']}>
          {report.approvalLine.map((a, i) => {
            const s = approvalStatusMap[a.approvalStatus] || approvalStatusMap.PENDING;
            return (
              <div key={i} className={styles['approval-item']} style={{ borderColor: s.color }}>
                <span className={styles['approval-status-icon']} style={{ color: s.color }}>{s.icon}</span>
                <span className={styles['approver-name']}>{a.name}</span>
                <span className={styles['approval-status']} style={{ color: s.color }}>{s.text}</span>
                <span className={styles['approval-date']}>{a.approvedAt ? new Date(a.approvedAt).toLocaleDateString() : '-'}</span>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default ApprovalPendingCard; 