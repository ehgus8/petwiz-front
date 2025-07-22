import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../configs/axios-config';
import { API_BASE_URL, APPROVAL_SERVICE } from '../configs/host-config';

export const useApprovalForm = (templateId, reportId) => {
  const navigate = useNavigate();
  
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [approvalLine, setApprovalLine] = useState([]);
  const [references, setReferences] = useState([]);
  const [attachments, setAttachments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // ★ 1. ID가 둘 다 없으면 API를 호출하지 않고 즉시 종료합니다.
      if (!reportId && !templateId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        let url;
        // ★ 2. 수정 모드(reportId)인지, 신규 작성 모드(templateId)인지 명확하게 구분합니다.
        if (reportId) {
          // 수정 모드: 기존 문서 상세 정보를 가져옵니다.
          url = `${API_BASE_URL}${APPROVAL_SERVICE}/reports/${reportId}`;
        } else {
          // 신규 작성 모드: 템플릿 정보를 가져옵니다.
          url = `${API_BASE_URL}${APPROVAL_SERVICE}/form?templateId=${templateId}`;
        }
        
        console.log(`%c[useApprovalForm] API 요청 시작: ${url}`, 'color: blue;');
        const res = await axiosInstance.get(url);
        
        if (res.data?.statusCode === 200) {
          const data = res.data.result;
          console.log(`%c[useApprovalForm] API 응답 성공:`, 'color: green;', data);

          // ★ 3. 응답 데이터를 각 상태에 맞게 설정합니다.
          setTemplate(data.template || null);
          // formData는 template의 기본값과 실제 데이터를 합쳐서 설정할 수 있습니다.
          setFormData(data.formData || {});
          setApprovalLine(
            (data.approvalLine || []).map(emp => emp.id ? emp : { ...emp, id: emp.employeeId })
          );
          setReferences(
            (data.references || []).map(emp => emp.id ? emp : { ...emp, id: emp.employeeId })
          );
          setAttachments(data.attachments || []);
        } else {
          throw new Error(res.data?.statusMessage || '데이터를 불러오지 못했습니다.');
        }
      } catch (err) {
        console.error("useApprovalForm 에러:", err);
        setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
        // 에러 발생 시 에러 페이지로 보내는 것도 좋은 방법입니다.
        // navigate('/error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reportId, templateId, navigate]); // navigate를 의존성 배열에 추가

  return {
    template,
    formData,
    setFormData,
    approvalLine,
    setApprovalLine,
    references,
    setReferences,
    attachments,
    setAttachments,
    loading,
    error,
  };
};