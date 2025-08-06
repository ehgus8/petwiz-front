import React, { useEffect, useState, useContext } from 'react';
import axiosInstance from '../../configs/axios-config';
import DraftBoxCard from './DraftBoxCard';
import styles from './ApprovalBoxList.module.scss';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import ReportFilter from '../../components/approval/ReportFilter';
import { useReportFilter } from '../../hooks/useReportFilter';
import EmptyState from '../../components/approval/EmptyState';
import Pagination from '../../components/Pagination';
import SkeletonCard from '../../components/approval/SkeletonCard';
import { UserContext } from '../../context/UserContext';

const CompletedBox = () => {
  const [completedDocs, setCompletedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(UserContext);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  // ★ 1. totalCount 상태를 제거합니다.
  
  const { filteredReports, handleFilterChange } = useReportFilter(completedDocs);

  const fetchCompletedDocs = async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(
        `${API_BASE_URL}${APPROVAL_SERVICE}/reports`,
        {
          params: { 
            role: 'writer', status: 'APPROVED', sortBy: 'reportCreatedAt',
            sortOrder: 'desc', page, size: 10
          },
        }
      );

      if (response.data?.result) {
        // ★ 2. 응답에서 totalElements를 사용하지 않습니다.
        const { reports, totalPages, number } = response.data.result;
        setCompletedDocs(reports || []);
        setTotalPages(totalPages || 0);
        setCurrentPage(number || 0);
      } else {
        throw new Error('완료된 문서를 불러오지 못했습니다.');
      }
    } catch (err) {
      setError('완료된 문서를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(user?.id) fetchCompletedDocs();
  }, [user?.id]);

  const handlePageChange = (newPage) => {
    fetchCompletedDocs(newPage);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>완료 문서함</h2>
      <ReportFilter onFilterChange={handleFilterChange} />
      
      {error && <div className={styles.error}>{error}</div>}
  
      {loading && (
        <div className={styles.list}>
          {Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      )}
  
      {!loading && !error && (
        <>
          {/* ★ 3. totalCount 대신 filteredReports.length를 사용하고, 문구를 변경합니다. */}
          {filteredReports.length > 0 && (
            <div className={styles.resultInfo}>
              현재 목록에 {filteredReports.length}건의 문서가 있습니다.
            </div>
          )}

          {filteredReports.length > 0 ? (
            <div className={styles.list}>
              {filteredReports.map((doc) => <DraftBoxCard key={doc.id} draft={doc} />)}
            </div>
          ) : (
            <EmptyState icon="📁" message="완료된 문서가 없습니다." />
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
export default CompletedBox;