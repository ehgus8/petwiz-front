// /src/pages/approval/ApprovalPage.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ApprovalBottomNav from './ApprovalBottomNav';
import styles from './ApprovalPage.module.scss';
import useWindowDimensions from '../../hooks/useWindowDimensions';

const ApprovalPage = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <div className={`${styles.approvalPageContainer} ${isMobile ? styles.mobileLayout : ''}`}>
      {/* 이제 Sidebar에 props를 전달할 필요가 없습니다. */}
      {!isMobile && <Sidebar />}
      
      <main className={styles.content}>
        {/* Outlet은 props나 context를 전달하지 않습니다. */}
        <Outlet />
      </main>
      
      {isMobile && <ApprovalBottomNav />}
    </div>
  );
};

export default ApprovalPage;