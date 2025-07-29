import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import { useApprovalForm } from '../../hooks/useApprovalForm';
import Editor from '../../components/Editor'; // TipTap 에디터로 변경
import EmployeeSelectModal from '../../components/approval/EmployeeSelectModal';
import VisualApprovalLine from '../../components/approval/VisualApprovalLine';
import MySwal from '../../common/common';
import styles from './ApprovalNew.module.scss';

// 불필요한 기본값들을 필터링하는 함수
const sanitizeValue = (val) => {
  if (!val) return '';
  
  // "ㅁㄴㅇㄹ" 같은 불필요한 기본값들 제거
  const unwantedDefaults = ['ㅁㄴㅇㄹ', 'test', '테스트', '내용을 입력하세요'];
  const trimmedValue = val.trim();
  
  if (unwantedDefaults.some(defaultVal => trimmedValue.includes(defaultVal))) {
    return '';
  }
  
  return val;
};

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
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false); // 예약 상신 모달
  const [isScheduling, setIsScheduling] = useState(false); // 예약 상신 중 상태

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

  // 예약 상신 API 호출 함수
  const handleScheduleSubmit = async (scheduledAt) => {
    // 필수값 유효성 검사
    if (!formData.title || formData.title.trim() === '') {
      await MySwal.fire({
        icon: 'warning',
        title: '제목은 필수 입력 항목입니다.',
        confirmButtonText: '확인',
      });
      setIsScheduling(false);
      return;
    }
    if (!approvalLine || approvalLine.length === 0) {
      await MySwal.fire({
        icon: 'warning',
        title: '결재선을 한 명 이상 지정해야 합니다.',
        confirmButtonText: '확인',
      });
      setIsScheduling(false);
      return;
    }

    // content 필드 검사 추가
    let contentValue = formData.content;
    if (template && template.content) {
      const editorField = template.content.find(f => f.type === 'editor');
      let editorId = editorField?.id || (editorField ? 'content' : undefined);
      if (editorId) {
        contentValue = formData[editorId] || '';
      }
    }
    
    if (!contentValue || contentValue.trim() === '') {
      await MySwal.fire({
        icon: 'warning',
        title: '내용은 필수 입력 항목입니다.',
        confirmButtonText: '확인',
      });
      setIsScheduling(false);
      return;
    }

    setIsScheduling(true);
    let reqDto = null; // reqDto를 try 블록 밖에서 선언

    try {
      // editor 타입 필드 id 자동 보정
      let fixedTemplate = template;
      if (template && template.content) {
        fixedTemplate = {
          ...template,
          content: template.content.map(f =>
            f.type === 'editor' && !f.id ? { ...f, id: 'content' } : f
          ),
        };
      }

      // 예약 상신 요청 데이터 구성
      reqDto = {
        title: formData.title.trim(),
        content: contentValue.trim(),
        templateId: fixedTemplate?.id,
        reportTemplateData: JSON.stringify(formData),
        approvalLine: approvalLine.map(a => ({ 
          employeeId: a.id || a.employeeId, 
          approvalContext: a.approvalContext 
        })),
        references: references.map(r => ({ 
          employeeId: r.id || r.employeeId 
        })),
        scheduledAt: scheduledAt // ISO 8601 형식의 예약 시간
      };

      const submissionData = new FormData();
      submissionData.append('req', new Blob([JSON.stringify(reqDto)], { type: 'application/json' }));
      files.forEach((file) => submissionData.append('files', file));

      console.log('[ApprovalNew] 예약 상신 API 호출 준비:', reqDto);
      console.log('[ApprovalNew] scheduledAt 형식 확인:', scheduledAt);
      console.log('[ApprovalNew] 현재 시간:', new Date().toISOString());
      console.log('[ApprovalNew] reqDto JSON:', JSON.stringify(reqDto, null, 2));

      // 백엔드에서 제공한 정확한 엔드포인트 사용
      const res = await axiosInstance.post(
        `${API_BASE_URL}${APPROVAL_SERVICE}/schedule`,
        submissionData
      );

      console.log('[ApprovalNew] 예약 상신 API 응답:', res.data);

      if (res.data && res.data.statusCode === 201) {
        setIsDirty(false);
        await MySwal.fire({
          icon: 'success',
          title: '문서가 성공적으로 예약되었습니다.',
          text: `예약 시간: ${new Date(scheduledAt).toLocaleString()}`,
          confirmButtonText: '확인',
        });
        navigate('/approval/home'); // 예약 문서함으로 이동
      } else {
        throw new Error(res.data?.statusMessage || '예약 상신에 실패했습니다.');
      }
    } catch (err) {
      console.error('[ApprovalNew] 예약 상신 실패:', err);
      console.error('[ApprovalNew] 서버 응답:', err.response?.data);
      
      // reqDto가 정의되지 않았을 수 있으므로 안전하게 처리
      try {
        console.error('[ApprovalNew] 요청 데이터:', reqDto);
        console.error('[ApprovalNew] scheduledAt:', scheduledAt);
      } catch (debugErr) {
        console.error('[ApprovalNew] 디버깅 정보 출력 중 오류:', debugErr);
      }
      
      await MySwal.fire({
        icon: 'error',
        title: '예약 상신 실패',
        text: err.response?.data?.statusMessage || err.message,
        confirmButtonText: '확인',
      });
    } finally {
      setIsScheduling(false);
      setIsScheduleModalOpen(false);
    }
  };

  // 예약 시간 선택 모달
  const ScheduleModal = () => {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedHour, setSelectedHour] = useState('');
    const [selectedMinute, setSelectedMinute] = useState('');

    // 서울 표준 시간(KST) 기준으로 10분 단위로 올림하여 최소 선택 가능 시간 설정
    const getCurrentKSTTime = () => {
      const now = new Date();
      
      // 10분 단위로 올림
      const minutes = now.getMinutes();
      const roundedMinutes = Math.ceil(minutes / 10) * 10;
      
      // 시간이 60을 넘으면 다음 시간으로 설정
      let hours = now.getHours();
      if (roundedMinutes >= 60) {
        hours += 1;
        now.setHours(hours, 0, 0, 0);
      } else {
        now.setMinutes(roundedMinutes, 0, 0);
      }
      
      return {
        date: now.toISOString().slice(0, 10),
        hour: now.getHours().toString().padStart(2, '0'),
        minute: now.getMinutes().toString().padStart(2, '0')
      };
    };

    // 10분 단위 옵션 생성
    const getMinuteOptions = () => {
      return ['00', '10', '20', '30', '40', '50'];
    };

    // 시간 옵션 생성 (0-23)
    const getHourOptions = () => {
      return Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    };

    // 현재 시간 기준으로 선택 가능한 최소 시간 계산
    const getMinimumTime = () => {
      const now = new Date();
      
      // 10분 단위로 올림
      const minutes = now.getMinutes();
      const roundedMinutes = Math.ceil(minutes / 10) * 10;
      let minimumHours = now.getHours();
      if (roundedMinutes >= 60) {
        minimumHours += 1;
        const newDate = new Date(now);
        newDate.setHours(minimumHours, 0, 0, 0);
        return {
          date: newDate.toISOString().slice(0, 10),
          hour: newDate.getHours().toString().padStart(2, '0'),
          minute: newDate.getMinutes().toString().padStart(2, '0')
        };
      } else {
        const newDate = new Date(now);
        newDate.setMinutes(roundedMinutes, 0, 0);
        return {
          date: newDate.toISOString().slice(0, 10),
          hour: newDate.getHours().toString().padStart(2, '0'),
          minute: newDate.getMinutes().toString().padStart(2, '0')
        };
      }
    };

    // 현재 시간 (정확한 시간, 올림하지 않음)
    const getCurrentTime = () => {
      const now = new Date();
      
      console.log('현재 시간:', now.toLocaleString('ko-KR'));
      
      const result = {
        date: now.toISOString().slice(0, 10),
        hour: now.getHours().toString().padStart(2, '0'),
        minute: now.getMinutes().toString().padStart(2, '0')
      };
      
      console.log('계산된 시간:', result);
      return result;
    };

    // 초기값 설정 - 현재 시간을 10분 단위로 올림
    React.useEffect(() => {
      const minTime = getMinimumTime();
      setSelectedDate(minTime.date);
      setSelectedHour(minTime.hour);
      setSelectedMinute(minTime.minute);
    }, []);

    const handleScheduleConfirm = () => {
      if (!selectedDate || !selectedHour || !selectedMinute) {
        MySwal.fire({
          icon: 'warning',
          title: '예약 시간을 선택해주세요.',
          confirmButtonText: '확인',
        });
        return;
      }

      // 선택된 시간을 KST 기준으로 비교
      const selectedDateTime = `${selectedDate}T${selectedHour}:${selectedMinute}:00`;
      const selectedTime = new Date(selectedDateTime);
      const currentTime = getCurrentTime();
      const currentDateTime = `${currentTime.date}T${currentTime.hour}:${currentTime.minute}:00`;
      const currentTimeObj = new Date(currentDateTime);

      // 현재 시간과 선택된 시간을 직접 비교 (10분 단위 고려)
      if (selectedTime <= currentTimeObj) {
        MySwal.fire({
          icon: 'warning',
          title: '이미 지나간 시간은 선택할 수 없습니다.',
          text: '10분 단위로 현재 시간 이후의 시간을 선택해주세요.',
          confirmButtonText: '확인',
        });
        return;
      }

      // KST 시간을 UTC로 변환하여 서버에 전송
      // selectedDateTime은 KST 시간이므로, UTC로 변환
      const kstTime = new Date(selectedDateTime + '+09:00'); // KST 시간으로 명시
      const scheduledAt = kstTime.toISOString(); // 이미 UTC로 변환됨
      
      console.log('[ApprovalNew] 선택된 KST 시간:', selectedDateTime);
      console.log('[ApprovalNew] 변환된 UTC 시간:', scheduledAt);
      
      handleScheduleSubmit(scheduledAt);
    };

    const minTime = getMinimumTime();
    const currentTime = getCurrentTime();

    return (
      <ModalPortal>
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>예약 상신</h3>
            <p>문서가 자동으로 상신될 시간을 선택해주세요. (서울 표준 시간 기준, 10분 단위)</p>
            <p style={{fontSize: '12px', color: '#666', marginTop: '8px'}}>
              현재 시간: {currentTime.date} {currentTime.hour}:{currentTime.minute}
            </p>
            
            <div className={styles.formRow}>
              <label>예약 날짜:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={minTime.date}
                className={styles.formInput}
              />
            </div>

            <div className={styles.formRow}>
              <label>예약 시간:</label>
              <div className={styles.timeSelector}>
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                  className={styles.timeSelect}
                >
                  {getHourOptions().map(hour => {
                    const currentTime = getCurrentTime();
                    const isDisabled = selectedDate === currentTime.date && 
                                     parseInt(hour) < parseInt(currentTime.hour);
                    return (
                      <option 
                        key={hour} 
                        value={hour}
                        disabled={isDisabled}
                      >
                        {hour}시
                      </option>
                    );
                  })}
                </select>
                <span className={styles.timeSeparator}>:</span>
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(e.target.value)}
                  className={styles.timeSelect}
                >
                  {getMinuteOptions().map(minute => {
                    const currentTime = getCurrentTime();
                    const isDisabled = selectedDate === currentTime.date && 
                                     selectedHour === currentTime.hour &&
                                     parseInt(minute) < parseInt(currentTime.minute);
                    return (
                      <option 
                        key={minute} 
                        value={minute}
                        disabled={isDisabled}
                      >
                        {minute}분
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className={styles.modalButtons}>
              <button
                type="button"
                onClick={handleScheduleConfirm}
                disabled={isScheduling}
                className={styles.submitButton}
              >
                {isScheduling ? '예약 중...' : '예약 상신'}
              </button>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className={styles.cancelButton}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    );
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
                  <Editor
                    content={sanitizeValue(formData.content || "")}
                    onChange={(content) => handleValueChange("content", content)}
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
            onClick={() => setIsScheduleModalOpen(true)}
            disabled={isSubmitting || isSaving || isScheduling}
            className={styles.scheduleButton}
          >
            예약 상신
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
      {isScheduleModalOpen && <ScheduleModal />}
    </div>
  );
}

export default ApprovalNew;