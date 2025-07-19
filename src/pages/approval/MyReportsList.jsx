import React, { useEffect, useState } from 'react';
import axiosInstance from '../../configs/axios-config';
import DraftBoxCard from './DraftBoxCard'; // 재사용 가능한 카드 컴포넌트
import styles from './ApprovalBoxList.module.scss';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';

// 1. 컴포넌트 이름 변경 추천: MyReportsList -> ApprovalInProgressBox
const ApprovalInProgressBox = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInProgressReports = async () => {
      setLoading(true);
      setError(null);
      
      // 2. API 요청 파라미터 수정
      const params = {
        role: 'approver', // 역할: '결재 관련자' (백엔드에서는 기안자 또는 결재자로 해석)
        // 'status' 파라미터는 제거합니다. (백엔드에서 status가 null이면 '결재 진행함'으로 처리)
        page: 0,
        size: 10,
      };
      
      try {
        const response = await axiosInstance.get(
          `${API_BASE_URL}${APPROVAL_SERVICE}/reports`,
          { params },
        );

        // 3. 응답 처리 로직 단순화
        if (response.data?.statusCode === 200) {
          // 백엔드가 이미 필터링된 결과를 주므로, 프론트엔드에서 추가 필터링할 필요가 없습니다.
          setReports(response.data.result.reports || []);
        } else {
          setReports([]);
          setError(response.data?.statusMessage || '진행 중인 문서를 불러오는 데 실패했습니다.');
        }
      } catch (err) {
        console.error('결재 진행함 문서를 불러오는 중 오류 발생:', err);
        setError('결재 진행함 문서를 불러오는 데 실패했습니다.');
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

  // 4. UI 렌더링 (변경 없음)
  return (
    <div className={styles.reportListContainer}>
      <h3 className={styles.sectionTitle}>결재 진행함</h3>
      
      <div className={styles.reportList}>
        {reports.length > 0 ? (
          reports.map((report) => (
            <DraftBoxCard key={report.id} draft={report} />
          ))
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

// 5. export 이름도 변경
export default ApprovalInProgressBox;