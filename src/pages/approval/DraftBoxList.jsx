import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '../../configs/axios-config';
import DraftBoxCard from './DraftBoxCard';
import styles from './DraftBoxList.module.scss';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import ReportFilter from '../../components/approval/ReportFilter';
import { useReportFilter } from '../../hooks/useReportFilter';
import EmptyState from '../../components/approval/EmptyState';

const DraftBoxList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 필터링 훅 사용
  const { filteredReports, handleFilterChange } = useReportFilter(reports);

  // fetchReports 함수를 useCallback으로 최적화
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchByStatus = (status) =>
        axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
          params: {
            role: 'writer',
            status,
            sortBy: 'reportCreatedAt',
            sortOrder: 'desc',
            page: 0,
            size: 50,
          },
        });
  
      const [draftRes, recalledRes] = await Promise.all([
        fetchByStatus('DRAFT'),
        fetchByStatus('RECALLED'),
      ]);
  
      const drafts = draftRes.data?.result?.reports || [];
      const recalled = recalledRes.data?.result?.reports || [];
  
      const combinedReports = [...drafts, ...recalled].sort(
        (a, b) => new Date(b.reportCreatedAt) - new Date(a.reportCreatedAt),
      );
  
      setReports(combinedReports);
    } catch (err) {
      console.error(err);
      setError('네트워크 오류 또는 서버 오류');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // 결과 정보를 useMemo로 최적화
  const resultInfo = useMemo(() => {
    if (filteredReports.length > 0) {
      return `총 ${filteredReports.length}건의 문서가 있습니다.`;
    }
    return null;
  }, [filteredReports.length]);

  return (
    <div className={styles.approvalContainer}>
      <div className={styles.container}>
        <h2 className="sectionTitle">임시 저장 문서함</h2>
        
        {/* 필터링 컴포넌트 */}
        <ReportFilter onFilterChange={handleFilterChange} />
        
        <div className={styles.list}>
          {loading && <p>로딩 중...</p>}
          {error && <p className={styles.error}>{error}</p>}
          {!loading && !error && filteredReports.length > 0 ? (
            <>
              {resultInfo && <div className={styles.resultInfo}>{resultInfo}</div>}
              {filteredReports.map((report) => (
                <DraftBoxCard key={report.id} draft={report} />
              ))}
            </>
          ) : (
            !loading && !error && <EmptyState icon="🗂️" message="임시 저장된 문서가 없습니다." />
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(DraftBoxList);