// Sidebar.js

// 1. [수정] react에서 `useState`를 import에 추가합니다.
import React, { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.scss';
import { UserContext } from '../../context/UserContext';
import { GearFill } from 'react-bootstrap-icons';
// 모달 컴포넌트의 경로가 올바른지 확인해주세요.
import TemplateSelectionModal from '../../components/approval/TemplateSelectionModal';
import ReactDOM from 'react-dom';

const ModalPortal = ({ children }) => {
  const modalRoot = document.getElementById('modal-root');
  return modalRoot ? ReactDOM.createPortal(children, modalRoot) : null;
};

const Sidebar = () => {
  const navigate = useNavigate();
  const { userRole } = useContext(UserContext);

  // 2. [추가] 모달의 열림/닫힘 상태를 관리하는 state를 선언합니다.
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

  // 3. [추가] return 문을 React Fragment(<>)로 전체를 감싸줍니다.
  // 컴포넌트가 사이드바(<aside>)와 모달(<TemplateSelectionModal>) 두 개의 요소를 반환해야 하기 때문입니다.
  return (
    <>
      <aside className={styles.sidebar}>
        <nav className={styles.menu}>
          <div className={styles.menuHeader}>전자결재</div>

          <ul className={styles.menuList}>
            <li>
              <NavLink
                to="/approval/home"
                className={({ isActive }) =>
                  `${styles.menuItem} ${isActive ? styles.active : ''}`
                }
              >
                결재 홈
              </NavLink>
            </li>
          </ul>

          <button
            className={styles.newApprovalBtn}
            onClick={() => setIsSelectionModalOpen(true)}
          >
            + 새 결재 작성
          </button>

          {userRole === 'ADMIN' && (
            <button
              className={styles.adminSettingsBtn}
              onClick={() => navigate('/approval/admin/templates')}
            >
              <GearFill />
              <span>문서양식관리</span>
            </button>
          )}

          <div className={styles.menuGroup}>
            <div className={styles.menuGroupHeader}>결재함</div>
            <ul className={styles.menuList}>
              <li>
                <NavLink
                  to="/approval/pending"
                  className={({ isActive }) =>
                    `${styles.menuItem} ${isActive ? styles.active : ''}`
                  }
                >
                  결재할 문서
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/approval/in-progress"
                  className={({ isActive }) =>
                    `${styles.menuItem} ${isActive ? styles.active : ''}`
                  }
                >
                  결재 진행함
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/approval/completed"
                  className={({ isActive }) =>
                    `${styles.menuItem} ${isActive ? styles.active : ''}`
                  }
                >
                  완료 문서함
                </NavLink>
              </li>
              <li> {/* 반려 문서함 메뉴 아이템 추가 */}
                <NavLink
                  to="/approval/rejected"
                  className={({ isActive }) =>
                    `${styles.menuItem} ${isActive ? styles.active : ''}`
                  }
                >
                  반려 문서함
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/approval/drafts"
                  className={({ isActive }) =>
                    `${styles.menuItem} ${isActive ? styles.active : ''}`
                  }
                >
                  임시 저장함
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/approval/cc"
                  className={({ isActive }) =>
                    `${styles.menuItem} ${isActive ? styles.active : ''}`
                  }
                >
                  수신 참조함
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      {/* 4. [추가] isModalOpen이 true일 때만 TemplateSelectionModal을 렌더링하는 코드입니다. */}
      {/* 모달 내부에서 닫기 기능을 구현할 수 있도록 onClose 함수를 props로 전달합니다. */}
      {isSelectionModalOpen && (
        <ModalPortal>
          <TemplateSelectionModal
            open={isSelectionModalOpen}
            onClose={() => setIsSelectionModalOpen(false)}
            onStartWriting={(templateId) => {
              setIsSelectionModalOpen(false);
              navigate(`/approval/new?templateId=${templateId}`);
            }}
          />
        </ModalPortal>
      )}
    </>
  );
};

export default Sidebar;