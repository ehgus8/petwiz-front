import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../context/UserContext';
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, HR_SERVICE } from '../../configs/host-config';
import './EmployeeList.scss';
import HRHeader from './HRHeader';
import EvaluationView from './EvaluationView';

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
      {/* 상세 정보는 선택 시 하단에만 노출 */}
      {selectedEvaluation && (
        <div className='emp-detail-below'>
          <EvaluationView
            evaluation={selectedEvaluation}
            onClose={handleClose}
          />
        </div>
      )}
    </>
  );
}
