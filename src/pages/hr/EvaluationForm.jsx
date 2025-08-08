import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './EvaluationForm.scss';
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, HR_SERVICE } from '../../configs/host-config';
import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { succeed, swalConfirm, swalError } from '../../common/common';

// 별점 컴포넌트
function StarRating({ value, onChange }) {
  return (
    <span className='star-row'>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{
            cursor: 'pointer',
            color: n <= value ? '#ffba08' : '#ccc',
            fontSize: '1.35em',
          }}
          onClick={() => onChange(n)}
          title={n + '점'}
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

export default function EvaluationForm({
  employee,
  evaluation,
  onClose,
  onSubmitSuccess,
}) {
  const { userId } = useContext(UserContext);
  // 폼 상태 관리
  const [form, setForm] = useState({
    name: '',
    dept: '',
    date: new Date(),
    template: {
      leadership: 1,
      creativity: 1,
      cooperation: 1,
      problem: 1,
    },
    comment: '',
  });
  const MAX_COMMENT_BYTES = 255;
  const [commentBytes, setCommentBytes] = useState(0);

  // 평가자 이름 상태 추가
  const [evaluatorName, setEvaluatorName] = useState('');
  const [updateMemo, setUpdateMemo] = useState('');

  // 평가 항목 동적 관리
  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCriterion, setNewCriterion] = useState('');

  const isEdit = !!evaluation;

  console.log(employee, '여기임');

  useEffect(() => {
    if (employee) {
      setForm((prev) => ({
        ...prev,
        name: `${employee.name} (${employee.role})`,
        dept: employee.department || '',
      }));
      setCriteria(DEFAULT_CRITERIA);
    }
    if (evaluation) {
      setForm({
        name: evaluation.evaluateeName || '',
        dept: evaluation.evaluateeDept || '',
        date: evaluation.interviewDate
          ? new Date(evaluation.interviewDate)
          : new Date(),
        template: {
          ...DEFAULT_CRITERIA.reduce(
            (acc, c) => ({ ...acc, [c.key]: evaluation.template[c.key] || 1 }),
            {},
          ),
          ...Object.keys(evaluation.template)
            .filter((k) => !DEFAULT_CRITERIA.find((c) => c.key === k))
            .reduce((acc, k) => ({ ...acc, [k]: evaluation.template[k] }), {}),
        },
        comment: evaluation.comment || '',
      });
      // 기존 항목 + 커스텀 항목
      setCriteria([
        ...DEFAULT_CRITERIA,
        ...Object.keys(evaluation.template)
          .filter((k) => !DEFAULT_CRITERIA.find((c) => c.key === k))
          .map((k) => ({ key: k, label: k })),
      ]);
      setUpdateMemo('');
      // 만약 이름/부서가 없으면 evaluateeId로 조회
      if (!evaluation.evaluateeName && evaluation.evaluateeId) {
        axiosInstance
          .get(
            `${API_BASE_URL}${HR_SERVICE}/employees/${evaluation.evaluateeId}/name`,
          )
          .then((res) =>
            setForm((prev) => ({ ...prev, name: res.data.result })),
          )
          .catch(() => {});
      }
      if (!evaluation.evaluateeDept && evaluation.evaluateeId) {
        axiosInstance
          .get(
            `${API_BASE_URL}${HR_SERVICE}/employees/${evaluation.evaluateeId}/name/department`,
          )
          .then((res) =>
            setForm((prev) => ({ ...prev, dept: res.data.result })),
          )
          .catch(() => {});
      }
    }
  }, [employee, evaluation]);

  // 평가자 이름 조회
  useEffect(() => {
    async function fetchEvaluatorName() {
      if (!userId) return;
      try {
        const res = await axiosInstance.get(
          `${API_BASE_URL}${HR_SERVICE}/employees/${userId}/name`,
        );
        setEvaluatorName(res.data.result);
      } catch (error) {
        setEvaluatorName('');
      }
    }
    fetchEvaluatorName();
  }, [userId]);

  // 별점
  const handleStar = (key, val) =>
    setForm((prev) => ({
      ...prev,
      template: {
        ...prev.template,
        [key]: val,
      },
    }));

  // 평균점수 계산 (동적)
  const avg = (
    criteria.reduce((sum, c) => sum + Number(form.template[c.key] || 0), 0) /
    (criteria.length || 1)
  ).toFixed(1);

  // 날짜 삭제
  const handleDateClear = () => setForm((prev) => ({ ...prev, date: null }));

  // 입력
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // UTF-8 바이트 계산
  const getUtf8ByteLength = (text) => {
    let total = 0;
    for (const ch of text) {
      const code = ch.codePointAt(0);
      if (code <= 0x7f) total += 1;
      else if (code <= 0x7ff) total += 2;
      else if (code <= 0xffff) total += 3;
      else total += 4;
    }
    return total;
  };

  // UTF-8 바이트 기준 잘라내기
  const truncateByUtf8Bytes = (text, maxBytes) => {
    let used = 0;
    let out = '';
    for (const ch of text) {
      const code = ch.codePointAt(0);
      const need =
        code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
      if (used + need > maxBytes) break;
      out += ch;
      used += need;
    }
    return out;
  };

  // 총평 전용 입력 처리 (바이트 제한)
  const handleCommentChange = (e) => {
    const next = e.target.value || '';
    const truncated = truncateByUtf8Bytes(next, MAX_COMMENT_BYTES);
    setForm((prev) => ({ ...prev, comment: truncated }));
  };

  // 총평 바이트 카운트 업데이트
  useEffect(() => {
    setCommentBytes(getUtf8ByteLength(form.comment || ''));
  }, [form.comment]);

  // 항목 삭제
  const handleRemoveCriterion = (key) => {
    setCriteria((prev) => prev.filter((c) => c.key !== key));
    setForm((prev) => {
      const newTemplate = { ...prev.template };
      delete newTemplate[key];
      return { ...prev, template: newTemplate };
    });
  };

  // 항목 추가
  const handleAddCriterion = () => {
    const key = (newCriterion || '').trim();
    if (!/^[가-힣]{1,7}$/.test(key)) {
      swalError('평가 항목 이름은 한글 1~7자만 가능합니다.');
      return;
    }
    if (criteria.find((c) => c.key === key)) return;
    setCriteria((prev) => [...prev, { key, label: key }]);
    setForm((prev) => ({
      ...prev,
      template: { ...prev.template, [key]: 1 },
    }));
    setShowAddModal(false);
    setNewCriterion('');
  };

  // 제출 등 이벤트 (실제 로직 연결 가능)
  const handleSubmit = async (e) => {
    e.preventDefault();
    // 항목 추가 모달이 열려있다면 평가 제출을 막음
    if (showAddModal) {
      return;
    }
    // 면담일시가 미래면 차단
    if (form.date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const chosen = new Date(form.date);
      chosen.setHours(0, 0, 0, 0);
      if (chosen > today) {
        swalError('면담일시는 미래 날짜를 선택할 수 없습니다.');
        return;
      }
    }
    try {
      if (isEdit) {
        await axiosInstance.patch(
          `${API_BASE_URL}${HR_SERVICE}/evaluation/${evaluation.evaluationId}`,
          {
            evaluateeId: evaluation.evaluateeId,
            evaluatorId: userId,
            template: JSON.stringify(
              criteria.reduce(
                (acc, c) => ({ ...acc, [c.key]: form.template[c.key] }),
                {},
              ),
            ),
            comment: form.comment,
            totalEvaluation: Number(avg),
            interviewDate: form.date,
            updateMemo,
          },
        );
        await succeed('평가 수정 완료'); // ← 확인 후 새로고침
      } else {
        await axiosInstance.post(
          `${API_BASE_URL}${HR_SERVICE}/evaluation/${employee.employeeId}`,
          {
            evaluateeId: employee.employeeId,
            evaluatorId: userId,
            template: JSON.stringify(
              criteria.reduce(
                (acc, c) => ({ ...acc, [c.key]: form.template[c.key] }),
                {},
              ),
            ),
            comment: form.comment,
            totalEvaluation: Number(avg),
            interviewDate: form.date,
          },
        );
        await succeed('평가등록 완료'); // ← 확인 후 새로고침
      }
      window.location.reload(); // 알림 OK 누른 후 새로고침!
    } catch (error) {
      swalError(
        '제출 실패: ' + (error.response?.data?.message || error.message),
      );
    }
  };

  const handleCancel = async () => {
    const result = await swalConfirm('취소하시겠습니까?');
    if (result.isConfirmed) {
      if (onClose) {
        onClose();
      } else {
        window.location.reload();
      }
    }
  };

  return (
    <div className='eval-root'>
      <div className='eval-header'>
        <button className='back-btn' type='button' onClick={handleCancel}>
          ◀
        </button>
        <div className='eval-title'>
          {isEdit ? '인사평가 수정' : '인사평가표'}
        </div>
      </div>

      <div className='eval-main'>
        {/* 평가 입력폼 */}
        <div className='eval-form-box'>
          <div className='eval-form-title'>인사평가표</div>
          <hr />
          <form onSubmit={handleSubmit} autoComplete='off'>
            <div className='eval-field'>
              <label>사원명</label>
              <input type='text' name='name' value={form.name} readOnly />
            </div>
            <div className='eval-field'>
              <label>소속부서</label>
              <input type='text' name='dept' value={form.dept} readOnly />
            </div>
            <div className='eval-field'>
              <label>면담일시</label>
              <div className='eval-date-group'>
                <DatePicker
                  dateFormat='yyyy.MM.dd'
                  selected={form.date}
                  onChange={(date) => setForm((prev) => ({ ...prev, date }))}
                  maxDate={new Date()}
                  placeholderText='날짜 선택'
                  className='datepicker-input'
                  isClearable
                />
                <button
                  type='button'
                  className='eval-date-clear'
                  title='날짜 삭제'
                  onClick={handleDateClear}
                  tabIndex={-1}
                >
                  ❌
                </button>
              </div>
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
            {criteria.map((c) => (
              <div
                className='eval-field stars'
                key={c.key}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <label style={{ flex: '0 0 100px' }}>{c.label}</label>
                <StarRating
                  value={form.template[c.key] || 1}
                  onChange={(v) => handleStar(c.key, v)}
                />
                <button
                  type='button'
                  style={{
                    marginLeft: 8,
                    color: 'red',
                    fontWeight: 'bold',
                    fontSize: 18,
                  }}
                  onClick={() => handleRemoveCriterion(c.key)}
                  title='항목 삭제'
                >
                  ×
                </button>
              </div>
            ))}
            {/* 항목 추가 버튼 */}
            <div style={{ textAlign: 'right', marginBottom: 8 }}>
              <button
                type='button'
                className='btn blue'
                onClick={() => setShowAddModal(true)}
              >
                + 항목 추가
              </button>
            </div>
            {/* 항목 추가 모달 */}
            {showAddModal && (
              <div className='modal-overlay'>
                <div className='modal-box'>
                  <h4>평가 항목 추가</h4>
                  <input
                    type='text'
                    value={newCriterion}
                    onChange={(e) => {
                      const raw = e.target.value || '';
                      const onlyKr = raw.replace(/[^가-힣]/g, '');
                      setNewCriterion(onlyKr.slice(0, 7));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddCriterion();
                      }
                    }}
                    placeholder='항목 이름 (한글 1~7자)'
                    autoFocus
                  />
                  <div className='modal-btns'>
                    <button
                      className='btn gray'
                      type='button'
                      onClick={() => setShowAddModal(false)}
                    >
                      취소
                    </button>
                    <button
                      className='btn blue'
                      type='button'
                      onClick={handleAddCriterion}
                    >
                      추가
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className='eval-field'>
              <label>총평</label>
              <textarea
                name='comment'
                value={form.comment}
                onChange={handleCommentChange}
              />
              <div className='byte-hint'>
                {commentBytes} / {MAX_COMMENT_BYTES} bytes
              </div>
            </div>
            <div className='eval-field avg'>
              <span>평균 점수</span>
              <span className='avg-score'>{avg} / 5</span>
            </div>
            {isEdit && (
              <div className='eval-field'>
                <label>수정 사유</label>
                <textarea
                  name='updateMemo'
                  value={updateMemo}
                  onChange={(e) => setUpdateMemo(e.target.value)}
                  placeholder='수정 사유를 입력하세요.'
                  required
                />
              </div>
            )}
            <div className='eval-footer-btns'>
              <button className='btn dark' type='button' onClick={handleCancel}>
                취소
              </button>
              <button className='btn blue' type='submit'>
                {isEdit ? '수정' : '등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
