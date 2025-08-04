// /src/pages/approval/ApprovalBottomNav.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './ApprovalBottomNav.module.scss';
import { 
    House, 
    Clock, 
    HourglassSplit, 
    Check2Circle, 
    Folder2, 
    XCircle,            
    Calendar2Event,     
    Envelope            
  } from 'react-bootstrap-icons';

const ApprovalBottomNav = () => {
  const navItems = [
    { to: "/approval/home", icon: <House />, label: "홈" },
    { to: "/approval/pending", icon: <Clock />, label: "결재 예정" },
    { to: "/approval/in-progress", icon: <HourglassSplit />, label: "결재 중" },
    { to: "/approval/completed", icon: <Check2Circle />, label: "결재 완료" },
    { to: "/approval/rejected", icon: <XCircle />, label: "반려" },
    { to: "/approval/drafts", icon: <Folder2 />, label: "임시 저장" },
    { to: "/approval/scheduled", icon: <Calendar2Event />, label: "예약" },
    { to: "/approval/cc", icon: <Envelope />, label: "참조" },
  ];

  return (
    <nav className={styles.bottomNav}>
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <div className={styles.icon}>{item.icon}</div>
          <div className={styles.label}>{item.label}</div>
        </NavLink>
      ))}
    </nav>
  );
};

export default ApprovalBottomNav;