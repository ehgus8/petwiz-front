import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './EvaluationForm.scss';
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, HR_SERVICE } from '../../configs/host-config';

// 별점 컴포넌트 (조회용, 클릭 불가)
function StarRatingView({ value }) {
  return (
    <span className='star-row'>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{
            color: n <= value ? '#ffba08' : '#ccc',
            fontSize: '1.35em',
          }}
        >
          {n <= value ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

// 평가 항목 기본값
const DEFAULT_CRITERIA = [
  { key: 'leadership', label: '리더십' },
  { key: 'creativity', label: '창의성' },
  { key: 'cooperation', label: '협업능력' },
  { key: 'problem', label: '문제해결능력' },
];

export default function EvaluationView({ evaluation, onClose, onEdit }) {
  // evaluation: {
  //   name, dept, date, leadership, creativity, cooperation, problem, comment, avg
  // }
  console.log(evaluation, '여기임');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeDept, setEmployeeDept] = useState('');
  const [approverName, setApproverName] = useState('');
  const [evaluatorName, setEvaluatorName] = useState('');

  useEffect(() => {
    getEmployeeName();
    getEmployeeDept();
    getApproverName();
    fetchEvaluatorName();
  }, []);

  const getEmployeeName = async () => {
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}${HR_SERVICE}/employees/${evaluation.evaluateeId}/name`,
      );
      setEmployeeName(res.data.result);
    } catch (error) {
      console.error(error);
    }
  };

  const getEmployeeDept = async () => {
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}${HR_SERVICE}/employees/${evaluation.evaluateeId}/name/department`,
      );
      setEmployeeDept(res.data.result);
    } catch (error) {
      console.error(error);
    }
  };

  const getApproverName = async () => {
    if (!evaluation.evaluatorId) return;
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}${HR_SERVICE}/employees/${evaluation.evaluatorId}/name`,
      );
      setApproverName(res.data.result);
    } catch (error) {
      setApproverName('');
    }
  };

  const fetchEvaluatorName = async () => {
    if (!evaluation.evaluatorId) return;
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}${HR_SERVICE}/employees/${evaluation.evaluatorId}/name`,
      );
      setEvaluatorName(res.data.result);
    } catch (error) {
      setEvaluatorName('');
    }
  };

  return (
    <div className='eval-root'>
      <div className='eval-header'>
        <button className='back-btn' onClick={onClose}>
          ◀
        </button>
        <div className='eval-title'>인사평가 조회</div>
      </div>
      <div className='eval-main'>
        {/* 평가 정보 표시 */}
        <div className='eval-form-box'>
          <div className='eval-form-title'>인사평가표</div>
          <hr />
          <form autoComplete='off'>
            <div className='eval-field'>
              <label>사원명</label>
              <input type='text' name='name' value={employeeName} readOnly />
            </div>
            <div className='eval-field'>
              <label>소속부서</label>
              <input type='text' name='dept' value={employeeDept} readOnly />
            </div>
            <div className='eval-field'>
              <label>면담일시</label>
              <input type='text' value={evaluation.interviewDate} readOnly />
            </div>
            <div className='eval-field'>
              <label>평가자</label>
              <input
                type='text'
                name='evaluator'
                value={evaluatorName || ''}
                readOnly
              />
            </div>
            {/* 평가 항목 동적 렌더링 */}
            {Object.entries(evaluation.template).map(([key, value]) => {
              const found = DEFAULT_CRITERIA.find((c) => c.key === key);
              const label = found ? found.label : key;
              return (
                <div className='eval-field stars' key={key}>
                  <label>{label}</label>
                  <StarRatingView value={value} />
                </div>
              );
            })}
            <div className='eval-field'>
              <label>총평</label>
              <textarea name='comment' value={evaluation.comment} readOnly />
            </div>
            {evaluation.updateMemo && (
              <div className='eval-field'>
                <label>수정 사유</label>
                <textarea
                  name='updateMemo'
                  value={evaluation.updateMemo}
                  readOnly
                />
              </div>
            )}
            <div className='eval-field avg'>
              <span>평균 점수</span>
              <span className='avg-score'>{evaluation.totalEvaluation}</span>
            </div>
          </form>
        </div>
      </div>
      {/* 하단 버튼 */}
      <div className='eval-footer-btns'>
        <button className='btn dark' type='button' onClick={onClose}>
          닫기
        </button>
        {onEdit && (
          <button
            className='btn blue'
            type='button'
            onClick={() => onEdit(evaluation)}
          >
            수정
          </button>
        )}
      </div>
    </div>
  );
}
