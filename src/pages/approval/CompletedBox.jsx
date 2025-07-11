import React, { useState, useEffect } from 'react';
import axiosInstance from '../../configs/axios-config';
import DraftBoxCard from './DraftBoxCard'; // 재사용 가능한 카드 컴포넌트
import styles from './ApprovalBoxList.module.scss'; // 재사용 가능한 스타일
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';

const CompletedBox = () => {
  const [completedDocs, setCompletedDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompletedDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        // 백엔드 API가 여러 상태 값을 동시에 처리하지 못하므로, 'APPROVED'와 'REJECTED'를 각각 호출합니다.
        const [approvedRes, rejectedRes] = await Promise.all([
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
            params: { role: 'writer', status: 'APPROVED', page: 0, size: 10 },
          }),
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
            params: { role: 'writer', status: 'REJECTED', page: 0, size: 10 },
          }),
        ]);

        const approvedDocs = approvedRes.data.result?.reports || [];
        const rejectedDocs = rejectedRes.data.result?.reports || [];

        // 두 결과를 합치고 최신 작성일 순으로 정렬합니다.
        const allCompletedDocs = [...approvedDocs, ...rejectedDocs].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );

        setCompletedDocs(allCompletedDocs);
      } catch (err) {
        console.error('완료 문서를 불러오는 중 오류 발생:', err);
        setError('완료된 문서를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedDocs();
  }, []);

  return (
    <div className={styles.reportList}>
      <h3 className={styles.sectionTitle}>완료 문서함</h3>
      {loading && <p>로딩 중...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !error && completedDocs.length > 0 ? (
        completedDocs.map((doc) => <DraftBoxCard key={doc.id} draft={doc} />)
      ) : (
        !loading &&
        !error && (
          <div className={styles.noReports}>
            <div className={styles.noReportsIcon}>🗂️</div>
            <p>완료된 문서가 없습니다.</p>
          </div>
        )
      )}
    </div>
  );
};

export default CompletedBox; 