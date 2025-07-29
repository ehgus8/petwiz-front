import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../context/UserContext';
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, HR_SERVICE } from '../../configs/host-config';
import './EmployeeList.scss';
import HRHeader from './HRHeader';
import EvaluationView from './EvaluationView';
import ModalPortal from '../../components/approval/ModalPortal';
import styles from '../../components/approval/CategoryModal.module.scss';

export default function MyEvaluationList() {
  const { userId } = useContext(UserContext);
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEvalId, setSelectedEvalId] = useState(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  // 페이징
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!userId) return;
    async function fetchEvaluations() {
      try {
        const res = await axiosInstance.get(
          `${API_BASE_URL}${HR_SERVICE}/evaluations/${userId}`,
          { params: { page, size } },
        );
        setEvaluations(res.data.result.content || []);
        setTotalPages(res.data.result.totalPages || 1);
      } catch (err) {
        setEvaluations([]);
        setTotalPages(1);
      }
    }
    fetchEvaluations();
  }, [userId, page, size]);

  // 평가 상세 정보 조회
  useEffect(() => {
    if (!selectedEvalId) {
      setSelectedEvaluation(null);
      return;
    }
    async function fetchEvaluationDetail() {
      try {
        const res = await axiosInstance.get(
          `${API_BASE_URL}${HR_SERVICE}/evaluation/detail/${selectedEvalId}`,
        );
        setSelectedEvaluation(res.data.result);
      } catch (err) {
        console.error('평가 상세 조회 실패:', err);
        setSelectedEvaluation(null);
      }
    }
    fetchEvaluationDetail();
  }, [selectedEvalId]);

  const handleRowClick = (evaluationId) => {
    setSelectedEvalId(evaluationId);
  };

  const handleClose = () => {
    setSelectedEvalId(null);
    setSelectedEvaluation(null);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  return (
    <>
      <HRHeader />
      <div className='emp-list-root'>
        <h2 className='emp-list-title'>내 인사평가 이력</h2>
        <table className='emp-list-table'>
          <thead>
            <tr>
              <th>평가ID</th>
              <th>면담일</th>
              <th>등록일</th>
              <th>총점수</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map((evalItem) => (
              <tr
                key={evalItem.evaluationId}
                onClick={() => handleRowClick(evalItem.evaluationId)}
                className={
                  selectedEvalId === evalItem.evaluationId ? 'selected' : ''
                }
                style={{ cursor: 'pointer' }}
              >
                <td>{evalItem.evaluationId}</td>
                <td>{evalItem.interviewDate}</td>
                <td>{evalItem.createdAt.split('T')[0]}</td>
                <td>{evalItem.totalEvaluation}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* 페이징 UI */}
        <div
          className='pagination'
          style={{ margin: '1rem 0', textAlign: 'center' }}
        >
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 0}
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, idx) => (
            <button
              key={idx}
              onClick={() => handlePageChange(idx)}
              style={{ fontWeight: page === idx ? 'bold' : 'normal' }}
            >
              {idx + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages - 1}
          >
            다음
          </button>
        </div>
      </div>
      {/* 상세 정보는 모달로 표시 */}
      {selectedEvaluation && (
        <ModalPortal>
          <div
            className={styles.modalOverlay}
            onClick={() => setSelectedEvalId(null)}
            style={{ zIndex: 1000 }}
          >
            <div
              className={styles.modalContainer}
              style={{
                maxWidth: '1000px',
                width: '90vw',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedEvalId(null)}
                style={{
                  position: 'absolute',
                  top: 18,
                  right: 24,
                  background: 'none',
                  border: 'none',
                  fontSize: 28,
                  cursor: 'pointer',
                  color: '#888',
                  zIndex: 10,
                }}
                aria-label='닫기'
              >
                ×
              </button>
              <EvaluationView
                evaluation={selectedEvaluation}
                onClose={handleClose}
              />
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
