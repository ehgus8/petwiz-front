import React, { useEffect, useState, useContext } from 'react';
import HRHeader from './HRHeader';
import './EmployeeList.scss';
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, HR_SERVICE } from '../../configs/host-config';
import EvaluationView from './EvaluationView';
import EvaluationForm from './EvaluationForm';
import { useNavigate } from 'react-router-dom';
import { getEmployeeList } from '../../common/hr';
import { warn } from '../../common/common';
import ModalPortal from '../../components/approval/ModalPortal';
import styles from '../../components/approval/CategoryModal.module.scss';
import { UserContext } from '../../context/UserContext';
import pin from '../../assets/pin.jpg';

export default function EmployeeViewList() {
  const { userId } = useContext(UserContext);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState({});
  const [employees, setEmployees] = useState([]);
  const [searchField, setSearchField] = useState('name');
  const [searchText, setSearchText] = useState('');
  const [searchDept, setSearchDept] = useState('전체');
  const [showInactive, setShowInactive] = useState(false); // 퇴직자만 체크박스
  // 실제 검색에 사용되는 state
  const [appliedSearch, setAppliedSearch] = useState({
    field: 'name',
    keyword: '',
    department: '전체',
    isActive: true, // 기본값: 재직자만
  });
  const [evaluation, setEvaluation] = useState(null);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [editEvaluation, setEditEvaluation] = useState(null);
  const [evaluationStatus, setEvaluationStatus] = useState({});
  const navigate = useNavigate();

  // 정렬 state
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  // 정렬 핸들러
  const handleSort = (field) => {
    let nextSortOrder = 'asc';
    if (sortField === field) {
      nextSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    setSortField(field);
    setSortOrder(nextSortOrder);
    setPage(0);
    // 정렬 시에도 현재 검색 조건을 반영해서 getEmployeeList 호출
    getEmployeeList({
      field: searchField,
      keyword: searchText,
      department: searchDept,
      sortField: field,
      sortOrder: nextSortOrder,
      setEmployees,
      setTotalPages,
    });
  };

  // 정렬, 페이지, 페이지 크기 변화 시 목록 재요청 (검색 조건은 appliedSearch 기준)
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
      isActive: appliedSearch.isActive, // 추가
    });
    // eslint-disable-next-line
  }, [page, size, sortField, sortOrder, appliedSearch]);

  // 직원별 평가 여부 전체 조회
  useEffect(() => {
    if (!employees.length) return;
    const fetchAllEvaluationStatus = async () => {
      const statusObj = {};
      await Promise.all(
        employees.map(async (emp) => {
          const empKey = emp.employeeId || emp.id;
          try {
            // "이번달 평가가 없으면 에러(404/500)"를 반환한다는 가정
            await axiosInstance.get(
              `${API_BASE_URL}${HR_SERVICE}/evaluation/${empKey}`,
            );
            statusObj[empKey] = true; // 평가가 있으면 true
          } catch {
            statusObj[empKey] = false; // 평가가 없으면 false
          }
        }),
      );
      setEvaluationStatus(statusObj);
    };
    fetchAllEvaluationStatus();
    // eslint-disable-next-line
  }, [employees]);

  useEffect(() => {
    if (selectedId == null) return;
    getLatestEvaluation(selectedId);
    // eslint-disable-next-line
  }, [selectedId]);

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

  // 최신 인사평가 불러오기 (예시: /hr-service/evaluation/{employeeId})
  const getLatestEvaluation = async (id) => {
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}${HR_SERVICE}/evaluation/${id}`,
      );
      setEvaluation(res.data.result);
    } catch (error) {
      setEvaluation(null);
      warn('인사평가 정보가 없습니다.');
    }
  };

  const handleClose = () => {
    setSelectedId(null);
    setEvaluation(null);
    setShowEvaluationForm(false);
  };

  const handleEvaluate = (employee) => {
    setShowEvaluationForm(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedSearch({
      field: searchField,
      keyword: searchText,
      department: searchDept,
      isActive: !showInactive, // 체크 시 false(퇴사자), 아니면 true(재직자)
    });
    setPage(0); // 검색 시 첫 페이지로
    setSelectedId(null);
    setEvaluation(null);
  };

  // '퇴직자만' 체크박스가 변경될 때마다 바로 검색
  useEffect(() => {
    setAppliedSearch((prev) => ({
      ...prev,
      isActive: !showInactive,
    }));
    setPage(0); // 첫 페이지로 이동
    setSelectedId(null); // 상세 닫기
    setEvaluation(null);
  }, [showInactive]);

  const handleReset = () => {
    setSearchField('name');
    setSearchText('');
    setSearchDept('전체');
    setSortField(null); // 정렬 초기화
    setSortOrder('asc'); // 정렬 초기화
    setShowInactive(false); // 체크박스도 해제
    setAppliedSearch({
      field: 'name',
      keyword: '',
      department: '전체',
    });
    setPage(0);
    setSelectedId(null);
    setEvaluation(null);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const handleEditEvaluation = (evaluation) => {
    setEditEvaluation(evaluation);
    setEditMode(true);
  };

  const handleEditClose = () => {
    setEditMode(false);
    setEditEvaluation(null);
  };

  const handleEditSuccess = () => {
    if (selectedId) getLatestEvaluation(selectedId);
  };

  return (
    <>
      <HRHeader />
      <div className='emp-list-root'>
        {editMode && editEvaluation ? (
          <EvaluationForm
            evaluation={editEvaluation}
            onClose={handleEditClose}
            onSubmitSuccess={handleEditSuccess}
          />
        ) : (
          <>
            <h2 className='emp-list-title'>직원 인사평가 조회</h2>
            <form className='emp-search-bar' onSubmit={handleSearch}>
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className='emp-search-select'
              >
                <option value='name'>이름</option>
                <option value='department'>부서</option>
                <option value='position'>직급</option>
                <option value='role'>직책</option>
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
                  onChange={(e) => setShowInactive(e.target.checked)}
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
                    {sortField === 'name'
                      ? sortOrder === 'asc'
                        ? '▲'
                        : '▼'
                      : ''}
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
                    {sortField === 'role'
                      ? sortOrder === 'asc'
                        ? '▲'
                        : '▼'
                      : ''}
                  </th>
                  <th
                    onClick={() => handleSort('phone')}
                    style={{ cursor: 'pointer', textAlign: 'center' }}
                  >
                    연락처{' '}
                    {sortField === 'phone'
                      ? sortOrder === 'asc'
                        ? '▲'
                        : '▼'
                      : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedId(emp.id)}
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
                            width: '24px',
                            height: '24px',
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
                          {evaluationStatus[emp.employeeId || emp.id] ===
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
            {/* 평가 조회/등록 조건부 렌더링 */}
            {selectedId && !showEvaluationForm && evaluation && (
              <ModalPortal>
                <div
                  className={styles.modalOverlay}
                  onClick={() => setSelectedId(null)}
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
                      onClick={() => setSelectedId(null)}
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
                      evaluation={evaluation}
                      onClose={handleClose}
                      onEdit={handleEditEvaluation}
                      userId={userId}
                    />
                  </div>
                </div>
              </ModalPortal>
            )}
            {showEvaluationForm && (
              <ModalPortal>
                <div
                  className={styles.modalOverlay}
                  onClick={() => setShowEvaluationForm(false)}
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
                      onClick={() => setShowEvaluationForm(false)}
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
                    <EvaluationForm
                      employee={selectedDetail}
                      onClose={handleClose}
                    />
                  </div>
                </div>
              </ModalPortal>
            )}
          </>
        )}
      </div>
    </>
  );
}
