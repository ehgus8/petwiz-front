import React from 'react';
import pin from '../../assets/pin.jpg';

export default function UserCard({
  userName,
  userPosition,
  departmentName,
  profileImageUri,
  onEditProfile,
  userRole,
}) {
  return (
    <div className='hr-usercard'>
      <div className='user-avatar'>
        <img
          src={profileImageUri ? profileImageUri : pin}
          alt='profile'
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
          }}
        />
      </div>
      <div className='user-meta'>
        <div className='user-name'>
          <b>{userName || '이름없음'}</b>{' '}
          <span className='user-role'>{userPosition || '직급없음'}</span>
        </div>
        <div className='user-desc'>
          {departmentName ? `부서: ${departmentName}` : '부서 정보 없음'}
        </div>
        <div className='user-edit' onClick={onEditProfile}>
          개인정보 수정
        </div>
      </div>
    </div>
  );
}
