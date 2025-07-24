import React, { useState, useEffect, useContext } from 'react';
import './EmployeeRegister.scss'; // 스타일 재사용!
import HRHeader from './HRHeader';
import axios from 'axios';
import { API_BASE_URL, HR_SERVICE } from '../../configs/host-config';
import axiosInstance from '../../configs/axios-config';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { getDepartmentNameById } from '../../common/hr';
import Swal from 'sweetalert2';
import { swalConfirm } from '../../common/common';
import ModalPortal from '../../components/approval/ModalPortal';

export default function EmployeeEdit({ employee, onClose, hideHeader }) {
  // 기존 employee prop을 state로 복사 (혹은 useEffect로 세팅)
  const [email, setEmail] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [birth, setBirth] = useState('');
  const [departmentId, setDepartmentId] = useState(1);
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [memo, setMemo] = useState('');
  const [departments, setDepartments] = useState([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [isDeptLoading, setIsDeptLoading] = useState(false);
  const [isNewEmployee, setIsNewEmployee] = useState(true);
  const [hireDate, setHireDate] = useState('');
  const [position, setPosition] = useState(''); // 직급 초기값 설정
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null); // 현재 수정할 직원의 ID
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const navigate = useNavigate();
  const { userId, userRole } = useContext(UserContext); // userRole 추가

  // prop으로 받은 employee가 있으면 그 정보를 사용하고, 없으면 userId로 본인 정보를 조회
  useEffect(() => {
    if (employee) {
      setCurrentEmployeeId(employee.employeeId);
      setEmail(employee.email || '');
      setEmployeeName(employee.name || '');
      setBirth(employee.birthday ? employee.birthday.split('T')[0] : '');
      setDepartmentId(employee.departmentId || 1);
      setAddress(employee.address || '');
      setRole(employee.role || '');
      setPhone(employee.phone || '');
      setPosition(employee.position || '');
      setMemo(employee.memo || '');
      setIsNewEmployee(employee.isNewEmployee !== false);
      setHireDate(employee.hireDate ? employee.hireDate.split('T')[0] : '');
    } else if (userId) {
      // prop이 없을 때, userId로 본인 정보를 조회
      const fetchMyData = async () => {
        try {
          const res = await axiosInstance.get(
            `${API_BASE_URL}${HR_SERVICE}/employees/${userId}`,
          );
          const myData = res.data.result;
          setCurrentEmployeeId(myData.employeeId);
          setEmail(myData.email || '');
          setEmployeeName(myData.name || '');
          setBirth(myData.birthday ? myData.birthday.split('T')[0] : '');
          setDepartmentId(myData.departmentId || 1);
          setAddress(myData.address || '');
          setRole(myData.role || '');
          setPhone(myData.phone || '');
          setPosition(myData.position || '');
          setMemo(myData.memo || '');
          setIsNewEmployee(myData.isNewEmployee !== false);
          setHireDate(myData.hireDate ? myData.hireDate.split('T')[0] : '');
        } catch (error) {
          console.error('Failed to fetch my data:', error);
          alert('내 정보를 불러오는 데 실패했습니다.');
          navigate(-1); // 이전 페이지로 돌아가기
        }
      };
      fetchMyData();
    }
  }, [employee, userId, navigate]);

  // 부서 목록 불러오기
  const fetchDepartments = async () => {
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}${HR_SERVICE}/departments`,
      );
      setDepartments(res.data.result);
    } catch (err) {
      setDepartments([]);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

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
      alert('부서 등록 성공!');
      setNewDeptName('');
      setShowDeptModal(false);
      fetchDepartments();
    } catch (err) {
      alert(
        err.response?.data?.statusMessage ||
          err.response?.data?.message ||
          '부서 등록 실패',
      );
    } finally {
      setIsDeptLoading(false);
    }
  };

  const handleAddressSearch = () => {
    new window.daum.Postcode({
      oncomplete: function (data) {
        setAddress(data.address);
      },
    }).open();
  };

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

  // 수정 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      alert('유효하지 않은 이메일 형식입니다!');
      return;
    }
    if (!hireDate.trim()) {
      alert('입사일을 입력해주세요.');
      return;
    }
    setShowConfirmModal(true);
    setPendingSubmit(true);
  };

  // 실제 서버로 PATCH 요청
  const handleConfirm = async () => {
    setShowConfirmModal(false);
    setPendingSubmit(false);
    try {
      const res = await axiosInstance.patch(
        `${API_BASE_URL}${HR_SERVICE}/employees/${currentEmployeeId}`,
        {
          email,
          name: employeeName,
          birthday: birth,
          address,
          departmentId,
          phone,
          status: employee.status || 'ACTIVE',
          role: role,
          position: position,
          memo,
          isNewEmployee,
          hireDate,
        },
      );
      if (onClose) {
        onClose({
          ...res.data.result,
          department: getDepartmentNameById(departmentId),
        });
      }
      Swal.fire({
        title: '알림',
        text: '수정이 완료 되었습니다.',
        icon: 'success',
        confirmButtonText: '확인',
      });
    } catch (error) {
      alert(error?.response?.data?.statusMessage || error.message);
    }
  };
  const handleCancel = () => {
    setShowConfirmModal(false);
    setPendingSubmit(false);
  };

  return (
    <>
      {!hideHeader && <HRHeader />}
      <div className='register-root'>
        <h2 className='register-title'>정보 수정</h2>

        <form className='register-form' onSubmit={handleSubmit}>
          {/* 이메일 */}
          <label className='reg-label'>이메일</label>
          <div className='reg-email-group'>
            <input
              className='reg-input'
              value={email}
              readOnly={!!employee || !!userId} // employee prop이 있거나 userId가 있으면 readonly
              style={{ backgroundColor: '#eee' }}
              onChange={(e) => setEmail(e.target.value)}
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
                  disabled={userRole === 'EMPLOYEE'}
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
                  disabled={userRole === 'EMPLOYEE'}
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className='reg-label'>직급</label>
              <select
                className='reg-input'
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                disabled={userRole === 'EMPLOYEE'}
              >
                <option value='INTERN'>INTERN</option>
                <option value='JUNIOR'>JUNIOR</option>
                <option value='SENIOR'>SENIOR</option>
                <option value='MANAGER'>MANAGER</option>
                <option value='DIRECTOR'>DIRECTOR</option>
              </select>
            </div>
            <div>
              <label className='reg-label'>직책</label>
              <select
                className='reg-input'
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={userRole === 'EMPLOYEE'}
              >
                <option value='EMPLOYEE'>EMPLOYEE</option>
                <option value='HR_MANAGER'>HR_MANAGER</option>
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
            <button
              type='button'
              className='btn gray'
              onClick={() => (onClose ? onClose() : navigate(-1))} // 취소 버튼 동작 수정
            >
              취소
            </button>
            <button type='submit' className='btn blue'>
              수정
            </button>
          </div>
        </form>
      </div>
      {/* 부서 추가 모달 */}
      {showDeptModal && (
        <div className='dept-modal-overlay'>
          <div className='dept-modal'>
            <h3>부서 추가</h3>
            <input
              className='reg-input'
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder='부서명 입력'
              disabled={isDeptLoading}
            />
            <div className='dept-modal-btns'>
              <button
                className='btn blue'
                onClick={handleAddDepartment}
                disabled={isDeptLoading}
              >
                추가
              </button>
              <button
                className='btn gray'
                onClick={() => setShowDeptModal(false)}
                disabled={isDeptLoading}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 수정 확인 모달 */}
      {showConfirmModal && (
        <ModalPortal>
          <div className='dept-modal-overlay'>
            <div className='dept-modal'>
              <h3>수정 정보 확인</h3>
              <div
                style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 16 }}
              >
                <table style={{ width: '100%', fontSize: '1rem' }}>
                  <tbody>
                    <tr>
                      <th align='left'>이메일</th>
                      <td>{email}</td>
                    </tr>
                    <tr>
                      <th align='left'>이름</th>
                      <td>{employeeName}</td>
                    </tr>
                    <tr>
                      <th align='left'>생년월일</th>
                      <td>{birth}</td>
                    </tr>
                    <tr>
                      <th align='left'>부서</th>
                      <td>
                        {departments.find((d) => d.id == departmentId)?.name ||
                          departmentId}
                      </td>
                    </tr>
                    <tr>
                      <th align='left'>직급</th>
                      <td>{position}</td>
                    </tr>
                    <tr>
                      <th align='left'>직책</th>
                      <td>{role}</td>
                    </tr>
                    <tr>
                      <th align='left'>주소</th>
                      <td>{address}</td>
                    </tr>
                    <tr>
                      <th align='left'>핸드폰</th>
                      <td>{phone}</td>
                    </tr>
                    <tr>
                      <th align='left'>입사일</th>
                      <td>{hireDate}</td>
                    </tr>
                    <tr>
                      <th align='left'>입사구분</th>
                      <td>{isNewEmployee ? '신입' : '경력'}</td>
                    </tr>
                    <tr>
                      <th align='left'>메모</th>
                      <td>{memo}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className='dept-modal-btns'>
                <button className='btn blue' onClick={handleConfirm}>
                  확인
                </button>
                <button className='btn gray' onClick={handleCancel}>
                  취소
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
