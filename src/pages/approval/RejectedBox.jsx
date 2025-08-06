import React, { useEffect, useState, useContext } from 'react';
import axiosInstance from '../../configs/axios-config';
import DraftBoxCard from './DraftBoxCard';
import styles from './ApprovalBoxList.module.scss'; // 이 import는 이미 있었습니다.
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import ReportFilter from '../../components/approval/ReportFilter';
import { useReportFilter } from '../../hooks/useReportFilter';
import EmptyState from '../../components/approval/EmptyState';
import Swal from 'sweetalert2';
import Pagination from '../../components/approval/Pagination';
import { UserContext } from '../../context/UserContext';
import SkeletonCard from '../../components/approval/SkeletonCard';

const ScheduledBox = () => {
  const [scheduledDocs, setScheduledDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { user } = useContext(UserContext);
  
  const { filteredReports, handleFilterChange } = useReportFilter(scheduledDocs);

  const fetchScheduledDocs = async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(
        `${API_BASE_URL}${APPROVAL_SERVICE}/reports/list/scheduled`,
        { params: { page, size: 10 } }
      );
      if (response.data?.statusCode === 200) {
        const { reports, totalElements, totalPages, number } = response.data.result;
        setScheduledDocs(reports || []);
        setTotalCount(totalElements || 0);
        setTotalPages(totalPages || 0);
        setCurrentPage(number || 0);
      } else {
        throw new Error('예약 문서를 불러오는 데 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류 또는 서버 오류');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelSchedule = async (reportId) => {
    const result = await Swal.fire({
      title: '예약을 취소하시겠습니까?',
      text: '예약이 취소되면 문서가 임시저장 상태로 돌아갑니다.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '예약 취소',
      cancelButtonText: '취소'
    });
    if (result.isConfirmed) {
      try {
        const response = await axiosInstance.put(
          `${API_BASE_URL}${APPROVAL_SERVICE}/reports/${reportId}/recall`
        );
        if (response.data?.statusCode === 200) {
          await Swal.fire({
            icon: 'success',
            title: '예약이 취소되었습니다.',
            text: '문서가 회수되어 임시저장 상태로 변경되었습니다.'
          });
          fetchScheduledDocs(currentPage);
        } else {
          throw new Error(response.data?.statusMessage || '예약 취소에 실패했습니다.');
        }
      } catch (err) {
        await Swal.fire({
          icon: 'error',
          title: '예약 취소 실패',
          text: err.response?.data?.statusMessage || err.message
        });
      }
    }
  };

  useEffect(() => {
    if (user?.id) fetchScheduledDocs();
  }, [user?.id]);

  const handlePageChange = (newPage) => {
    fetchScheduledDocs(newPage);
  };

  // ★★★ JSX 구조와 클래스명을 RejectedBox와 동일하게 맞춥니다. ★★★
  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>내 반려함</h2>
      <ReportFilter onFilterChange={handleFilterChange} />
      
      {error && <div className={styles.error}>{error}</div>}
  
      {loading && (
        <div className={styles.list}>
          {Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      )}
  
      {!loading && !error && (
        <>
          {totalCount > 0 && (
            <div className={styles.resultInfo}>총 {totalCount}건의 문서가 있습니다.</div>
          )}
          {filteredReports.length > 0 ? (
            <div className={styles.list}>
              {filteredReports.map((doc) => <DraftBoxCard key={doc.id} draft={doc} />)}
            </div>
          ) : (
            <EmptyState icon="📄" message="반려된 문서가 없습니다." />
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

export default ScheduledBox;