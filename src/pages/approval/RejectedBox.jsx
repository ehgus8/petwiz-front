import React, { useState, useEffect, useContext } from 'react';
import axiosInstance from '../../configs/axios-config';
import DraftBoxCard from './DraftBoxCard';
import styles from './ApprovalBoxList.module.scss';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import ReportFilter from '../../components/approval/ReportFilter';
import { useReportFilter } from '../../hooks/useReportFilter';
import { UserContext } from '../../context/UserContext';
import EmptyState from '../../components/approval/EmptyState';
import Pagination from '../../components/Pagination';
import SkeletonCard from '../../components/approval/SkeletonCard';

const RejectedBox = () => {
  const [rejectedDocs, setRejectedDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, refetchCounts } = useContext(UserContext);

  // 페이지네이션 및 총 개수 상태 추가
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const { filteredReports, handleFilterChange } = useReportFilter(rejectedDocs);

  const fetchRejectedDocs = async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
        params: { 
          role: 'writer', 
          status: 'REJECTED', 
          sortBy: 'reportCreatedAt',
          sortOrder: 'desc',
          page: page, 
          size: 10 // 페이지네이션을 위해 size 조정
        },
      });
      
      if (res.data?.result) {
        const { reports, totalPages, number, totalElements } = res.data.result;
        setRejectedDocs(reports || []);
        setTotalPages(totalPages || 0);
        setCurrentPage(number || 0);
        setTotalCount(totalElements || 0); // 백엔드가 알려주는 진짜 총 개수 저장
        await refetchCounts();
      } else {
        throw new Error('반려된 문서를 불러오지 못했습니다.');
      }
    } catch (err) {
      console.error('반려 문서를 불러오는 중 오류 발생:', err);
      setError('반려된 문서를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejectedDocs();
  }, [user?.id]);

  const handlePageChange = (newPage) => {
    fetchRejectedDocs(newPage);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>반려 문서함</h2>
      <ReportFilter onFilterChange={handleFilterChange} />

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        // ★ 로딩 중일 때 SkeletonCard 5개 보여주기
        <div className={styles.list}>
          {Array.from({ length: 5 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : (
        <>
          {totalCount > 0 ? (
            <div className={styles.resultInfo}>총 {totalCount}건의 문서가 있습니다.</div>
          ) : null}

          {filteredReports.length > 0 ? (
            <div className={styles.list}>
              {filteredReports.map((doc) => (
                <DraftBoxCard key={doc.id} draft={doc} />
              ))}
            </div>
          ) : (
            <EmptyState icon="📄" message="반려된 문서가 없습니다." />
          )}

          {totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};


export default RejectedBox;