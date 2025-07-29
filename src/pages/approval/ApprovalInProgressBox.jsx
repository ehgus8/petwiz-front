import React, { useEffect, useState } from 'react';
import axiosInstance from '../../configs/axios-config';
import DraftBoxCard from './DraftBoxCard'; // 재사용 가능한 카드 컴포넌트
import styles from './ApprovalBoxList.module.scss';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import ReportFilter from '../../components/approval/ReportFilter';
import { useReportFilter } from '../../hooks/useReportFilter';
import PropTypes from 'prop-types';

const ApprovalInProgressBox = ({ onTotalCountChange }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  
  const { filteredReports, handleFilterChange } = useReportFilter(reports);

  useEffect(() => {
    const fetchInProgressReports = async () => {
      setLoading(true);
      setError(null);
      
      const paramsApprover = {
        role: 'approver',
        status: 'IN_PROGRESS',
        sortBy: 'reportCreatedAt',
        sortOrder: 'desc',
        page: 0,
        size: 50,
      };
      const paramsWriter = {
        role: 'writer',
        status: 'IN_PROGRESS',
        sortBy: 'reportCreatedAt',
        sortOrder: 'desc',
        page: 0,
        size: 50,
      };
      try {
        // 두 역할로 각각 요청
        const [approverRes, writerRes] = await Promise.all([
          axiosInstance.get(
            `${API_BASE_URL}${APPROVAL_SERVICE}/reports`,
            { params: paramsApprover },
          ),
          axiosInstance.get(
            `${API_BASE_URL}${APPROVAL_SERVICE}/reports`,
            { params: paramsWriter },
          ),
        ]);
        // 두 결과 합치고 중복 제거
        const approverReports = approverRes.data.result.reports || [];
        const writerReports = writerRes.data.result.reports || [];
        const allReports = [...approverReports, ...writerReports];
        const uniqueReportsMap = new Map(allReports.map(r => [(r.id || r.reportId), r]));
        let uniqueReports = Array.from(uniqueReportsMap.values());
        // ★★★ reportStatus가 IN_PROGRESS인 문서만 남김 ★★★
        uniqueReports = uniqueReports.filter(r => r.reportStatus === 'IN_PROGRESS');
        // 최신순 정렬
        uniqueReports.sort((a, b) => new Date(b.reportCreatedAt) - new Date(a.reportCreatedAt));
        setReports(uniqueReports);
        setTotalCount(uniqueReports.length);
        if (onTotalCountChange) onTotalCountChange(uniqueReports.length);
      } catch (err) {
        console.error('결재 중 문서함 문서를 불러오는 중 오류 발생:', err);
        setReports([]);
        setTotalCount(0);
        if (onTotalCountChange) onTotalCountChange(0);
        setError('결재 중 문서함 문서를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchInProgressReports();
  }, []);

  if (loading) {
    return <div className={styles.loading}>로딩 중...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.reportListContainer}>
      <h2 className="sectionTitle">결재 중 문서함</h2>
      
      <ReportFilter onFilterChange={handleFilterChange} />
      
      <div className={styles.reportList}>
        {filteredReports.length > 0 ? (
          <>
            <div className={styles.resultInfo}>
              총 {totalCount}건의 문서가 있습니다.
            </div>
            {/* ★★★ 핵심 수정: 렌더링 직전에 sort() 함수를 추가하여 재정렬합니다. ★★★ */}
            {[...filteredReports] // 원본 배열 수정을 방지하기 위해 복사본 생성
              .sort((a, b) => new Date(b.reportCreatedAt) - new Date(a.reportCreatedAt))
              .map((report) => (
                <DraftBoxCard key={report.id} draft={report} />
            ))}
          </>
        ) : (
          <div className={styles.noReports}>
            <div className={styles.noReportsIcon}>📄</div>
            <p>현재 진행 중인 문서가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

ApprovalInProgressBox.propTypes = {
  onTotalCountChange: PropTypes.func,
};

export default ApprovalInProgressBox;