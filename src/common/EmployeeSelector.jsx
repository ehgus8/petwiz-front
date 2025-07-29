const EmployeeSelector = ({ employeeList, onSelect }) => {
  return (
    <select onChange={(e) => onSelect(employeeList[e.target.value])}>
      <option value=''>직원 선택</option>
      {employeeList.map((emp, index) => {
        return (
          <option key={index} value={index}>
            {emp['이름']}({emp['부서']})
          </option>
        );
      })}
    </select>
  );
};

export default EmployeeSelector;
