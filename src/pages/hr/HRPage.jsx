import React, { useContext, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HRHeader from './HRHeader';
import './HRPage.scss';
import { UserContext } from '../../context/UserContext';
import axiosInstance from '../../configs/axios-config';
import {
  API_BASE_URL,
  HR_SERVICE,
  NOTICE_SERVICE,
} from '../../configs/host-config';
import pin from '../../assets/pin.jpg';
import EmployeeOfMonthCarousel from './EmployeeOfMonthCarousel';
import UserCard from './UserCard';
import CalendarWidget from './CalendarWidget';
import NoticeList from './NoticeList';
import EmployeeEdit from './EmployeeEdit'; // EmployeeEdit 컴포넌트 임포트
import Weather from './Weather';
import ApprovalRequestTabs from '../../components/approval/ApprovalRequestTabs';

export default function HRPage() {
  const { noticeId } = useParams();
  const navigate = useNavigate();
  const {
    userName,
    userRole,
    userImage,
    userPosition,
    departmentId,
    userId,
    accessToken,
  } = useContext(UserContext);
  const [departments, setDepartments] = useState([]);
  const [departmentName, setDepartmentName] = useState('');
  const [profileImageUri, setProfileImageUri] = useState('');
  const [showEdit, setShowEdit] = useState(false); // 수정 컴포넌트 토글 상태
  const [currentUserEmployee, setCurrentUserEmployee] = useState(null); // 현재 사용자 정보 상태
  const [teamEmployees, setTeamEmployees] = useState([]); // 우리팀 직원 목록
  const [teamPage, setTeamPage] = useState(0); // 우리팀 직원 슬라이드 페이지
  const [pendingPage, setPendingPage] = useState(null);
  const [fade, setFade] = useState(true);
  const autoSlideRef = useRef();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 431);

  // 터치/마우스 이벤트 관련 상태
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [deptNotices, setDeptNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noticeTab, setNoticeTab] = useState('전체'); // or '부서'
  const [allNotices, setAllNotices] = useState([]);

  // 결재요청/미승인결재 탭 상태
  const [approvalTab, setApprovalTab] = useState('결재요청');

  // 결재요청 목록 상태
  const [reportList, setReportList] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  // 결재요청 목록 API 호출
  useEffect(() => {
    if (approvalTab !== '결재요청') return;
    setReportLoading(true);
    fetch('http://localhost:60696/approval/reports?role=writer&page=0&size=4', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        setReportList(data.reports || []);
      })
      .catch(() => setReportList([]))
      .finally(() => setReportLoading(false));
  }, [approvalTab]);

  // 달력 상태 및 유틸
  const today = new Date();
  const [calendarDate, setCalendarDate] = useState(new Date());
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0:일~6:토
  const lastDate = new Date(year, month + 1, 0).getDate();
  // 달력은 월요일 시작(Mo=1)로 맞춤
  const getCalendarMatrix = () => {
    const matrix = [];
    let day = 1;
    let start = (firstDay + 6) % 7; // 일요일(0) -> 6, 월요일(1) -> 0
    for (let i = 0; i < 6; i++) {
      const row = [];
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < start) || day > lastDate) {
          row.push(null);
        } else {
          row.push(day++);
        }
      }
      matrix.push(row);
    }
    return matrix;
  };
  const calendarMatrix = getCalendarMatrix();
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const handlePrevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1));
  };

  // 1년 기준 현재 몇주차인지 계산하는 함수 (ISO 8601 주차)
  function getWeekNumber(date) {
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
    // 목요일이 포함된 주가 그 해의 첫 번째 주
    tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
    return (
      1 +
      Math.round(
        ((tempDate.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7,
      )
    );
  }

  // 오늘이 현재 달력에 표시된 달에 포함되어 있으면 오늘 기준 주차, 아니면 달력의 1일 기준 주차
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;
  const weekNumber = isCurrentMonth
    ? getWeekNumber(today)
    : getWeekNumber(calendarDate);

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

  // 반응형 처리를 위한 window resize 이벤트 리스너
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 431;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
        setTeamPage(0); // 페이지 초기화
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  useEffect(() => {
    console.log('departmentId:', departmentId, 'departments:', departments);
    if (!departmentId || !departments.length) {
      setDepartmentName('');
      return;
    }
    const found = departments.find(
      (d) => String(d.id) === String(departmentId),
    );
    setDepartmentName(found ? found.name : '');
  }, [departmentId, departments]);

  useEffect(() => {
    if (!userId) return;
    async function fetchEmployee() {
      try {
        const res = await axiosInstance.get(
          `${API_BASE_URL}${HR_SERVICE}/employees/${userId}`,
        );
        setProfileImageUri(res.data.result.profileImageUri || '');
        setCurrentUserEmployee(res.data.result); // 전체 직원 정보 저장
      } catch (err) {
        setProfileImageUri('');
        setCurrentUserEmployee(null);
      }
    }
    fetchEmployee();
  }, [userId]);

  useEffect(() => {
    if (!departmentId || !accessToken) return;

    const fetchDeptNotices = async () => {
      setLoading(true);
      try {
        const url = `${API_BASE_URL}${NOTICE_SERVICE}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = await res.json();
        setDeptNotices(data.notices || []);
      } catch (err) {
        console.error('부서 공지 가져오기 실패', err);
        setDeptNotices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDeptNotices();
  }, [departmentId, accessToken]);

  // 전체 공지 불러오기 useEffect
  useEffect(() => {
    if (!accessToken) return;
    const fetchAllNotices = async () => {
      try {
        const url = `${API_BASE_URL}${NOTICE_SERVICE}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = await res.json();
        setAllNotices(data.generalNotices || []);
      } catch (err) {
        console.error('전체 공지 가져오기 실패', err);
        setAllNotices([]);
      }
    };

    fetchAllNotices();
  }, [accessToken]);

  const [eomIndex, setEomIndex] = useState(0);

  // 부서명 변경 시 우리팀 직원 목록 fetch
  useEffect(() => {
    if (!departmentName) {
      setTeamEmployees([]);
      return;
    }
    const fetchTeamEmployees = async () => {
      try {
        const res = await axiosInstance.get(
          `${API_BASE_URL}${HR_SERVICE}/employees?department=${encodeURIComponent(departmentName)}`,
        );
        setTeamEmployees(res.data.result.content || []);
      } catch (err) {
        setTeamEmployees([]);
      }
    };
    fetchTeamEmployees();
  }, [departmentName]);

  // 자동 슬라이드 타이머 관리 (비활성화)
  useEffect(() => {
    const currentPageSize = isMobile ? 5 : 10;
    if (teamEmployees.length <= currentPageSize) {
      setTeamPage(0);
      return;
    }
    // 자동 슬라이드 비활성화 - 스와이프로만 제어
    // autoSlideRef.current = setInterval(() => {
    //   const nextPage =
    //     (teamPage + 1) % Math.ceil(teamEmployees.length / currentPageSize);
    //   changeTeamPage(nextPage);
    // }, 3000);
    // return () => clearInterval(autoSlideRef.current);
    // eslint-disable-next-line
  }, [teamEmployees, teamPage, isMobile]);

  // 자연스러운 페이드 전환 함수
  const changeTeamPage = (nextPage) => {
    if (nextPage === teamPage) return;
    setFade(false);
    setPendingPage(nextPage);
  };

  // fade-out 후 실제 페이지 변경 및 fade-in
  useEffect(() => {
    if (fade === false && pendingPage !== null) {
      const timeout = setTimeout(() => {
        setTeamPage(pendingPage);
        setFade(true);
        setPendingPage(null);
      }, 800); // 300 → 800ms로 변경
      return () => clearTimeout(timeout);
    }
  }, [fade, pendingPage]);

  // dot 클릭 핸들러도 변경
  const handleTeamDotClick = (idx) => changeTeamPage(idx);

  // 반응형에 따른 페이지 크기 및 slice 계산
  const pageSize = isMobile ? 5 : 10;
  const teamSlice = teamEmployees.slice(
    teamPage * pageSize,
    teamPage * pageSize + pageSize,
  );
  const teamTotalPages = Math.ceil(teamEmployees.length / pageSize);

  // 스와이프 감지 로직
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && teamPage < teamTotalPages - 1) {
      // 왼쪽 스와이프 - 다음 페이지
      changeTeamPage(teamPage + 1);
    } else if (isRightSwipe && teamPage > 0) {
      // 오른쪽 스와이프 - 이전 페이지
      changeTeamPage(teamPage - 1);
    }
  };

  // 마우스 이벤트 (데스크톱 지원)
  const onMouseDown = (e) => {
    setIsDragging(true);
    setTouchEnd(null);
    setTouchStart(e.clientX);
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    setTouchEnd(e.clientX);
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    onTouchEnd(); // 같은 로직 재사용
  };

  // 수정 컴포넌트가 활성화되면 해당 컴포넌트만 렌더링
  if (showEdit) {
    return (
      <EmployeeEdit
        employee={currentUserEmployee}
        hideHeader={true}
        onClose={() => {
          setShowEdit(false);
          // 데이터가 수정되었을 수 있으니 다시 불러오기
          const fetchEmployee = async () => {
            try {
              const res = await axiosInstance.get(
                `${API_BASE_URL}${HR_SERVICE}/employees/${userId}`,
              );
              setProfileImageUri(res.data.result.profileImageUri || '');
              setCurrentUserEmployee(res.data.result);
            } catch (err) {
              console.error(err);
            }
          };
          fetchEmployee();
        }}
      />
    );
  }

  return (
    <div className='hrpage-root'>
      {/* 유저 카드 + 검색/달력 */}
      <div
        className='hr-top'
        style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}
      >
        <UserCard
          userName={userName}
          userPosition={userPosition}
          departmentName={departmentName}
          profileImageUri={profileImageUri}
          onEditProfile={() => setShowEdit(true)} // 수정 버튼 클릭 시 토글
          userRole={userRole}
        />
        <div className='hr-weather-eom-container'>
          <EmployeeOfMonthCarousel
            teamEmployees={teamEmployees}
            teamPage={teamPage}
            changeTeamPage={changeTeamPage}
            handleTeamDotClick={handleTeamDotClick}
            autoSlideRef={autoSlideRef}
          />
          <Weather />
        </div>
      </div>
      {/* 메인 카드 섹션 */}
      <div className='hr-main-cards'>
        <div className='hr-row'>
          <ApprovalRequestTabs />
          {/* 공지사항 */}
          <div className='hr-card hr-tab-card' style={{ flex: 2 }}>
            <div className='tabs'>
              <button
                className={noticeTab === '전체' ? 'active' : ''}
                onClick={() => setNoticeTab('전체')}
              >
                {' '}
                전체공지
              </button>
              <button
                className={noticeTab === '부서' ? 'active' : ''}
                onClick={() => setNoticeTab('부서')}
              >
                {' '}
                부서공지
              </button>
              <div className='menu-icon' onClick={() => navigate(`/notice`)}>
                ≡{' '}
              </div>
            </div>

            <NoticeList
              notices={
                noticeTab === '전체'
                  ? (allNotices || []).slice(0, 4)
                  : (deptNotices || []).slice(0, 4)
              }
              load={loading}
            />
          </div>
        </div>
        {/* 두번째 줄 */}
        <div className='hr-row'>
          {/* 우리팀 직원 */}
          <div className='hr-card hr-tab-card'>
            <div className='tabs'>
              <button className='active'>우리팀 직원</button>
              <div className='menu-icon' onClick={() => navigate(`/contacts`)}>
                ≡
              </div>
            </div>
            <table
              className={`mini-table team-fade${fade ? ' team-fade-active' : ''} ${isMobile ? 'mobile-team-table' : ''}`}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              style={{
                touchAction: 'pan-y',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
              }}
            >
              <thead>
                <tr>
                  <th>성명</th>
                  <th>직급</th>
                  <th>연락처</th>
                  {!isMobile && (
                    <>
                      <th>성명</th>
                      <th>직급</th>
                      <th>연락처</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {teamEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={isMobile ? 3 : 6}>팀원이 없습니다.</td>
                  </tr>
                ) : isMobile ? (
                  // 모바일: 5명을 1열로 표시
                  teamSlice.map((emp, index) => (
                    <tr key={emp.employeeId || index}>
                      <td>{emp.name}</td>
                      <td>{emp.position}</td>
                      <td>{emp.phone}</td>
                    </tr>
                  ))
                ) : (
                  // 데스크톱: 10명을 2열로 표시
                  Array.from({ length: 5 }, (_, rowIndex) => {
                    const leftEmp = teamSlice[rowIndex];
                    const rightEmp = teamSlice[rowIndex + 5];

                    return (
                      <tr key={rowIndex}>
                        <td>{leftEmp?.name || ''}</td>
                        <td>{leftEmp?.position || ''}</td>
                        <td>{leftEmp?.phone || ''}</td>
                        <td>{rightEmp?.name || ''}</td>
                        <td>{rightEmp?.position || ''}</td>
                        <td>{rightEmp?.phone || ''}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {/* 팀원 페이지네이션 점 표시 */}
            {teamTotalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: 8,
                }}
              >
                {Array.from({ length: teamTotalPages }).map((_, idx) => (
                  <span
                    key={idx}
                    onClick={() => handleTeamDotClick(idx)}
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: idx === teamPage ? '#3b82f6' : '#d1d5db',
                      margin: '0 4px',
                    }}
                  ></span>
                ))}
              </div>
            )}
          </div>
          {/* <CalendarWidget
            calendarDate={calendarDate}
            setCalendarDate={setCalendarDate}
            today={today}
            calendarMatrix={calendarMatrix}
            monthNames={monthNames}
            handlePrevMonth={handlePrevMonth}
            handleNextMonth={handleNextMonth}
            year={year}
            month={month}
            weekNumber={weekNumber}
          /> */}
        </div>
      </div>
    </div>
  );
}
