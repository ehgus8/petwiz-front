import * as XLSX from 'xlsx';
import { useState, useRef } from 'react';

const ExcelUploader = ({ onDataParsed }) => {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet);
      onDataParsed(json);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className='excel-upload-row'>
      <input
        type='file'
        accept='.xlsx, .xls'
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      <button
        type='button'
        className='excel-upload-btn'
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
      >
        엑셀 파일 선택
      </button>
      {file && <span className='excel-upload-success'>{file.name}</span>}
    </div>
  );
};
export default ExcelUploader;
