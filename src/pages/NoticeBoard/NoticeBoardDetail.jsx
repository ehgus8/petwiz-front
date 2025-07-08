import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    API_BASE_URL,
    NOTICE_SERVICE
} from '../../configs/host-config';
import { UserContext } from '../../context/UserContext';

const NoticeBoardDetail = () => {
    const { id } = useParams();
    const [posts, setPosts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthor, setIsAuthor] = useState(false); // ✅ 상태값으로 분리

    const { accessToken, userId, isInit } = useContext(UserContext);
    const navigate = useNavigate();

    const handleDelete = async () => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}${NOTICE_SERVICE}/noticeboard/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!res.ok) throw new Error('삭제 실패');

            alert('삭제 완료');
            navigate('/noticeboard');
        } catch (err) {
            console.error('삭제 실패:', err);
            alert('삭제 중 오류 발생');
        }
    };

    const handleEdit = () => {
        navigate(`/noticeboard/edit/${id}`);
    };

    const handleBack = () => {
        navigate(-1); // 뒤로가기
    };

    useEffect(() => {
        if (!isInit || !accessToken) return;

        const fetchPost = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}${NOTICE_SERVICE}/noticeboard/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                const data = await res.json();
                setPosts(data);

                console.log('data : ', data);
                console.log('data.employeeId : ', data.employeeId);
                console.log('posts : ', posts);
                console.log('userId : ', userId);

                // ✅ 작성자 여부 판단
                if (data.employeeId === userId) {
                    setIsAuthor(true);
                    console.log('작성자 맞음!')
                }

                // ✅ 읽음 처리
                await fetch(`${API_BASE_URL}${NOTICE_SERVICE}/noticeboard/${id}/read`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
            } catch (err) {
                console.error('상세글 조회 실패 또는 읽음 처리 실패:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [id, accessToken, isInit, userId]);

    // ✅ posts가 바뀐 이후 작성자인지 여부 판단
    useEffect(() => {
        if (posts && userId) {
            if (posts.employeeId === userId) {
                setIsAuthor(true);
                console.log('작성자 맞음!');
            }
        }
    }, [posts, userId]);

    if (loading) return <p>불러오는 중...</p>;
    if (!posts) return <p>게시글을 찾을 수 없습니다.</p>;

    return (
        <div className="notice-detail">
            <h2>{posts.isNotice ? '[공지] ' : ''}{posts.title}</h2>
            <div className="meta">
                <p>작성자 : {posts.name}</p>
                <p>부서 : {posts.departmentName}</p>
                <p>등록일 : {posts.createdAt?.substring(0, 10)}</p>
                <p>조회수 : {posts.viewCount}</p>
            </div>
            <hr />
            <div className="content">{posts.content}</div>

            {posts.fileUrl && (
                <div className="attachment">
                    <a href={posts.fileUrl} download>📎 첨부파일 다운로드</a>
                </div>
            )}

            {isAuthor && (
                <div className="buttons">
                    <button onClick={handleEdit}>수정</button>
                    <button onClick={handleDelete}>삭제</button>
                </div>
            )}

            <div className="buttons">
                <button onClick={handleBack}>뒤로가기</button>
            </div>
        </div>
    );
};

export default NoticeBoardDetail;
