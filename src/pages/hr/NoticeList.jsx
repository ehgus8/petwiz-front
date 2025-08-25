import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './NoticeList.scss';
import { UserContext, UserContextProvider } from '../../context/UserContext'; // 로그인 유저 정보

export default function NoticeList({ notices, load }) {
  const { isInit, userId, accessToken, departmentId, userPosition } =
    useContext(UserContext);
  const navigate = useNavigate();

  // 제목을 20자로 제한하는 함수
  const truncateTitle = (title, maxLength = 20) => {
    return title.length > maxLength ? `${title.slice(0, maxLength)}...` : title;
  };

  // if (!notices || notices.length === 0) {
  //   return <p className='no-notice'>공지사항이 없습니다.</p>;
  // }

  return (
    <>
      {load ? (
        <p>불러오는 중...</p>
      ) : (
        <>
          <table className='notice-list'>
            <tbody>
              {notices.map((notice) => (
                <tr key={notice.noticeId} className='notice-item'>
                  <td
                    style={{
                      fontWeight:
                        notice.position === userPosition ? 'bold' : 'normal',
                    }}
                    className='notice-title'
                    onClick={() => navigate(`/notice/${notice.noticeId}`)}
                    title={notice.title} // 전체 제목을 툴팁으로 표시
                  >
                    {truncateTitle(notice.title)}
                  </td>
                  <td
                    style={{
                      fontWeight:
                        notice.position === userPosition ? 'bold' : 'normal',
                    }}
                    className='notice-author'
                  >
                    {notice.employStatus === 'INACTIVE'
                      ? `${notice.name}(퇴사)`
                      : notice.name}
                  </td>
                  <td
                    style={{
                      fontWeight:
                        notice.position === userPosition ? 'bold' : 'normal',
                    }}
                    className='notice-date'
                  >
                    {new Date(notice.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

// {notices.map((notice) => (
//   <li
//     key={notice.id}
//     className='notice-item'
//     onClick={() => navigate(`/noticeboard/${notice.id}`)}
//     style={{ cursor: 'pointer' }}
//   >
//     📌 {notice.title}
//   </li>
// ))}
