import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../configs/axios-config';
import { UserContext } from '../../context/UserContext';
import styles from './ApprovalHome.module.scss';
import SummaryCard from './SummaryCard';
import MyReportsList from './MyReportsList';
import FrequentTemplatesModal from './FrequentTemplatesModal';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';

// 아이콘 임포트
import delayedIcon from '/icons/advanced.png';
import uncheckedIcon from '/icons/intermediate.png';
import ccIcon from '/icons/beginner.png';
import historyIcon from '/icons/master.png';
import templateIcon from '/icons/admin.png';

const ApprovalHome = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  // --- 상태(State) 선언 ---
  const [summaryData, setSummaryData] = useState({ delayed: 0, unchecked: 0, cc: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [allTemplates, setAllTemplates] = useState([]); // 서버에서 가져온 모든 템플릿 목록
  const [frequentTemplates, setFrequentTemplates] = useState([]); // 자주 쓰는 템플릿 ID 배열

  // --- 데이터 초기화 로직 ---
  useEffect(() => {
    if (!user) return;

    const initialize = async () => {
      setLoading(true);
      let serverTemplates = [];

      try {
        // 1. 서버에서 전체 템플릿 목록을 가져옵니다.
        const response = await axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/templates/list`);
        if (response.data && Array.isArray(response.data.result)) {
          serverTemplates = response.data.result;
          setAllTemplates(serverTemplates);
        }
      } catch (error) {
        console.error("Error fetching all templates:", error);
      }

      // 2. localStorage에서 저장된 '자주 쓰는 템플릿' ID 목록을 불러옵니다.
      const storedIds = JSON.parse(localStorage.getItem('frequentTemplates') || '[]');
      
      // 3. 서버에 더 이상 존재하지 않는 템플릿 ID는 제외하여 데이터 정합성을 맞춥니다.
      const serverTemplateIds = new Set(serverTemplates.map(t => t.templateId));
      const validFrequentIds = storedIds.filter(id => serverTemplateIds.has(id));
      
      // 4. 최종적으로 유효한 ID 목록을 상태에 저장합니다.
      setFrequentTemplates(validFrequentIds);

      // (임시 데이터) 요약 카드 데이터 설정
      setSummaryData({ delayed: 5, unchecked: 2, cc: 0, total: 27 });
      
      setLoading(false);
    };

    initialize();
  }, [user]);

  // --- 이벤트 핸들러 ---

  // 모달에서 '저장' 버튼을 눌렀을 때 실행될 콜백 함수
  const handleSaveTemplates = (selectedTemplateIds) => {
    // 1. localStorage에 새로운 ID 목록을 저장합니다.
    localStorage.setItem('frequentTemplates', JSON.stringify(selectedTemplateIds));
    
    // 2. 홈 화면의 상태(state)를 즉시 업데이트하여 리렌더링을 유발합니다.
    setFrequentTemplates(selectedTemplateIds);
    
    // 모달을 닫고 사용자에게 알림을 표시합니다.
    setIsModalOpen(false);
    alert('설정이 저장되었습니다.');
  };

  // '자주 쓰는 양식' 카드에서 x 버튼을 눌렀을 때 실행될 함수
  const handleRemoveFrequentTemplate = (e, templateIdToRemove) => {
    e.stopPropagation(); // 부모 요소(카드)의 클릭 이벤트 전파를 막습니다.
    
    const updatedIds = frequentTemplates.filter(id => id !== templateIdToRemove);
    
    // 상태와 localStorage를 모두 업데이트합니다.
    setFrequentTemplates(updatedIds);
    localStorage.setItem('frequentTemplates', JSON.stringify(updatedIds));
  };
  
  // 템플릿 ID로 템플릿 제목을 찾는 헬퍼 함수
  const getTemplateTitle = (templateId) => {
    const template = allTemplates.find(t => t.templateId === templateId);
    return template ? template.template.title : '알 수 없는 양식';
  };

  // --- 렌더링 ---
  return (
    <div className={styles.approvalHomeContainer}>
      {isModalOpen && (
        <FrequentTemplatesModal 
          open={isModalOpen} // 모달 열림/닫힘 상태 전달
          onClose={() => setIsModalOpen(false)} // 모달 닫기 함수 전달
          onSave={handleSaveTemplates} // '저장' 시 실행될 함수 전달
          allTemplates={allTemplates} // 전체 템플릿 목록 전달
          initialSelectedIds={frequentTemplates} // 현재 선택된 ID 목록 전달
        />
      )}

      {/* 자주 쓰는 결재 양식 섹션 */}
      <div className={styles.frequentTemplatesSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>자주 쓰는 결재 양식</h3>
          <button onClick={() => setIsModalOpen(true)} className={styles.manageButton}>관리하기</button>
        </div>
        {frequentTemplates.length > 0 ? (
          <div className={styles.templatesGrid}>
            {frequentTemplates.map(templateId => (
              <div key={templateId} className={styles.templateCard} onClick={() => navigate(`/approval/new?templateId=${templateId}`)}>
                <button 
                  className={styles.removeButton} 
                  onClick={(e) => handleRemoveFrequentTemplate(e, templateId)}
                >
                  ×
                </button>
                <img src={templateIcon} alt="양식" />
                <span>{getTemplateTitle(templateId)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noTemplates}>
            <span>결재 양식 사용정보가 존재하지 않습니다.</span>
            <button onClick={() => setIsModalOpen(true)} className={styles.addButton}>+ 추가하기</button>
          </div>
        )}
      </div>
      
      {/* 요약 카드 섹션 */}
      <div className={styles.summarySection}>
        <SummaryCard title="일주일 이상 지연된 수신결재" count={`${summaryData.delayed}건`} icon={delayedIcon} />
        <SummaryCard title="처리하지 않은 수신결재" count={`${summaryData.unchecked}건`} icon={uncheckedIcon} />
        <SummaryCard title="확인하지 않은 수신참조" count={`${summaryData.cc}건`} icon={ccIcon} />
        <SummaryCard title="결재내역보기" count={`${summaryData.total}건`} icon={historyIcon} />
      </div>

      {/* 결재 목록 섹션 */}
      <div className={styles.reportListContainer}>
        {loading ? (
          <div className={styles.loading}>로딩 중...</div>
        ) : (
          <MyReportsList />
        )}
      </div>
    </div>
  );
};

export default ApprovalHome;