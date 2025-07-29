// /src/components/approval/ApprovalLineModal.jsx (최종 완성본)

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
        const promises = approvalLine.map(approver =>
          axiosInstance.get(`${API_BASE_URL}${HR_SERVICE}/employees/${approver.employeeId}`)
        );

        const responses = await Promise.all(promises);
        const detailsData = responses.map(res => res.data.result);
        const detailsMap = new Map(detailsData.map(detail => [detail.employeeId, detail]));
        const mergedDetails = approvalLine.map(approver => {
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
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.visualLineWrapper}>
            <VisualApprovalLine
              approvalLine={approverDetails} // ★ 상세 정보가 포함된 데이터를 전달
              reportStatus={reportStatus}
              mode='full'
            />
          </div>

          {loading ? (
            <div className={styles.loading}>로딩 중...</div>
          ) : (
            <ul className={styles.approverList}>
              {approverDetails.map((approver) => (
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
                        <div className={styles.nameAndPosition}>
                           <span className={styles.name}>{approver.name}</span>
                           {/* ★★★ 여기가 핵심 수정 부분입니다 ★★★ */}
                           {/* 필드 이름을 positionName -> position, roleName -> role 로 변경 */}
                           {/* 데이터가 없는 경우를 대비해 안정적인 코드로 변경 */}
                           <span className={styles.position}>
                             {[approver.position, approver.role].filter(Boolean).join(' / ')}
                           </span>
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