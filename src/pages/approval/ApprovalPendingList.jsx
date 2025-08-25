import React, { useEffect, useMemo, useState, useContext } from 'react';
import axiosInstance from '../../configs/axios-config';
import styles from './ApprovalBoxList.module.scss';
import ApprovalPendingCard from './ApprovalPendingCard';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import ReportFilter from '../../components/approval/ReportFilter';
import { useReportFilter } from '../../hooks/useReportFilter';
import { UserContext } from '../../context/UserContext';
import EmptyState from '../../components/approval/EmptyState';
import Pagination from '../../components/approval/Pagination';
import SkeletonCard from '../../components/approval/SkeletonCard';

const ApprovalPendingList = () => {
  
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(UserContext);

  const { filteredReports, handleFilterChange } = useReportFilter(pendingReports);

  // client-side pagination
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredReports.length / pageSize)), [filteredReports.length]);
  const pagedReports = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage]);
  useEffect(() => { setCurrentPage(0); }, [filteredReports.length]);

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}${APPROVAL_SERVICE}/reports`,
        {
          params: {
            role: 'approver',
            status: 'IN_PROGRESS',
            sortBy: 'reportCreatedAt', 
            sortOrder: 'desc',
            page: 0,
            size: 1000,
          },
        },
      );
      if (res.data?.result) {
        const { reports } = res.data.result;
        // 백엔드가 이미 '내 차례'인 문서만 주므로 프론트 필터링은 검색/기간만
        setPendingReports(reports || []);
      } else {
        throw new Error('결재 예정 문서를 불러오는 데 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류 또는 서버 오류');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if(user?.id) fetchPending();
  }, [user?.id]);

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>결재 예정 문서함</h2>
      <ReportFilter onFilterChange={handleFilterChange} />
      
      {error && <div className={styles.error}>{error}</div>}
  
      {loading && (
        <div className={styles.list}>
          {Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      )}
  
      {!loading && !error && (
        <>
          {pagedReports.length > 0 ? (
            <div className={styles.list}>
              {pagedReports.map((report) => (
                <ApprovalPendingCard key={report.id} report={report} />
              ))}
            </div>
          ) : (
            <EmptyState icon="⏳" message="결재 예정 문서가 없습니다." />
          )}
          {totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default ApprovalPendingList;