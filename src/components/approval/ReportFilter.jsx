import React, { useState } from 'react';
import styles from './ReportFilter.module.scss';

const ReportFilter = ({ onFilterChange, showCategory = true }) => {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    title: '',
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      dateFrom: '',
      dateTo: '',
      title: '',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div className={styles.filterContainer}>
      <div className={styles.filterHeader}>
        <h3>필터</h3>
        <button
          type="button"
          onClick={handleClearFilters}
          className={styles.clearButton}
        >
          필터 초기화
        </button>
      </div>

      <div className={styles.filterContent}>
        <div className={styles.filterRow}>
          <div className={styles.filterItem}>
            <label>기간</label>
            <div className={styles.dateInputs}>
              <input
                type="text"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                placeholder="시작일"
                onFocus={(e) => (e.target.type = 'date')}
                onBlur={(e) => {
                  if (!e.target.value) e.target.type = 'text';
                }}
                className={styles.dateInput} // ★★★ 클래스 추가
              />
              <span className={styles.dateSeparator}>~</span>
              <input
                type="text"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                placeholder="종료일"
                onFocus={(e) => (e.target.type = 'date')}
                onBlur={(e) => {
                  if (!e.target.value) e.target.type = 'text';
                }}
                className={styles.dateInput} // ★★★ 클래스 추가
              />
            </div>
          </div>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterItem}>
            <label>제목</label>
            <input
              type="text"
              value={filters.title}
              onChange={(e) => handleFilterChange('title', e.target.value)}
              placeholder="제목 검색"
              className={styles.titleInput}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportFilter;