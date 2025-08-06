import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '../../configs/axios-config';
import DraftBoxCard from './DraftBoxCard';
import styles from './DraftBoxList.module.scss';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import ReportFilter from '../../components/approval/ReportFilter';
import { useReportFilter } from '../../hooks/useReportFilter';
import EmptyState from '../../components/approval/EmptyState';
import Pagination from '../../components/approval/Pagination'; // 페이지네이션 추가
import SkeletonCard from '../../components/approval/SkeletonCard';

const DraftBoxList = () => {
  const [scheduledDocs, setScheduledDocs] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 페이지네이션 상태 추가
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const { filteredReports, handleFilterChange } = useReportFilter(reports);
  const [trueTotalCount, setTrueTotalCount] = useState(0);

  const fetchReports = useCallback(async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      // 1. 'DRAFT' 상태의 문서를 가져오는 요청
      const draftPromise = axiosInstance.get(
        `${API_BASE_URL}${APPROVAL_SERVICE}/reports`,
        {
          params: {
            role: 'writer',
            status: 'DRAFT', 
            sortBy: 'reportCreatedAt',
            sortOrder: 'desc',
            page: page,
            size: 10,
          },
        }
      );
      
      // 2. 'RECALLED' 상태의 문서를 가져오는 요청
      const recalledPromise = axiosInstance.get(
        `${API_BASE_URL}${APPROVAL_SERVICE}/reports`,
        {
          params: {
            role: 'writer',
            status: 'RECALLED',
            sortBy: 'reportCreatedAt',
            sortOrder: 'desc',
            page: page,
            size: 10,
          },
        }
      );
  
      // ★★★ 두 요청을 Promise.all로 병렬 처리 ★★★
      const [draftRes, recalledRes] = await Promise.all([
        draftPromise,
        recalledPromise,
      ]);
  
      const drafts = draftRes.data?.result?.reports || [];
      const recalled = recalledRes.data?.result?.reports || [];
      
      // ★★★ 디버깅을 위한 로그 추가 ★★★
      console.log("📄 [DraftBoxList] 'DRAFT' API 응답:", draftRes.data.result);
      console.log("📄 [DraftBoxList] 'RECALLED' API 응답:", recalledRes.data.result);

      // 3. 두 목록을 합치고 중복 제거 (혹시 모를 경우를 대비)
      // DRAFT와 RECALLED는 같은 문서일 가능성이 거의 없지만, 안전한 방법입니다.
      const combinedReportsRaw = [...drafts, ...recalled];
      const uniqueReportsMap = new Map(combinedReportsRaw.map(doc => [doc.id, doc]));
      const combinedReports = Array.from(uniqueReportsMap.values()).sort(
        (a, b) => new Date(b.reportCreatedAt) - new Date(a.reportCreatedAt),
      );
  
      setReports(combinedReports);

      const draftTotal = draftRes.data?.result?.totalElements || 0;
      const recalledTotal = recalledRes.data?.result?.totalElements || 0;
      const total = draftTotal + recalledTotal;
      setTrueTotalCount(total);

       // 페이지네이션 정보 설정
      const draftTotalPages = draftRes.data?.result?.totalPages || 0;
      const recalledTotalPages = recalledRes.data?.result?.totalPages || 0;
      setTotalPages(Math.max(draftTotalPages, recalledTotalPages)); 
      setCurrentPage(page);

      // ★★★ 최종 계산된 개수 로그 ★★★
      console.log(`📊 [DraftBoxList] DRAFT 문서 개수: ${drafts.length}개`);
      console.log(`📊 [DraftBoxList] RECALLED 문서 개수: ${recalled.length}개`);
      console.log(`📊 [DraftBoxList] 최종 결합된 임시 저장 문서 개수: ${combinedReports.length}개`);

    } catch (err) {
      console.error('임시 저장 문서 조회 실패:', err);
      setError('네트워크 오류 또는 서버 오류');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handlePageChange = (newPage) => {
    fetchReports(newPage);
  };
  
  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>내 임시저장함</h2>
      <ReportFilter onFilterChange={handleFilterChange} />
      
      {error && <div className={styles.error}>{error}</div>}
  
      {loading && (
        <div className={styles.list}>
          {Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      )}
  
      {!loading && !error && (
        <>
          {trueTotalCount > 0 && (
            <div className={styles.resultInfo}>총 {trueTotalCount}건의 문서가 있습니다.</div>
          )}
          {filteredReports.length > 0 ? (
            <div className={styles.list}>
              {filteredReports.map((report) => (
                <DraftBoxCard key={report.id} draft={report} />
              ))}
            </div>
          ) : (
            <EmptyState icon="🗂️" message="임시 저장된 문서가 없습니다." />
          )}
          {totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default React.memo(DraftBoxList);