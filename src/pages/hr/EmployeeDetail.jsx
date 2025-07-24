import React, { useState, useEffect, useRef, useContext } from 'react';
import './EmployeeDetail.scss';
import HRHeader from './HRHeader';
import EmployeeEdit from './EmployeeEdit';
import EvaluationForm from './EvaluationForm';
import TransferHistoryModal from './TransferHistoryModal';
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, HR_SERVICE } from '../../configs/host-config';
import pin from '../../assets/pin.jpg';
import { UserContext } from '../../context/UserContext';
import { succeed, swalConfirm, swalError } from '../../common/common';

export default function EmployeeDetail({ employee, onEval, onEdit, onClose }) {
  const [showEdit, setShowEdit] = useState(false);
  const [showEval, setShowEval] = useState(false);
  const [showTransferHistory, setShowTransferHistory] = useState(false); // 모달 토글용
  const [localEmployee, setLocalEmployee] = useState(employee);
  const [imageUri, setImageUri] = useState('');
  const fileInputRef = useRef(null);
  const { userRole, userId } = useContext(UserContext);

  const canEdit =
    userRole === 'HR_MANAGER' ||
    userRole === 'ADMIN' ||
    (userRole === 'EMPLOYEE' && userId === employee.employeeId);

  const canManage = userRole === 'HR_MANAGER' || userRole === 'ADMIN';

  const handleProfileImageClick = () => {
    if (!canEdit) return;
    fileInputRef.current.click();
  };

  const uploadFile = (e) => {
    let fileArr = e.target.files;

    const formData = new FormData();

    formData.append('targetEmail', employee.email);
    formData.append('file', fileArr[0]);

    setImageUri(URL.createObjectURL(fileArr[0])); // 이걸로 임시보기 먼저 띄움움

    axiosInstance
      .post(`${API_BASE_URL}${HR_SERVICE}/profileImage`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((res) => {
        setImageUri(res.data); //후에 진행 다시 진행!
      });
  };

  useEffect(() => {
    setLocalEmployee(employee);
    setImageUri(employee.profileImageUri);
  }, [employee]);

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

  // 근속년월 계산 함수
  function getServicePeriod(hireDate) {
    if (!hireDate) return '';
    const start = new Date(hireDate);
    const end = new Date();
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years}년 ${months}개월 ${days}일`;
  }

  // 직원 삭제 함수
  const handleDelete = async () => {
    const result = await swalConfirm('정말로 이 직원을 삭제하시겠습니까?');
    if (result.isDismissed) return;
    try {
      const res = await axiosInstance.patch(
        `${API_BASE_URL}${HR_SERVICE}/employee/${employee.employeeId}/retire`,
      );
      succeed('직원이 퇴사처리 되었습니다.');
      setLocalEmployee((prev) => ({
        ...prev,
        status: 'INACTIVE',
        retireDate: new Date().toISOString(), // 또는 res.data.retireDate
      }));
    } catch (error) {
      swalError('퇴사처리에 실패하였습니다.');
      console.error(error);
    }
  };

  // 두 컴포넌트 중 하나라도 활성화되면 해당 컴포넌트만 표시
  // if (showEdit) {
  //   return (
  //     <EmployeeEdit
  //       employee={employee}
  //       onClose={(updatedEmployee) => {
  //         if (updatedEmployee) {
  //           setLocalEmployee(updatedEmployee);
  //           setImageUri(updatedEmployee.profileImageUri);
  //         }
  //         setShowEdit(false);
  //       }}
  //     />
  //   );
  // }
  // if (showEval) {
  //   return (
  //     <EvaluationForm employee={employee} onClose={() => setShowEval(false)} />
  //   );
  // }

  return (
    <>
      {showTransferHistory && (
        <TransferHistoryModal
          employeeId={employee.employeeId}
          onClose={() => setShowTransferHistory(false)}
        />
      )}
      <div className='emp-detail-card'>
        <div className='emp-profile-main'>
          <div className='emp-profile-img'>
            <input
              className={canEdit ? '' : 'disabled'}
              type='file'
              ref={fileInputRef}
              onChange={uploadFile}
              style={{ display: 'none' }}
            />
            <img
              className={canEdit ? '' : 'disabled'}
              src={imageUri ? imageUri : pin}
              alt='profile'
              onClick={handleProfileImageClick}
              style={{ cursor: canEdit ? 'pointer' : 'default' }}
            />
          </div>
          <div className='emp-main-info'>
            <div className='emp-name'>{employee.name}</div>
            <div className='emp-meta'>
              <span className='emp-position'>{employee.position}</span>
              <span className='emp-role'>{employee.role}</span>
              <span className='emp-dept'>{employee.department}</span>
            </div>
            <div
              className={`emp-status${employee.status === 'INACTIVE' ? ' inactive' : ''}`}
            >
              {employee.status}
            </div>
            <div className='emp-contact'>
              <span>📞 {employee.phone}</span>
              <span>✉️ {employee.email}</span>
            </div>
          </div>
        </div>
        <div className='emp-detail-extra'>
          <table className='emp-info-table'>
            <tbody>
              <tr>
                <th>이름</th>
                <td>{employee.name}</td>
                <th>생년월일</th>
                <td>
                  {employee.birthday ? employee.birthday.split('T')[0] : ''}
                </td>
                <th>나이</th>
                <td>{getAge(employee?.birthday)}</td>
              </tr>
              <tr>
                <th>사번</th>
                <td>{employee.employeeId}</td>
                <th>재직상태</th>
                <td>{employee.status}</td>
                <th>입사구분</th>
                <td>{employee.isNewEmployee ? '신입' : '경력'}</td>
              </tr>
              <tr>
                <th>입사일</th>
                <td>
                  {employee.hireDate ? employee.hireDate.split('T')[0] : ''}
                </td>
                <th>근속년월</th>
                <td>{getServicePeriod(employee.hireDate)}</td>
                <th>퇴사일</th>
                <td>
                  {localEmployee.retireDate
                    ? localEmployee.retireDate.split('T')[0]
                    : ''}
                </td>
              </tr>
              <tr>
                <th>근무부서</th>
                <td>{employee.department}</td>
                <th>직급</th>
                <td>{employee.position}</td>
                <th>직책</th>
                <td>{employee.role}</td>
              </tr>
              <tr>
                <th>주소</th>
                <td colSpan={3}>{employee.address}</td>
                <th>전화번호</th>
                <td>{employee.phone}</td>
              </tr>
              <tr>
                <th>이메일</th>
                <td colSpan={5}>{employee.email}</td>
              </tr>
              <tr>
                <th>메모</th>
                <td colSpan={5}>{employee.memo}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className='emp-btns modern'>
          {canEdit && (
            <button className='btn blue' onClick={onEdit}>
              직원정보 수정
            </button>
          )}
          {canManage && localEmployee.status !== 'INACTIVE' && (
            <button className='btn blue' onClick={handleDelete}>
              직원정보 삭제
            </button>
          )}
          {canManage &&
            localEmployee.status !== 'INACTIVE' &&
            userId !== employee.employeeId && (
              <button className='btn green' onClick={onEval}>
                인사평가
              </button>
            )}
          <button
            className='btn blue'
            onClick={() => setShowTransferHistory(true)}
          >
            인사이동 이력
          </button>
        </div>
      </div>
    </>
  );
}
