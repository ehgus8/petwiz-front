import { useState } from 'react';
import ExcelUploader from '../../common/ExcelUploader';
import EmployeeSelector from '../../common/EmployeeSelector';
import EmployeeForm from '../../common/EmployeeForm';

const ImportEmployee = () => {
  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handleSubmit = (formData) => {
    console.log('제출된 데이터:', formData);
    // axios.post('/api/employees', formData) 등으로 서버에 등록 가능
  };

  return (
    <>
      <ExcelUploader onDataParsed={setEmployeeList} />
      <EmployeeSelector
        employeeList={employeeList}
        onSelect={setSelectedEmployee}
      />
      <EmployeeForm
        selectedEmployee={selectedEmployee}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default ImportEmployee;
