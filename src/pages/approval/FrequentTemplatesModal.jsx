import React, { useState, useEffect } from 'react';
import styles from './FrequentTemplatesModal.module.scss';

// 아이콘 컴포넌트 (실제 아이콘 라이브러리로 대체 가능)
const PlusIcon = () => <span className={styles.icon}>+</span>;
const CheckIcon = () => <span className={styles.icon}>✓</span>;

const FrequentTemplatesModal = ({ open, onClose, onSave, allTemplates, initialSelectedIds = [] }) => {
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. 컴포넌트가 열릴 때, 부모로부터 받은 초기 선택 ID 목록으로 선택된 템플릿 상태를 구성합니다.
  useEffect(() => {
    if (open && allTemplates.length > 0) {
      const selected = initialSelectedIds
        .map(id => allTemplates.find(t => t.templateId === id))
        .filter(Boolean); // ID가 삭제된 경우를 대비해 null/undefined 값 제거
      setSelectedTemplates(selected);
    }
  }, [open, allTemplates, initialSelectedIds]);

  // 2. 검색어가 변경될 때마다 전체 양식 목록을 필터링합니다.
  useEffect(() => {
    const filtered = allTemplates.filter(t =>
      t.template.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTemplates(filtered);
  }, [searchTerm, allTemplates]);

  // 3. 양식 선택/해제 핸들러
  const handleToggleTemplate = (template) => {
    const isSelected = selectedTemplates.some(t => t.templateId === template.templateId);
    if (isSelected) {
      setSelectedTemplates(prev => prev.filter(t => t.templateId !== template.templateId));
    } else {
      if (selectedTemplates.length < 10) {
        setSelectedTemplates(prev => [...prev, template]);
      } else {
        alert('자주 쓰는 결재는 최대 10개까지 추가할 수 있습니다.');
      }
    }
  };

  // 4. 상단의 선택된 양식 제거 핸들러
  const handleRemoveSelected = (templateId) => {
    setSelectedTemplates(prev => prev.filter(t => t.templateId !== templateId));
  };

  // 5. 저장 버튼 핸들러: localStorage에 직접 저장하지 않고, 부모에게 선택된 ID 목록을 전달합니다.
  const handleSave = () => {
    const selectedIds = selectedTemplates.map(t => t.templateId);
    onSave(selectedIds); // 부모 컴포넌트의 onSave 함수를 호출
  };

  // 6. 모달이 닫혀 있으면 아무것도 렌더링하지 않습니다.
  if (!open) {
    return null;
  }
  
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>자주쓰는 결재를 설정합니다.</h3>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        <div className={styles.modalBody}>
          {/* 상단: 선택된 양식 목록 */}
          <div className={styles.selectedSection}>
            <div className={styles.sectionHeader}>
              <h4>자주 쓰는 결재</h4>
              <p>순서를 변경해보세요. 자주쓰는 결재는 최대 10개까지 지정 가능하며, 홈 화면의 바로가기 순서로 반영됩니다.</p>
            </div>
            <div className={styles.selectedList}>
              {selectedTemplates.map(template => (
                <div key={template.templateId} className={styles.selectedItem}>
                  <span>{template.template.title}</span>
                  <button onClick={() => handleRemoveSelected(template.templateId)}>×</button>
                </div>
              ))}
            </div>
          </div>

          {/* 하단: 전체 양식 그리드 */}
          <div className={styles.selectionSection}>
            <div className={styles.sectionHeader}>
              <h4>결재양식</h4>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  placeholder="양식명을 검색하세요"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.templateGrid}>
              {filteredTemplates.map(template => {
                const isSelected = selectedTemplates.some(t => t.templateId === template.templateId);
                return (
                  <button
                    key={template.templateId}
                    className={`${styles.templateItem} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleToggleTemplate(template)}
                  >
                    <div className={styles.itemActionIcon}>
                      {isSelected ? <CheckIcon /> : <PlusIcon />}
                    </div>
                    <div className={styles.itemIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="#4A5568" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2V8H20" stroke="#4A5568" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 13H8" stroke="#4A5568" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 17H8" stroke="#4A5568" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span className={styles.itemTitle}>{template.template.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelButton}>취소</button>
          <button onClick={handleSave} className={styles.saveButton}>저장</button>
        </div>
      </div>
    </div>
  );
};

export default FrequentTemplatesModal;