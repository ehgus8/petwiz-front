import React, { useState, useEffect, useContext } from 'react';
import axiosInstance from '../../configs/axios-config';
import CcBoxCard from './CcBoxCard';
import styles from './ApprovalBoxList.module.scss';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import { UserContext } from '../../context/UserContext';
import ReportFilter from '../../components/approval/ReportFilter';
import { useReportFilter } from '../../hooks/useReportFilter';

const CcBox = () => {
  const [ccDocs, setCcDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(UserContext);
  
  const { filteredReports, handleFilterChange } = useReportFilter(ccDocs);

  useEffect(() => {
    if (!user?.id) return;

    const fetchCcDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get(
          `${API_BASE_URL}${APPROVAL_SERVICE}/reports`,
          {
            params: {
              role: 'reference',
              sortBy: 'reportCreatedAt',
              sortOrder: 'desc',
              page: 0,
              size: 50,
            },
          },
        );
        console.log('[CcBox] API 응답:', res.data);
        const allReports = res.data.result.reports || [];
        console.log('[CcBox] 필터링 전 reports:', allReports);
        const filteredReportsApi = allReports.filter( // 변수명 충돌 방지
          (report) =>
            report.reportStatus !== 'DRAFT' &&
            report.reportStatus !== 'RECALLED',
        );
        console.log('[CcBox] 필터링 후 reports:', filteredReportsApi);
        setCcDocs(filteredReportsApi);
      } catch (err) {
        console.error('수신 참조 문서를 불러오는 중 오류 발생:', err);
        setError('네트워크 오류 또는 서버 오류');
      } finally {
        setLoading(false);
      }
    };

    fetchCcDocs();
  }, [user?.id]);

  return (
    <div className={styles.reportListContainer}>
      <h3 className={styles.sectionTitle}>수신 참조 문서함</h3>
      
      <ReportFilter onFilterChange={handleFilterChange} />
      
      <div className={styles.reportList}>
        {loading && <p>로딩 중...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && !error && filteredReports.length > 0 ? (
          <>
            <div className={styles.resultInfo}>
              총 {filteredReports.length}건의 문서가 있습니다.
            </div>
            {/* ★★★ 핵심 수정: 렌더링 직전에 sort() 함수를 추가하여 재정렬합니다. ★★★ */}
            {[...filteredReports] // 원본 배열 수정을 방지하기 위해 복사본 생성
              .sort((a, b) => new Date(b.reportCreatedAt) - new Date(a.reportCreatedAt))
              .map((doc) => (
                <CcBoxCard key={doc.id} doc={doc} />
            ))}
          </>
        ) : (
          !loading &&
          !error && (
            <div className={styles.noReports}>
              <div className={styles.noReportsIcon}>📧</div>
              <p>수신 참조된 문서가 없습니다.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default CcBox;