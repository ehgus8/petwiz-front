import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../configs/axios-config';
import { UserContext } from '../../context/UserContext';
import styles from './ApprovalBoxList.module.scss';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';

const ApprovalBoxList = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  
  const [pageData, setPageData] = useState({
    reports: [],
    totalPages: 0,
    totalElements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');

  // 백엔드 ReportStatus Enum과 프론트엔드 표시 텍스트 매핑
  const reportStatusMap = {
    DRAFT: '임시 저장',
    IN_PROGRESS: '진행중',
    APPROVED: '승인',
    REJECTED: '반려',
    RECALLED: '회수',
  };

  useEffect(() => {
    const fetchReports = async () => {
      // 로그인 상태가 아니면 API를 호출하지 않습니다.
      if (!user || !user.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        
        const params = { role: 'approver' };
        // '진행중' 탭일 때만 status 파라미터를 추가합니다.
        if (activeTab === 'IN_PROGRESS') {
          params.status = 'IN_PROGRESS';
        }

        const response = await axiosInstance.get(
          `${API_BASE_URL}${APPROVAL_SERVICE}/reports`,
          { params } 
        );

        // 백엔드의 CommonResDto에 맞춰 'data'를 사용하고, 페이징 정보도 저장합니다.
        if (response.data?.data) {
          setPageData({
            reports: response.data.data.reports || [],
            totalPages: response.data.data.totalPages || 0,
            totalElements: response.data.data.totalElements || 0,
          });
        } else {
          setPageData({ reports: [], totalPages: 0, totalElements: 0 });
        }
        setError(null);
      } catch (err) {
        console.error('결재 문서를 불러오는 중 오류 발생:', err);
        setError('결재 문서를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user, activeTab]); // user 또는 activeTab이 바뀔 때마다 API를 다시 호출

  const tabs = [
    { id: 'ALL', label: '전체' },
    { id: 'IN_PROGRESS', label: '진행중' },
  ];

  // 날짜별로 그룹화하는 함수
  const groupReportsByDate = (reportsToGroup) => {
    if (!reportsToGroup) return {};
    return reportsToGroup.reduce((acc, report) => {
      const date = new Date(report.createdAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(report);
      return acc;
    }, {});
  };

  if (loading) return <div className={styles.loading}>로딩 중...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  const groupedReports = groupReportsByDate(pageData.reports);

  return (
    <div className={styles.reportListContainer}>
      <div className={styles.tabHeader}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? styles.active : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {`${tab.label} ${activeTab === tab.id ? pageData.totalElements : ''}`}
          </button>
        ))}
      </div>

      <div className={styles.listHeader}>
        <div className={styles.headerCell} style={{ flex: 3 }}>문서제목</div>
        <div className={styles.headerCell} style={{ flex: 1 }}>기안자</div>
        <div className={styles.headerCell} style={{ flex: 1 }}>기안일</div>
        <div className={styles.headerCell} style={{ flex: 1 }}>문서상태</div>
      </div>

      <div className={styles.reportList}>
        {pageData.reports.length > 0 ? (
          Object.entries(groupedReports).map(([date, reportsOnDate]) => (
            <div key={date} className={styles.dateGroup}>
              <div className={styles.dateHeader}>{date}</div>
              {reportsOnDate
                .map((report) => (
                  <div
                    key={report.id}
                    className={styles.reportItem}
                    onClick={() => navigate(`/approval/reports/${report.id}`)}
                  >
                    <div className={styles.itemCell} style={{ flex: 3 }}>
                      <div className={styles.titleContainer}>
                        <span className={styles.title}>{report.title}</span>
                        {/* 첨부파일 표시 */}
                        {report.attachments && report.attachments.length > 0 && (
                          <span className={styles.attachmentBadge} title={`첨부파일 ${report.attachments.length}개`}>
                            📎 {report.attachments.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.itemCell} style={{ flex: 1 }}>
                      {report.name || '정보 없음'}
                    </div>
                    <div className={styles.itemCell} style={{ flex: 1 }}>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                    <div className={styles.itemCell} style={{ flex: 1 }}>
                      <span className={`${styles.status} ${styles[report.reportStatus?.toLowerCase() || '']}`}>
                        {reportStatusMap[report.reportStatus] || report.reportStatus || '상태 없음'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ))
        ) : (
          <div className={styles.noReports}>
            <div className={styles.noReportsIcon}>📂</div>
            <p>결재할 문서가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalBoxList;