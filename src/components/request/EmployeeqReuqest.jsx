import { useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { API_BASE_URL, HR_SERVICE } from '../../constants/api';
import ContactList from '../../pages/contacts/ContactList';
import EmployeeSelectModal from '../approval/EmployeeSelectModal';

// 공통된 요청이 있는 컴포넌트들의 부모 컴포넌트
const EmployeeRequest = () => {
  const [departmentList, setDepartmentList] = useState([]);
  const [employees, setEmployees] = useState([]);

  // 부서 목록 최초 1회
  useEffect(() => {
    const getDepartments = async () => {
      const res = await axiosInstance.get(
        `${API_BASE_URL}${HR_SERVICE}/departments`,
      );
      if (res.status === 200) setDepartmentList(res.data.result);
    };
    getDepartments();
  }, []);

  // 직원 목록: page, 검색, 부서, size 바뀔 때마다
  const getEmployeeList = async ({
    field = searchField,
    keyword = searchText,
    department = searchDept,
    page: reqPage = page,
    size: reqSize = size,
  } = {}) => {
    try {
      let params = `?page=${reqPage}&size=${reqSize}`;
      if (keyword.trim())
        params += `&field=${field}&keyword=${encodeURIComponent(keyword)}`;
      if (department !== '전체')
        params += `&department=${encodeURIComponent(department)}`;
      const res = await axiosInstance.get(
        `${API_BASE_URL}${HR_SERVICE}/employees${params}`,
      );
      setEmployees(res.data.result.content);
      setTotalPages(res.data.result.totalPages || 1);
    } catch (error) {
      alert(error?.response?.data?.statusMessage || error.message);
    }
  };

  useEffect(() => {
    getEmployeeList({ page, size });
    // eslint-disable-next-line
  }, [page, size]);

  return (
    <>
      <ContactList />
      <EmployeeSelectModal />
    </>
  );
};

export default EmployeeRequest;
