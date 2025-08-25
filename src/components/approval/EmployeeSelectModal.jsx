import React, { useState, useEffect } from 'react';
import styles from './EmployeeSelectModal.module.scss';
import { SkeletonBlock } from '../common/Skeleton';
import axiosInstance from '../../configs/axios-config';
import {
  API_BASE_URL,
  HR_SERVICE,
  APPROVAL_SERVICE,
} from '../../configs/host-config';

const EmployeeSelectModal = ({
  open,
  onClose,
  onSelect,
  selected, // prop 이름 통일
  multiple,
}) => {
  const [departmentList, setDepartmentList] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [selectedState, setSelectedState] = useState([]);
  const [activeTab, setActiveTab] = useState('전체');
  const [openDept, setOpenDept] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const getDepartmentList = async () => {
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}${HR_SERVICE}/departments`,
      );
      if (res.status === 200) {
        const allDepartments = res.data.result;
        // ★★★ 핵심 수정: API 응답에서 '전체' 부서를 필터링하여 제외합니다. ★★★
        const actualDepartments = allDepartments.filter(
          (dept) => dept.name !== '전체',
        );
        setDepartmentList(actualDepartments);
      }
    } catch (err) {
      console.error('부서 정보 로딩 실패:', err);
      setError('부서 정보를 불러오지 못했습니다.');
    }
  };

  const getEmployeeList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}${HR_SERVICE}/employees/contact?size=99999`,
      );
      if (res.status === 200) {
        const allEmployees = res.data.result.content;
        const activeEmployees = allEmployees.filter(
          (emp) => emp.status === 'ACTIVE',
        );
        setEmployeeList(activeEmployees);
      }
    } catch (err) {
      console.error('직원 정보 로딩 실패:', err);
      setError('직원 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      getDepartmentList();
      getEmployeeList();
    }
  }, [open]);

  // ★ selected prop이 바뀌거나 open이 true가 될 때마다 내부 selectedState를 동기화
  useEffect(() => {
    if (open) {
      setSelectedState(selected || []);
    }
  }, [open, selected]);

  const filteredEmployees = employeeList.filter((emp) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    return (
      (emp.name && emp.name.toLowerCase().includes(keyword)) ||
      (emp.department && emp.department.toLowerCase().includes(keyword)) ||
      (emp.position && emp.position.toLowerCase().includes(keyword)) ||
      (emp.role && emp.role.toLowerCase().includes(keyword))
    );
  });

  const employeesByDept = departmentList.reduce((acc, dept) => {
    acc[dept.name] = filteredEmployees.filter(
      (emp) => emp.department === dept.name,
    );
    return acc;
  }, {});

  const handleSelect = (emp) => {
    if (multiple) {
      setSelectedState((prev) =>
        prev.some((e) => e.id === emp.id)
          ? prev.filter((e) => e.id !== emp.id)
          : [...prev, emp],
      );
    } else {
      setSelectedState([emp]);
    }
  };

  const handleConfirm = () => {
    const transformedSelection = selectedState.map((emp, index) => ({
      ...emp,
      employeeId: emp.id,
      approvalContext: index + 1,
    }));
    onSelect(transformedSelection);
    onClose();
  };

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={styles.modalTitle}>직원 선택</h3>
        <div className={styles.searchRow}>
          <input
            type='text'
            placeholder='이름/부서/직급/직책 검색'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.tabGroup}>
          <button
            className={activeTab === '전체' ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab('전체')}
            type='button'
          >
            전체
          </button>
          <button
            className={activeTab === '팀별' ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab('팀별')}
            type='button'
          >
            팀별
          </button>
        </div>

        {loading && (
          <div style={{padding: '8px 0'}}>
            <SkeletonBlock height={12} style={{ width: '30%', marginBottom: 6 }} />
            <SkeletonBlock height={12} style={{ width: '55%', marginBottom: 6 }} />
            <SkeletonBlock height={12} style={{ width: '45%' }} />
          </div>
        )}
        {error && <div className={styles.error}>{error}</div>}

        {!loading && !error && activeTab === '전체' && (
          <ul className={styles.employeeList}>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <li key={emp.id} className={styles.employeeItem}>
                  <label className={styles.employeeLabel}>
                    <input
                      type={multiple ? 'checkbox' : 'radio'}
                      checked={selectedState.some((e) => e.id === emp.id)}
                      onChange={() => handleSelect(emp)}
                      className={styles.employeeInput}
                    />
                    <span className={styles.employeeInfo}>
                      <b>{emp.name}</b>{' '}
                      <span className={styles.employeeMeta}>
                        ({emp.position} / {emp.role} / {emp.department})
                      </span>
                    </span>
                  </label>
                </li>
              ))
            ) : (
              <li className={styles.noResult}>표시할 직원이 없습니다.</li>
            )}
          </ul>
        )}

        {!loading && !error && activeTab === '팀별' && (
          <div className={styles.departmentList}>
            {departmentList.map((dept) => (
              <div key={dept.id} className={styles.departmentItem}>
                <div
                  className={styles.departmentHeader}
                  onClick={() =>
                    setOpenDept(openDept === dept.id ? null : dept.id)
                  }
                >
                  {dept.name}{' '}
                  <span className={styles.departmentCount}>
                    ({employeesByDept[dept.name]?.length || 0}명)
                  </span>
                  <span className={styles.departmentArrow}>
                    {openDept === dept.id ? '▲' : '▼'}
                  </span>
                </div>
                {openDept === dept.id && (
                  <ul className={styles.departmentEmployeeList}>
                    {employeesByDept[dept.name]?.length > 0 ? (
                      employeesByDept[dept.name].map((emp) => (
                        <li key={emp.id} className={styles.employeeItem}>
                          <label className={styles.employeeLabel}>
                            <input
                              type={multiple ? 'checkbox' : 'radio'}
                              checked={selectedState.some(
                                (e) => e.id === emp.id,
                              )}
                              onChange={() => handleSelect(emp)}
                              className={styles.employeeInput}
                            />
                            <span className={styles.employeeInfo}>
                              <b>{emp.name}</b>{' '}
                              <span className={styles.employeeMeta}>
                                ({emp.position} / {emp.role})
                              </span>
                            </span>
                          </label>
                        </li>
                      ))
                    ) : (
                      <li className={styles.noResult}>
                        해당 부서에 직원이 없습니다.
                      </li>
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        <div className={styles.buttonGroup}>
          <button
            onClick={handleConfirm}
            className={styles.confirmButton}
            type='button'
          >
            확인
          </button>
          <button
            onClick={onClose}
            className={styles.cancelButton}
            type='button'
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSelectModal;
