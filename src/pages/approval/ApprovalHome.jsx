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

  // --- 상태(State) 선언 ---
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allTemplates, setAllTemplates] = useState([]);
  const [frequentTemplates, setFrequentTemplates] = useState([]);

  // ★ 모든 문서 개수를 이곳에서 중앙 관리합니다.
  const [inProgressTotal, setInProgressTotal] = useState(0);
  const [completedTotal, setCompletedTotal] = useState(0);
  const [scheduledTotal, setScheduledTotal] = useState(0);

  // 어떤 목록을 보여줄지 상태로 관리
  const [activeBox, setActiveBox] = useState('inProgress');

  // --- 데이터 초기화 로직 ---
  useEffect(() => {
    if (!user) return;

    const initialize = async () => {
      setLoading(true);

      // ★ 실제 문서 데이터를 가져와서 개수를 세는 방식으로 변경
      try {
        const [
          templatesRes,
          pendingRes,
          inProgressRes,
          rejectedRes,
          draftsRes,
          scheduledRes,
          ccRes,
          completedWriterRes,
          completedApproverRes,
        ] = await Promise.all([
          // 1. 전체 템플릿 목록
<<<<<<< HEAD
          axiosInstance.get(
            `${API_BASE_URL}${APPROVAL_SERVICE}/templates/list`,
          ),
          // 2. 결재 예정 문서 개수 (size=1로 요청하여 totalElements만 확인)
=======
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/templates/list`),
          // 2. 결재 예정 문서 (실제 데이터)
>>>>>>> 7f052367a475e9d2146604f39d113726c89435fa
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
            params: { role: 'approver', status: 'IN_PROGRESS', size: 1000 },
          }),
<<<<<<< HEAD
          // 3. 예약 문서 개수
          axiosInstance.get(
            `${API_BASE_URL}${APPROVAL_SERVICE}/reports/list/scheduled`,
            {
              params: { size: 1 },
            },
          ),
          // 4. 내가 기안한 완료 문서 개수
=======
          // 3. 결재 중 문서 (실제 데이터)
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
            params: { role: 'writer', status: 'IN_PROGRESS', size: 1000 },
          }),
          // 4. 반려 문서 (실제 데이터)
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
            params: { role: 'writer', status: 'REJECTED', size: 1000 },
          }),
          // 5. 임시저장 문서 (실제 데이터)
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
            params: { role: 'writer', status: 'DRAFT,RECALLED', size: 1000 },
          }),
          // 6. 예약 문서 (실제 데이터)
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports/list/scheduled`, {
            params: { size: 1000 },
          }),
          // 7. 수신참조 문서 (실제 데이터)
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
            params: { role: 'reference', size: 1000 },
          }),
          // 8. 내가 기안한 완료 문서 개수
>>>>>>> 7f052367a475e9d2146604f39d113726c89435fa
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
            params: { role: 'writer', status: 'APPROVED', size: 1 },
          }),
          // 9. 내가 결재한 완료 문서 개수
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
            params: { role: 'approver', status: 'APPROVED', size: 1 },
          }),
        ]);

        // --- 각 상태 업데이트 ---

        // 템플릿 관련 상태 설정
        const serverTemplates = templatesRes.data?.result || [];
        setAllTemplates(serverTemplates);
        const storedIds = JSON.parse(
          localStorage.getItem('frequentTemplates') || '[]',
        );
        const serverTemplateIds = new Set(
          serverTemplates.map((t) => t.templateId),
        );
        const validFrequentIds = storedIds.filter((id) =>
          serverTemplateIds.has(id),
        );
        setFrequentTemplates(validFrequentIds);
<<<<<<< HEAD

        // 문서 개수 상태 설정
        setInProgressTotal(pendingRes.data.result?.totalElements || 0);
        setScheduledTotal(scheduledRes.data.result?.totalElements || 0);
        const totalWriter = completedWriterRes.data.result?.totalElements || 0;
        const totalApprover =
          completedApproverRes.data.result?.totalElements || 0;
        setCompletedTotal(totalWriter + totalApprover);
=======
        
        // ★ 실제 데이터의 개수를 세어서 저장
        const newCounts = {
          pending: pendingRes.data.result?.reports?.length || 0,
          inProgress: inProgressRes.data.result?.reports?.length || 0,
          rejected: rejectedRes.data.result?.reports?.length || 0,
          drafts: draftsRes.data.result?.reports?.length || 0,
          scheduled: scheduledRes.data.result?.reports?.length || 0,
          cc: ccRes.data.result?.reports?.length || 0,
          completed: (completedWriterRes.data.result?.totalElements || 0) + (completedApproverRes.data.result?.totalElements || 0),
        };

        // UserContext의 counts 업데이트
        setCounts(newCounts);
        
        // 문서 개수 상태 설정
        setInProgressTotal(newCounts.pending);
        setScheduledTotal(newCounts.scheduled);
        setCompletedTotal(newCounts.completed);

>>>>>>> 7f052367a475e9d2146604f39d113726c89435fa
      } catch (error) {
        console.error('전자결재 홈 데이터 초기화 실패:', error);
        // 에러 발생 시 모든 카운트를 0으로 설정하여 오해를 방지
        setInProgressTotal(0);
        setScheduledTotal(0);
        setCompletedTotal(0);
        
        // UserContext도 0으로 초기화
        setCounts({
          pending: 0,
          inProgress: 0,
          rejected: 0,
          drafts: 0,
          scheduled: 0,
          cc: 0,
          completed: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [user, setCounts]);

  // --- 이벤트 핸들러 ---
  const handleSaveTemplates = (selectedTemplateIds) => {
    localStorage.setItem(
      'frequentTemplates',
      JSON.stringify(selectedTemplateIds),
    );
    setFrequentTemplates(selectedTemplateIds);
    setIsModalOpen(false);
    alert('설정이 저장되었습니다.');
  };

  const handleRemoveFrequentTemplate = (e, templateIdToRemove) => {
    e.stopPropagation(); // 부모 요소(카드)의 클릭 이벤트 전파를 막습니다.
    const updatedIds = frequentTemplates.filter(
      (id) => id !== templateIdToRemove,
    );
    setFrequentTemplates(updatedIds);
    localStorage.setItem('frequentTemplates', JSON.stringify(updatedIds));
  };

  const getTemplateTitle = (templateId) => {
    const template = allTemplates.find((t) => t.templateId === templateId);
    return template ? template.template.title : '알 수 없는 양식';
  };

  // --- 렌더링 ---
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

      {/* 자주 쓰는 결재 양식 섹션 */}
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
                onClick={() =>
                  navigate(`/approval/new?templateId=${templateId}`)
                }
              >
                <button
                  className={styles.removeButton}
                  onClick={(e) => handleRemoveFrequentTemplate(e, templateId)}
                >
                  ×
                </button>
                <span
                  style={{ fontSize: 32, color: '#007BFF', marginBottom: 6 }}
                >
                  📝
                </span>
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

      {/* 요약 카드 섹션 (이제 모든 카운트가 올바르게 표시됩니다) */}
      <div className={styles.summarySection}>
        <SummaryCard
          title='결재 예정 문서'
          count={`${inProgressTotal}건`}
          icon={<span style={{ color: '#007BFF', fontSize: 22 }}>📬</span>}
          onClick={() => setActiveBox('inProgress')}
          active={activeBox === 'inProgress'}
          // onClick={() => navigate('/approval/in-progress')}  // ✅ 라우팅 이동
          // active={window.location.pathname === '/approval/in-progress'} // ❗선택된 상태 표시 시 사용 가능
        />
        <SummaryCard
          title='예약 문서'
          count={`${scheduledTotal}건`}
          icon={<span style={{ color: '#ff9800', fontSize: 22 }}>⏰</span>}
          onClick={() => setActiveBox('scheduled')}
          active={activeBox === 'scheduled'}
        />
        <SummaryCard
          title='결재 완료 문서'
          count={`${completedTotal}건`}
          icon={<span style={{ color: '#6C757D', fontSize: 22 }}>🗂️</span>}
          onClick={() => setActiveBox('history')}
          active={activeBox === 'history'}
        />
      </div>

      {/* 선택된 카드에 따라 컴포넌트 렌더링 */}
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
