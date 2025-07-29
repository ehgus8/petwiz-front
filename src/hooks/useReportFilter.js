import { useState, useEffect } from 'react';

export const useReportFilter = (reports) => {
  const [filteredReports, setFilteredReports] = useState([]);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    title: '',
    category: ''
  });

  // 필터링 로직
  useEffect(() => {
    let filtered = [...reports];
    
    // 제목 필터링 (대소문자 무시)
    if (filters.title) {
      filtered = filtered.filter(report => 
        report.title && report.title.toLowerCase().includes(filters.title.toLowerCase())
      );
    }
    
    // 카테고리 필터링
    if (filters.category) {
      filtered = filtered.filter(report => 
        report.category === filters.category
      );
    }
    
    // 기간 필터링
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.createdAt || report.reportCreatedAt);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        let toDate = filters.dateTo ? new Date(filters.dateTo) : null;
        // toDate가 있으면 23:59:59로 맞춰서 해당 날짜까지 포함
        if (toDate) {
          toDate.setHours(23, 59, 59, 999);
        }
        if (fromDate && reportDate < fromDate) return false;
        if (toDate && reportDate > toDate) return false;
        return true;
      });
    }
    
    setFilteredReports(filtered);
  }, [reports, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      dateFrom: '',
      dateTo: '',
      title: '',
      category: ''
    };
    setFilters(clearedFilters);
  };

  return {
    filteredReports,
    filters,
    handleFilterChange,
    clearFilters
  };
}; 