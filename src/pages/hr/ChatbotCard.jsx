import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatbotCard.module.scss';
import { API_BASE_URL, HR_SERVICE } from '../../configs/host-config.js';
import axiosInstance from '../../configs/axios-config.js';

const SYSTEM_PROMPT = '너는 HR 업무를 도와주는 챗봇이야.';

const ChatbotCard = ({
  messages,
  setMessages,
  question,
  setQuestion,
  loading,
  setLoading,
  error,
  setError,
}) => {
  // const [messages, setMessages] = useState([]);
  // const [question, setQuestion] = useState('');
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState('');
  // chatWindowRef로 변경
  const chatWindowRef = useRef(null);
  // inputRef 추가
  const inputRef = useRef(null);
  // 크게보기 상태
  const [isWide, setIsWide] = useState(false);

  // 채팅창 내부만 스크롤
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError('');

    const newMessages = [...messages, { role: 'user', content: question }];
    setMessages(newMessages);
    setQuestion(''); // 요청 보낸 직후 입력창 비우기

    try {
      const res = await axiosInstance.post(
        `${API_BASE_URL}${HR_SERVICE}/chat`,
        { messages: newMessages },
      );
      const assistantReply = res.data.answer || res.data;

      setMessages([
        ...newMessages,
        { role: 'assistant', content: assistantReply },
      ]);
      // 입력창에 포커스 유지
      if (inputRef.current) inputRef.current.focus();
    } catch (err) {
      setError('챗봇 응답을 불러오지 못했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        isWide ? `${styles.chatbotCard} ${styles.wide}` : styles.chatbotCard
      }
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem',
        }}
      >
        <h3 style={{ margin: 0 }}>HRHub 도우미</h3>
        <button
          type='button'
          onClick={() => setIsWide((w) => !w)}
          className={styles.wideToggleBtn}
        >
          {isWide ? '기본 크기' : '크게보기'}
        </button>
      </div>
      <div className={styles.chatWindow} ref={chatWindowRef}>
        {messages
          .filter((msg) => msg.role !== 'system')
          .map((msg, idx) => (
            <div
              key={idx}
              className={`${styles.bubbleRow} ${msg.role === 'user' ? styles.userRow : styles.botRow}`}
            >
              <div
                className={`${styles.bubble} ${msg.role === 'user' ? styles.userBubble : styles.botBubble}`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        {loading && (
          <div className={`${styles.bubbleRow} ${styles.botRow}`}>
            <div className={`${styles.bubble} ${styles.botBubble}`}>...</div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type='text'
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder='질문을 입력하세요...'
          className={styles.input}
          ref={inputRef}
        />
        <button
          type='submit'
          disabled={loading || !question}
          className={styles.button}
        >
          {loading ? '전송 중...' : '질문하기'}
        </button>
      </form>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

export default ChatbotCard;
