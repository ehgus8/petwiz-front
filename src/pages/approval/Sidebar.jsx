// /src/pages/approval/Sidebar.jsx

import React, { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.scss';
import { UserContext } from '../../context/UserContext';
import { GearFill } from 'react-bootstrap-icons';
import TemplateSelectionModal from '../../components/approval/TemplateSelectionModal';
import ModalPortal from '../../components/approval/ModalPortal';

const Sidebar = () => {
  const navigate = useNavigate();
  const { userRole, counts } = useContext(UserContext);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  
  const safeCounts = counts || {};

  return (
    <>
      <aside className={styles.sidebar}>
        <nav className={styles.menu}>
          <div className={styles.menuHeader} onClick={() => navigate('/approval/home')}>
            전자결재
          </div>
          <button className={styles.newApprovalBtn} onClick={() => setIsSelectionModalOpen(true)}>
            + 새 결재 작성
          </button>
          {userRole === 'ADMIN' && (
            <button className={styles.adminSettingsBtn} onClick={() => navigate('/approval/admin/templates')}>
              <GearFill />
              <span>문서양식관리</span>
            </button>
          )}
          <div className={styles.menuGroup}>
            <div className={styles.menuGroupHeader}>결재함</div>
            <ul className={styles.menuList}>
              {/* ★★★ data-count 속성을 사용하여 CSS에서 제어하도록 변경 ★★★ */}
              <li>
                <NavLink to="/approval/pending" className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.active : ''}`}>
                  <span>결재 예정 문서함</span>
                  <span className={styles.countBadge} data-count={safeCounts.pending || 0}>{safeCounts.pending || 0}</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/approval/in-progress" className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.active : ''}`}>
                  <span>결재 중 문서함</span>
                  <span className={styles.countBadge} data-count={safeCounts.inProgress || 0}>{safeCounts.inProgress || 0}</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/approval/completed" className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.active : ''}`}>
                  <span>결재 완료 문서함</span>
                  <span className={styles.countBadge} data-count={safeCounts.completed || 0}>{safeCounts.completed || 0}</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/approval/rejected" className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.active : ''}`}>
                  <span>반려 문서함</span>
                  <span className={styles.countBadge} data-count={safeCounts.rejected || 0}>{safeCounts.rejected || 0}</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/approval/drafts" className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.active : ''}`}>
                  <span>임시 저장 문서함</span>
                  <span className={styles.countBadge} data-count={safeCounts.drafts || 0}>{safeCounts.drafts || 0}</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/approval/scheduled" className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.active : ''}`}>
                  <span>예약 문서함</span>
                  <span className={styles.countBadge} data-count={safeCounts.scheduled || 0}>{safeCounts.scheduled || 0}</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/approval/cc" className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.active : ''}`}>
                  <span>수신 참조 문서함</span>
                  <span className={styles.countBadge} data-count={safeCounts.cc || 0}>{safeCounts.cc || 0}</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

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