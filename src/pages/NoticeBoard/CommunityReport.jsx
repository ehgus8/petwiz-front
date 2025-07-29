import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import { API_BASE_URL } from '../../configs/host-config';
import { UserContext } from '../../context/UserContext';
import './CommunityReport.scss';

const reportReasons = [
    '스팸홍보/도배입니다.',
    '음란물입니다.',
    '불법정보를 포함하고 있습니다.',
    '욕설/생명경시/혐오/차별적 표현입니다.',
    '개인정보가 노출되었습니다.',
    '불쾌한 표현이 있습니다.',
    '명예훼손 또는 저작권이 침해되었습니다.',
    '불법촬영물 등이 포함되어 있습니다.',
];

const CommunityReport = () => {
    const { communityId } = useParams();
    const navigate = useNavigate();
    const { accessToken, userId } = useContext(UserContext);

    const [selectedReason, setSelectedReason] = useState('');
    const [details, setDetails] = useState('');
    const [author, setAuthor] = useState('');
    const [authorId, setAuthorId] = useState('');
    const [content, setContent] = useState('');

    // 게시글 정보 가져오기
    useEffect(() => {
        const fetchCommunityData = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/community/${communityId}`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!res.ok) throw new Error('게시글 조회 실패');
                const data = await res.json();

                setAuthor(data.name || '알 수 없음');
                setAuthorId(data.employeeId || '알 수 없음');
                setContent(data.title || '');
            } catch (err) {
                console.error(err);
                Swal.fire({
                    icon: 'error',
                    title: '게시글 정보를 불러오는 데 실패했습니다.',
                });
            }
        };

        fetchCommunityData();
    }, [communityId, accessToken]);

    // 신고 제출
    const handleSubmit = async () => {
        if (!selectedReason) {
            Swal.fire({ icon: 'warning', title: '신고 사유를 선택해 주세요.' });
            return;
        }

        const reportData = {
            reporterId: userId,
            communityId: Number(communityId),
            reason: selectedReason + (details ? ` - ${details}` : ''),
        };
        console.log('reportData : ', reportData);
        console.log('url : ', `${API_BASE_URL}/report/${communityId}`);
        try {
            const res = await axios.post(`${API_BASE_URL}/report/${communityId}`, reportData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                validateStatus: (status) => true // axios가 오류로 간주하지 않도록 모든 상태 허용
            });

            if (res.status === 409) {
                // ✅ 중복 신고 처리
                await Swal.fire({
                    icon: 'warning',
                    title: '이미 신고한 게시글입니다.',
                    text: '이 게시글은 이미 신고하셨습니다.',
                    confirmButtonText: '확인'
                });
                navigate('/community'); // 신고페이지 종료
                return;
            }

            if (res.status !== 200) throw new Error('신고 요청 실패');

            Swal.fire({ icon: 'success', title: '신고가 접수되었습니다.' }).then(() => {
                navigate('/community');
            });
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: 'error', title: '신고 처리 중 오류가 발생했습니다.' });
        }
    };

    return (
        <div className="community-report-wrapper">
            <div className="report-box">
                <h2>신고하기</h2>

                <div className="report-meta">
                    <p><strong>작성자</strong> | {author}</p>
                    <p><strong>내용</strong>  | {content}</p>
                </div>

                <div className="reason-section">
                    <h4>사유선택</h4>
                    <ul>
                        {reportReasons.map((reason, idx) => (
                            <li key={idx}>
                                <label>
                                    <input
                                        type="radio"
                                        name="reportReason"
                                        value={reason}
                                        checked={selectedReason === reason}
                                        onChange={() => setSelectedReason(reason)}
                                    />
                                    {reason}
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>

                <textarea
                    placeholder="추가 입력이 필요한 경우 여기에 작성해 주세요."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                />

                <button className="submit-button" onClick={handleSubmit}>신고하기</button>
                <button className="cancel-button" onClick={() => navigate(-1)}>취소</button>
            </div>
        </div>
    );
};

export default CommunityReport;
