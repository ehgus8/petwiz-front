import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { Navigate, Outlet } from 'react-router-dom';
import { FullPageSkeleton } from '../components/common/Skeleton';

const AdminRoute = () => {
  const { isLoggedIn, userRole, isInit } = useContext(UserContext);

  if (!isInit) {
    return <FullPageSkeleton lines={6} />;
  }

  if (!isLoggedIn) {
    alert('로그인이 필요합니다.');
    return <Navigate to='/' replace />;
  }

  if (userRole !== 'ADMIN') {
    alert('접근 권한이 없습니다.');
    return <Navigate to='/dashboard' replace />; // Redirect to a safe page
  }

  return <Outlet />;
};

export default AdminRoute; 