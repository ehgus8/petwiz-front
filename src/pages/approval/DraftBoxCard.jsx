import React, { useState } from 'react';
import styles from './DraftBoxCard.module.scss';
import { useNavigate } from 'react-router-dom';
import VisualApprovalLine from '../../components/approval/VisualApprovalLine';
import ApprovalLineModal from '../../components/approval/ApprovalLineModal';
import ModalPortal from '../../components/approval/ModalPortal';

const DraftBoxCard = ({ draft }) => {
  console.log('DraftBoxCard draft:', draft);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = () => {
    // 임시저장/회수 문서는 수정 페이지로, 나머지는 상세 페이지로 이동
    if (draft.reportStatus === 'DRAFT' || draft.reportStatus === 'RECALLED') {
      navigate(`/approval/edit/${draft.id}`);
    } else {
      navigate(`/approval/reports/${draft.id}`);
    }
  };
  
  const docIcon = draft.templateName?.includes('휴가') ? '🌴' : '📄';

  // 첨부파일 개수 계산
  const attachmentCount = draft.attachments?.length || 0;

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
      </div>

      {/* Center Section: 제목 및 정보 */}
      <div className={styles['center-section']}>
        <div className={styles['card-title']}>{draft.title || '제목 없음'}</div>
        <div className={styles['card-info']}>
          <span>기안일: {draft.createdAt || draft.reportCreatedAt ? new Date(draft.createdAt || draft.reportCreatedAt).toLocaleDateString() : '-'}</span>
          <span style={{ margin: '0 8px' }}>|</span>
          <span>기안자: {draft.writer?.name || draft.name || '미지정'}</span>
        </div>
      </div>

      {/* Right Section: 시각적 결재선 */}
      <div
        className={styles['right-section']}
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

export default DraftBoxCard; 