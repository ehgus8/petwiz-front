import React from 'react';
import { UserContextProvider } from './context/UserContext';

function App({ children }) {
  return (
    <UserContextProvider>
      {/* 전역 Provider 및 공통 UI(헤더/푸터 등) 추가 가능 */}
      {children}
    </UserContextProvider>
  );
}

export default App;
