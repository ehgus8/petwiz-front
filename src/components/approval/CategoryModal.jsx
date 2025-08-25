import React, { useState, useEffect } from 'react';
import styles from './CategoryModal.module.scss';
import Swal from 'sweetalert2';


const CategoryModal = ({ open, onClose, onSubmit, category }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    // 모달이 열리고, 수정할 category 데이터가 있을 때 상태를 설정합니다.
    if (open && category) {
      setName(category.categoryName || '');
      setDescription(category.categoryDescription || '');
    }
    // 모달이 열리고, category 데이터가 없으면 (즉, '추가' 모드일 때) 상태를 초기화합니다.
    else if (open && !category) {
      setName('');
      setDescription('');
    }
    // 모달이 닫힐 때 상태 초기화
    else if (!open) {
      setName('');
      setDescription('');
    }
  }, [open, category?.id, category?.categoryName, category?.categoryDescription]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: '카테고리 이름을 입력해주세요.',
        confirmButtonText: '확인',
      });
      return;
    }
    // 부모 컴포넌트로 데이터 전달
    onSubmit({
      categoryName: name,
      categoryDescription: description,
    });
    console.log(category.categoryDescription);
  };

  const handleDelete = async () => {
    onSubmit(null, true); 
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  if (!open) {
    return null;
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <h3>{category ? '카테고리 수정' : '카테고리 추가'}</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor='category-name'>카테고리 이름</label>
            <input
              id='category-name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='예: 휴가 신청서'
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor='category-description'>카테고리 설명</label>
            <textarea
              id='category-description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='카테고리에 대한 간단한 설명을 입력하세요.'
              rows='3'
              
            ></textarea>
          </div>
          <div className={styles.buttonGroup}>
            {category && (
              <button type='button' onClick={handleDelete} className={styles.deleteButton}>
                삭제
              </button>
            )}
            <button type='button' onClick={handleClose} className={styles.cancelButton}>
              취소
            </button>
            <button type='submit' className={styles.saveButton}>
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal; 