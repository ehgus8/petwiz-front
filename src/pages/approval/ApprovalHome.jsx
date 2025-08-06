import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../configs/axios-config';
import { UserContext } from '../../context/UserContext';
import styles from './ApprovalHome.module.scss';
import SummaryCard from './SummaryCard';
import ApprovalPendingList from './ApprovalPendingList';
import FrequentTemplatesModal from './FrequentTemplatesModal';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import CompletedBox from './CompletedBox';
import ScheduledBox from './ScheduledBox';

const ApprovalHome = () => {
  const navigate = useNavigate();
  const { user, setCounts } = useContext(UserContext);

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allTemplates, setAllTemplates] = useState([]);
  const [frequentTemplates, setFrequentTemplates] = useState([]);
  const [inProgressTotal, setInProgressTotal] = useState(0);
  const [completedTotal, setCompletedTotal] = useState(0);
  const [scheduledTotal, setScheduledTotal] = useState(0);
  const [activeBox, setActiveBox] = useState('inProgress');

  useEffect(() => {
    if (!user) return;

    const initialize = async () => {
      setLoading(true);

      try {
        const [
          templatesRes,
          pendingRes,
          inProgressRes,
          rejectedRes,
          // ★★★ 1. 요청을 DRAFT와 RECALLED로 분리합니다.
          draftRes,
          recalledRes,
          scheduledRes,
          ccRes,
          completedWriterRes,
          completedApproverRes
        ] = await Promise.all([
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/templates/list`),
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, { params: { role: 'approver', status: 'IN_PROGRESS', size: 1 } }),
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, { params: { role: 'writer', status: 'IN_PROGRESS', size: 1 } }),
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, { params: { role: 'writer', status: 'REJECTED', size: 1 } }),
          // ★★★ 2. 'DRAFT' 상태만 요청
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, { params: { role: 'writer', status: 'DRAFT', size: 1 } }),
          // ★★★ 3. 'RECALLED' 상태만 요청
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, { params: { role: 'writer', status: 'RECALLED', size: 1 } }),
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports/list/scheduled`, { params: { size: 1 } }),
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, { params: { role: 'reference', size: 1 } }),
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, { params: { role: 'writer', status: 'APPROVED', size: 1 } }),
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, { params: { role: 'approver', status: 'APPROVED', size: 1 } }),
        ]);

        const serverTemplates = templatesRes.data?.result || [];
        setAllTemplates(serverTemplates);
        const storedIds = JSON.parse(localStorage.getItem('frequentTemplates') || '[]');
        const serverTemplateIds = new Set(serverTemplates.map((t) => t.templateId));
        const validFrequentIds = storedIds.filter((id) => serverTemplateIds.has(id));
        setFrequentTemplates(validFrequentIds);
        
        const getTotalElements = (response) => response.data?.result?.totalElements || 0;
        
        const newCounts = {
          pending: getTotalElements(pendingRes),
          inProgress: getTotalElements(inProgressRes),
          rejected: getTotalElements(rejectedRes),
          // ★★★ 4. DRAFT와 RECALLED 결과를 합산합니다.
          drafts: getTotalElements(draftRes) + getTotalElements(recalledRes),
          scheduled: getTotalElements(scheduledRes),
          cc: getTotalElements(ccRes),
          completed: getTotalElements(completedWriterRes) + getTotalElements(completedApproverRes),
        };

        setCounts(newCounts);
        
        setInProgressTotal(newCounts.pending);
        setScheduledTotal(newCounts.scheduled);
        setCompletedTotal(newCounts.completed);

      } catch (error) {
        console.error("전자결재 홈 데이터 초기화 실패:", error);
        setInProgressTotal(0);
        setScheduledTotal(0);
        setCompletedTotal(0);
        setCounts({ pending: 0, inProgress: 0, rejected: 0, drafts: 0, scheduled: 0, cc: 0, completed: 0 });
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [user, setCounts]);
  
  // (이하 나머지 코드는 동일)
  const handleSaveTemplates = (selectedTemplateIds) => {
    localStorage.setItem('frequentTemplates', JSON.stringify(selectedTemplateIds));
    setFrequentTemplates(selectedTemplateIds);
    setIsModalOpen(false);
    alert('설정이 저장되었습니다.');
  };

  const handleRemoveFrequentTemplate = (e, templateIdToRemove) => {
    e.stopPropagation();
    const updatedIds = frequentTemplates.filter((id) => id !== templateIdToRemove);
    setFrequentTemplates(updatedIds);
    localStorage.setItem('frequentTemplates', JSON.stringify(updatedIds));
  };

  const getTemplateTitle = (templateId) => {
    const template = allTemplates.find((t) => t.templateId === templateId);
    return template ? template.template.title : '알 수 없는 양식';
  };

  return (
    <div className={styles.approvalHomeContainer}>
      {isModalOpen && (
        <FrequentTemplatesModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTemplates}
          allTemplates={allTemplates}
          initialSelectedIds={frequentTemplates}
        />
      )}

      <div className={styles.frequentTemplatesSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>자주 쓰는 결재 양식</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className={styles.manageButton}
          >
            관리하기
          </button>
        </div>
        {frequentTemplates.length > 0 ? (
          <div className={styles.templatesGrid}>
            {frequentTemplates.map((templateId) => (
              <div
                key={templateId}
                className={styles.templateCard}
                onClick={() => navigate(`/approval/new?templateId=${templateId}`)}
              >
                <button
                  className={styles.removeButton}
                  onClick={(e) => handleRemoveFrequentTemplate(e, templateId)}
                >
                  ×
                </button>
                <span style={{fontSize: 32, color: '#007BFF', marginBottom: 6}}>📝</span>
                <span>{getTemplateTitle(templateId)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noTemplates}>
            <span>결재 양식 사용정보가 존재하지 않습니다.</span>
            <button
              onClick={() => setIsModalOpen(true)}
              className={styles.addButton}
            >
              + 추가하기
            </button>
          </div>
        )}
      </div>

      <div className={styles.summarySection}>
        <SummaryCard
          title='결재 예정 문서'
          count={`${inProgressTotal}건`}
          icon={<span style={{color: '#007BFF', fontSize: 22}}>📬</span>}
          onClick={() => setActiveBox('inProgress')}
          active={activeBox === 'inProgress'}
        />
        <SummaryCard
          title='예약 문서'
          count={`${scheduledTotal}건`}
          icon={<span style={{color: '#ff9800', fontSize: 22}}>⏰</span>}
          onClick={() => setActiveBox('scheduled')}
          active={activeBox === 'scheduled'}
        />
        <SummaryCard
          title='결재 완료 문서'
          count={`${completedTotal}건`}
          icon={<span style={{color: '#6C757D', fontSize: 22}}>🗂️</span>}
          onClick={() => setActiveBox('history')}
          active={activeBox === 'history'}
        />
      </div>

      <div className={styles.reportListContainer}>
        {loading ? (
          <div className={styles.loading}>로딩 중...</div>
        ) : activeBox === 'inProgress' ? (
          <ApprovalPendingList />
        ) : activeBox === 'scheduled' ? (
          <ScheduledBox />
        ) : activeBox === 'history' ? (
          <CompletedBox />
        ) : null}
      </div>
    </div>
  );
};

export default ApprovalHome;