import React, { useEffect, useState } from 'react';
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, HR_SERVICE } from '../../configs/host-config';
import './EmployeeList.scss';

export default function TransferHistoryModal({ employeeId, onClose }) {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [deptError, setDeptError] = useState(null);

  useEffect(() => {
    async function fetchTransferHistory() {
      try {
        const res = await axiosInstance.get(
          `${API_BASE_URL}${HR_SERVICE}/transfer-history/${employeeId}`,
        );
        setHistories(res.data.result.hrTransferHistories || []);
        setError(null);
      } catch (err) {
        setError('인사이동 이력을 불러오는데 실패했습니다.');
        setHistories([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTransferHistory();
  }, [employeeId]);

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await axiosInstance.get(
          `${API_BASE_URL}${HR_SERVICE}/departments`,
        );
        setDepartments(res.data.result || []);
        setDeptError(null);
      } catch (err) {
        setDeptError('부서 목록을 불러오는데 실패했습니다.');
        setDepartments([]);
      } finally {
        setDeptLoading(false);
      }
    }
    fetchDepartments();
  }, []);

  // 부서 id -> 부서명 매핑 함수
  const getDeptName = (id) => {
    const dept = departments.find((d) => String(d.id) === String(id));
    return dept ? dept.name : id;
  };

  return (
    <div
      className='modal-backdrop'
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className='modal-content'
        style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '1rem',
          minWidth: '600px',
          maxWidth: '80%',
          maxHeight: '80vh',
          overflowY: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>인사이동 이력</h2>
        <button
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
          }}
          onClick={onClose}
        >
          ×
        </button>
        {loading || deptLoading ? (
          <div>로딩 중...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : deptError ? (
          <div style={{ color: 'red' }}>{deptError}</div>
        ) : (
          <table className='emp-list-table' style={{ marginTop: '1rem' }}>
            <style>
              {`
                .emp-list-table tbody tr:hover {
                  background: #fff !important;
                  box-shadow: 0 2px 10px 0 rgba(40, 60, 120, 0.08) !important;
                  color: inherit !important;
                  font-weight: normal !important;
                }
              `}
            </style>
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>순번</th>
                <th style={{ textAlign: 'center' }}>부서</th>
                <th style={{ textAlign: 'center' }}>직급</th>
              </tr>
            </thead>
            <tbody>
              {histories.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center' }}>
                    이력이 없습니다.
                  </td>
                </tr>
              ) : (
                histories.map((history) => (
                  <tr key={history.sequenceId} style={{ cursor: 'default' }}>
                    <td style={{ textAlign: 'center' }}>
                      {history.sequenceId}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {getDeptName(history.departmentId)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {history.positionName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
