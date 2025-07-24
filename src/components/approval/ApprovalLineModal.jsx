import React, { useState, useEffect } from 'react';
import styles from './ApprovalLineModal.module.scss';
import VisualApprovalLine from './VisualApprovalLine';
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, HR_SERVICE } from '../../configs/host-config';
import defaultProfileImage from '../../assets/pin.jpg';
import {
  CheckCircleFill,
  XCircleFill,
  ClockFill,
} from 'react-bootstrap-icons';

// 상태별 아이콘과 텍스트를 반환하는 작은 컴포넌트
const StatusIcon = ({ status }) => {
  switch (status) {
    case 'APPROVED':
      return (
        <div className={`${styles.statusBadge} ${styles.approved}`}>
          <CheckCircleFill />
          <span>승인</span>
        </div>
      );
    case 'REJECTED':
      return (
        <div className={`${styles.statusBadge} ${styles.rejected}`}>
          <XCircleFill />
          <span>반려</span>
        </div>
      );
    default:
      return (
        <div className={`${styles.statusBadge} ${styles.pending}`}>
          <ClockFill />
          <span>대기</span>
        </div>
      );
  }
};

const ApprovalLineModal = ({ approvalLine, reportStatus, onClose }) => {
  const [approverDetails, setApproverDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApproverDetails = async () => {
      if (!approvalLine || approvalLine.length === 0) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const employeeIds = approvalLine.map((a) => a.employeeId);
        const response = await axiosInstance.get(
          `${API_BASE_URL}${HR_SERVICE}/employees/details`,
          {
            params: { ids: employeeIds.join(',') },
          },
        );
        const detailsMap = new Map(
          response.data.result.map((detail) => [detail.employeeId, detail]),
        );
        const mergedDetails = approvalLine.map((approver) => {
          const detail = detailsMap.get(approver.employeeId) || {};
          return { ...approver, ...detail };
        });
        setApproverDetails(mergedDetails);
      } catch (error) {
        console.error('결재자 정보를 불러오는 데 실패했습니다:', error);
        setApproverDetails(approvalLine);
      } finally {
        setLoading(false);
      }
    };
    fetchApproverDetails();
  }, [approvalLine]);

  if (!approvalLine) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>결재선 정보</h3>
          <button onClick={onClose} className={styles.closeButton}>
            &times;
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.visualLineWrapper}>
            <VisualApprovalLine
              approvalLine={approvalLine}
              reportStatus={reportStatus}
              mode='full'
            />
          </div>
          {loading ? (
            <div className={styles.loading}>로딩 중...</div>
          ) : (
            <ul className={styles.approverList}>
              {approverDetails.map((approver, index) => (
                <li key={approver.employeeId} className={styles.approverItem}>
                  <div className={styles.statusIconWrapper}>
                    <StatusIcon status={approver.approvalStatus} />
                  </div>
                  <div className={styles.approverDetails}>
                    <div className={styles.profile}>
                      <img
                        src={approver.profileImageUri || defaultProfileImage}
                        alt='profile'
                        className={styles.profileImage}
                      />
                      <div className={styles.info}>
                        <div className={styles.nameAndTimestamp}>
                          <span className={styles.name}>{approver.name}</span>
                          {approver.approvalDateTime && (
                            <span className={styles.timestamp}>
                              {new Date(
                                approver.approvalDateTime,
                              ).toLocaleString('ko-KR', {
                                year: '2-digit',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                        <span className={styles.dept}>
                          {approver.department}
                        </span>
                      </div>
                    </div>
                    {approver.approvalComment && (
                      <div className={styles.comment}>
                        {approver.approvalComment}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalLineModal; 