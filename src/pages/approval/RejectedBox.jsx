import React, { useState, useEffect } from 'react';
import axiosInstance from '../../configs/axios-config';
import DraftBoxCard from './DraftBoxCard';
import styles from './ApprovalBoxList.module.scss';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';

const RejectedBox = () => {
  const [rejectedDocs, setRejectedDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRejectedDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        // 내가 '기안자' 또는 '결재자'인 '반려'된 문서만 가져오도록 설정
        const responses = await Promise.all([
          // 1. 내가 기안한 반려 문서
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
            params: { role: 'writer', status: 'REJECTED', page: 0, size: 20 },
          }),
          // 2. 내가 결재한 반려 문서
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
            params: { role: 'approver', status: 'REJECTED', page: 0, size: 20 },
          }),
        ]);

        const allDocs = responses.flatMap(res => res.data.result?.reports || []);

        // 중복 제거 후 최신순으로 정렬
        const uniqueDocs = Array.from(new Map(allDocs.map(doc => [doc.id, doc])).values());
        uniqueDocs.sort((a, b) => new Date(b.createdAt || b.reportCreatedAt) - new Date(a.createdAt || a.reportCreatedAt));

        setRejectedDocs(uniqueDocs);
      } catch (err) {
        console.error('반려 문서를 불러오는 중 오류 발생:', err.response?.data || err);
        setError('반려된 문서를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchRejectedDocs();
  }, []);

  return (
    <div className={styles.reportListContainer}>
      <h3 className={styles.sectionTitle}>반려 문서함</h3>
      <div className={styles.reportList}>
        {loading && <p>로딩 중...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && !error && rejectedDocs.length > 0 ? (
          rejectedDocs.map((doc) => <DraftBoxCard key={doc.id} draft={doc} />)
        ) : (
          !loading &&
          !error && (
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