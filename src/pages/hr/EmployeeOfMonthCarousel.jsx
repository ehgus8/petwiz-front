import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, HR_SERVICE } from '../../configs/host-config';
import axiosInstance from '../../configs/axios-config';

const EmployeeOfMonthCarousel = () => {
  const navigate = useNavigate();
  const [eomList, setEomList] = useState([]);

  const getThisMonthEmployee = async () => {
    try {
      // 이달의 사원 조회회
      const res = await axiosInstance.get(
        `${API_BASE_URL}${HR_SERVICE}/eom/top3`,
      );
      console.log('이달의 사원 조회 성공', res.data);
      // 부서명 조회
      const eomList = await Promise.all(
        res.data.map(async (eom) => {
          const deptName = await axiosInstance.get(
            `${API_BASE_URL}${HR_SERVICE}/departments/${eom.departmentId}`,
          );
          return {
            ...eom,
            departmentId: deptName.data.result.name,
          };
        }),
      );
      setEomList(eomList);
    } catch (e) {
      alert(e.response.data.message);
    }
  };

  useEffect(() => {
    getThisMonthEmployee();
  }, []);

  const [eomIndex, setEomIndex] = useState(0);
  // 자동 슬라이드
  useEffect(() => {
    if (eomList.length <= 1) return;
    const timer = setInterval(() => {
      setEomIndex((prev) => (prev + 1) % eomList.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [eomList.length]);

  return (
    <div className='employee-of-month'>
      <div className='tabs'>
        <button className='active'>이달의 사원</button>
        <div className='menu-icon' onClick={() => navigate(`/hr`)} >≡</div>
      </div>
      <div className='eom-slider'>
        {eomList.map((eom, idx) => (
          <div
            key={eom.name}
            className={`eom-slide${idx === eomIndex ? ' active' : ''}`}
          >
            <div className='eom-avatar'>
              <img src={eom.profileImageUri} alt='이달의 사원' />
            </div>
            <div className='eom-info'>
              <div className='eom-name'>{eom.name}</div>
              <div className='eom-dept'>{eom.departmentId}</div>
              <div className='eom-comment'>"{eom.memo}"</div>
            </div>
          </div>
        ))}
        {/* 페이지네이션 */}
        <div className='eom-pagination'>
          {eomList.map((_, idx) => (
            <span
              key={idx}
              className={idx === eomIndex ? 'active' : ''}
              onClick={() => setEomIndex(idx)}
            ></span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeOfMonthCarousel;
