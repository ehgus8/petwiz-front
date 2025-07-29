import React, { useEffect, useState } from 'react';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import axiosInstance from '../../configs/axios-config';
import { useNavigate } from 'react-router-dom';

export default function ApprovalRequestTabs() {
  // 결재요청/미승인결재 탭 상태
  const [approvalTab, setApprovalTab] = useState('결재요청');
  const navigate = useNavigate();

  // 결재요청 목록 상태
  const [reportList, setReportList] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  // 결재요청 목록 API 호출
  useEffect(() => {
    if (approvalTab !== '결재요청' && approvalTab !== '미승인결재') return;
    setReportLoading(true);
    axiosInstance
      .get(
        `${API_BASE_URL}${APPROVAL_SERVICE}/reports?role=writer&page=0&size=9999`,
      )
      .then((res) => {
        setReportList(res.data.result.reports || []);
      })
      .catch(() => setReportList([]))
      .finally(() => setReportLoading(false));
  }, [approvalTab]);

  // 상태별 필터링 및 한글 변환
  const SHOW_STATUSES =
    approvalTab === '결재요청' ? ['IN_PROGRESS', 'APPROVED'] : ['REJECTED'];
  const statusMap = {
    IN_PROGRESS: '진행중',
    APPROVED: '승인완료',
    REJECTED: '반려',
  };
  const filteredList = reportList.filter((r) =>
    SHOW_STATUSES.includes(r.reportStatus),
  );
  const displayList = [...filteredList]
    .sort((a, b) => new Date(b.reportCreatedAt) - new Date(a.reportCreatedAt))
    .slice(0, 4);

  return (
    <div className='hr-card hr-tab-card'>
      <div className='tabs'>
        <button 원비
          className={approvalTab === '결재요청' ? 'active' : ''}
          onClick={() => setApprovalTab('결재요청')}
        >
          결재요청
        </button>
        <button
          className={approvalTab === '미승인결재' ? 'active' : ''}
          onClick={() => setApprovalTab('미승인결재')}
        >
          미승인결재
        </button>
        <div className='menu-icon' style={{ cursor: 'pointer' }} onClick={() => navigate('/approval/home')}>≡</div>
      </div>
      {approvalTab === '결재요청' && (
        <table className='mini-table'>
          <thead>
            <tr>
              <th>기안 제목</th>
              <th>기안 요청일</th>
              <th>처리상태</th>
              <th>승인자</th>
            </tr>
          </thead>
          <tbody>
            {reportLoading ? (
              <tr>
                <td colSpan={4}>로딩중...</td>
              </tr>
            ) : displayList.length === 0 ? (
              <tr>
                <td colSpan={4}>결재요청 내역이 없습니다.</td>
              </tr>
            ) : (
              displayList.map((report, idx) => {
                let parsedTitle = '';
                try {
                  parsedTitle = JSON.parse(report.title).title;
                } catch {
                  parsedTitle = report.title;
                }
                return (
                  <tr key={report.id || idx}>
                    <td>
                      <span style={{ color: '#1976d2', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => navigate(`/approval/reports/${report.id}`)}>
                        {parsedTitle}
                      </span>
                    </td>
                    <td>
                      {report.reportCreatedAt
                        ? report.reportCreatedAt.slice(0, 10)
                        : ''}
                    </td>
                    <td
                      className={`status-${report.reportStatus && report.reportStatus.toLowerCase()}`}
                    >
                      {statusMap[report.reportStatus] || report.reportStatus}
                    </td>
                    <td>
                      {report.approvalLine && report.approvalLine.length > 0
                        ? report.approvalLine[report.approvalLine.length - 1]
                            .employeeName
                        : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
      {approvalTab === '미승인결재' && (
        <table className='mini-table'>
          <thead>
            <tr>
              <th>기안 제목</th>
              <th>기안 요청일</th>
              <th>처리상태</th>
              <th>승인자</th>
            </tr>
          </thead>
          <tbody>
            {reportLoading ? (
              <tr>
                <td colSpan={4}>로딩중...</td>
              </tr>
            ) : displayList.length === 0 ? (
              <tr>
                <td colSpan={4}>미승인결재 내역이 없습니다.</td>
              </tr>
            ) : (
              displayList.map((report, idx) => {
                let parsedTitle = '';
                try {
                  parsedTitle = JSON.parse(report.title).title;
                } catch {
                  parsedTitle = report.title;
                }
                return (
                  <tr key={report.id || idx}>
                    <td>{parsedTitle}</td>
                    <td>
                      {report.reportCreatedAt
                        ? report.reportCreatedAt.slice(0, 10)
                        : ''}
                    </td>
                    <td
                      className={`status-${report.reportStatus && report.reportStatus.toLowerCase()}`}
                    >
                      {statusMap[report.reportStatus] || report.reportStatus}
                    </td>
                    <td>
                      {report.approvalLine && report.approvalLine.length > 0
                        ? report.approvalLine[report.approvalLine.length - 1]
                            .employeeName
                        : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
