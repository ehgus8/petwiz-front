import React, { useEffect, useState } from 'react';
import axiosInstance from '../../configs/axios-config';
import DraftBoxCard from './DraftBoxCard'; // 재사용 가능한 카드 컴포넌트
import styles from './ApprovalBoxList.module.scss'; // 재사용 가능한 스타일
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import ReportFilter from '../../components/approval/ReportFilter';
import { useReportFilter } from '../../hooks/useReportFilter';
import PropTypes from 'prop-types';
import EmptyState from '../../components/approval/EmptyState';

const CompletedBox = ({ onTotalCountChange }) => {
  const [completedDocs, setCompletedDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // 필터링 훅 사용
  const { filteredReports, handleFilterChange } = useReportFilter(completedDocs);

  useEffect(() => {
    const fetchCompletedDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        const responses = await Promise.all([
          // 1. 내가 기안한 승인 문서 (최신순 정렬 요청)
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
            params: { 
              role: 'writer', 
              status: 'APPROVED', 
              sortBy: 'reportCreatedAt',
              sortOrder: 'desc',
              page: 0, 
              size: 50 
            },
          }),
          // 2. 내가 결재한 승인 문서 (최신순 정렬 요청)
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
            params: { 
              role: 'approver', 
              status: 'APPROVED', 
              sortBy: 'reportCreatedAt',
              sortOrder: 'desc',
              page: 0, 
              size: 50 
            },
          }),
        ]);

        const allDocs = responses.flatMap(res => res.data.result?.reports || []);

        // 중복 제거
        const uniqueDocsMap = new Map(allDocs.map(doc => [doc.id, doc]));
        
        // ★★★ 최종적으로 합쳐진 배열을 프론트엔드에서 다시 한번 최신순으로 정렬합니다. ★★★
        const sortedDocs = Array.from(uniqueDocsMap.values()).sort(
          (a, b) => new Date(b.createdAt || b.reportCreatedAt) - new Date(a.createdAt || a.reportCreatedAt)
        );

        setCompletedDocs(sortedDocs);
        // writer/approver 중 더 많은 totalElements를 전체 건수로 사용
        const totalWriter = responses[0].data.result?.totalElements || 0;
        const totalApprover = responses[1].data.result?.totalElements || 0;
        setTotalCount(totalWriter + totalApprover);
        if (onTotalCountChange) onTotalCountChange(totalWriter + totalApprover);
      } catch (err) {
        console.error('완료 문서를 불러오는 중 오류 발생:', err.response?.data || err);
        setCompletedDocs([]);
        setTotalCount(0);
        setError('완료된 문서를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedDocs();
  }, []);

  return (
    <div className={styles.reportListContainer}>
      <h2 className="sectionTitle">결재 완료 문서함</h2>
      
      <ReportFilter onFilterChange={handleFilterChange} />
      
      <div className={styles.reportList}>
        {loading && <p>로딩 중...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && !error && filteredReports.length > 0 ? (
          <>
            <div className={styles.resultInfo}>
              총 {totalCount}건의 문서가 있습니다.
            </div>
            {filteredReports.map((doc) => <DraftBoxCard key={doc.id} draft={doc} />)}
          </>
        ) : (
          !loading &&
          !error && (
            <EmptyState icon="📁" message="완료된 문서가 없습니다." />
          )
        )}
      </div>
    </div>
  );
};

CompletedBox.propTypes = {
  onTotalCountChange: PropTypes.func,
};

export default CompletedBox;