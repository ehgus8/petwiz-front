import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import styles from './ApprovalPage.module.scss';

const ApprovalPage = () => {
  return (
    <div className={styles.approvalPageContainer}>
      <Sidebar />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};

export default ApprovalPage; 