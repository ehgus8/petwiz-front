import React, { useState, useEffect } from 'react';
import './EmployeeRegister.scss';
import HRHeader from './HRHeader';
import axios from 'axios';
import { API_BASE_URL, HR_SERVICE } from '../../configs/host-config';
import axiosInstance from '../../configs/axios-config';
import { useNavigate } from 'react-router-dom';
import { succeed, swalError, warn } from '../../common/common';
import EmployeeSelectorModal from '../../common/EmployeeSelectorModal';
import ExcelUploader from '../../common/ExcelUploader';
import { getEmployeeList } from '../../common/hr'; // 상단 import 추가

export default function EmployeeRegister() {
  const [departments, setDepartments] = useState([]);
  const [email, setEmail] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [birth, setBirth] = useState('');
  const [departmentId, setDepartmentId] = useState(1);
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [position, setPosition] = useState('INTERN'); // 직책 추가
  const [phone, setPhone] = useState('');
  const [memo, setMemo] = useState('');
  const [isNewEmployee, setIsNewEmployee] = useState(true);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [isDeptLoading, setIsDeptLoading] = useState(false);
  const [hireDate, setHireDate] = useState('');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가
  const [excelEmployees, setExcelEmployees] = useState([]);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [registeredEmployees, setRegisteredEmployees] = useState([]); // 추가

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // 전화번호 형식 검증: 010-1234-5678, 010-123-4567 등
  function isValidPhone(phone) {
    return /^01[016789]-\d{3,4}-\d{4}$/.test(phone);
  }

  function getAge(birth) {
    if (!birth) return '';
    const today = new Date();
    const dob = new Date(birth);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  // 필수 항목 검증 함수
  function isFormValid() {
    if (
      !email.trim() ||
      !employeeName.trim() ||
      !birth.trim() ||
      !address.trim() ||
      !role.trim() ||
      !phone.trim() ||
      !hireDate.trim()
    ) {
      // alert('필수 항목을 모두 입력해주세요.');
      warn('필수 항목을 모두 입력해주세요.');
      return false;
    }
    if (!isValidEmail(email)) {
      warn('유효하지 않은 이메일 형식입니다!');
      return false;
    }
    if (!isValidPhone(phone)) {
      warn('전화번호는 010-1234-5678 형식으로 입력해주세요.');
      return false;
    }
    return true;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setIsLoading(true); // 로딩 시작
    try {
      await axiosInstance.post(`${API_BASE_URL}${HR_SERVICE}/employees`, {
        email,
        name: employeeName,
        birthday: birth,
        address,
        departmentId,
        phone,
        status: 'ACTIVE',
        role,
        memo,
        isNewEmployee,
        hireDate,
        position, // 추가
      });
      succeed('등록 성공!');
      navigate('/hr/employee-list');
    } catch (error) {
      swalError(error.response?.data?.statusMessage || '등록 실패');
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  const handleAddressSearch = () => {
    new window.daum.Postcode({
      oncomplete: function (data) {
        setAddress(data.address);
      },
    }).open();
  };

  // 부서 등록 핸들러
  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) {
      alert('부서명을 입력하세요.');
      return;
    }

    setIsDeptLoading(true);
    try {
      const res = await axiosInstance.post(
        `${API_BASE_URL}${HR_SERVICE}/department/add`,
        {
          name: newDeptName,
        },
      );
      succeed('부서 등록 성공!');
      setNewDeptName('');
      setShowDeptModal(false);
      fetchDepartments();
    } catch (err) {
      swalError(
        err.response?.data?.statusMessage ||
          err.response?.data?.message ||
          '부서 등록 실패',
      );
    } finally {
      setIsDeptLoading(false);
    }
  };

  // 부서 목록 불러오기
  const fetchDepartments = async () => {
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}${HR_SERVICE}/departments`,
      );
      setDepartments(res.data.result);
    } catch (err) {
      console.log(err, '부서 목록 못부름');
      alert('부서 목록을 불러오지 못했습니다.');
    }
  };

  function excelSerialToDate(serial) {
    // 엑셀 기준: 1899-12-30
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(
      excelEpoch.getTime() + (serial - 1) * 24 * 60 * 60 * 1000,
    );
    // YYYY-MM-DD 형식으로 반환
    return date.toISOString().slice(0, 10);
  }

  function toDateInputFormat(dateValue) {
    if (!dateValue) return '';
    // 이미 YYYY-MM-DD면 그대로 반환
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue))
      return dateValue;
    // YYYY.MM.DD, YYYY/MM/DD, YYYY-M-D 등 처리
    if (typeof dateValue === 'string') {
      const parts = dateValue.replace(/[./]/g, '-').split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        return [
          y.padStart(4, '0'),
          m.padStart(2, '0'),
          d.padStart(2, '0'),
        ].join('-');
      }
    }
    // 엑셀 시리얼 넘버(숫자) 처리
    if (!isNaN(dateValue)) {
      return excelSerialToDate(Number(dateValue));
    }
    return '';
  }

  const handleEmployeeSelect = (emp) => {
    setEmail(emp['이메일'] || '');
    setRole(emp['직책'] || 'EMPLOYEE');
    setPosition(emp['직급'] || 'INTERN');
    setEmployeeName(emp['이름'] || '');
    setBirth(toDateInputFormat(emp['생년월일']));
    setAddress(emp['주소'] || '');
    setPhone(emp['핸드폰'] || '');
    setHireDate(toDateInputFormat(emp['입사일']) || '');
    setIsNewEmployee(emp['입사구분'] === '신입');
    setMemo(emp['메모'] || '');

    // 부서명 → id 변환
    const deptName = emp['부서'];
    const matchedDept = departments.find((d) => d.name === deptName);
    setDepartmentId(matchedDept ? matchedDept.id : 1); // 없으면 기본값 1

    setShowEmployeeModal(false);
  };

  useEffect(() => {
    fetchDepartments();
    // 등록된 직원 불러오기
    getEmployeeList({
      field: 'name',
      keyword: '',
      department: '전체',
      setEmployees: setRegisteredEmployees,
      setTotalPages: () => {},
      isActive: true, // 재직자만
      size: 9999,
    });
  }, []);

  // 이미 등록된 직원 이메일 배열
  const registeredEmails = registeredEmployees.map(
    (emp) => emp.email && emp.email.trim(),
  );
  // 엑셀에서 불러온 직원 중, 등록되지 않은 직원만 필터링
  const filteredExcelEmployees = excelEmployees.filter(
    (emp) => emp['이메일'] && !registeredEmails.includes(emp['이메일'].trim()),
  );

  // 디버깅용 콘솔 출력
  console.log(
    'registeredEmployees:',
    registeredEmployees.map((e) => e.email),
  );
  console.log('registeredEmails:', registeredEmails);
  console.log(
    'excelEmployees:',
    excelEmployees.map((e) => e['이메일']),
  );
  console.log(
    'filteredExcelEmployees:',
    filteredExcelEmployees.map((e) => e['이메일']),
  );

  return (
    <>
      <HRHeader />
      <div className='register-root'>
        <h2 className='register-title'>신규 등록</h2>
        {/* 엑셀 업로더 및 직원 불러오기 버튼을 form 바깥, 한 줄에 배치 */}
        <div className='excel-upload-row'>
          <ExcelUploader onDataParsed={setExcelEmployees} />
          <button
            type='button'
            className={`employee-select-btn${excelEmployees.length === 0 ? ' disabled' : ''}`}
            onClick={() => setShowEmployeeModal(true)}
            disabled={excelEmployees.length === 0}
            style={{
              display: excelEmployees.length === 0 ? 'none' : 'block',
            }}
          >
            직원 불러오기
          </button>
        </div>
        {/* 직원 선택 모달 */}
        {showEmployeeModal && (
          <EmployeeSelectorModal
            employeeList={filteredExcelEmployees}
            onSelect={handleEmployeeSelect}
            onClose={() => setShowEmployeeModal(false)}
          />
        )}
        <form className='register-form' onSubmit={handleSubmit}>
          {/* 이메일 */}
          <label className='reg-label'>이메일</label>
          <div className='reg-email-group'>
            <input
              className='reg-input'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='예: abc@domain.com'
            />
          </div>

          {/* 2단 배치 필드 */}
          <div className='reg-grid'>
            <div>
              <label className='reg-label'>생년월일</label>
              <input
                className='reg-input'
                type='date'
                value={birth}
                onChange={(e) => setBirth(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className='reg-label'>나이</label>
              <input
                className='reg-input'
                type='number'
                value={getAge(birth)}
                readOnly
                placeholder='생년월일 선택시 자동계산'
              />
            </div>
            <div>
              <label className='reg-label'>직원명</label>
              <input
                className='reg-input'
                type='text'
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
              />
            </div>
            <div>
              <label className='reg-label'>부서명</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <select
                  className='reg-input'
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  style={{ flex: 1 }}
                >
                  {departments.map((dept) => (
                    <option value={dept.id} key={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <button
                  type='button'
                  style={{
                    border: 'none',
                    background: '#e6e6e6',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    fontSize: 20,
                    cursor: 'pointer',
                    marginLeft: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                  aria-label='부서 추가'
                  onClick={() => setShowDeptModal(true)}
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className='reg-label'>직책</label>
              <select
                className='reg-input'
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value='EMPLOYEE'>EMPLOYEE</option>
                <option value='HR_MANAGER'>HR_MANAGER</option>
              </select>
            </div>
            <div>
              <label className='reg-label'>직급</label>
              <select
                className='reg-input'
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              >
                <option value='INTERN'>INTERN</option>
                <option value='JUNIOR'>JUNIOR</option>
                <option value='SENIOR'>SENIOR</option>
                <option value='MANAGER'>MANAGER</option>
                <option value='DIRECTOR'>DIRECTOR</option>
              </select>
            </div>
            <div>
              <label className='reg-label'>주소</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  className='reg-input'
                  type='text'
                  value={address}
                  readOnly
                  placeholder='주소'
                  style={{ flex: 1 }}
                />
                <button
                  type='button'
                  onClick={handleAddressSearch}
                  className='btn blue'
                >
                  주소 찾기
                </button>
              </div>
            </div>
            <div>
              <label className='reg-label'>핸드폰</label>
              <input
                className='reg-input'
                type='text'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder='010-1234-5678'
                maxLength={13}
              />
            </div>
            <div>
              <label className='reg-label'>입사일</label>
              <input
                className='reg-input'
                type='date'
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className='reg-label'>입사구분</label>
              <select
                className='reg-input'
                value={isNewEmployee ? '신입' : '경력'}
                onChange={(e) => setIsNewEmployee(e.target.value === '신입')}
              >
                <option value='신입'>신입</option>
                <option value='경력'>경력</option>
              </select>
            </div>
          </div>
          {/* 메모 */}
          <label className='reg-label'>메모</label>
          <textarea
            className='reg-input reg-textarea'
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />

          {/* 하단 버튼 */}
          <div className='reg-btns'>
            <button type='button' className='btn gray'>
              목록
            </button>
            <button type='submit' className='btn blue' disabled={isLoading}>
              {isLoading ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
      {showDeptModal && (
        <div
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
          onClick={() => setShowDeptModal(false)}
        >
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              minWidth: 300,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>부서 등록</h3>
            <input
              className='reg-input'
              type='text'
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder='부서명 입력'
              autoFocus
            />
            <div className='dept-modal-btns'>
              <button
                type='button'
                className='btn gray'
                onClick={() => setShowDeptModal(false)}
                disabled={isDeptLoading}
              >
                취소
              </button>
              <button
                type='button'
                className='btn blue'
                onClick={handleAddDepartment}
                disabled={isDeptLoading}
              >
                {isDeptLoading ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
