import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import styles from './TemplateSelectionModal.module.scss';

const TemplateSelectionModal = ({ open, onClose, onStartWriting }) => {
  // --- 모든 훅(Hook)은 조건문 없이 컴포넌트 최상단에서 호출되어야 합니다. ---
  const [allTemplates, setAllTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // 훅 내부의 조건문은 괜찮습니다. 훅 자체는 매번 호출되기 때문입니다.
    if (!open) return;

    const fetchTemplates = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/templates/list`);
        setAllTemplates(res.data?.result || []);
      } catch (err) {
        console.error("Error fetching templates:", err);
        setError("양식을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [open]);

  // 검색어에 따라 필터링된 템플릿 목록 (useMemo로 성능 최적화)
  const filteredTemplates = useMemo(() => {
    if (!searchTerm) return allTemplates;
    return allTemplates.filter(template =>
      template.template.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allTemplates, searchTerm]);

  // --- 모든 훅 호출이 끝난 후에 조건부 렌더링을 처리합니다. ---
  // 이 if문이 훅 호출보다 위에 있으면 "Rules of Hooks" 에러가 발생합니다.
  if (!open) {
    return null;
  }

  // --- 이벤트 핸들러 함수들 ---
  const handleTemplateClick = (templateId) => {
    setSelectedTemplateId(prevId => (prevId === templateId ? null : templateId));
  };

  const handleStart = () => {
    if (selectedTemplateId) {
      onStartWriting(selectedTemplateId);
    } else {
      alert('작성할 양식을 선택해주세요.');
    }
  };

  const handleStartWithoutTemplate = () => {
    onStartWriting(0);
  };

  // 로딩/에러/콘텐츠 렌더링을 위한 헬퍼 함수
  const renderContent = () => {
    if (loading) return <p>양식을 불러오는 중...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (filteredTemplates.length === 0) return <p>표시할 양식이 없습니다.</p>;

    return (
      <div className={styles.templateGrid}>
        {filteredTemplates.map(template => (
          <div
            key={template.templateId}
            className={`${styles.templateCard} ${selectedTemplateId === template.templateId ? styles.selected : ''}`}
            onClick={() => handleTemplateClick(template.templateId)}
          >
            <span>{template.template.title}</span>
          </div>
        ))}
      </div>
    );
  };
  console.log('✅ 3단계: 모달이 받은 open prop:', open);
  // --- 최종 JSX 렌더링 ---
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
          <div className={styles.header}>
            <h2>결재 양식 선택</h2>
            <button onClick={onClose} className={styles.closeButton}>×</button>
          </div>

          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="양식 이름으로 검색하세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.body}>
            {renderContent()}
          </div>

          <div className={styles.footer}>
            <button onClick={handleStartWithoutTemplate} className={styles.defaultButton}>
              템플릿 없이 작성
            </button>
            <button onClick={handleStart} className={styles.primaryButton} disabled={!selectedTemplateId}>
              선택한 양식으로 작성
            </button>
          </div>
        </div>
      </div>
  );
};

export default TemplateSelectionModal;