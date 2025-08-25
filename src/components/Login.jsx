import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // 쿼리 파싱용
import './Login.scss';
import axios from 'axios';
import { API_BASE_URL, HR_SERVICE } from '../configs/host-config';
import { UserContext, UserContextProvider } from '../context/UserContext';
import modalStyles from './ResetPasswordModal.module.scss';
import { succeed, swalError, warn } from '../common/common';
import logo from '../assets/hrhub_logo.png';

// 모달 컴포넌트 추가
function ResetPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async () => {
    if (!email) {
      warn('이메일을 입력해주세요.');
      return;
    }
    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      warn('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await axios.get(
        `${API_BASE_URL}${HR_SERVICE}/employees/email/verification/${email}`,
      );
      succeed('이메일이 전송되었습니다.');
      onClose();
    } catch (error) {
      swalError(
        error.response?.data?.statusMessage || '이메일 전송에 실패했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className={modalStyles['modal-overlay']}>
      <div className={modalStyles['modal-content']}>
        <h3>비밀번호 재설정</h3>
        <label htmlFor='reset-email'>이메일 입력</label>
        <input
          type='email'
          id='reset-email'
          placeholder='email@example.com'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className={modalStyles['modal-btn-group']}>
          <button
            className={modalStyles['send-btn']}
            onClick={handleSendEmail}
            disabled={loading}
          >
            {loading ? '전송 중...' : '비밀번호 재설정 메일 전송'}
          </button>
          <button className={modalStyles['close-btn']} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function Login() {
  const navigate = useNavigate();
  const query = useQuery();
  const emailParam = query.get('email'); // 주소에 ?email=xxx 있으면 값, 없으면 null
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const isResetMode = !!emailParam; // email 쿼리가 있으면 "비번 재설정" 모드
  const { onLogin, isLoggedIn } = useContext(UserContext);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard');
    }
  }, [isLoggedIn, navigate]);
  // email 쿼리가 들어오면 초기값 셋팅
  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  // localStorage에서 이메일 불러오기
  useEffect(() => {
    if (!emailParam) {
      // 쿼리스트링 email이 없을 때만
      const savedEmail = localStorage.getItem('rememberedEmail');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberEmail(true);
      }
    }
  }, [emailParam]);

  const verifyPassword = () => {
    if (!newPassword || !newPasswordConfirm) {
      warn('새 비밀번호를 입력해주세요.');
      return false;
    } else if (newPassword !== newPasswordConfirm) {
      warn('비밀번호가 일치하지 않습니다.');
      return false;
    }
    return true;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    // 이메일 기억하기 체크 시 저장/해제
    if (rememberEmail) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
    if (isResetMode) {
      if (!verifyPassword()) {
        return;
      }
      try {
        await axios.patch(`${API_BASE_URL}${HR_SERVICE}/employees/password`, {
          email,
          password: newPassword,
          verificationCode, // 인증번호 추가
        });
        succeed('비밀번호 설정 완료');
        navigate('/');
      } catch (error) {
        swalError(
          error.response.data.statusMessage
            ? error.response.data.statusMessage
            : error,
        );
      }
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}${HR_SERVICE}/employees/login`,
        {
          email,
          password,
        },
      );
      onLogin(res.data.result);
      navigate('/dashboard');
    } catch (error) {
      swalError(
        error.response.data.statusMessage
          ? error.response.data.statusMessage
          : '서버 에러입니다. 관리자에게 문의해주세요.',
      );
    }
  };

  return (
    <div className='login-container'>
      <div className='login-box'>
        <img src={logo} alt='hrhub' className='logo' />
        <form className='login-form' onSubmit={handleSubmit}>
          {/* 로그인 or 비밀번호 재설정 분기 */}
          <label htmlFor='email'>Email address</label>
          <input
            type='email'
            id='email'
            placeholder='email@example.com'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={isResetMode}
          />

          {isResetMode ? (
            // 비밀번호 재설정 모드
            <>
              <label htmlFor='verificationCode'>인증번호 입력</label>
              <input
                type='text'
                id='verificationCode'
                placeholder='인증번호'
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              <label htmlFor='newPassword'>새 비밀번호 입력</label>
              <input
                type='password'
                id='newPassword'
                placeholder='새 비밀번호'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <label htmlFor='newPasswordConfirm'>새 비밀번호 확인</label>
              <input
                type='password'
                id='newPasswordConfirm'
                placeholder='새 비밀번호 확인'
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
              />
              <button type='submit'>비밀번호 변경</button>
            </>
          ) : (
            // 일반 로그인 모드
            <>
              <label htmlFor='password'>Password</label>
              <input
                type='password'
                id='password'
                placeholder='Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className='options'>
                <label>
                  <input
                    type='checkbox'
                    checked={rememberEmail}
                    onChange={(e) => setRememberEmail(e.target.checked)}
                  />
                  이메일 기억하기
                </label>
              </div>
              <button type='submit'>Sign in</button>

              <div className='forgot'>
                <a
                  href='#'
                  onClick={(e) => {
                    e.preventDefault();
                    setIsResetModalOpen(true);
                  }}
                >
                  비밀번호를 잊어버리셨나요?
                </a>
              </div>
            </>
          )}
        </form>
      </div>
      {/* 비밀번호 재설정 모달 */}
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />
    </div>
  );
}
