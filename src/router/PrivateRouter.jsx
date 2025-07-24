import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { Navigate } from 'react-router-dom';

// 라우터 쪽에서 로그인 여부나 권한을 검사하는 기능을 담당하는 PrivateRouter 생성
const PrivateRouter = ({ element, requiredRole }) => {
  const { isLoggedIn, userRole, isInit } = useContext(UserContext);

  // COntext 데이터가 초기화되지 않았다면 밑에 로직이 실행되지 않게끔 로딩 페이지 먼저 리턴.
  // 초기화가 완료되면 PrivateRouter가 다시 렌더링을 시도할 겁니다
  if (!isInit) return <div>Loading...</div>;
  if (!isLoggedIn) {
    alert('로그인 안함');

    return <Navigate to='/login' replace />;
  }

  if (!requiredRole) {
    alert('권한 없음');
    return <Navigate to='/' replace />;
  }
  console.log(
    '사용자 로그인상태 private: ' + isLoggedIn,
    '사용자 권한: ' + userRole,
  );

  // 로그인도 했고, 권한에도 문제가 없다면 원래 렌더링 하고자 했던 컴포넌트를 렌더링
  return element;
};

export default PrivateRouter;
