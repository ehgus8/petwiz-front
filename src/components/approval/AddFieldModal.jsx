import React, { useEffect, useRef } from 'react';
import styles from './AddFieldModal.module.scss';
import { TfiText } from 'react-icons/tfi';
import { IoCalendarOutline, IoSwapHorizontalOutline } from 'react-icons/io5';
import { FaHashtag } from 'react-icons/fa';

const AddFieldModal = ({ isOpen, onClose, onSelect }) => {
  const modalContentRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (
      modalContentRef.current &&
      !modalContentRef.current.contains(e.target)
    ) {
      onClose();
    }
  };

  const componentOptions = [
    {
      id: 'text', // ★★★ 이제 이 'text'가 사용자 정의 모달을 여는 역할을 합니다.
      icon: <TfiText />,
      name: '텍스트',
      desc: '필드명, 필수 여부 등 모든 속성을 직접 설정합니다.', // 설명을 더 명확하게 변경
    },
    {
      id: 'date_ymd',
      icon: <IoCalendarOutline />,
      name: '날짜',
      desc: '년/월/일을 선택합니다.',
    },
    {
      id: 'period',
      icon: <IoSwapHorizontalOutline />,
      name: '기간',
      desc: '시작일과 종료일을 선택합니다.',
    },
    {
      id: 'number',
      icon: <FaHashtag />,
      name: '숫자',
      desc: '숫자만 입력받습니다.',
    },
  ];
  
  // ★★★ 'customOption' 객체는 이제 필요 없으므로 삭제합니다.

  return (
    <div className={styles.modalOverlay} onMouseDown={handleOverlayClick}>
      <div className={styles.modalContent} ref={modalContentRef}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label='닫기'
          title='닫기'
        >
          ×
        </button>

        <h2 className={styles.title}>필드 추가</h2>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>컴포넌트 유형</h3>
          <p className={styles.sectionDesc}>
            추가할 컴포넌트 유형을 선택하세요.
          </p>
          <div className={styles.optionGrid}>
            {componentOptions.map((opt) => (
              <div
                key={opt.id}
                className={styles.optionCard}
                onClick={() => onSelect(opt.id)}
              >
                <div className={styles.icon}>{opt.icon}</div>
                <div className={styles.details}>
                  <div className={styles.name}>{opt.name}</div>
                  <div className={styles.desc}>{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ★★★ '또는' 구분선과 '사용자 정의 컴포넌트' 섹션을 모두 제거합니다. ★★★ */}
        
      </div>
    </div>
  );
};

export default AddFieldModal;