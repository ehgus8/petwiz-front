import React, { useEffect, useState, useContext } from 'react';
import axiosInstance from '../../configs/axios-config';
import styles from './ApprovalBoxList.module.scss';
import ApprovalPendingCard from './ApprovalPendingCard';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import ReportFilter from '../../components/approval/ReportFilter';
import { useReportFilter } from '../../hooks/useReportFilter';
import { UserContext } from '../../context/UserContext';
import EmptyState from '../../components/approval/EmptyState';
import Pagination from '../../components/approval/Pagination';

const ApprovalPendingList = () => {
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(UserContext);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const { filteredReports, handleFilterChange } = useReportFilter(pendingReports);

  const fetchPending = async (page = 0) => {
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
            page: page,
            size: 10,
          },
        },
      );
      if (res.data?.result) {
        const { reports, totalPages, number, totalElements } = res.data.result;
        // 백엔드가 이미 '내 차례'인 문서만 주므로 프론트 필터링 제거
        setPendingReports(reports || []);
        setTotalPages(totalPages || 0);
        setCurrentPage(number || 0);
        setTotalCount(totalElements || 0);
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

  const handlePageChange = (newPage) => {
    fetchPending(newPage);
  };

  return (
    <div className={styles.container + ' page-fade'}>
      <h2 className="sectionTitle">결재 예정 문서함</h2>
      <ReportFilter onFilterChange={handleFilterChange} />
      <div className={styles.list}>
        {loading && <p>로딩 중...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && !error && (filteredReports.length > 0 || totalCount > 0) ? (
          <>
            <div className={styles.resultInfo}>
              총 {totalCount}건의 문서가 있습니다.
            </div>
            {filteredReports.map((report) => (
              <ApprovalPendingCard key={report.id} report={report} />
            ))}
            {totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}
          </>
        ) : (
          !loading && !error && <EmptyState icon="⏳" message="결재 예정 문서가 없습니다." />
        )}
      </div>
    </div>
  );
};
export default ApprovalPendingList;