import React, { useState, useEffect, useContext } from 'react';
import axiosInstance from '../../configs/axios-config';
import DraftBoxCard from './DraftBoxCard';
import styles from './ApprovalBoxList.module.scss';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import ReportFilter from '../../components/approval/ReportFilter';
import { useReportFilter } from '../../hooks/useReportFilter';
import { UserContext } from '../../context/UserContext';

const RejectedBox = () => {
  const [rejectedDocs, setRejectedDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(UserContext);
  // 필터링 훅 사용
  const { filteredReports, handleFilterChange } = useReportFilter(rejectedDocs);

  useEffect(() => {
    const fetchRejectedDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        // 내가 기안한 반려 문서만 가져옴
        const res = await axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
          params: { 
            role: 'writer', 
            status: 'REJECTED', 
            sortBy: 'reportCreatedAt',
            sortOrder: 'desc',
            page: 0, 
            size: 50 
          },
        });
        setRejectedDocs(res.data.result?.reports || []);
      } catch (err) {
        console.error('반려 문서를 불러오는 중 오류 발생:', err.response?.data || err);
        setError('반려된 문서를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchRejectedDocs();
  }, [user?.id]);

  return (
    <div className={styles.reportListContainer}>
      <h2 className="sectionTitle">반려 문서함</h2>
      {/* 필터링 컴포넌트 */}
      <ReportFilter onFilterChange={handleFilterChange} />
      <div className={styles.reportList}>
        {loading && <p>로딩 중...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && !error && filteredReports.length > 0 ? (
          <>
            <div className={styles.resultInfo}>총 {filteredReports.length}건의 문서가 있습니다.</div>
            {filteredReports.map((doc) => <DraftBoxCard key={doc.id} draft={doc} />)}
          </>
        ) : (
          !loading && !error && (
            <div className={styles.noReports}>
              <div className={styles.noReportsIcon}>📄</div>
              <p>반려된 문서가 없습니다.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default RejectedBox;