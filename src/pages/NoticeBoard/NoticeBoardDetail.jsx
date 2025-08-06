import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { API_BASE_URL, NOTICE_SERVICE } from '../../configs/host-config';
import Swal from 'sweetalert2';
import axios from 'axios';
import { UserContext } from '../../context/UserContext';
import './NoticeBoardDetail.scss';
import { BsThreeDotsVertical } from "react-icons/bs";


const fileIconMap = {
    txt: '/icons/txt.png',
    doc: '/icons/doc.png',
    docx: '/icons/docx.png',
    pdf: '/icons/pdf.png',
    php: '/icons/php.png',
    xls: '/icons/xls.png',
    xlsx: '/icons/xlsx.png',
    csv: '/icons/csv.png',
    css: '/icons/css.png',
    jpg: '/icons/jpg.png',
    jpeg: '/icons/jpg.png',
    js: '/icons/js.png',
    png: '/icons/png.png',
    gif: '/icons/gif.png',
    htm: '/icons/htm.png',
    html: '/icons/html.png',
    zip: '/icons/zip.png',
    mp3: '/icons/mp3.png',
    mp4: '/icons/mp4.png',
    ppt: '/icons/ppt.png',
    exe: '/icons/exe.png',
    svg: '/icons/svg.png',
};

const NoticeBoardDetail = () => {
    const { noticeId } = useParams();
    const [posts, setPosts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthor, setIsAuthor] = useState(false); // ✅ 상태값으로 분리
    const [attachments, setAttachments] = useState([]);
    const [menuOpenId, setMenuOpenId] = useState(null);

    const menuPopupRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuPopupRef.current && !menuPopupRef.current.contains(event.target)) {
                setMenuOpenId(null); // 외부 클릭 시 팝업 닫기
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuPopupRef]);



    const truncateTitle = (title, maxLength = 30) => {
        title[0].split('.').pop().toLowerCase()
        return title.length > maxLength ? `${title.slice(0, maxLength)}···.${title.split('.').pop().toLowerCase()}` : title;
    };

    // ✅ 댓글 관련 상태
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [editCommentId, setEditCommentId] = useState(null);
    const [editContent, setEditContent] = useState('');

    const [replyTargetId, setReplyTargetId] = useState(null);
    const [replyContent, setReplyContent] = useState('');


    const { accessToken, userId, isInit, userName } = useContext(UserContext);
    const navigate = useNavigate();

    const handleDelete = () => {
        Swal.fire({
            title: '게시글을 삭제하시겠어요?',
            text: '삭제된 게시글은 복구할 수 없습니다.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            reverseButtons: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(
                        `${API_BASE_URL}${NOTICE_SERVICE}/delete/${noticeId}`,
                        {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                            },
                        },
                    );
                    Swal.fire('삭제 완료!', '게시글이 삭제되었습니다.', 'success');
                    navigate(-1);
                } catch (err) {
                    console.error(err);
                    Swal.fire('오류 발생', '삭제 중 오류가 발생했습니다.', 'error');
                }
            }
        });
    };

    const handleEdit = () => {
        navigate(`/notice/edit/${noticeId}`);
    };

    const handleBack = () => {
        navigate(-1); // 뒤로가기
    };

    const isImageFile = (url) => {
        return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
    };

    // 🔥 presigned GET URL 요청
    const getDownloadUrl = async (fileName) => {
        try {
            const res = await fetch(
                `${API_BASE_URL}${NOTICE_SERVICE}/download-url?fileName=${encodeURIComponent(fileName)}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            );

            if (!res.ok) throw new Error('presigned GET URL 요청 실패');
            return await res.text(); // presigned URL (string)
        } catch (error) {
            console.error('GET presigned URL 요청 실패', error);
            return null;
        }
    };

    // 🔥 다운로드 핸들러
    const handleDownloadClick = async (url) => {
        const fileName = url.split('/').pop();
        const presignedUrl = await getDownloadUrl(fileName);
        console.log('다운로드 fileName : ', fileName);
        if (!presignedUrl) {
            Swal.fire({
                title: '에러',
                text: '파일 다운로드에 실패했습니다.',
                icon: 'error',
                confirmButtonText: '확인',
            });
            return;
        }

        try {
            const res = await fetch(presignedUrl);
            const blob = await res.blob();

            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            await Swal.fire({
                title: '에러',
                text: '파일 다운로드에 실패했습니다.',
                icon: 'error',
                confirmButtonText: '확인',
            });
            console.error(error);
        }
    };

    const fetchComments = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}${NOTICE_SERVICE}/${noticeId}/comments`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            setComments(data);
            console.log('댓글 data:', data)
        } catch (err) {
            console.error('댓글 불러오기 실패:', err);
            await Swal.fire({
                title: '오류',
                text: '댓글 불러오기 중 오류가 발생했습니다.',
                icon: 'error',
                confirmButtonText: '확인',
            });
        }
    };

    // 댓글 작성
    const handleAddComment = async () => {
        if (!newComment.trim()) {
            await Swal.fire({
                icon: 'warning',
                title: '입력 오류',
                text: '댓글 내용을 입력해 주세요.',
                confirmButtonText: '확인',
                confirmButtonColor: '#3085d6',
            });
            return;
        }

        try {
            const res = await fetch(
                `${API_BASE_URL}${NOTICE_SERVICE}/${noticeId}/comments`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        content: newComment,
                        writerId: `${userId}`,
                        writerName: `${userName}`,
                    }),
                },
            );

            if (!res.ok) throw new Error('댓글 작성 실패');

            setNewComment('');
            fetchComments(); // 목록 갱신
        } catch (err) {
            console.error(err);
            await Swal.fire({
                title: '오류',
                text: '댓글 작성 중 오류가 발생했습니다.',
                icon: 'error',
                confirmButtonText: '확인',
            });
        }
    };

    // 댓글 삭제
    const handleDeleteComment = async (NoticeCommentId) => {
        Swal.fire({
            title: '댓글을 삭제하시겠어요?',
            // text: '삭제된 게시글은 복구할 수 없습니다.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            reverseButtons: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await fetch(`${API_BASE_URL}${NOTICE_SERVICE}/${noticeId}/comments/${NoticeCommentId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                        },
                    });
                    Swal.fire('삭제 완료!', '댓글이 삭제되었습니다.', 'success').then(() => {
                        window.location.reload(); // 또는 window.location.href = `/noticeboard/${id}`;
                    });
                } catch (err) {
                    console.error(err);
                    Swal.fire('오류 발생', '삭제 중 오류가 발생했습니다.', 'error');
                }
            }
        });
    };

    // 댓글 수정
    const handleEditComment = async (NoticeCommentId) => {
        if (!editContent.trim()) {
            await Swal.fire({
                icon: 'warning',
                title: '입력 오류',
                text: '수정할 댓글 내용을 입력해 주세요.',
                confirmButtonText: '확인',
                confirmButtonColor: '#3085d6',
            });
            return;
        }
        try {
            const res = await fetch(
                `${API_BASE_URL}${NOTICE_SERVICE}/${noticeId}/comments/${NoticeCommentId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({ content: editContent }),
                },
            );

            if (!res.ok) throw new Error('댓글 수정 실패');
            setEditCommentId(null);
            setEditContent('');
            fetchComments();
        } catch (err) {
            console.error(err);
            await Swal.fire({
                title: '오류',
                text: '댓글 수정 중 오류가 발생했습니다.',
                icon: 'error',
                confirmButtonText: '확인',
            });
        }
    };

    useEffect(() => {
        // if (!isInit || !accessToken) return;

        const fetchPost = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `${API_BASE_URL}${NOTICE_SERVICE}/${noticeId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    },
                );

                const data = await res.json();
                setPosts(data); // ✅ posts를 여기서만 세팅

                console.log('data : ', data);
                console.log('data.employeeId : ', data.employeeId);
                console.log('userId : ', userId);

                // ✅ 첨부파일 파싱
                let attachments = [];
                if (data.attachmentUri) {
                    try {
                        if (data.attachmentUri.trim().startsWith('[')) {
                            // JSON 배열인 경우
                            const parsed = JSON.parse(data.attachmentUri);
                            attachments = Array.isArray(parsed) ? parsed : [parsed];
                        } else {
                            // 쉼표 구분 문자열인 경우
                            attachments = data.attachmentUri
                                .split(',')
                                .map((url) => url.trim());
                        }
                    } catch (e) {
                        console.error('첨부파일 파싱 실패', e);
                        attachments = [];
                    }
                }
                setAttachments(attachments);

                // ✅ 읽음 처리
                await fetch(`${API_BASE_URL}${NOTICE_SERVICE}/${noticeId}/read`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                fetchComments(); // ✅ 댓글 불러오기
            } catch (err) {
                console.error('상세글 조회 실패 또는 읽음 처리 실패:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [noticeId, accessToken, isInit, userId]);

    // ✅ 수정된 부분: posts가 세팅된 이후에만 작성자 여부 판단
    useEffect(() => {
        if (posts && userId) {
            if (posts.employeeId === Number(userId)) {
                setIsAuthor(true);
                console.log('작성자 맞음!');
            } else {
                console.log('작성자 아님!');
            }
        }
    }, [posts, userId]); // ✅ 여기서만 판단하도록 분리

    console.log('posts : ', posts);

    const handleAddReply = async (parentId) => {
        if (!replyContent.trim()) return;

        console.log("replyContent : ", replyContent);
        console.log("userName : ", userName);
        console.log("userId : ", userId);
        console.log("parentId : ", parentId);

        try {
            await axios.post(`${API_BASE_URL}/notice/${posts.noticeId}/comments`, {
                content: replyContent,
                writerName: userName,
                writerId: userId,
                parentId: parentId
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            });

            setReplyContent('');
            setReplyTargetId(null);
            fetchComments(); // 댓글 새로고침
        } catch (err) {
            console.error('대댓글 등록 실패', err);
        }
    };

    const renderComments = (comments) => {
        return comments.map((topComment) => (
            <div key={topComment.noticeCommentId} className="comment-item">
                <p className="writerAndOption">
                    <strong>{topComment.writerName}</strong>
                    {(String(userId) === String(posts.employeeId) || topComment.writerName === userName) && (
                        <div className="comment-options">
                            <BsThreeDotsVertical
                                onClick={() =>
                                    setMenuOpenId(
                                        menuOpenId === topComment.noticeCommentId ? null : topComment.noticeCommentId
                                    )}
                                style={{ cursor: "pointer" }}
                            />
                            {menuOpenId === topComment.noticeCommentId && (
                                <div className="menu-popup" ref={menuPopupRef}>
                                    <button onClick={() => {
                                        setEditCommentId(topComment.noticeCommentId);
                                        setEditContent(topComment.content);
                                        setMenuOpenId(null);
                                    }}>수정</button>
                                    <button onClick={() => {
                                        handleDeleteComment(topComment.noticeCommentId);
                                        setMenuOpenId(null);
                                    }}>삭제</button>
                                </div>
                            )}
                        </div>
                    )}
                </p>

                {editCommentId === topComment.noticeCommentId ? (
                    <div className="edit-input">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                        />
                        <button onClick={() => handleEditComment(topComment.noticeCommentId)}>저장</button>
                        <button onClick={() => setEditCommentId(null)}>취소</button>
                    </div>
                ) : (
                    <>
                        <p className="commentContent">{topComment.content}</p>
                        <p className="commentDate">{topComment.createdAt?.substring(0, 16).replace('T', ' ')}</p>
                        <div className="comment-buttons">
                            <button className="reply-btn" onClick={() => {
                                setReplyTargetId(topComment.noticeCommentId);
                                setReplyContent('');
                            }}>답글</button>
                        </div>
                    </>
                )}

                {/* 대댓글 입력창 */}
                {replyTargetId === topComment.noticeCommentId && (
                    <div className="reply-input">
                        <textarea
                            placeholder="답글을 입력하세요..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                        />
                        <button onClick={() => handleAddReply(topComment.noticeCommentId)}>등록</button>
                        <button onClick={() => setReplyTargetId(null)}>취소</button>
                    </div>
                )}

                {/* 대댓글 렌더링 */}
                <div className="replies">
                    {topComment.children?.map((reply) => (
                        <div key={reply.noticeCommentId} className="reply-item">
                            <span className="writerAndOption">
                                <strong>{reply.writerName}</strong>
                                {(String(userId) === String(posts.employeeId) || reply.writerName === userName) && (
                                    <div className="comment-options">
                                        <BsThreeDotsVertical
                                            onClick={() =>
                                                setMenuOpenId(
                                                    menuOpenId === reply.noticeCommentId ? null : reply.noticeCommentId
                                                )}
                                            style={{ cursor: "pointer" }}
                                        />
                                        {menuOpenId === reply.noticeCommentId && (
                                            <div className="menu-popup" ref={menuPopupRef}>
                                                <button onClick={() => {
                                                    setEditCommentId(reply.noticeCommentId);
                                                    setEditContent(reply.content);
                                                    setMenuOpenId(null);
                                                }}>수정</button>
                                                <button onClick={() => {
                                                    handleDeleteComment(reply.noticeCommentId);
                                                    setMenuOpenId(null);
                                                }}>삭제</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </span>

                            {editCommentId === reply.noticeCommentId ? (
                                <div className="edit-input">
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                    />
                                    <button onClick={() => handleEditComment(reply.noticeCommentId)}>저장</button>
                                    <button onClick={() => setEditCommentId(null)}>취소</button>
                                </div>
                            ) : (
                                <>
                                    <p className="commentContent">{reply.content}</p>
                                    <p className="commentDate">{reply.createdAt?.substring(0, 16).replace('T', ' ')}</p>
                                    <div className="comment-buttons">
                                        <button className="reply-btn" onClick={() => {
                                            setReplyTargetId(topComment.noticeCommentId);
                                            setReplyContent('');
                                        }}>답글</button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        ));
    };

    return (
        <div className="notice-detail">
            {loading ? (
                <p>불러오는 중...</p>
            ) : (
                <>
                    <h2>{posts.departmentId === 0 ? '[공지] ' : ''}{posts.title}</h2>
                    <button className="print-button" onClick={() => window.print()} title="인쇄하기">🖨️</button>
                    <div className="meta-with-attachment">
                        <div className="meta">
                            <p>작성자 : {posts.name}{posts.employStatus === 'INACTIVE' ? '(퇴사)' : ''}</p>
                            <p>부서 : {posts.departmentName}</p>
                            <p>등록일 : {posts.createdAt?.substring(0, 10)}</p>
                            <p>조회수 : {posts.viewCount}</p>
                        </div>
                        {attachments.length > 0 && (
                            <div className="attachment-link">
                                {attachments.map((url, idx) => (
                                    <div key={idx} >
                                        <a
                                            href="#!"
                                            onClick={() => handleDownloadClick(url)}
                                            rel="noopener noreferrer"
                                        >
                                            <img src={fileIconMap[attachments[0].split('.').pop().toLowerCase()] || '/icons/default.png'} alt={attachments[0].split('.').pop().toLowerCase()}
                                                style={{ width: '20px', height: '20px' }} />
                                            {truncateTitle(url.split('/').pop())}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <hr />
                    <div
                        className="content"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(posts.content) }}
                    />
                    <hr />

                    {/* ✅ 첨부파일 미리보기 */}
                    {attachments.length > 0 && (
                        <div className="attachments">
                            {attachments.map((url, idx) => (
                                <div key={idx} style={{ marginBottom: '10px' }}>
                                    {isImageFile(url) ? (
                                        <img
                                            src={url}
                                            alt={`attachment-${idx}`}
                                            style={{ maxWidth: '100%', borderRadius: '8px' }}
                                        />
                                    ) : (<img />)}
                                </div>
                            ))}
                        </div>
                    )}
                    {isAuthor && (
                        <div className="buttons">
                            <button onClick={handleEdit}>수정</button>
                            <button onClick={handleDelete}>삭제</button>
                        </div>
                    )}

                    {/* ✅ 댓글 영역 시작 */}
                    {posts.published === true && (
                        <div className="comment-section">
                            <h3>댓글</h3>
                            <div className="comment-input">
                                <textarea
                                    placeholder="댓글을 입력하세요..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <button onClick={handleAddComment}>등록</button>
                            </div>

                            <div className="comment-list">
                                {comments.length === 0 && <p className='noComment'>아직 댓글이 없습니다.</p>}
                                {renderComments(comments)}
                            </div>
                        </div>)}

                    <div className="buttons">
                        <button onClick={handleBack}>뒤로가기</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default NoticeBoardDetail;
