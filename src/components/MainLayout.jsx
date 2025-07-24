import React, { useState, useEffect, useContext } from 'react';

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
} from 'react-icons/fa';

const sidebarMenus = [
  {
    to: '/general',
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

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const [unreadCount, setUnreadCount] = useState(0);
  const [unApprovalCount, setUnApprovalCount] = useState(0);
  const { user, userId, accessToken, isInit } = useContext(UserContext);
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
    const fetchPending = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get(
          `${API_BASE_URL}${APPROVAL_SERVICE}/reports`,
          {
            params: {
              role: 'approver', // '내가 결재할 차례인 문서'를 의미
              status: 'IN_PROGRESS', // 반려/완료된 문서를 제외하기 위해 반드시 필요
              page: 0,
              size: 10,
            },
          },
        );
        if (res.data?.statusCode === 200) {
          const allReports = res.data.result.reports || [];
          // 이중 필터링: API가 IN_PROGRESS 외 다른 상태를 보내주는 경우를 대비
          const filteredReports = allReports.filter(
            (report) => report.reportStatus === 'IN_PROGRESS',
          );
          console.log('filteredReports : ', filteredReports);
          console.log('filteredReports.length : ', filteredReports.length);
          setPendingReports(filteredReports);

          const count = filteredReports.length;
          setUnApprovalCount(count);
          console.log('미결재 문서 :', count);
        } else {
          setError(
            res.data?.statusMessage ||
              '결재 예정 문서를 불러오는 데 실패했습니다.',
          );
        }
      } catch (err) {
        console.error(err);
        setError('네트워크 오류 또는 서버 오류');
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, [user, location.pathname]);

  return (
    <div className='layout'>
      <aside className='sidebar'>
        <div className='logo' onClick={() => navigate('/dashboard')}>
          <img src='/src/assets/hrhub_logo.png' alt='hrhub' />
        </div>
        <nav className='nav'>
          {sidebarMenus.map((menu) => (
            <Link
              key={menu.to}
              to={menu.to}
              className={location.pathname.startsWith(menu.to) ? 'active' : ''}
            >
              <span className='menu-icon'>{menu.icon}</span>
              <span className='menu-label'>{menu.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className='main'>
        <header className='header'>
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
          <button className='logout-btn' onClick={handleLogoutClick}>
            Logout
          </button>
        </header>

        <main className='content'>
          <Outlet />
        </main>
        {/* 챗봇 플로팅 버튼 및 챗봇 카드 */}
        <div>
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
