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
        // 내가 '기안자' 또는 '결재자'인 '승인 완료'된 문서만 가져오도록 수정
        const responses = await Promise.all([
          // 1. 내가 기안한 승인 문서
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
            params: { role: 'writer', status: 'APPROVED', page: 0, size: 20 },
          }),
          // 2. 내가 결재한 승인 문서
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
            params: { role: 'approver', status: 'APPROVED', page: 0, size: 20 },
          }),
        ]);

        const allDocs = responses.flatMap(res => res.data.result?.reports || []);

        // 중복 제거 후 최신순으로 정렬
        const uniqueDocs = Array.from(new Map(allDocs.map(doc => [doc.id, doc])).values());
        uniqueDocs.sort((a, b) => new Date(b.createdAt || b.reportCreatedAt) - new Date(a.createdAt || a.reportCreatedAt));

        setCompletedDocs(uniqueDocs);
      } catch (err) {
        console.error('완료 문서를 불러오는 중 오류 발생:', err.response?.data || err);
        setError('완료된 문서를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedDocs();
  }, []);

  return (
    <div className={styles.reportListContainer}> {/* reportList -> reportListContainer로 변경하여 h3와 list를 감쌈 */}
      <h3 className={styles.sectionTitle}>완료 문서함</h3>
      <div className={styles.reportList}>
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
    </div>
  );
};

export default CompletedBox;