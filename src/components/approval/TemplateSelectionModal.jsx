import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import styles from './TemplateSelectionModal.module.scss';

const TemplateSelectionModal = ({ open, onClose, onStartWriting }) => {
  // --- 모든 훅(Hook)은 조건문 없이 컴포넌트 최상단에서 호출되어야 합니다. ---
  const [allTemplates, setAllTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!open) return;
    const fetchTemplatesAndCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const [tplRes, catRes] = await Promise.all([
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/templates/list`),
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/category`)
        ]);
        setAllTemplates(tplRes.data?.result || []);
        setCategories(catRes.data?.result || []);
      } catch (err) {
        console.error("Error fetching templates or categories:", err);
        setError("양식/카테고리 불러오기 오류");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplatesAndCategories();
  }, [open]);

  // 검색어에 따라 필터링된 템플릿 목록 (useMemo로 성능 최적화)
  const filteredTemplates = useMemo(() => {
    let filtered = allTemplates;
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(t => String(t.categoryId) === selectedCategory);
    }
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.template.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [allTemplates, searchTerm, selectedCategory]);

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
            <div>
              <span>{template.template.title}</span>
              {template.template.description && (
                <div className={styles.templateDesc}>{template.template.description}</div>
              )}
            </div>
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
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className={styles.categorySelect}
            >
              <option value="ALL">전체</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.categoryName}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="양식 이름으로 검색하세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginLeft: 8 }}
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