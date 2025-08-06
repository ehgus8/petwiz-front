import React from 'react';
// ★★★ 1. SCSS 모듈 파일을 import 합니다.
import styles from './Pagination.module.scss'; 
import {
  ChevronLeft,
  ChevronRight,
  ChevronDoubleLeft,
  ChevronDoubleRight,
} from 'react-bootstrap-icons';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const getPageNumbers = () => {
    const pageNumbers = [];
    const visiblePages = 5;
    if (totalPages <= visiblePages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(2, currentPage);
      let endPage = Math.min(totalPages - 1, currentPage + 4);
      pageNumbers.push(1);
      if (currentPage > 3) pageNumbers.push('...');
      for (let i = startPage; i <= endPage; i++) {
        if (i > 1 && i < totalPages) pageNumbers.push(i);
      }
      if (currentPage < totalPages - 5) pageNumbers.push('...');
      pageNumbers.push(totalPages);
    }
    return [...new Map(pageNumbers.map((item, index) => [item, {item, index}])).values()].map(v => v.item);
  };

  const pageNumbers = getPageNumbers();

  return (
    // ★★★ 2. 모든 요소에 styles 객체를 사용한 클래스 이름을 적용합니다.
    <nav className={styles.paginationNav}>
      <ul className={styles.paginationList}>
        <li className={`${styles.pageItem} ${currentPage === 0 ? styles.disabled : ''}`}>
          <button onClick={() => onPageChange(0)} disabled={currentPage === 0}>
            <ChevronDoubleLeft />
          </button>
        </li>
        <li className={`${styles.pageItem} ${currentPage === 0 ? styles.disabled : ''}`}>
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0}>
            <ChevronLeft />
          </button>
        </li>

        {pageNumbers.map((page, index) =>
          page === '...' ? (
            <li key={`ellipsis-${index}`} className={`${styles.pageItem} ${styles.ellipsis}`}>
              <span>...</span>
            </li>
          ) : (
            <li key={page} className={`${styles.pageItem} ${currentPage + 1 === page ? styles.active : ''}`}>
              <button onClick={() => onPageChange(page - 1)}>{page}</button>
            </li>
          )
        )}
        
        <li className={`${styles.pageItem} ${currentPage === totalPages - 1 ? styles.disabled : ''}`}>
          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages - 1}>
            <ChevronRight />
          </button>
        </li>
        <li className={`${styles.pageItem} ${currentPage === totalPages - 1 ? styles.disabled : ''}`}>
          <button onClick={() => onPageChange(totalPages - 1)} disabled={currentPage === totalPages - 1}>
            <ChevronDoubleRight />
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;