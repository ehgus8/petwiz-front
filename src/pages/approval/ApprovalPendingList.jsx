import React, { useEffect, useState } from 'react';
import axiosInstance from '../../configs/axios-config';
import styles from './ApprovalPendingList.module.scss';
import ApprovalPendingCard from './ApprovalPendingCard';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import ReportFilter from '../../components/approval/ReportFilter';
import { useReportFilter } from '../../hooks/useReportFilter';
import PropTypes from 'prop-types';
import { UserContext } from '../../context/UserContext';
import EmptyState from '../../components/approval/EmptyState';

const ApprovalPendingList = () => {
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = React.useContext(UserContext);
  
  const { filteredReports, handleFilterChange } = useReportFilter(pendingReports);

  useEffect(() => {
    const fetchPending = async () => {
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
              page: 0,
              size: 50,
            },
          },
        );
        if (res.data?.statusCode === 200) {
          const allReports = res.data.result.reports || [];
          const filteredApiReports = allReports.filter(
            (report) => {
              const pendingLine = report.approvalLine?.find(line => line.approvalStatus === 'PENDING');
              return report.reportStatus === 'IN_PROGRESS' && pendingLine?.employeeId === user?.id;
            }
          );
          setPendingReports(filteredApiReports);
        } else {
          setError(
            res.data?.statusMessage ||
            '결재 예정 문서를 불러오는 데 실패했습니다.',
          );
        }
      } catch (err) {
        console.error(err);
        setError('네트워크 오류 또는 서버 오류');
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, [user?.id]);

  return (
    <div className={styles.container + ' page-fade'}>
      <h2 className="sectionTitle">결재 예정 문서함</h2>
      
      <ReportFilter onFilterChange={handleFilterChange} />
      
      <div className={styles.list}>
        {loading && <p>로딩 중...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && !error && filteredReports.length > 0 ? (
          <>
            <div className={styles.resultInfo}>
              총 {filteredReports.length}건의 문서가 있습니다.
            </div>
            {filteredReports.map((report) => (
              <ApprovalPendingCard key={report.id} report={report} />
            ))}
          </>
        ) : (
          !loading && !error && <EmptyState icon="⏳" message="결재 예정 문서가 없습니다." />
        )}
      </div>
    </div>
  );
};
export default ApprovalPendingList;