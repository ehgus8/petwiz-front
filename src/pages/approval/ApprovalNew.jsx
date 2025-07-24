import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate, useParams, useSearchParams, useBlocker } from 'react-router-dom';
import styles from './ApprovalNew.module.scss';
import { useApprovalForm } from '../../hooks/useApprovalForm';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import EmployeeSelectModal from '../../components/approval/EmployeeSelectModal';
import VisualApprovalLine from '../../components/approval/VisualApprovalLine';
import AttachmentList from '../../components/approval/AttachmentList';
import FormField from './FormField';
import QuillEditor from '../../components/editor/QuillEditor';
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import TemplateSelectionModal from '../../components/approval/TemplateSelectionModal';
import { UserContext } from '../../context/UserContext';
import ModalPortal from '../../components/approval/ModalPortal';

const MySwal = withReactContent(Swal);

function ApprovalNew() {
  console.log('ApprovalNew mount');
  const { reportId } = useParams(); // 수정 모드일 때만 값이 존재
  const [searchParams] = useSearchParams();
  // 쿼리에서 templateId, resubmit 추출
  const templateIdFromQuery = searchParams.get('templateId');
  const resubmitId = searchParams.get('resubmit');
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  // resubmitId가 있으면 reportId 대신 사용
  const effectiveReportId = resubmitId || reportId;
  const {
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
  } = useApprovalForm(templateIdFromQuery, effectiveReportId);

  const [isApproverModalOpen, setIsApproverModalOpen] = useState(false);
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [files, setFiles] = useState([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false); // 폼 내용 변경 여부
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // useCallback을 사용하여 함수가 항상 최신 상태를 참조하도록 함
  const handleFinalSubmit = useCallback(async (isSubmit = false, isMovingAway = false) => {
    // 필수값 유효성 검사
    if (!formData.title || formData.title.trim() === '') {
      await MySwal.fire({
        icon: 'warning',
        title: '제목은 필수 입력 항목입니다.',
        confirmButtonText: '확인',
      });
      if (isSubmit) setIsSubmitting(false);
      else setIsSaving(false);
      return;
    }
    if (isSubmit && (!approvalLine || approvalLine.length === 0)) {
      await MySwal.fire({
        icon: 'warning',
        title: '결재선을 한 명 이상 지정해야 합니다.',
        confirmButtonText: '확인',
      });
      if (isSubmit) setIsSubmitting(false);
      else setIsSaving(false);
      return;
    }
    if (isSubmit) setIsSubmitting(true);
    else setIsSaving(true);

    let url, submissionData;
    // editor 타입 필드 id 자동 보정: id 없으면 'content'로 대입
    let fixedTemplate = template;
    if (template && template.content) {
      fixedTemplate = {
        ...template,
        content: template.content.map(f =>
          f.type === 'editor' && !f.id ? { ...f, id: 'content' } : f
        ),
      };
    }
    // content 값 보정: editor 타입 id 없으면 'content'로 강제 추출
    let contentValue = formData.content;
    if (template && template.content) {
      const editorField = template.content.find(f => f.type === 'editor');
      let editorId = editorField?.id || (editorField ? 'content' : undefined);
      if (editorId) {
        contentValue = formData[editorId] || '';
      }
    }
    // 상세 로그: 분기별로 어떤 API/데이터를 쓰는지
    console.log('[ApprovalNew] handleFinalSubmit 호출:', { isSubmit, isMovingAway, resubmitId, effectiveReportId, formData, approvalLine, references, attachments, files });
    if (resubmitId) {
      url = `${API_BASE_URL}${APPROVAL_SERVICE}/reports/${resubmitId}/resubmit`;
      const resubmitDto = {
        newTitle: formData.title,
        newContent: contentValue,
        approvalLine: approvalLine.map(a => ({ employeeId: a.id || a.employeeId, approvalContext: a.approvalContext })),
        attachments: attachments.map(f => ({ fileName: f.fileName || f.name, url: f.url })),
        references: references.map(r => ({ employeeId: r.id || r.employeeId })),
      };
      submissionData = JSON.stringify(resubmitDto);
      console.log('[ApprovalNew] 재상신 API 호출 준비:', url, resubmitDto);
    } else if (effectiveReportId && isSubmit) {
      url = `${API_BASE_URL}${APPROVAL_SERVICE}/reports/${effectiveReportId}`;
      const updateDto = {
        title: formData.title,
        content: contentValue,
        templateId: fixedTemplate?.id,
        reportTemplateData: JSON.stringify(formData),
        approvalLine: approvalLine.map(a => ({ ...a })),
        references: references.map(r => ({ ...r })),
        attachments: attachments, // 기존 첨부파일 목록
        status: 'IN_PROGRESS', // 상신이면 IN_PROGRESS
      };
      submissionData = new FormData();
      submissionData.append('req', new Blob([JSON.stringify(updateDto)], { type: 'application/json' }));
      files.forEach((file) => submissionData.append('files', file));
      console.log('[ApprovalNew] 임시저장 문서 상신(수정) API 호출 준비:', url, updateDto, files);
    } else if (effectiveReportId && !isSubmit) {
      url = `${API_BASE_URL}${APPROVAL_SERVICE}/reports/${effectiveReportId}`;
      const updateDto = {
        title: formData.title,
        content: contentValue,
        templateId: fixedTemplate?.id,
        reportTemplateData: JSON.stringify(formData),
        approvalLine: approvalLine.map(a => ({ ...a })),
        references: references.map(r => ({ ...r })),
        attachments: attachments, // 기존 첨부파일 목록
        status: 'DRAFT', // 임시저장
      };
      submissionData = new FormData();
      submissionData.append('req', new Blob([JSON.stringify(updateDto)], { type: 'application/json' }));
      files.forEach((file) => submissionData.append('files', file));
      console.log('[ApprovalNew] 임시저장 문서 임시저장(수정) API 호출 준비:', url, updateDto, files);
    } else {
      // 신규 생성 로직 (POST)
      const reqDto = {
        title: formData.title,
        content: contentValue,
        templateId: fixedTemplate?.id,
        reportTemplateData: JSON.stringify(formData),
        approvalLine: approvalLine,
        references: references,
      };
      submissionData = new FormData();
      submissionData.append('req', new Blob([JSON.stringify(reqDto)], { type: 'application/json' }));
      files.forEach((file) => submissionData.append('files', file));
      url = isSubmit
        ? `${API_BASE_URL}${APPROVAL_SERVICE}/submit`
        : `${API_BASE_URL}${APPROVAL_SERVICE}/save`;
      console.log('[ApprovalNew] 신규 생성 API 호출 준비:', url, reqDto, files);
    }
    const successMessage = isSubmit ? '성공적으로 상신되었습니다.' : '임시 저장되었습니다.';
    try {
      let res;
      if (resubmitId) {
        // 재상신: JSON body로 전송
        res = await axiosInstance.post(url, submissionData, {
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (effectiveReportId && (isSubmit || !isSubmit)) {
        // 임시저장 문서의 상신/임시저장 모두 PUT
        res = await axiosInstance.put(url, submissionData);
      } else {
        res = await axiosInstance.post(url, submissionData);
      }
      console.log('[ApprovalNew] API 응답:', res && res.data);
      if (res.data && (res.data.statusCode === 201 || res.data.statusCode === 200)) {
        setIsDirty(false); // dirty 해제
        await Promise.resolve(); // 상태 반영 보장
        await MySwal.fire({
          icon: 'success',
          title: successMessage,
          confirmButtonText: '확인',
        });
        // navigate는 성공 모달 확인 후 실행
        if (isSubmit) {
          navigate('/approval/home');
        } else {
          navigate('/approval/drafts');
        }
      } else {
        console.error('[ApprovalNew] API 응답 statusCode 오류:', res.data);
        throw new Error(res.data.statusMessage || '요청에 실패했습니다.');
      }
    } catch (err) {
      console.error(`[ApprovalNew] 요청 실패: ${url}`, err);
      if (!isMovingAway) {
        alert(`오류: ${err.response?.data?.statusMessage || err.message}`);
      }
    } finally {
      if (isSubmit) setIsSubmitting(false);
      else setIsSaving(false);
    }
  }, [formData, template, approvalLine, references, files, navigate, effectiveReportId]);

  // React Router v7의 useBlocker로 페이지 이탈 감지
  const shouldBlock = !loading && isDirty;
  const blocker = useBlocker(shouldBlock);

  // 작성자만 수정/재상신 가능하도록 방어
  useEffect(() => {
    if (!effectiveReportId) return;
    // reportId 또는 resubmitId로 진입 시, 문서의 작성자와 현재 로그인 사용자가 다르면 차단
    (async () => {
      try {
        const res = await axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/reports/${effectiveReportId}`);
        const report = res.data?.result;
        if (!report || !report.writer || !user || report.writer.id !== user.id) {
          await MySwal.fire({
            icon: 'error',
            title: '접근 권한이 없습니다.',
            text: '해당 문서는 작성자만 수정할 수 있습니다.',
            confirmButtonText: '확인',
          });
          navigate('/approval/home');
        }
      } catch (err) {
        await MySwal.fire({
          icon: 'error',
          title: '문서 정보를 불러올 수 없습니다.',
          text: err.response?.data?.statusMessage || err.message,
          confirmButtonText: '확인',
        });
        navigate('/approval/home');
      }
    })();
  }, [effectiveReportId, user, navigate]);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      MySwal.fire({
        title: '작성중인 내용이 있습니다.',
        text: "페이지를 떠나기 전에 임시저장 하시겠습니까?",
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: '예 (임시저장)',
        denyButtonText: '아니오 (그냥 이동)',
        cancelButtonText: '취소 (머무르기)',
      }).then(async (result) => {
        if (result.isConfirmed) {
          await handleFinalSubmit(false, true);
          await MySwal.fire({
            icon: 'success',
            title: '임시 저장되었습니다.',
            confirmButtonText: '확인',
          });
          blocker.proceed();
        } else if (result.isDenied) {
          blocker.proceed();
        } else {
          blocker.reset();
        }
      });
    }
  }, [blocker, handleFinalSubmit]);

  // ★★★ 핵심 수정: 폼을 수정하는 모든 핸들러에 setIsDirty(true)를 추가합니다. ★★★
  const handleValueChange = (id, value) => {
    setIsDirty(true);
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectApprovers = (selected) => {
    setIsDirty(true);
    setApprovalLine(selected);
    setIsApproverModalOpen(false);
  };

  const handleSelectReferences = (selected) => {
    setIsDirty(true);
    setReferences(selected);
    setIsReferenceModalOpen(false);
  };

  const handleFileChange = (e) => {
    setIsDirty(true);
    const newFiles = Array.from(e.target.files);
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const handleRemoveFile = (indexToRemove) => {
    setIsDirty(true);
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleCancel = () => {
    MySwal.fire({
      title: '취소하시겠습니까?',
      text: '작성 중인 내용이 모두 사라집니다.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '예, 취소합니다',
      cancelButtonText: '아니오',
    }).then((result) => {
      if (result.isConfirmed) {
        setIsDirty(false); // ★ 취소로 나갈 때도 dirty 해제
        setTimeout(() => {
          navigate('/approval/home');
        }, 0);
      }
      // 아니오(취소)면 아무 동작 안 함
    });
  };

  // 상신/임시저장 전 사용자 확인 모달
  const handleSubmitWithConfirm = async (isSubmit) => {
    const result = await MySwal.fire({
      title: isSubmit ? '정말 상신하시겠습니까?' : '임시 저장하시겠습니까?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '예',
      cancelButtonText: '아니오',
    });
    if (result.isConfirmed) {
      handleFinalSubmit(isSubmit);
    }
  };

  // 모달 확인 버튼 클릭 시 이동
  const handleSuccessModalClose = () => {
    setIsSuccessModalOpen(false);
    // 상신이면 상세, 임시저장이면 drafts로 이동
    if (successMessage.includes('상신')) {
      // 최근 생성된 문서 id로 이동
      // (res.data.result.id를 상태로 저장해두고 사용해도 됨. 여기선 단순화)
      navigate('/approval/home');
    } else {
      navigate('/approval/drafts');
    }
  };

  if (loading) return <p>로딩 중...</p>;
  if (error) return <p>오류: {error}</p>;

  return (
    <div className={styles.pageContainer}>
      {/* 
        각 input, QuillEditor, EmployeeSelectModal 등이 
        위에서 수정한 핸들러 함수들(handleValueChange, handleSelectApprovers 등)을 
        props로 잘 전달받고 있는지 확인하는 것이 중요합니다.
      */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmitWithConfirm(true); }}>
        <div className={styles.section}>
          <div className={styles.formRow}>
            <div className={styles.formLabel}>제목</div>
            <div className={styles.formField}>
                  <input
                    type="text"
                    id="title"
                    value={formData.title || ''}
                    onChange={(e) => handleValueChange('title', e.target.value)}
                    placeholder="결재 문서의 제목을 입력하세요."
                    required
                className={styles.formInput}
                  />
            </div>
          </div>
              {/* 동적 필드 렌더링: editor 타입 id 없으면 'content'로 강제 부여, 모든 필드에 안전한 key/fieldKey 부여 */}
        {template?.content?.map((field, index) => {
          let safeId = field.id;
          if (field.type === 'editor' && !field.id) safeId = 'content';
          if (!safeId) safeId = `${field.header || 'field'}_${index}`;
          return (
            <FormField
              key={safeId}
              field={{ ...field, id: safeId }}
              value={formData}
              onChange={handleValueChange}
              fieldKey={safeId}
            />
          );
        })}
          {/* 템플릿이 없을 때만 기본 내용 입력창 표시 */}
          {(!template || !template.content || template.content.length === 0) && (
          <div className={styles.formRow}>
            <div className={styles.formLabel}>내용</div>
            <div className={`${styles.formField} ${styles.vertical}`}>
              <div className={styles.editorContainer}>
                  <QuillEditor
                    value={formData.content || ""}
                  onChange={(content) => handleValueChange("content", content)}
                    placeholder="내용을 입력하세요..."
                  />
              </div>
            </div>
          </div>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.formRow}>
            <div className={styles.formLabel}>결재선</div>
            <div className={styles.formField} style={{ justifyContent: 'space-between' }}>
              <div className={styles.referenceContainer}>
                {approvalLine.length > 0 ? (
                  <div>
                    <strong>결재자 ({approvalLine.length}명):</strong>
                  <VisualApprovalLine approvalLine={approvalLine} mode="full" />
                  </div>
                ) : (
                  <span style={{ color: '#999', fontStyle: 'italic' }}>결재선이 지정되지 않았습니다.</span>
                )}
              </div>
                  <button type="button" onClick={() => setIsApproverModalOpen(true)} className={styles.actionButton}>
                    결재선 지정
                  </button>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formLabel}>참조</div>
            <div className={styles.formField} style={{ justifyContent: 'space-between' }}>
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
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.formRow}>
            <div className={styles.formLabel}>첨부파일</div>
            <div className={`${styles.formField} ${styles.vertical}`}>
              <div className={styles.fileUploadArea}>
                <input
                  type="file"
                  id="files"
                  multiple
                  onChange={handleFileChange}
                  className={styles.fileInput}
                />
                <label htmlFor="files" className={styles.fileUploadButton}>
                  파일 선택
                </label>
                <span className={styles.fileUploadHint}>
                  여러 파일을 선택할 수 있습니다
                </span>
              </div>
              {/* 기존 첨부파일(attachments) */}
              {attachments.length > 0 && (
                <div className={styles.selectedFilesSection}>
                  {attachments.map((file, index) => (
                    <span key={file.id || file.fileName || index} className={styles.fileTag}>
                      {file.fileName || file.name}
                      <button
                        type="button"
                        onClick={() => {
                          // 기존 첨부파일 삭제
                          setAttachments(prev => prev.filter((_, i) => i !== index));
                        }}
                        className={styles.removeFileButton}
                        title="삭제"
                      >✕</button>
                    </span>
                  ))}
                </div>
              )}
              {/* 새로 추가한 파일(files) */}
              {files.length > 0 && (
                <div className={styles.selectedFilesSection}>
                  {files.map((file, index) => (
                    <span key={index} className={styles.fileTag}>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className={styles.removeFileButton}
                        title="삭제"
                      >✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="submit"
            disabled={isSubmitting || isSaving}
            className={styles.submitButton}
          >
            {isSubmitting ? '상신 중...' : '상신'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmitWithConfirm(false)}
            disabled={isSubmitting || isSaving}
            className={styles.draftButton}
          >
            {isSaving ? '저장 중...' : '임시 저장'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className={styles.cancelButton}
          >
            취소
          </button>
        </div>
      </form>
      {isApproverModalOpen && (
        <EmployeeSelectModal
          open={isApproverModalOpen}
          onClose={() => setIsApproverModalOpen(false)}
          onSelect={handleSelectApprovers}
          multiple
          selected={approvalLine} // 현재 선택된 결재자 목록 전달
        />
      )}
      {isReferenceModalOpen && (
        <EmployeeSelectModal
          open={isReferenceModalOpen}
          onClose={() => setIsReferenceModalOpen(false)}
          onSelect={handleSelectReferences}
          multiple
          selected={references} // 현재 선택된 참조자 목록 전달
        />
      )}
       {isTemplateModalOpen && (
        <TemplateSelectionModal
          open={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onStartWriting={(templateId) => navigate(`/approval/new?templateId=${templateId}`)}
        />
      )}
    </div>
  );
}

export default ApprovalNew;