import React from 'react';
import DraftBoxCard from './DraftBoxCard';

/**
 * CcBox로부터 받은 데이터를 DraftBoxCard가 사용할 수 있는 props 형식으로 변환(Adapt)하는 컴포넌트입니다.
 * 
 * 데이터 필드 이름의 불일치 문제를 해결합니다.
 * - approvalLine -> approvalLines
 * - submittedAt -> createdAt
 * - title -> title (유지)
 * - ... 등 필요한 필드 매핑
 */
const CcBoxCard = ({ doc }) => {

  const adaptedDraft = {
    ...doc,
    // id: doc.reportId, 
    approvalLines: doc.approvalLine, 
    createdAt: doc.submittedAt,     
  };

  return <DraftBoxCard draft={adaptedDraft} />;
};

export default CcBoxCard; 