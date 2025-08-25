import React, { useEffect, useState } from 'react';
import EmployeeDetail from './EmployeeDetail';
import EmployeeEdit from './EmployeeEdit';
import EvaluationForm from './EvaluationForm';
import HRHeader from './HRHeader';
import './EmployeeList.scss';
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, HR_SERVICE } from '../../configs/host-config';
import { getDepartmentNameById } from '../../common/hr';
import { swalError, warn } from '../../common/common';
import ModalPortal from '../../components/approval/ModalPortal';
import styles from '../../components/approval/CategoryModal.module.scss';
import pin from '../../assets/pin.jpg';
import TransferHistoryModal from './TransferHistoryModal'; // 추가

export default function EmployeeList() {
  const [mode, setMode] = useState('list'); // 'list', 'edit', 'eval'
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState({});
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [evaluationStatus, setEvaluationStatus] = useState({});
  const [searchField, setSearchField] = useState('name');
  const [searchText, setSearchText] = useState('');
  const [searchDept, setSearchDept] = useState('전체');
  const [showInactive, setShowInactive] = useState(false);
  const [appliedSearch, setAppliedSearch] = useState({
    field: 'name',
    keyword: '',
    department: '전체',
    isActive: true,
  });
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 인사이동 이력 모달 상태/데이터 추가
  const [isTransferHistoryOpen, setIsTransferHistoryOpen] = useState(false);
  const [transferHistoryList, setTransferHistoryList] = useState([]);

  useEffect(() => {
    getEmployeeList({
      field: appliedSearch.field,
      keyword: appliedSearch.keyword,
      department: appliedSearch.department,
      page,
      size,
      sortField,
      sortOrder,
      setEmployees,
      setTotalPages,
      isActive: appliedSearch.isActive,
    });
    // eslint-disable-next-line
  }, [page, size, sortField, sortOrder, appliedSearch]);

  useEffect(() => {
    setAppliedSearch((prev) => ({
      ...prev,
      isActive: !showInactive,
    }));
    setPage(0);
    setSelectedId(null);
  }, [showInactive]);

  // 부서 목록 불러오기
  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await axiosInstance.get(
          `${API_BASE_URL}${HR_SERVICE}/departments`,
        );
        setDepartments(res.data.result || []);
      } catch (err) {
        setDepartments([]);
      }
    }
    fetchDepartments();
  }, []);

  // 직원상세 조회시 상세 정보 가져옴
  useEffect(() => {
    if (selectedId == null) return;
    getEmployeeDetail(selectedId);
    setIsDetailModalOpen(true);
    // eslint-disable-next-line
  }, [selectedId]);

  // 직원별 평가 상태 가져오기
  useEffect(() => {
    const fetchEvaluationStatus = async () => {
      const statusObj = {};
      await Promise.all(
        employees.map(async (emp) => {
          const empKey = emp.employeeId || emp.id;
          try {
            const res = await axiosInstance.get(
              `${API_BASE_URL}${HR_SERVICE}/evaluation/${empKey}`,
            );
            statusObj[empKey] = !!res.data.result;
          } catch {
            statusObj[empKey] = false;
          }
        }),
      );
      setEvaluationStatus(statusObj);
    };
    if (employees.length > 0) fetchEvaluationStatus();
  }, [employees]);

  // 직원 목록 가져오기
  const getEmployeeList = async ({
    field = 'name',
    keyword = '',
    department = '전체',
    page: reqPage = 0,
    size: reqSize = 10,
    sortField: reqSortField = null,
    sortOrder: reqSortOrder = 'asc',
    setEmployees,
    setTotalPages,
    isActive,
  } = {}) => {
    try {
      let params = `?page=${reqPage}&size=${reqSize}`;
      if (keyword.trim())
        params += `&field=${field}&keyword=${encodeURIComponent(keyword)}`;
      if (department !== '전체')
        params += `&department=${encodeURIComponent(department)}`;
      if (reqSortField) params += `&sort=${reqSortField},${reqSortOrder}`;
      if (typeof isActive === 'boolean') params += `&isActive=${isActive}`;
      const res = await axiosInstance.get(
        `${API_BASE_URL}${HR_SERVICE}/employees${params}`,
      );
      setEmployees(res.data.result.content);
      setTotalPages(res.data.result.totalPages || 1);
    } catch (error) {
      swalError(error?.response?.data?.statusMessage || error.message);
    }
  };

  const getEmployeeDetail = async (id) => {
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}${HR_SERVICE}/employees/${id}`,
      );
      setSelectedDetail({
        ...res.data.result,
        department: employees.find((e) => e.id === id)?.department,
      });
    } catch (error) {
      swalError(error.response?.data || '시스템에러');
    }
  };

  const handleSort = (field) => {
    let nextSortOrder = 'asc';
    if (sortField === field) {
      nextSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    setSortField(field);
    setSortOrder(nextSortOrder);
    setPage(0);
    getEmployeeList({
      field: appliedSearch.field,
      keyword: appliedSearch.keyword,
      department: appliedSearch.department,
      sortField: field,
      sortOrder: nextSortOrder,
      setEmployees,
      setTotalPages,
    });
  };

  const handleEvalWithCheck = async () => {
    if (!selectedDetail || !selectedDetail.employeeId) return;
    try {
      await axiosInstance.get(
        `${API_BASE_URL}${HR_SERVICE}/evaluation/${selectedDetail.employeeId}`,
      );
      warn('이미 인사평가가 존재합니다.');
    } catch (error) {
      setMode('eval');
      setIsDetailModalOpen(false);
    }
  };

  const handleEdit = () => {
    setMode('edit');
    setIsDetailModalOpen(false);
  };

  const handleEval = () => {
    setMode('eval');
    setIsDetailModalOpen(false);
  };

  const handleClose = (updatedEmployee) => {
    setMode('list');
    if (updatedEmployee) {
      setSelectedDetail({ ...updatedEmployee });
      const employees2 = employees.map((employee) => {
        if (employee.id === updatedEmployee.employeeId) {
          employee.name = updatedEmployee.name;
          employee.department = getDepartmentNameById(
            updatedEmployee.departmentId,
          );
          employee.position = updatedEmployee.position;
          employee.role = updatedEmployee.role;
          employee.phone = updatedEmployee.phone;
        }
        return employee;
      });
      setEmployees(employees2);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedSearch({
      field: searchField,
      keyword: searchText,
      department: searchDept,
      isActive: !showInactive,
    });
    setPage(0);
    setSelectedId(null);
  };

  const handleShowInactiveChange = (e) => {
    const checked = e.target.checked;
    setShowInactive(checked);
    setAppliedSearch({
      field: searchField,
      keyword: searchText,
      department: searchDept,
      isActive: !checked,
    });
    setPage(0);
    setSelectedId(null);
  };

  const handleReset = () => {
    setSearchField('name');
    setSearchText('');
    setSearchDept('전체');
    setSortField(null);
    setSortOrder('asc');
    setShowInactive(false);
    setAppliedSearch({
      field: 'name',
      keyword: '',
      department: '전체',
    });
    setPage(0);
    setSelectedId(null);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedId(null);
  };

  // *** 인사이동 이력 핸들러 ***
  const handleTransferHistory = async (employee) => {
    if (!employee?.employeeId) return;
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}${HR_SERVICE}/transfer-history/${employee.employeeId}`,
      );
      setTransferHistoryList(res.data.result || []);
      setIsTransferHistoryOpen(true);
    } catch (err) {
      swalError('이력 조회에 실패했습니다.');
      console.log(err, '이력조회실패에러');
    }
  };

  // 전체 페이지 전환 분기
  if (mode === 'edit')
    return <EmployeeEdit employee={selectedDetail} onClose={handleClose} />;
  if (mode === 'eval')
    return <EvaluationForm employee={selectedDetail} onClose={handleClose} />;

  return (
    <>
      <HRHeader />
      <div className='emp-list-root'>
        <h2 className='emp-list-title'>직원 목록</h2>
        <form className='emp-search-bar' onSubmit={handleSearch}>
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className='emp-search-select'
          >
            <option value='name'>이름</option>
            <option value='department'>부서</option>
            <option value='position'>직급</option>
            <option value='phone'>연락처</option>
          </select>
          <input
            type='text'
            className='emp-search-input'
            placeholder='검색어 입력'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <select
            value={searchDept}
            onChange={(e) => setSearchDept(e.target.value)}
            className='emp-search-dept'
          >
            <option value='전체'>전체</option>
            {departments.map((dept) => (
              <option value={dept.name} key={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          <label style={{ marginLeft: 8 }}>
            <input
              type='checkbox'
              checked={showInactive}
              onChange={handleShowInactiveChange}
            />
            퇴직자만
          </label>
          <button type='submit' className='emp-search-btn'>
            검색
          </button>
          <button
            type='button'
            className='emp-search-clear'
            onClick={handleReset}
          >
            초기화
          </button>
        </form>
        <table className='emp-list-table'>
          <thead>
            <tr>
              <th
                onClick={() => handleSort('name')}
                style={{ cursor: 'pointer', textAlign: 'center' }}
              >
                이름{' '}
                {sortField === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th
                onClick={() => handleSort('department')}
                style={{ cursor: 'pointer', textAlign: 'center' }}
              >
                부서{' '}
                {sortField === 'department'
                  ? sortOrder === 'asc'
                    ? '▲'
                    : '▼'
                  : ''}
              </th>
              <th
                onClick={() => handleSort('position')}
                style={{ cursor: 'pointer', textAlign: 'center' }}
              >
                직급{' '}
                {sortField === 'position'
                  ? sortOrder === 'asc'
                    ? '▲'
                    : '▼'
                  : ''}
              </th>
              <th
                onClick={() => handleSort('role')}
                style={{ cursor: 'pointer', textAlign: 'center' }}
              >
                직책{' '}
                {sortField === 'role' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th
                onClick={() => handleSort('phone')}
                style={{ cursor: 'pointer', textAlign: 'center' }}
              >
                연락처{' '}
                {sortField === 'phone' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr
                key={emp.id}
                onClick={() => {
                  if (selectedId === emp.id) {
                    setSelectedId(null);
                    setTimeout(() => setSelectedId(emp.id), 0);
                  } else {
                    setSelectedId(emp.id);
                  }
                }}
                className={selectedId === emp.id ? 'selected' : ''}
                style={{ cursor: 'pointer' }}
              >
                <td style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <img
                      src={emp.profileImageUri || pin}
                      alt='profile'
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <span>{emp.name}</span>

                      {/* “평가 필요” 뱃지 – 재직자만 표시 */}
                      {!showInactive /* 퇴직자 화면이면 건너뜀 */ &&
                        evaluationStatus[emp.employeeId || emp.id] ===
                          false && (
                          <span
                            style={{
                              background: '#ff5252',
                              color: '#fff',
                              borderRadius: '10px',
                              fontSize: '0.62em',
                              padding: '0 5px',
                              marginTop: '3px',
                              fontWeight: 600,
                              letterSpacing: '0.01em',
                              height: '16px',
                              lineHeight: '16px',
                              display: 'inline-block',
                            }}
                          >
                            평가 필요
                          </span>
                        )}
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>{emp.department}</td>
                <td style={{ textAlign: 'center' }}>{emp.position}</td>
                <td style={{ textAlign: 'center' }}>{emp.role}</td>
                <td style={{ textAlign: 'center' }}>{emp.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
      {/* 상세정보 모달 */}
      {isDetailModalOpen && selectedId && (
        <ModalPortal>
          <div
            className={styles.modalOverlay}
            onClick={handleModalClose}
            style={{ zIndex: 1000 }}
          >
            <div
              className={styles.modalContainer}
              style={{
                maxWidth: '850px',
                width: '85vw',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleModalClose}
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
              <EmployeeDetail
                employee={selectedDetail}
                onEdit={handleEdit}
                onEval={handleEvalWithCheck}
                onTransferHistory={handleTransferHistory} // 빈 함수 아님!
              />
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 인사이동 이력 모달 */}
      {isTransferHistoryOpen && (
        <ModalPortal>
          <TransferHistoryModal
            employeeId={selectedDetail.employeeId ?? selectedDetail.id}
            onClose={() => setIsTransferHistoryOpen(false)}
          />
        </ModalPortal>
      )}
    </>
  );
}
