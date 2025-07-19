import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './ApprovalNew.module.scss';
import { useApprovalForm } from '../../hooks/useApprovalForm';
import EmployeeSelectModal from '../../components/approval/EmployeeSelectModal';
import VisualApprovalLine from '../../components/approval/VisualApprovalLine';
import AttachmentList from '../../components/approval/AttachmentList';
import FormField from './FormField'; // FormField 컴포넌트 임포트
import QuillEditor from '../../components/editor/QuillEditor'; // 새로 만든 에디터 컴포넌트 import
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import TemplateSelectionModal from '../../components/approval/TemplateSelectionModal';

function ApprovalNew() {
  const { reportId } = useParams();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('templateId') || reportId;

  console.log(`%c[1단계: 파라미터 확인]`, 'color: blue; font-weight: bold;', { 
    templateId, 
    reportId, 
    searchParams: Object.fromEntries(searchParams.entries()) 
  });

  const navigate = useNavigate();

  const {
    template,
    formData,
    setFormData,
    approvalLine,
    setApprovalLine,
    references,
    setReferences,
    attachments,
    loading,
    error,
  } = useApprovalForm(templateId, reportId);

  const [isApproverModalOpen, setIsApproverModalOpen] = useState(false);
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // 임시 저장 로딩 상태
  const [files, setFiles] = useState([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const handleValueChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectApprovers = (selected) => {
    setApprovalLine(selected);
    setIsApproverModalOpen(false); // 모달 닫기 추가
  };

  const handleSelectReferences = (selected) => {
    setReferences(selected);
    setIsReferenceModalOpen(false); // 모달 닫기 추가
  };

  const handleFileChange = (e) => {
    // 새로 선택한 파일들로 기존 목록을 완전히 교체합니다.
    setFiles(Array.from(e.target.files));
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleFinalSubmit = async (isSubmit = false) => {
    if (isSubmit) {
      setIsSubmitting(true);
    } else {
      setIsSaving(true);
    }

    console.log(`%c[4단계: 저장 직전 template 상태]`, 'color: red; font-weight: bold;', template);

    // 1. DTO와 정확히 일치하는 구조의 자바스크립트 객체를 먼저 만듭니다.
    const reqDto = {
      title: formData.title,
      content: formData.content,
      templateId: template?.id,
      reportTemplateData: JSON.stringify(formData),
      approvalLine: approvalLine,
      references: references,
    };

    // 2. 최종적으로 서버에 보낼 FormData 객체를 생성합니다.
    const submissionData = new FormData();
    console.log(`%c[5단계: 최종 전송 DTO]`, 'color: purple; font-weight: bold;', reqDto);
    // 3. 위에서 만든 자바스크립트 객체(reqDto)를 'req'라는 이름의 파트로 추가합니다.
    //    Blob을 사용하여 Content-Type을 'application/json'으로 명시해줍니다.
    submissionData.append(
      'req',
      new Blob([JSON.stringify(reqDto)], {
        type: 'application/json',
      }),
    );

    // 4. 파일들을 'files'라는 이름의 파트로 추가합니다.
    files.forEach((file) => {
      submissionData.append('files', file);
    });

    // 5. API를 호출합니다.
    const url = isSubmit
      ? `${API_BASE_URL}${APPROVAL_SERVICE}/submit`
      : `${API_BASE_URL}${APPROVAL_SERVICE}/save`;
    const successMessage = isSubmit
      ? '성공적으로 상신되었습니다.'
      : '임시 저장되었습니다.';

    try {
      const res = await axiosInstance.post(url, submissionData);

      if (
        res.data &&
        (res.data.statusCode === 201 || res.data.statusCode === 200)
      ) {
        console.log(`%c[6단계: API 응답]`, 'color: green; font-weight: bold;', res.data);
        
        // 성공 시 다른 페이지로 이동
        const nextUrl = isSubmit
          ? `/approval/reports/${res.data.result.id}`
          : '/approval/drafts';
        navigate(nextUrl);
      } else {
        throw new Error(res.data.statusMessage || '요청에 실패했습니다.');
      }
    } catch (err) {
      console.error(`요청 실패: ${url}`, err);
      alert(`오류: ${err.response?.data?.statusMessage || err.message}`);
    } finally {
      if (isSubmit) {
        setIsSubmitting(false);
      } else {
        setIsSaving(false);
      }
    }
  };



  if (loading) return <p>로딩 중...</p>;
  if (error) return <p>오류: {error}</p>;

  // 디버깅 정보 출력
  console.log(`%c[8단계: 렌더링 시 데이터 상태]`, 'color: purple; font-weight: bold;', {
    template,
    formData,
    approvalLine,
    references,
    attachments,
    reportId
  });
  console.log('[렌더링 시점] template:', template);
console.log('[렌더링 시점] formData:', formData);
console.log('[렌더링 시점] approvalLine:', approvalLine);
console.log('[렌더링 시점] references:', references);
console.log('[렌더링 시점] attachments:', attachments);

  return (
    <div className={styles.pageContainer}>
      <form onSubmit={(e) => { e.preventDefault(); handleFinalSubmit(true); }}>
        <div className={styles.section}>
          <h3>{template ? template.title : '결재 문서 작성'}</h3>
          <table className={styles.approvalFormTable}>
            <tbody>
              {/* 제목 필드 - 항상 표시 */}
              <tr>
                <th>제목</th>
                <td>
                  <input
                    type="text"
                    id="title"
                    value={formData.title || ''}
                    onChange={(e) => handleValueChange('title', e.target.value)}
                    placeholder="결재 문서의 제목을 입력하세요."
                    required
                    className={styles.formInput}
                  />
                </td>
              </tr>
              {/* 템플릿의 다른 필드들 (제목 제외) */}
              {template?.content
                ?.filter((field) => field.type !== 'editor' && field.id !== 'title')
                .map((field) => (
                  <FormField
                    key={field.id}
                    field={field}
                    value={formData}
                    onChange={handleValueChange}
                  />
                ))}
              <tr>
                <td className={styles.formLabel}>내용</td>
                <td colSpan="3" className={styles.formField}>
                  <QuillEditor
                    value={formData.content || ""}
                    onChange={(content) =>
                      handleValueChange("content", content)
                    }
                    placeholder="내용을 입력하세요..."
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.section}>
          <h3>결재선 정보</h3>
          <table className={styles.approvalFormTable}>
            <tbody>
              <tr>
                <th>결재선</th>
                <td>
                  {approvalLine.length > 0 ? (
                    <div>
                      <strong>결재자 ({approvalLine.length}명):</strong>
                      <VisualApprovalLine approvalLine={approvalLine} mode="full" />
                    </div>
                  ) : (
                    <span style={{ color: '#999', fontStyle: 'italic' }}>결재선이 지정되지 않았습니다.</span>
                  )}
                  <button type="button" onClick={() => setIsApproverModalOpen(true)} className={styles.actionButton}>
                    결재선 지정
                  </button>
                </td>
              </tr>
              <tr>
                <th>참조</th>
                <td>
                  <div className={styles.referenceContainer}>
                    {references.length > 0 ? (
                      <div>
                        <strong>참조자 ({references.length}명):</strong>
                        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                          {references.map((r, index) => (
                            <li key={index}>
                              {r.name ? r.name : `직원ID: ${r.employeeId}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>참조자가 지정되지 않았습니다.</span>
                    )}
                  </div>
                  <button type="button" onClick={() => setIsReferenceModalOpen(true)} className={styles.actionButton}>
                    참조자 지정
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.section}>
          <h3>파일 첨부</h3>
          <table className={styles.approvalFormTable}>
             <tbody>
               <tr>
                <th>첨부파일</th>
                <td>
                  <div className={styles.fileUploadArea}>
                    <input 
                      type="file" 
                      id="files" 
                      multiple 
                      onChange={handleFileChange}
                      className={styles.fileInput}
                    />
                    <label htmlFor="files" className={styles.fileUploadButton}>
                      📁 파일 선택
                    </label>
                    <span className={styles.fileUploadHint}>
                      여러 파일을 선택할 수 있습니다
                    </span>
                  </div>
                  
                  {/* 새로 선택한 파일들 */}
                  {files.length > 0 && (
                    <div className={styles.selectedFilesSection}>
                      <h4>선택된 파일 ({files.length}개)</h4>
                      <div className={styles.fileList}>
                        {files.map((file, index) => (
                          <div key={index} className={styles.fileItem}>
                            <span className={styles.fileName}>{file.name}</span>
                            <span className={styles.fileSize}>
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveFile(index)} 
                              className={styles.removeFileButton}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 기존 첨부파일 표시 */}
                  {attachments.length > 0 ? (
                    <div className={styles.existingFilesSection}>
                      <h4>기존 첨부파일 ({attachments.length}개)</h4>
                      <AttachmentList 
                        attachments={attachments} 
                        readonly={true}
                      />
                    </div>
                  ) : (
                    <div style={{ marginTop: '12px', color: '#999', fontStyle: 'italic' }}>
                      기존 첨부파일이 없습니다.
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.actions}>
          <button type="submit" disabled={isSubmitting || isSaving} className={styles.submitButton}>
            {isSubmitting ? '상신 중...' : '상신'}
          </button>
          <button type="button" onClick={() => handleFinalSubmit(false)} disabled={isSubmitting || isSaving} className={styles.draftButton}>
            {isSaving ? '저장 중...' : '임시 저장'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className={styles.cancelButton}>취소</button>
        </div>
      </form>

      {/* --- DEBUG CODE START --- */}
      {isApproverModalOpen && <h3 style={{ color: 'red' }}>[DEBUG] 결재선 모달 열림 상태입니다.</h3>}
      {isReferenceModalOpen && <h3 style={{ color: 'red' }}>[DEBUG] 참조자 모달 열림 상태입니다.</h3>}
      {/* --- DEBUG CODE END --- */}

      {isApproverModalOpen && (
        <EmployeeSelectModal
          open={isApproverModalOpen} // prop 이름 isOpen -> open으로 수정
          onClose={() => setIsApproverModalOpen(false)}
          onSelect={handleSelectApprovers}
          multiple // isMulti -> multiple로 수정
        />
      )}
      {isReferenceModalOpen && (
        <EmployeeSelectModal
          open={isReferenceModalOpen} // prop 이름 isOpen -> open으로 수정
          onClose={() => setIsReferenceModalOpen(false)}
          onSelect={handleSelectReferences}
          multiple // isMulti -> multiple로 수정
        />
      )}

      {isTemplateModalOpen && (
        <TemplateSelectionModal
          open={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onStartWriting={handleStartWriting}
        />
      )}
    </div>
  );
}

export default ApprovalNew;