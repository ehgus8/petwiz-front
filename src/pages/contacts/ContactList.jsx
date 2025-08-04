import React, { useState, useEffect } from 'react';
import './ContactList.scss';
import axiosInstance from '../../configs/axios-config';
import { get } from 'lodash';
import { API_BASE_URL, HR_SERVICE } from '../../configs/host-config';
import pin from '../../assets/pin.jpg'; // 임시 프로필 사진

const ContactList = () => {
  const [searchField, setSearchField] = useState('name');
  const [searchText, setSearchText] = useState('');
  const [sortField, setSortField] = useState('name');
  const [employees, setEmployees] = useState([]);
  const [searchDept, setSearchDept] = useState('전체');
  const [showInactive, setShowInactive] = useState(false); // 퇴직자만 체크박스
  const [page, setPage] = useState(0); // 0-based
  const [size, setSize] = useState(window.innerWidth <= 600 ? 5 : 10);
  const [totalPages, setTotalPages] = useState(1);
  const [departmentList, setDepartmentList] = useState([]);

  // 반응형: 화면 크기에 따라 size 자동 조정
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 600) {
        setSize(5);
      } else {
        setSize(10);
      }
    };
    window.addEventListener('resize', handleResize);
    // 최초 진입 시도 반영
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 부서 목록 최초 1회
  useEffect(() => {
    const getDepartments = async () => {
      const res = await axiosInstance.get(
        `${API_BASE_URL}${HR_SERVICE}/departments`,
      );
      if (res.status === 200) setDepartmentList(res.data.result);
    };
    getDepartments();
  }, []);

  // 직원 목록: page, 검색, 부서, size 바뀔 때마다
  const getEmployeeList = async ({
    field = searchField,
    keyword = searchText,
    department = searchDept,
    page: reqPage = page,
    size: reqSize = size,
    isActive = !showInactive, // 기본값: 체크박스 상태에 따라
  } = {}) => {
    try {
      let params = `?page=${reqPage}&size=${reqSize}`;
      if (keyword.trim())
        params += `&field=${field}&keyword=${encodeURIComponent(keyword)}`;
      if (department !== '전체')
        params += `&department=${encodeURIComponent(department)}`;
      if (typeof isActive === 'boolean') params += `&isActive=${isActive}`; // 추가
      const res = await axiosInstance.get(
        `${API_BASE_URL}${HR_SERVICE}/employees/contact${params}`,
      );
      setEmployees(res.data.result.content);
      setTotalPages(res.data.result.totalPages || 1);
    } catch (error) {
      alert(error?.response?.data?.statusMessage || error.message);
    }
  };

  useEffect(() => {
    getEmployeeList({ page, size });
    // eslint-disable-next-line
  }, [page, size]);

  // 검색/필터/정렬 변경 시
  const handleSearch = (e) => {
    e.preventDefault();
    getEmployeeList({
      field: searchField,
      keyword: searchText,
      department: searchDept,
      page: 0,
      size,
      isActive: !showInactive, // 체크 시 false(퇴사자), 아니면 true(재직자)
    });
    setPage(0);
  };
  const handleReset = () => {
    setSearchField('name');
    setSearchText('');
    setSearchDept('전체');
    setShowInactive(false); // 초기화 시 재직자만
    getEmployeeList({
      field: 'name',
      keyword: '',
      department: '전체',
      page: 0,
      size,
      isActive: true,
    });
    setPage(0);
  };
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  // 정렬만 프론트에서
  const sortedEmployees = [...employees].sort((a, b) => {
    if (sortField === 'name') return a.name.localeCompare(b.name);
    if (sortField === 'position') return a.position.localeCompare(b.position);
    if (sortField === 'role') return a.role.localeCompare(b.role);
    return 0;
  });

  return (
    <div className='contact-root'>
      <aside className='contact-org'>
        <h3>조직도</h3>
        <ul>
          <li
            className={searchDept === '전체' ? 'selected' : ''}
            onClick={() => {
              setSearchDept('전체');
              setPage(0);
              getEmployeeList({ department: '전체', page: 0, size });
            }}
          >
            전체
          </li>
          {departmentList
            .filter((dept) => dept.name !== '전체')
            .map((dept) => (
              <li
                key={dept.id}
                className={searchDept === dept.name ? 'selected' : ''}
                onClick={() => {
                  setSearchDept(dept.name);
                  setPage(0);
                  getEmployeeList({ department: dept.name, page: 0, size });
                }}
              >
                {dept.name}
              </li>
            ))}
        </ul>
      </aside>
      <section className='contact-main'>
        <form className='contact-search' onSubmit={handleSearch}>
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
          >
            <option value='name'>이름</option>
            <option value='position'>직급</option>
            <option value='role'>직책</option>
          </select>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder='검색어 입력'
          />
          <label style={{ marginLeft: 8 }}>
            <input
              type='checkbox'
              checked={showInactive}
              onChange={(e) => {
                setShowInactive(e.target.checked);
                getEmployeeList({
                  field: searchField,
                  keyword: searchText,
                  department: searchDept,
                  page: 0,
                  size,
                  isActive: !e.target.checked ? true : false, // true면 재직자, false면 퇴직자만
                });
                setPage(0);
              }}
            />
            퇴직자만
          </label>
          <button type='submit'>검색</button>
          <div className='contact-sort'>
            <span>정렬:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
            >
              <option value='name'>이름순</option>
              <option value='position'>직급순</option>
              <option value='role'>직책순</option>
            </select>
            <button type='button' onClick={handleReset}>
              초기화
            </button>
          </div>
        </form>
        <div className='contact-list'>
          {sortedEmployees.map((emp) => (
            <div className='contact-card' key={emp.id}>
              <div className='contact-profile'>
                <img
                  src={emp.profileImageUri ? emp.profileImageUri : pin}
                  alt='프로필 사진'
                />
              </div>
              <div className='contact-info'>
                <b>
                  {emp.name} <span>{emp.position}</span> <span>{emp.role}</span>{' '}
                  <span>{emp.department}</span>
                </b>
                <div>{emp.phone}</div>
                <div>{emp.email}</div>
              </div>
            </div>
          ))}
          {sortedEmployees.length === 0 && (
            <div className='no-result'>검색 결과가 없습니다.</div>
          )}
        </div>
        {/* 페이징 UI */}
        <div
          className='contact-pagination'
          style={{ textAlign: 'center', margin: '1rem 0' }}
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
              className={page === idx ? 'active' : ''}
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
      </section>
    </div>
  );
};

export default ContactList;
