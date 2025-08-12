import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../configs/axios-config';
import DraftBoxCard from './DraftBoxCard';
import styles from './ApprovalBoxList.module.scss';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import ReportFilter from '../../components/approval/ReportFilter';
import { useReportFilter } from '../../hooks/useReportFilter';
import EmptyState from '../../components/approval/EmptyState';
import Pagination from '../../components/approval/Pagination';
import SkeletonCard from '../../components/approval/SkeletonCard';

const ApprovalInProgressBox = () => {
  const [scheduledDocs, setScheduledDocs] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { filteredReports, handleFilterChange } = useReportFilter(reports);

  // client-side pagination
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredReports.length / pageSize)), [filteredReports.length]);
  const pagedReports = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage]);

  useEffect(() => {
    setCurrentPage(0);
  }, [filteredReports.length]);

  const fetchInProgressReports = async () => {
    setLoading(true);
    setError(null);
    try {
      // 전체 데이터 크게 가져오기 (전역 검색 지원)
      const response = await axiosInstance.get(
        `${API_BASE_URL}${APPROVAL_SERVICE}/reports`,
        { 
          params: { 
            role: 'writer,approver,involved',
            status: 'IN_PROGRESS', 
            sortBy: 'createdAt', 
            sortOrder: 'desc', 
            page: 0, 
            size: 1000 
          }, 
          
        }
      );
      if(response.data?.result) {
        const { reports } = response.data.result;
        setReports(reports || []);
      } else {
        throw new Error('결재 중 문서를 불러오지 못했습니다.');
      }
    } catch (err) {
      setError('결재 중 문서를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInProgressReports();
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>결재 중 문서함</h2>
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
                <DraftBoxCard key={report.id} draft={report} />
              ))}
            </div>
          ) : (
            <EmptyState icon="📄" message="현재 진행 중인 문서가 없습니다." />
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
};

export default ApprovalInProgressBox;