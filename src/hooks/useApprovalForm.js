import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../configs/axios-config';
import { API_BASE_URL, APPROVAL_SERVICE } from '../configs/host-config';

export const useApprovalForm = (templateId, reportId) => {
  const navigate = useNavigate();
  console.log(`%c[2단계: 훅 수신]`, 'color: green; font-weight: bold;', { templateId, reportId });
  // API 응답 데이터를 한 번에 관리
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [approvalLine, setApprovalLine] = useState([]);
  const [references, setReferences] = useState([]); // 참조자 상태 추가
  const [attachments, setAttachments] = useState([]);

  // UI 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFormData = async () => {
      // ID가 확정되기 전에 불필요한 호출을 방지
      if (!templateId && !reportId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let url;
        let params = {};
        
        if (reportId) {
          // 기존 문서 수정: 상세 조회 API 사용
          url = `${API_BASE_URL}${APPROVAL_SERVICE}/reports/${reportId}`;
        } else {
          // 새 문서 작성: 템플릿 조회 API 사용
          url = `${API_BASE_URL}${APPROVAL_SERVICE}/form`;
          if (templateId) {
            params.templateId = templateId;
          }
        }
        
        const res = await axiosInstance.get(url, { params });

        console.log(`%c[3단계: API 응답]`, 'color: orange; font-weight: bold;', res.data.result);

        if (res.data && res.data.statusCode === 200) {
          const result = res.data.result;
          
          console.log(`%c[3-1단계: 백엔드 응답 데이터]`, 'color: cyan; font-weight: bold;', {
            template: result.template,
            formData: result.formData,
            approvalLine: result.approvalLine,
            references: result.references,
            attachments: result.attachments
          });
          
          // 기존 문서 수정 시 데이터 매핑
          if (reportId) {
            // 백엔드 응답 구조에 따라 데이터 매핑
            const mappedFormData = result.formData || {
              title: result.title || '',
              content: result.content || '',
              ...result.reportTemplateData ? JSON.parse(result.reportTemplateData) : {}
            };
            
            setTemplate(result.template || null);
            setFormData(mappedFormData);
            setApprovalLine(result.approvalLine || []);
            setReferences(result.references || []);
            setAttachments(result.attachments || []);
          } else {
            // 새 문서 작성 시 기존 로직
            const { template, formData, approvalLine, attachments, references } = result;
            setTemplate(template);
            setFormData(formData || {});
            setApprovalLine(approvalLine || []);
            setReferences(references || []);
            setAttachments(attachments || []);
          }
        } else {
          throw new Error(
            res.data.statusMessage || '결재 양식 데이터를 불러오는 데 실패했습니다.', // 'message' -> 'statusMessage'
          );
        }
      } catch (err) {
        console.error('Failed to fetch form data:', err);
        console.error('Failed to fetch form data (에러 객체 전체):', err);
        setError(err.message);
        // 필요시 에러 페이지로 이동
        // navigate('/error'); 
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [templateId, reportId, navigate]);

  return {
    template,
    formData,
    setFormData, // formData는 사용자가 수정해야 하므로 setter도 반환
    approvalLine,
    setApprovalLine,
    references, // 반환값에 추가
    setReferences, // 반환값에 추가
    attachments,
    setAttachments,
    loading,
    error,
  };
}; 