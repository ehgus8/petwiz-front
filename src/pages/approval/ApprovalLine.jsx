import React from 'react';
import './ApprovalLine.module.scss';

const approvalStatusMap = {
  PENDING: { color: '#bdbdbd', text: '대기', icon: '⏳' },
  APPROVED: { color: '#4caf50', text: '승인', icon: '✔️' },
  REJECTED: { color: '#f44336', text: '반려', icon: '❌' },
};

const ApprovalLine = ({ approvers = [] }) => (
  <div className="approval-line">
    {approvers.map((a, i) => {
      const s = approvalStatusMap[a.approvalStatus] || approvalStatusMap.PENDING;
      return (
        <div key={i} className="approval-item" style={{ borderColor: s.color }}>
          <span className="approval-status-icon" style={{ color: s.color }}>{s.icon}</span>
          <span className="approver-name">{a.name}</span>
          <span className="approval-status" style={{ color: s.color }}>{s.text}</span>
          <span className="approval-date">{a.approvedAt ? a.approvedAt.slice(0,10) : '-'}</span>
        </div>
      );
    })}
  </div>
);

export default ApprovalLine; 