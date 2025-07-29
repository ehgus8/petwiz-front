import React, { useEffect, useState, useContext } from 'react';
import { API_BASE_URL, NOTICE_SERVICE, APPROVAL_SERVICE } from '../../configs/host-config';
import { UserContext } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import './NoticeAlertPage.scss';
import ApprovalPendingCard from '../approval/ApprovalPendingCard.jsx';
import axiosInstance from '../../configs/axios-config';



const NoticeAlertPage = () => {
    const { userId, accessToken, isInit } = useContext(UserContext);
    const [alerts, setAlerts] = useState({ unreadNotices: [], otherAlerts: [] });

    const [pendingReports, setPendingReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!userId) return;

        const fetchAlerts = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}${NOTICE_SERVICE}/alerts`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`서버 응답 오류: ${res.status} ${errorText}`);
                }

                const data = await res.json();
                setAlerts(data);
            } catch (err) {
                console.error('알림 목록 불러오기 실패:', err);
            }
        };

        fetchAlerts();
    }, [userId, accessToken]);

    useEffect(() => {
        const fetchPending = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axiosInstance.get(
                    `${API_BASE_URL}${APPROVAL_SERVICE}/reports`,
                    {
                        params: {
                            role: 'approver', // '내가 결재할 차례인 문서'를 의미
                            status: 'IN_PROGRESS', // 반려/완료된 문서를 제외하기 위해 반드시 필요
                            page: 0,
                            size: 10,
                        },
                    },
                );
                if (res.data?.statusCode === 200) {
                    const allReports = res.data.result.reports || [];
                    // 이중 필터링: API가 IN_PROGRESS 외 다른 상태를 보내주는 경우를 대비
                    const filteredReports = allReports.filter(
                        (report) => report.reportStatus === 'IN_PROGRESS',
                    );
                    console.log('filteredReports : ', filteredReports);
                    setPendingReports(filteredReports);
                } else {
                    setError(
                        res.data?.statusMessage ||
                        '결재 예정 문서를 불러오는 데 실패했습니다.',
                    );
                }
            } catch (err) {
                console.error(err);
                setError('네트워크 오류 또는 서버 오류');
            } finally {
                setLoading(false);
            }
        };
        fetchPending();
    }, []);


    const handleClick = (noticeId) => {
        navigate(`/notice/${noticeId}`);
    };

    const handleBack = () => {
        navigate(-1); // 뒤로가기
    };


    return (
        <div className="alert-page">
            <h2>🔔 알림센터</h2>

            <section>
                <h3>📢 읽지 않은 공지글</h3>

                {alerts.unreadNotices.map(notice =>
                    notice.departmentId === 0 ? (
                        <ul>
                            <li key={notice.noticeId} onClick={() => navigate(`/notice/${notice.noticeId}`)}>
                                <div className="title" style={{ color: '#28c309', fontWeight: 'bold' }}>{notice.title}</div>
                                <div className="writer">{notice.name}</div>
                                <div className="date">{notice.createdAt?.substring(0, 10)}</div>
                            </li>
                        </ul>
                    ) : (
                        <ul>
                            <li key={notice.noticeId} onClick={() => navigate(`/notice/${notice.noticeId}`)}>
                                <div className="title" style={{ color: '#21429e', fontWeight: 'bold' }}>{notice.title}</div>
                                <div className="writer">{notice.name}</div>
                                <div className="date">{notice.createdAt?.substring(0, 10)}</div>
                            </li>
                        </ul>
                    )
                )}

            </section>

            <section>
                <h3>📌 결재 알림</h3>

                {!loading && !error && pendingReports.length > 0 ? (
                    pendingReports.map((report) => (
                        <ul>
                            <li key={report.id} onClick={() => navigate(`/approval/reports/${report.id}`)}>
                                <div className="title" style={{ color: '#f46d14', fontWeight: 'bold' }}>{report.title}</div>
                                <div className="writer">{report.name}</div>
                                <div className="date">{report.createdAt?.substring(0, 10)}</div>
                            </li>
                        </ul>
                        // <ApprovalPendingCard key={report.id} report={report} />
                    ))
                ) : (
                    !loading && !error && <p>결재 예정 문서가 없습니다.</p>
                )}
            </section>

            <section>
                <h3>📌 기타 알림</h3>
                <p>아직 알림이 없습니다.</p>
            </section>

            <div className="buttons">
                <button onClick={handleBack}>뒤로가기</button>
            </div>
        </div>
    );
};

export default NoticeAlertPage;
