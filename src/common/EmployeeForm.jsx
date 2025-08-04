import { useState, useEffect } from 'react';

const EmployeeForm = ({ selectedEmployee, onChange, onSubmit }) => {
  const [formData, setFormData] = useState(selectedEmployee || {});

  // 선택된 사원정보가 변경되면 반영
  useEffect(() => {
    setFormData(selectedEmployee || {});
  }, [selectedEmployee]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
    >
      <input
        name='employeeId'
        value={formData.employeeId || ''}
        onChange={handleChange}
        placeholder='사원번호'
      />
      <input
        name='name'
        value={formData.name || ''}
        onChange={handleChange}
        placeholder='이름'
      />
      <input
        name='department'
        value={formData.department || ''}
        onChange={handleChange}
        placeholder='부서'
      />

      <button type='submit'>등록</button>
    </form>
  );
};

export default EmployeeForm;
