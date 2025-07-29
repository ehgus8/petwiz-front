import React, { useEffect, useState } from 'react';
import axiosInstance from '../../configs/axios-config';
import DraftBoxCard from './DraftBoxCard'; // 재사용 가능한 카드 컴포넌트
import styles from './ApprovalBoxList.module.scss'; // 재사용 가능한 스타일
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import ReportFilter from '../../components/approval/ReportFilter';
import { useReportFilter } from '../../hooks/useReportFilter';
import PropTypes from 'prop-types';
import EmptyState from '../../components/approval/EmptyState';
import Swal from 'sweetalert2';
import Pagination from '../../components/Pagination';

const ScheduledBox = ({ onTotalCountChange }) => {
  const [scheduledDocs, setScheduledDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // 필터링 훅 사용
  const { filteredReports, handleFilterChange } = useReportFilter(scheduledDocs);

  // 예약 취소 함수
  const handleCancelSchedule = async (reportId) => {
    try {
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
        setLoading(true);
        
        // 예약 취소 API 호출 (임시저장으로 변경)
        const response = await axiosInstance.put(
          `${API_BASE_URL}${APPROVAL_SERVICE}/reports/${reportId}/recall`
        );

        if (response.data?.statusCode === 200) {
          await Swal.fire({
            icon: 'success',
            title: '예약이 취소되었습니다.',
            text: '문서가 회수되어 임시저장 상태로 변경되었습니다.'
          });
          
          // 목록 새로고침
          fetchScheduledDocs();
        } else {
          throw new Error(response.data?.statusMessage || '예약 취소에 실패했습니다.');
        }
      }
    } catch (err) {
      console.error('예약 취소 실패:', err);
      await Swal.fire({
        icon: 'error',
        title: '예약 취소 실패',
        text: err.response?.data?.statusMessage || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledDocs = async (page = currentPage, size = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      // 새로운 예약 문서함 전용 API 사용
      const response = await axiosInstance.get(
        `${API_BASE_URL}${APPROVAL_SERVICE}/reports/list/scheduled`,
        {
          params: {
            page: page,
            size: size,
          },
        }
      );

      if (response.data?.statusCode === 200) {
        const reports = response.data.result.reports || [];
        const totalElements = response.data.result.totalElements || 0;
        const totalPages = response.data.result.totalPages || 0;
        const currentPage = response.data.result.number || 0;
        
        setScheduledDocs(reports);
        setTotalCount(totalElements);
        setTotalPages(totalPages);
        setCurrentPage(currentPage);
        if (onTotalCountChange) onTotalCountChange(totalElements);
      } else {
        setError('예약 문서를 불러오는 데 실패했습니다.');
        setScheduledDocs([]);
        setTotalCount(0);
        if (onTotalCountChange) onTotalCountChange(0);
      }
    } catch (err) {
      console.error('예약 문서 조회 실패:', err);
      setError('네트워크 오류 또는 서버 오류');
      setScheduledDocs([]);
      setTotalCount(0);
      if (onTotalCountChange) onTotalCountChange(0);
    } finally {
      setLoading(false);
    }
  };

  // 페이지 변경 함수
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchScheduledDocs(newPage, pageSize);
  };

  useEffect(() => {
    fetchScheduledDocs();
  }, [onTotalCountChange]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>예약 문서함</h3>
      </div>
      
      <ReportFilter onFilterChange={handleFilterChange} />
      
      {filteredReports.length === 0 ? (
        <EmptyState 
          message="예약된 문서가 없습니다."
          subMessage="문서 작성 시 '예약 상신'을 선택하여 미래의 특정 시간에 자동으로 상신되도록 설정할 수 있습니다."
        />
      ) : (
        <>
          <div className={styles.cardList}>
            {filteredReports.map((doc) => (
              <DraftBoxCard
                key={doc.id}
                draft={doc}
                showScheduleInfo={true} // 예약 정보 표시 플래그
                onCancelSchedule={handleCancelSchedule} // 예약 취소 함수 전달
              />
            ))}
          </div>
          
          {/* 페이징 컴포넌트 */}
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

ScheduledBox.propTypes = {
  onTotalCountChange: PropTypes.func,
};

export default ScheduledBox; 