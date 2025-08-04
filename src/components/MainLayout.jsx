import React, { useState, useEffect, useContext } from 'react';
import logo from '../assets/hrhub_logo.png';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import './MainLayout.scss';
import {
  API_BASE_URL,
  NOTICE_SERVICE,
  APPROVAL_SERVICE,
} from '../configs/host-config';
import { UserContext } from '../context/UserContext';
import axiosInstance from '../configs/axios-config';
import ChatbotCard from '../pages/hr/ChatbotCard';
import {
  FaBullhorn, // 📢 공지
  FaChartBar, // 📊 대시보드
  FaUsers, // 👥 인사관리
  FaPen, // ✍️ 전자결재
  FaHome, // 🏠 메인
  FaPhone, // 📞 연락처
  FaComments, // 💬 챗봇 플로팅
  FaBars, // 🍔 메뉴 열기
} from 'react-icons/fa';
import { getDepartmentNameById } from '../common/hr';
import { FaUserCircle } from 'react-icons/fa';

const sidebarMenus = [
  {
    to: '/notice',
    label: '공지사항',
    icon: <FaBullhorn style={{ color: '#ff8a80', opacity: 0.7 }} />,
  }, // 연한 빨강
  {
    to: '/dashboard',
    label: '대시보드',
    icon: <FaChartBar style={{ color: '#90caf9', opacity: 0.7 }} />,
  }, // 연한 파랑
  {
    to: '/hr',
    label: '인사관리',
    icon: <FaUsers style={{ color: '#81c784', opacity: 0.7 }} />,
  }, // 연한 초록
  {
    to: '/approval',
    label: '전자결재',
    icon: <FaPen style={{ color: '#b39ddb', opacity: 0.7 }} />,
  }, // 연한 보라
];

const headerMenus = [
  {
    to: '/dashboard',
    label: '메인',
    icon: <FaHome style={{ color: '#ffd180', opacity: 0.7 }} />,
  }, // 연한 주황
  {
    to: '/contacts',
    label: '연락처',
    icon: <FaPhone style={{ color: '#80deea', opacity: 0.7 }} />,
  }, // 연한 청록
  {
    to: '/community',
    label: '커뮤니티',
    icon: <FaComments style={{ color: '#fff59d', opacity: 0.7 }} />,
  }, // 연한 노랑
  // { to: '/board', label: '게시판' },
  // { to: '/mail', label: '메일', icon: '✉️' },
  // { to: '/attendance', label: '근태', icon: '🕒' },
];

export default function MainLayout() {

  const location = useLocation();
  const { onLogout } = useContext(UserContext);
  const navigate = useNavigate();

  // 현재 페이지가 전자결재 페이지인지 확인
  const isApprovalPage = location.pathname.startsWith('/approval');

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const [unreadCount, setUnreadCount] = useState(0);
  const [unApprovalCount, setUnApprovalCount] = useState(0);
  const {
    user,
    userId,
    accessToken,
    isInit,
    userName,
    departmentId,
    userRole,
    userPosition,
    setCounts
  } = useContext(UserContext);
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // 챗봇 플로팅 버튼 상태
  const [showChatbot, setShowChatbot] = useState(false);
  // 챗봇 상태를 MainLayout에서 관리 (초기화 방지)
  const [chatbotMessages, setChatbotMessages] = useState([]);
  const [chatbotQuestion, setChatbotQuestion] = useState('');
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const [chatbotError, setChatbotError] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [showSidebar, setShowSidebar] = useState(false); // 모바일 사이드바 상태
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const sidebarMenus = [
    { to: '/notice', label: '공지사항', icon: <FaBullhorn style={{ color: '#ff8a80', opacity: 0.7 }} /> },
    { to: '/dashboard', label: '대시보드', icon: <FaChartBar style={{ color: '#90caf9', opacity: 0.7 }} /> },
    { to: '/hr', label: '인사관리', icon: <FaUsers style={{ color: '#81c784', opacity: 0.7 }} /> },
    { to: '/approval', label: '전자결재', icon: <FaPen style={{ color: '#b39ddb', opacity: 0.7 }} /> },
  ];

  useEffect(() => {
    if (!userId) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}${NOTICE_SERVICE}/unread-count`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        const count = await res.json();
        setUnreadCount(count);
        console.log('안 읽은 게시글 수 :', count);
      } catch (err) {
        console.log('안 읽은 게시글 수 조회 실패:', err);
      }
    };

    fetchUnreadCount();
  }, [user, location.pathname]);


  useEffect(() => {
    if (!user) return;
    const fetchAllCounts = async () => {
      try {
        const countPromises = [
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, { params: { role: 'approver', status: 'IN_PROGRESS', size: 1 } }),
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, { params: { role: 'writer', status: 'IN_PROGRESS', size: 1 } }),
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, { params: { role: 'writer', status: 'REJECTED', size: 1 } }),
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, { params: { role: 'writer', status: 'DRAFT,RECALLED', size: 1 } }),
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports/list/scheduled`, { params: { size: 1 } }),
          axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, { params: { role: 'reference', size: 1 } }),
        ];
        const responses = await Promise.all(countPromises);
        const newCounts = {
          pending: responses[0].data.result?.totalElements || 0,
          inProgress: responses[1].data.result?.totalElements || 0,
          rejected: responses[2].data.result?.totalElements || 0,
          drafts: responses[3].data.result?.totalElements || 0,
          scheduled: responses[4].data.result?.totalElements || 0,
          cc: responses[5].data.result?.totalElements || 0,
          completed: 0,
        };
        setCounts(newCounts);
        setUnApprovalCount(newCounts.pending);
      } catch (err) {
        console.error("문서함 개수 조회 실패:", err);
      }
    };
    fetchAllCounts();
  }, [user, location.pathname, setCounts]);

  // 3. (기존 코드 유지) 부서 이름 조회
  useEffect(() => {
    if (departmentId) {
      getDepartmentNameById(departmentId).then((name) => {
        if (name) setDepartmentName(name);
      });
    } else {
      setDepartmentName('');
    }
  }, [departmentId]);

  // 4. (기존 코드 유지) 예약 상신 알람 (폴링)
  useEffect(() => {
    if (!user) return;
    const intervalId = setInterval(async () => {
      try {
        const res = await axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports`, {
          params: { role: 'approver', status: 'IN_PROGRESS', size: 1 },
        });
        const newCount = res.data.result?.totalElements || 0;
        if (!isInitialLoad && newCount > unApprovalCount) {
          Swal.fire({
            icon: 'info',
            title: '새로운 결재 문서가 도착했습니다.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
        }
        setUnApprovalCount(newCount);
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      } catch (err) {
        console.error("결재 문서 개수 폴링 중 오류 발생:", err);
      }
    }, 60000);
    return () => clearInterval(intervalId);
  }, [user, unApprovalCount, isInitialLoad]);

  const roleMap = {
    CEO: '대표',
    HR_MANAGER: '인사담당',
    EMPLOYEE: '사원',
    ADMIN: '관리자',
  };

  // /src/components/MainLayout.jsx

  // 예약 상신 알람 
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await axiosInstance.get(
          `${API_BASE_URL}${APPROVAL_SERVICE}/reports`,
          {
            params: {
              role: 'approver',
              status: 'IN_PROGRESS',
              size: 1,
            },
          },
        );

        const newCount = res.data.result?.totalElements || 0;

        // ★★★ 2. 알림 조건 수정 ★★★
        // 초기 로딩이 아니고, 새로운 개수가 이전 개수보다 많을 때 알림
        if (!isInitialLoad && newCount > unApprovalCount) {
          Swal.fire({
            icon: 'info',
            title: '새로운 결재 문서가 도착했습니다.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
        }

        setUnApprovalCount(newCount);

        // ★ 3. 첫 폴링 이후에는 초기 로딩 상태를 false로 변경 ★
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }

      } catch (err) {
        console.error("결재 문서 개수 폴링 중 오류 발생:", err);
      }
    }, 60000);

    return () => clearInterval(intervalId);

  }, [user, unApprovalCount, isInitialLoad]); // ★ 4. 의존성 배열에 isInitialLoad 추가

  return (
    <div className='layout'>
      {/* 데스크탑/태블릿 사이드바 */}
      <aside className={`sidebar${showSidebar ? ' sidebar--mobile-open' : ''}`}>
        <div className='logo' onClick={() => navigate('/dashboard')}>
          <img src={logo} alt='hrhub' />
        </div>
        <nav className='nav'>
          {sidebarMenus.map((menu) => (
            <Link
              key={menu.to}
              to={menu.to}
              className={location.pathname.startsWith(menu.to) ? 'active' : ''}
              onClick={() => setShowSidebar(false)} // 모바일에서 메뉴 클릭 시 닫힘
            >
              <span className='menu-icon'>{menu.icon}</span>
              <span className='menu-label'>{menu.label}</span>
              {menu.to === '/approval' && unApprovalCount > 0 && (
                <span className='sidebar-badge'>{unApprovalCount}</span>
              )}
            </Link>
          ))}
        </nav>
        {/* 모바일 사이드바에서만 로그아웃 버튼 노출 */}
        <div className='sidebar-logout-mobile'>
          <button className='logout-btn' onClick={handleLogoutClick}>
            Logout
          </button>
        </div>
      </aside>
      {/* 모바일 오버레이 */}
      {showSidebar && (
        <div
          className='sidebar-overlay'
          onClick={() => setShowSidebar(false)}
        ></div>
      )}
      <div className='main'>
        <header className='header'>
          {/* 모바일 햄버거 버튼 */}
          <button
            className='hamburger-btn'
            onClick={() => setShowSidebar((prev) => !prev)}
            aria-label='메뉴 열기'
          >
            <FaBars />
          </button>
          <div className='menu'>
            {headerMenus.map((menu) => (
              <Link
                key={menu.to}
                to={menu.to}
                className={
                  location.pathname.startsWith(menu.to) ? 'active' : ''
                }
              >
                <span className='header-menu-icon'>{menu.icon}</span>
                <span className='header-menu-label'>{menu.label}</span>
              </Link>
            ))}
          </div>

          <div
            className='notice-icon'
            onClick={() => navigate('/notice/alert')}
          >
            <FaBullhorn color='#ff5252' style={{ verticalAlign: 'middle' }} />
            {(unreadCount > 0 || unApprovalCount > 0) && (
              <span className='badge'>{unreadCount + unApprovalCount}</span>
            )}
          </div>
          {/* 데스크탑/태블릿에서만 사용자 정보와 로그아웃 버튼 노출, 모바일(430px 이하)에서는 숨김 */}
          <div className='header-user-desktop'>
            {userName && departmentName && (
              <div className='user-info'>
                <FaUserCircle className='user-icon' />
                <span className='user-name'>{userName}</span>
                {userPosition && (
                  <span className='user-position'>{userPosition}</span>
                )}
                <span className='user-dept'>({departmentName})</span>
                {userRole && (
                  <span className='user-role'>
                    {roleMap[userRole] || userRole}
                  </span>
                )}
              </div>
            )}
            <button className='logout-btn' onClick={handleLogoutClick}>
              Logout
            </button>
          </div>
        </header>

        <main className='content'>
          <Outlet />
        </main>
        {/* 챗봇 플로팅 버튼 및 챗봇 카드 */}
        <div className={isApprovalPage ? 'fab-raised' : ''}>
          {/* 플로팅 버튼 */}
          <button
            className='chatbot-fab'
            onClick={() => setShowChatbot((prev) => !prev)}
            aria-label='챗봇 열기'
            style={{
              position: 'fixed',
              right: '2.5rem',
              bottom: '2.5rem',
              zIndex: 1000,
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#2b80ff',
              color: '#fff',
              border: 'none',
              boxShadow: '0 4px 16px rgba(30,65,112,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              cursor: 'pointer',
            }}
          >
            <FaComments />
          </button>
          {/* 챗봇 카드 팝업 */}
          {showChatbot && (
            <div
              style={{
                position: 'fixed',
                right: '2.5rem',
                bottom: '6.5rem',
                zIndex: 1001,
                boxShadow: '0 8px 32px rgba(30,65,112,0.18)',
              }}
            >
              <ChatbotCard
                messages={chatbotMessages}
                setMessages={setChatbotMessages}
                question={chatbotQuestion}
                setQuestion={setChatbotQuestion}
                loading={chatbotLoading}
                setLoading={setChatbotLoading}
                error={chatbotError}
                setError={setChatbotError}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}