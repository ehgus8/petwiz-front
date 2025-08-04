import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  Fragment,
} from 'react';
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
  const [hasEvaluation, setHasEvaluation] = useState(false);

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

    setImageUri(URL.createObjectURL(fileArr[0])); // 임시보기

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
    // 인사평가 존재 여부 확인
    if (employee && employee.employeeId) {
      axiosInstance
        .get(`${API_BASE_URL}${HR_SERVICE}/evaluations/${employee.employeeId}`)
        .then((res) => {
          setHasEvaluation(
            Array.isArray(res.data.result.content) &&
              res.data.result.content.length > 0,
          );
        })
        .catch(() => setHasEvaluation(false));
    } else {
      setHasEvaluation(false);
    }
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

    let end;
    if (employee.status === 'INACTIVE' && localEmployee.retireDate) {
      end = new Date(localEmployee.retireDate);
    } else {
      end = new Date();
    }

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

  // 직원 퇴사 함수
  const handleDelete = async () => {
    const result = await swalConfirm('정말로 이 직원을 퇴사처리하시겠습니까?');
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

  // showEdit, showEval, showTransferHistory 모달 관리
  // 메인 상세는 항상 렌더링, 버튼 누르면 각 모달만 show~로 제어
  return (
    <Fragment>
      {showEdit && (
        <EmployeeEdit
          employee={employee}
          onClose={(updatedEmployee) => {
            if (updatedEmployee) {
              setLocalEmployee(updatedEmployee);
              setImageUri(updatedEmployee.profileImageUri);
            }
            setShowEdit(false);
            if (onEdit) onEdit(updatedEmployee); // 부모 갱신 필요 시
          }}
        />
      )}
      {showEval && (
        <EvaluationForm
          employee={employee}
          onClose={() => setShowEval(false)}
        />
      )}
      {showTransferHistory && (
        <TransferHistoryModal
          employeeId={employee.employeeId}
          onClose={() => setShowTransferHistory(false)}
        />
      )}

      {/* 상세 메인 내용 */}
      {!showEdit && !showEval && !showTransferHistory && (
        <div>
          <div className='emp-modal-content-row'>
            <div className='emp-modal-profile-col'>
              <div className='emp-modal-profile-img'>
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
              <div className='emp-modal-profile-main'>
                <div className='emp-modal-name highlight-main'>
                  {employee.name}
                </div>
                <div className='emp-modal-contact-block'>
                  <div className='highlight-phone'>📞 {employee.phone}</div>
                  <div className='highlight-email'>✉️ {employee.email}</div>
                </div>
              </div>
            </div>
            <div className='emp-modal-detail-col'>
              <dl className='emp-modal-detail-list-grid'>
                <div>
                  <dt>사번</dt>
                  <dd>{employee.employeeId}</dd>
                </div>
                <div>
                  <dt>생년월일</dt>
                  <dd>
                    {employee.birthday ? employee.birthday.split('T')[0] : ''}
                  </dd>
                </div>
                <div>
                  <dt>나이</dt>
                  <dd>{getAge(employee?.birthday)}</dd>
                </div>
                <div>
                  <dt>입사일</dt>
                  <dd>
                    {employee.hireDate ? employee.hireDate.split('T')[0] : ''}
                  </dd>
                </div>
                <div>
                  <dt>재직상태</dt>
                  <dd>{employee.status === 'INACTIVE' ? '퇴직' : '재직'}</dd>
                </div>
                <div>
                  <dt>입사구분</dt>
                  <dd>{employee.isNewEmployee ? '신입' : '경력'}</dd>
                </div>
                <div>
                  <dt>근속년월</dt>
                  <dd>{getServicePeriod(employee.hireDate)}</dd>
                </div>
                <div>
                  <dt>퇴사일</dt>
                  <dd>
                    {localEmployee.retireDate
                      ? localEmployee.retireDate.split('T')[0]
                      : '-'}
                  </dd>
                </div>
                <div>
                  <dt>근무부서</dt>
                  <dd>{employee.department}</dd>
                </div>
                <div>
                  <dt>직급</dt>
                  <dd>{employee.position}</dd>
                </div>
                <div>
                  <dt>직책</dt>
                  <dd>{employee.role}</dd>
                </div>
                <div>
                  <dt>주소</dt>
                  <dd>{employee.address}</dd>
                </div>
                <div>
                  <dt>전화번호</dt>
                  <dd>{employee.phone}</dd>
                </div>
                <div style={{ gridColumn: '1 / span 2' }}>
                  <dt>메모</dt>
                  <dd>{employee.memo}</dd>
                </div>
              </dl>
            </div>
          </div>
          <div className='emp-modal-btns'>
            {canEdit && localEmployee.status !== 'INACTIVE' && (
              <button className='btn blue' onClick={() => setShowEdit(true)}>
                직원정보 수정
              </button>
            )}
            {canManage && localEmployee.status !== 'INACTIVE' && (
              <button className='btn red' onClick={handleDelete}>
                퇴사처리
              </button>
            )}
            {canManage &&
              localEmployee.status !== 'INACTIVE' &&
              userId !== employee.employeeId &&
              !hasEvaluation && (
                <button className='btn green' onClick={() => setShowEval(true)}>
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
      )}
    </Fragment>
  );
}
