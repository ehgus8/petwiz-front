// 서버에서 직원 목록 조회 (필터 포함)
import axiosInstance from '../configs/axios-config';
import { API_BASE_URL, HR_SERVICE } from '../configs/host-config';

export const getEmployeeList = async ({
  field = 'name',
  keyword = '',
  department = '전체',
  page: reqPage = 0,
  size: reqSize = 10,
  sortField: reqSortField = null,
  sortOrder: reqSortOrder = 'asc',
  setEmployees,
  setTotalPages,
  isActive, // 추가
} = {}) => {
  try {
    let params = `?page=${reqPage}&size=${reqSize}`;
    if (keyword.trim())
      params += `&field=${field}&keyword=${encodeURIComponent(keyword)}`;
    if (department !== '전체')
      params += `&department=${encodeURIComponent(department)}`;
    if (reqSortField) params += `&sort=${reqSortField},${reqSortOrder}`;
    if (typeof isActive === 'boolean') params += `&isActive=${isActive}`; // 추가
    const res = await axiosInstance.get(
      `${API_BASE_URL}${HR_SERVICE}/employees${params}`,
    );
    setEmployees(res.data.result.content);
    setTotalPages(res.data.result.totalPages || 1);
  } catch (error) {
    console.log(error + 'from getEmployeeList');
    alert(error?.response?.data?.statusMessage || error.message);
  }
};

export const getDepartmentNameById = async (id) => {
  try {
    const res = await axiosInstance.get(
      `${API_BASE_URL}${HR_SERVICE}/departments/${id}`,
    );
    return res.data.result.name;
  } catch (error) {
    console.log(error + 'from getDepartmentNameById');
    alert(error?.response?.data?.statusMessage || error.message);
  }
};
