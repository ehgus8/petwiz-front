import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import styles from './DraftBoxCard.module.scss';
import { useNavigate } from 'react-router-dom';
import VisualApprovalLine from '../../components/approval/VisualApprovalLine';
import ApprovalLineModal from '../../components/approval/ApprovalLineModal';
import ModalPortal from '../../components/approval/ModalPortal';
import { UserContext } from '../../context/UserContext';

const DraftBoxCard = ({ draft, showScheduleInfo = false, onCancelSchedule }) => {
  console.log('DraftBoxCard draft:', draft);
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = () => {
    // 임시저장/회수/예약 문서는 수정 페이지로, 나머지는 상세 페이지로 이동
    if (draft.reportStatus === 'DRAFT' || draft.reportStatus === 'RECALLED' || draft.reportStatus === 'SCHEDULED') {
      navigate(`/approval/edit/${draft.id}`);
    } else {
      navigate(`/approval/reports/${draft.id}`);
    }
  };
  
  const docIcon = draft.templateName?.includes('휴가') ? '🌴' : '📄';

  // 첨부파일 개수 계산
  const attachmentCount = draft.attachments?.length || 0;

  // 예약 시간 포맷팅 함수
  const formatScheduledTime = (utcDateString) => {
    if (!utcDateString) return '';
    try {
      const date = new Date(utcDateString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Seoul'
      });
    } catch (error) {
      console.error("날짜 변환 오류", error);
      return utcDateString;
    }
  };

  // 예약 시간까지 남은 시간 계산 함수
  const getTimeUntilScheduled = (scheduledAt) => {
    if (!scheduledAt) return '';
    try {
      const scheduledTime = new Date(scheduledAt);
      const now = new Date();
      const diffMs = scheduledTime - now;
      
      if (diffMs <= 0) return '예약 시간이 지났습니다';
      
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHours > 24) {
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}일 후`;
      } else if (diffHours > 0) {
        return `${diffHours}시간 ${diffMinutes}분 후`;
      } else {
        return `${diffMinutes}분 후`;
      }
    } catch (error) {
      return '';
    }
  };

  return (
    <div className={styles['reportItem']} onClick={handleCardClick}>
      {/* Left Section: 아이콘 및 양식명 */}
      <div className={styles['left-section']}>
        <span className={styles['doc-icon']}>{docIcon}</span>
        <span className={styles['template-name']}>{draft.templateName || '일반 문서'}</span>
        {/* 첨부파일 표시 */}
        {attachmentCount > 0 && (
          <span className={styles['attachment-indicator']} title={`첨부파일 ${attachmentCount}개`}>
            📎 {attachmentCount}
          </span>
        )}
        {/* 예약 정보 표시 */}
        {showScheduleInfo && draft.reportStatus === 'SCHEDULED' && (
          <div className={styles['schedule-info']}>
            <span className={styles['schedule-indicator']} title={`예약 시간: ${formatScheduledTime(draft.scheduledAt)}`}>
              ⏰ {draft.currentApprover}
            </span>
            {draft.scheduledAt && (
              <span className={styles['time-until']}>
                {getTimeUntilScheduled(draft.scheduledAt)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Center Section: 제목 및 정보 */}
      <div className={styles['center-section']}>
        <div className={styles['card-title']}>{draft.title || '제목 없음'}</div>
        <div className={styles['card-info']}>
          <span>기안일: {draft.createdAt || draft.reportCreatedAt ? new Date(draft.createdAt || draft.reportCreatedAt).toLocaleDateString() : '-'}</span>
          <span style={{ margin: '0 8px' }}>|</span>
          <span>기안자: {user?.name || draft.writer?.name || draft.name || '미지정'}</span>
        </div>
      </div>

      {/* Right Section: 시각적 결재선 및 예약 취소 버튼 */}
      <div className={styles['right-section']}>
        <div
          onClick={e => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
          style={{ cursor: 'pointer' }}
          title='결재선 전체보기'
        >
          <VisualApprovalLine
            approvalLine={draft.approvalLine || []}
            reportStatus={draft.reportStatus}
            mode='summary'
          />
        </div>
        {showScheduleInfo && draft.reportStatus === 'SCHEDULED' && onCancelSchedule && (
          <button
            className={styles['cancel-schedule-btn']}
            onClick={(e) => {
              e.stopPropagation(); // 카드 클릭(수정페이지 이동) 방지
              onCancelSchedule(draft.id);
            }}
          >
            예약 취소
          </button>
        )}
      </div>
      {isModalOpen && (
        <ModalPortal>
          <ApprovalLineModal
            approvalLine={draft.approvalLine || []}
            reportStatus={draft.reportStatus}
            onClose={() => setIsModalOpen(false)}
          />
        </ModalPortal>
      )}
    </div>
  );
};

DraftBoxCard.propTypes = {
  draft: PropTypes.object.isRequired,
  showScheduleInfo: PropTypes.bool,
  onCancelSchedule: PropTypes.func,
};

export default DraftBoxCard; 