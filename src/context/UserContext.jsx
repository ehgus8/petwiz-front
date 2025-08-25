import React, { useEffect, useState, useContext, useCallback } from 'react';
import axiosInstance from '../configs/axios-config';
import { API_BASE_URL, APPROVAL_SERVICE } from '../configs/host-config';
import { removeLocalStorageForLogout } from '../common/common';

export const UserContext = React.createContext({
  isLoggedIn: false,
  onLogin: () => {},
  onLogout: () => {},
  userRole: '',
  userPosition: '',
  userName: '',
  badge: null,
  setBadge: () => {},
  userId: null,
  departmentId: null,
  userImage: '', // 유저 프로필사진
  setUserImage: () => {},
  isInit: false,
  accessToken: '',
  counts: {},
  setCounts: () => {},
  refetchCounts: () => {},
});

export const UserContextProvider = (props) => {
  const [userId, setUserId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [userPosition, setUserPosition] = useState('');
  const [badge, setBadge] = useState(null);
  const [isInit, setIsInit] = useState(false);
  const [userImage, setUserImage] = useState('');
  const [departmentId, setDepartmentId] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null); // user 객체 상태 추가

  const refetchCounts = useCallback(async () => {
    const token = localStorage.getItem('ACCESS_TOKEN');
    if (!token) return;

    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}${APPROVAL_SERVICE}/reports/counts`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data?.statusCode === 200) {
        const newCounts = res.data.result;
        setCounts(newCounts);
        localStorage.setItem('APPROVAL_COUNTS', JSON.stringify(newCounts));
        console.log("📦 localStorage counts:", localStorage.getItem('APPROVAL_COUNTS'));
        console.log("🎯 API counts:", newCounts);
        console.log("📣 refetchCounts 호출됨");
      }

    } catch (err) {
      console.error('문서함 개수 조회 실패:', err);
    }
  }, []);

  const defaultCounts = {
    pending: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0,
    drafts: 0,
    scheduled: 0,
    cc: 0,
  };

  const [counts, setCounts] = useState(() => {
    try {
      const cached = localStorage.getItem('APPROVAL_COUNTS');
      return cached ? JSON.parse(cached) : defaultCounts;
    } catch {
      return defaultCounts;
    }
  });

  useEffect(() => {
    if (isLoggedIn) {
      setUser({
        id: userId,
        role: userRole,
        name: userName,
        position: userPosition,
        departmentId: departmentId,
        image: userImage,
      });
    } else {
      setUser(null);
    }
  }, [
    isLoggedIn,
    userId,
    userRole,
    userName,
    userPosition,
    departmentId,
    userImage,
  ]);

  // 로그인 함수: 상태 + 배지까지 한 번에처리리
  const loginHandler = async (loginData) => {
    console.log('[loginHandler] 로그인 응답 데이터:', loginData);
    console.log(`[accessToken]: Bearer ${loginData.token}`);

    // 로컬스토리지 저장
    localStorage.setItem('ACCESS_TOKEN', loginData.token);
    localStorage.setItem('USER_ID', loginData.id);
    console.log(`[UserContext] 💾 USER_ID to localStorage: ${loginData.id}`);
    localStorage.setItem('USER_ROLE', loginData.role);
    localStorage.setItem('USER_NAME', loginData.name);
    // localStorage.setItem('USER_IMAGE', loginData.profileImage);
    loginData.departmentId = loginData.depId;
    localStorage.setItem('USER_DEPARTMENT_ID', loginData.departmentId);
    localStorage.setItem('USER_POSITION', loginData.position);

    localStorage.removeItem('IS_LOGGING_OUT'); // Clear logout flag on successful login

    // 상태저장
    console.log('loginData : ', loginData);
    console.log('logingPositionl : ', loginData.position);
    setIsLoggedIn(true);
    setUserId(loginData.id);
    console.log(`[UserContext] 🔄️ userId state set to: ${loginData.id}`);
    setUserRole(loginData.role);
    setUserName(loginData.name);
    setUserImage(loginData.profileImageUri || loginData.profileImage || '');
    setUserPosition(loginData.position);
    setDepartmentId(loginData.departmentId);
    setAccessToken(loginData.token);
    setIsInit(true); // 로그인 시에도 초기화 완료로 설정
    refetchCounts();
  };

  const logoutHandler = () => {
    console.log('[logoutHandler] 로그아웃 수행');
    removeLocalStorageForLogout();
    setIsLoggedIn(false);
    setUserRole('');
    setUserName('');
    setBadge(null);
    setUserImage('');
    setAccessToken(null); // Clear access token on logout
    setUserId(null); // Clear userId on logout
    setUserPosition(''); // Clear userPosition on logout
    setDepartmentId(null); // Clear departmentId on logout
    // 로그아웃 후에도 초기화는 완료 상태 유지
    setIsInit(true);
  };

  useEffect(() => {
    console.log('🌀 [useEffect] 초기 렌더링 시 로컬스토리지 확인');
    const storedToken = localStorage.getItem('ACCESS_TOKEN');

    let intervalId = null;
    if (storedToken) {
      const storedId = localStorage.getItem('USER_ID');
      const storedRole = localStorage.getItem('USER_ROLE');
      const storedPosition = localStorage.getItem('USER_POSITION');
      const storedName = localStorage.getItem('USER_NAME');
      const storedBadge = localStorage.getItem('USER_ICON');
      const storedImage = localStorage.getItem('USER_IMAGE');
      const storedDepartmentId = localStorage.getItem('USER_DEPARTMENT_ID');

      setIsLoggedIn(true);
      setAccessToken(storedToken);
      setUserId(Number(storedId));
      setUserRole(storedRole);
      setUserPosition(storedPosition);
      setUserName(storedName);

      refetchCounts();

      if (storedImage) {
        setUserImage(storedImage);
      }
      if (storedDepartmentId) {
        setDepartmentId(storedDepartmentId);
      }
      // 1차 로컬 복원
      if (storedBadge) {
        try {
          const parsed = JSON.parse(storedBadge);
          setBadge(parsed);
          console.log('📦 로컬 배지 복원됨:', parsed);
        } catch (e) {
          console.error('⚠️ 로컬 배지 파싱 실패:', e);
        }
      }

      setIsInit(true);

      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }

    // 토큰이 있든 없든 초기화는 완료로 표시
    console.log('✅ UserContext 초기화 완료 - isInit을 true로 설정');
    setIsInit(true);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [refetchCounts]);

  const fetchCounts = async () => {
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}${APPROVAL_SERVICE}/reports/counts`
      );
      if (res.data?.statusCode === 200 && res.data.result) {
        const newCounts = res.data.result;
        setCounts(newCounts);
        localStorage.setItem('APPROVAL_COUNTS', JSON.stringify(newCounts));
        console.log("📦 localStorage counts:", localStorage.getItem('APPROVAL_COUNTS'));
        console.log("🎯 API counts:", newCounts);
      }
    } catch (err) {
      console.error('문서함 개수 조회 실패:', err);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
  
    const tick = () => refetchCounts(); // counts 갱신
    tick(); // 로그인 직후 한 번
  
    const id = setInterval(tick, 30000); // 30초
    const onFocus = () => refetchCounts(); // 창 다시 포커스 시 즉시 갱신
    window.addEventListener('focus', onFocus);
  
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [isLoggedIn, refetchCounts]);

  return (
    <UserContext.Provider
      value={{
        isLoggedIn,
        onLogin: loginHandler,
        onLogout: logoutHandler,
        userRole,
        userName,
        userPosition,
        userId,
        departmentId,
        badge,
        setBadge,
        userImage,
        setUserImage,
        isInit,
        accessToken,
        user, // Provider value에 user 객체 추가
        counts,
        setCounts, // counts 업데이트 함수 추가
        refetchCounts,
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
};
