import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './HRHeader.scss';
import { UserContext } from '../../context/UserContext';

export default function HRHeader() {
  const location = useLocation();
  const { userRole } = useContext(UserContext);
  const menus = [
    { label: '인사조회', path: '/hr/employee-list' },
    { label: '인사평가 조회', path: '/hr/employee-eval-list' },
    { label: '내 인사평가 이력', path: '/hr/my-evaluations' },
    ...(userRole !== 'EMPLOYEE'
      ? [{ label: '신규등록', path: '/hr/employee-register' }]
      : []),
  ];

  return (
    <nav className='hr-nav'>
      {menus.map((menu) => (
        <Link
          key={menu.path}
          to={menu.path}
          className={location.pathname === menu.path ? 'active' : ''}
        >
          {menu.label}
        </Link>
      ))}
    </nav>
  );
}
