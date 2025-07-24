import React, { useEffect, useState } from 'react';
import HRHeader from './HRHeader';
import './EmployeeList.scss';
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, HR_SERVICE } from '../../configs/host-config';
import EvaluationView from './EvaluationView';
import EvaluationForm from './EvaluationForm';
import { useNavigate } from 'react-router-dom';
import { getEmployeeList } from '../../common/hr';
import { warn } from '../../common/common';

export default function EmployeeViewList() {
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

  // 최신 인사평가 불러오기 (예시: /hr-service/evaluations/latest/{employeeId})
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

  const handleReset = () => {
    setSearchField('name');
    setSearchText('');
    setSearchDept('전체');
    setSortField(null); // 정렬 초기화
    setSortOrder('asc'); // 정렬 초기화
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
                    style={{ cursor: 'pointer' }}
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
                    style={{ cursor: 'pointer' }}
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
                    style={{ cursor: 'pointer' }}
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
                    style={{ cursor: 'pointer' }}
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
                    style={{ cursor: 'pointer' }}
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
                    <td>{emp.name}</td>
                    <td>{emp.department}</td>
                    <td>{emp.position}</td>
                    <td>{emp.role}</td>
                    <td>{emp.phone}</td>
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
              <EvaluationView
                evaluation={evaluation}
                onClose={handleClose}
                onEdit={handleEditEvaluation}
              />
            )}
            {showEvaluationForm && (
              <EvaluationForm employee={selectedDetail} onClose={handleClose} />
            )}
          </>
        )}
      </div>
    </>
  );
}
