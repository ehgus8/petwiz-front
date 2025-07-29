import React, { useEffect, useRef } from 'react';
import styles from './AddFieldModal.module.scss'; // 1. SCSS 파일 import

// 아이콘 임포트 (React Icons 라이브러리 사용 예시)
// npm install react-icons
import { TfiText, TfiLayoutMenuV } from 'react-icons/tfi';
import {
  IoCalendarOutline,
  IoSwapHorizontalOutline,
  IoCreateOutline,
} from 'react-icons/io5';
import { FaHashtag } from 'react-icons/fa';

const AddFieldModal = ({ isOpen, onClose, onSelect }) => {
  const modalContentRef = useRef(null);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 오버레이 클릭 시 닫기
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
      id: 'text',
      icon: <TfiText />,
      name: '텍스트',
      desc: '한 줄 텍스트를 입력받습니다.',
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

  const customOption = {
    id: 'custom',
    icon: <IoCreateOutline />,
    name: '새 항목 직접 만들기',
    desc: '필드명, 필수 여부 등 모든 속성을 직접 설정합니다.',
    note: '※ 필드명(제목)은 필수 입력 항목입니다.',
  };

  return (
    // 2. className 적용
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
          <h3 className={styles.sectionTitle}>기본 컴포넌트</h3>
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

        <div className={styles.divider}>또는</div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>사용자 정의 컴포넌트</h3>
          <p className={styles.sectionDesc}>
            더 상세한 설정이 필요한 경우, 새 항목을 직접 만드세요.
          </p>
          <div className={styles.optionGrid}>
            <div
              className={styles.optionCard}
              onClick={() => onSelect(customOption.id)}
            >
              <div className={styles.icon}>{customOption.icon}</div>
              <div className={styles.details}>
                <div className={styles.name}>{customOption.name}</div>
                <div className={styles.desc}>{customOption.desc}</div>
                {customOption.note && (
                  <div className={styles.note}>{customOption.note}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFieldModal;
