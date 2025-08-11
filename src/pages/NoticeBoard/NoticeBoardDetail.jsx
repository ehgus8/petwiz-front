// NoticeBoardDetail.jsx
import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Swal from 'sweetalert2';
import { BsThreeDotsVertical } from 'react-icons/bs';

import { API_BASE_URL, NOTICE_SERVICE } from '../../configs/host-config';
import { UserContext } from '../../context/UserContext';
import './NoticeBoardDetail.scss';

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
  webp: '/icons/webp.jpg',
};

const isImageFile = (url) => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);

const truncateTitle = (name, maxLength = 30) => {
  const file = (name || '').split('/').pop() || '';
  const parts = file.split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';
  const base = parts.join('.');
  const trimmed =
    base.length > maxLength ? base.slice(0, maxLength) + '…' : base;
  return ext ? `${trimmed}.${ext}` : trimmed;
};

const NoticeBoardDetail = () => {
  const { noticeId } = useParams();
  const navigate = useNavigate();
  const { accessToken, userId, userName } = useContext(UserContext);

  const [posts, setPosts] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [isAuthor, setIsAuthor] = useState(false);
  const [loading, setLoading] = useState(true);

  // 댓글 상태
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editCommentId, setEditCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyTargetId, setReplyTargetId] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  // 메뉴 팝업
  const [menuOpenId, setMenuOpenId] = useState(null);
  const menuPopupRef = useRef(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuPopupRef.current && !menuPopupRef.current.contains(e.target)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 게시글 + 읽음 처리 + 댓글 로딩
  useEffect(() => {
    let mounted = true;

    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}${NOTICE_SERVICE}/${noticeId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (!res.ok) throw new Error('공지 상세 조회 실패');

        const data = await res.json();
        if (!mounted) return;

        setPosts(data);

        // 첨부 파싱
        let parsed = [];
        if (data.attachmentUri) {
          try {
            const raw = data.attachmentUri.trim();
            if (raw.startsWith('[')) {
              const arr = JSON.parse(raw);
              parsed = Array.isArray(arr) ? arr : [arr];
            } else {
              parsed = raw
                .split(',')
                .map((u) => u.trim())
                .filter(Boolean);
            }
          } catch (e) {
            console.error('첨부파일 파싱 실패', e);
          }
        }
        setAttachments(parsed);

        // 읽음 처리 (실패 무시)
        try {
          await fetch(`${API_BASE_URL}${NOTICE_SERVICE}/${noticeId}/read`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          });
        } catch (_) { }

        await fetchComments(); // 댓글 로드
      } catch (err) {
        console.error(err);
        Swal.fire('오류', '게시글을 불러오지 못했습니다.', 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPost();
    return () => {
      mounted = false;
    };
  }, [noticeId, accessToken]);

  // 작성자 여부
  useEffect(() => {
    if (posts && userId != null) {
      setIsAuthor(Number(posts.employeeId) === Number(userId));
    }
  }, [posts, userId]);

  // 댓글 API
  const fetchComments = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}${NOTICE_SERVICE}/${noticeId}/comments`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!res.ok) throw new Error('댓글 불러오기 실패');
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('댓글 불러오기 실패:', err);
      Swal.fire('오류', '댓글을 불러오지 못했습니다.', 'error');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      await Swal.fire('입력 오류', '댓글 내용을 입력해 주세요.', 'warning');
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
            writerId: String(userId),
            writerName: String(userName),
          }),
        },
      );
      if (!res.ok) throw new Error('댓글 작성 실패');
      setNewComment('');
      await fetchComments();
    } catch (err) {
      console.error(err);
      Swal.fire('오류', '댓글 작성 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    const result = await Swal.fire({
      title: '댓글을 삭제하시겠어요?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}${NOTICE_SERVICE}/${noticeId}/comments/${commentId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!res.ok) throw new Error('댓글 삭제 실패');
      await Swal.fire('삭제 완료', '댓글이 삭제되었습니다.', 'success');
      await fetchComments();
    } catch (err) {
      console.error(err);
      Swal.fire('오류', '댓글 삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) {
      await Swal.fire(
        '입력 오류',
        '수정할 댓글 내용을 입력해 주세요.',
        'warning',
      );
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}${NOTICE_SERVICE}/${noticeId}/comments/${commentId}`,
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
      await fetchComments();
    } catch (err) {
      console.error(err);
      Swal.fire('오류', '댓글 수정 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleAddReply = async (parentId) => {
    if (!replyContent.trim()) return;
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
            content: replyContent,
            writerName: String(userName),
            writerId: String(userId),
            parentId,
          }),
        },
      );
      if (!res.ok) throw new Error('대댓글 등록 실패');
      setReplyContent('');
      setReplyTargetId(null);
      await fetchComments();
    } catch (err) {
      console.error('대댓글 등록 실패', err);
      Swal.fire('오류', '대댓글 등록 중 오류가 발생했습니다.', 'error');
    }
  };

  // 파일 다운로드 (presigned GET)
  const getDownloadUrl = async (fileName) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}${NOTICE_SERVICE}/download-url?fileName=${encodeURIComponent(fileName)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) throw new Error('presigned GET URL 요청 실패');
      return await res.text();
    } catch (error) {
      console.error('GET presigned URL 요청 실패', error);
      return null;
    }
  };

  const handleDownloadClick = async (url) => {
    const raw = url.split('/').pop() || '';
    const fileName = decodeURIComponent(raw.split('?')[0]); // 쿼리 제거 + 디코드
    const presignedUrl = await getDownloadUrl(fileName);

    if (!presignedUrl) {
      Swal.fire('에러', '파일 다운로드에 실패했습니다.', 'error');
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
      console.error(error);
      Swal.fire('에러', '파일 다운로드에 실패했습니다.', 'error');
    }
  };

  // 게시글 수정/삭제/뒤로
  const handleEdit = () => navigate(`/notice/edit/${noticeId}`);
  const handleBack = () => navigate(-1);
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: '게시글을 삭제하시겠어요?',
      text: '삭제된 게시글은 복구할 수 없습니다.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}${NOTICE_SERVICE}/delete/${noticeId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!res.ok) throw new Error('게시글 삭제 실패');
      await Swal.fire('삭제 완료', '게시글이 삭제되었습니다.', 'success');
      navigate(-1);
    } catch (err) {
      console.error(err);
      Swal.fire('오류 발생', '삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  // 댓글 렌더링
  const renderComments = (list) =>
    list.map((top) => (
      <div key={top.noticeCommentId} className='comment-item'>
        <p className='writerAndOption'>
          <strong>{top.writerName}</strong>
          {top.writerName === userName && (
            <div className='comment-options'>
              <BsThreeDotsVertical
                onClick={() =>
                  setMenuOpenId(
                    menuOpenId === top.noticeCommentId
                      ? null
                      : top.noticeCommentId,
                  )
                }
                style={{ cursor: 'pointer' }}
              />
              {menuOpenId === top.noticeCommentId && (
                <div className='menu-popup' ref={menuPopupRef}>
                  <button
                    onClick={() => {
                      setEditCommentId(top.noticeCommentId);
                      setEditContent(top.content);
                      setMenuOpenId(null);
                    }}
                  >
                    수정
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteComment(top.noticeCommentId);
                      setMenuOpenId(null);
                    }}
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          )}
        </p>

        {editCommentId === top.noticeCommentId ? (
          <div className='edit-input'>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <div className='edit-button'>
              <button onClick={() => handleEditComment(top.noticeCommentId)}>
                수정
              </button>
              <button onClick={() => setEditCommentId(null)}>취소</button>
            </div>
          </div>
        ) : (
          <>
            <p className='commentContent'>{top.content}</p>
            <p className='commentDate'>
              {top.createdAt?.substring(0, 16).replace('T', ' ')}
            </p>
            <div className='comment-buttons'>
              <button
                className='reply-btn'
                onClick={() => {
                  setReplyTargetId(top.noticeCommentId);
                  setReplyContent('');
                }}
              >
                답글
              </button>
            </div>
          </>
        )}

        {/* 대댓글 입력창 */}
        {replyTargetId === top.noticeCommentId && (
          <div className='edit-input'>
            <textarea
              placeholder='답글을 입력하세요...'
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <div className='edit-button'>
              <button onClick={() => handleAddReply(top.noticeCommentId)}>
                등록
              </button>
              <button onClick={() => setReplyTargetId(null)}>취소</button>
            </div>
          </div>
        )}

        {/* 대댓글 */}
        <div className='replies'>
          {top.children?.map((reply) => (
            <div key={reply.noticeCommentId} className='reply-item'>
              <span className='writerAndOption'>
                <strong>{reply.writerName}</strong>
                {reply.writerName === userName && (
                  <div className='comment-options'>
                    <BsThreeDotsVertical
                      onClick={() =>
                        setMenuOpenId(
                          menuOpenId === reply.noticeCommentId
                            ? null
                            : reply.noticeCommentId,
                        )
                      }
                      style={{ cursor: 'pointer' }}
                    />
                    {menuOpenId === reply.noticeCommentId && (
                      <div className='menu-popup' ref={menuPopupRef}>
                        <button
                          onClick={() => {
                            setEditCommentId(reply.noticeCommentId);
                            setEditContent(reply.content);
                            setMenuOpenId(null);
                          }}
                        >
                          수정
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteComment(reply.noticeCommentId);
                            setMenuOpenId(null);
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </span>

              {editCommentId === reply.noticeCommentId ? (
                <div className='edit-input'>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                  <div className='edit-button'>
                    <button
                      onClick={() => handleEditComment(reply.noticeCommentId)}
                    >
                      수정
                    </button>
                    <button onClick={() => setEditCommentId(null)}>취소</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className='commentContent'>{reply.content}</p>
                  <p className='commentDate'>
                    {reply.createdAt?.substring(0, 16).replace('T', ' ')}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </div >
    ));

  if (loading)
    return (
      <div className='notice-detail'>
        <p>불러오는 중...</p>
      </div>
    );
  if (!posts)
    return (
      <div className='notice-detail'>
        <p>게시글을 찾을 수 없습니다.</p>
      </div>
    );

  return (
    <div className='notice-detail'>
      <h2>
        {posts.departmentId === 0 ? '[공지] ' : ''}
        {posts.title}
      </h2>
      <button
        className='print-button'
        onClick={() => window.print()}
        title='인쇄하기'
      >
        🖨️
      </button>

      <div className='meta-with-attachment'>
        <div className='meta'>
          <p>
            작성자 : {posts.name}
            {posts.employStatus === 'INACTIVE' ? '(퇴사)' : ''}
          </p>
          <p>부서 : {posts.departmentName}</p>
          <p>등록일 : {posts.createdAt?.substring(0, 10)}</p>
          <p>조회수 : {posts.viewCount}</p>
        </div>

        {attachments.length > 0 && (
          <div className='attachment-link'>
            {attachments.map((url, idx) => {
              const filename = (url.split('/').pop() || '').split('?')[0];
              const ext = filename.split('.').pop()?.toLowerCase();
              const icon = fileIconMap[ext] || '/icons/default.png';
              return (
                <div key={idx}>
                  <a
                    href='#!'
                    onClick={() => handleDownloadClick(url)}
                    rel='noopener noreferrer'
                  >
                    <img
                      src={icon}
                      alt={ext || 'file'}
                      style={{ width: 20, height: 20 }}
                    />
                    {truncateTitle(filename)}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <hr />

      <div
        className='content'
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(
            (posts.content || '')
              .replace(/(<p>\s*<\/p>)+/g, '')
              .replace(/(<br\s*\/?>\s*){2,}/g, '<br>'),
          ),
        }}
      />

      <hr />

      {/* 첨부 미리보기 (이미지 파일만) */}
      {attachments.length > 0 && (
        <div className='attachments'>
          {attachments.map((url, idx) => (
            <div key={idx} style={{ marginBottom: 10 }}>
              {isImageFile(url) ? (
                <img
                  src={url}
                  alt={`attachment-${idx}`}
                  style={{ maxWidth: '100%', borderRadius: 8 }}
                />
              ) : null}
            </div>
          ))}
        </div>
      )}

      {isAuthor && (
        <div className='buttons'>
          <button onClick={handleEdit}>수정</button>
          <button onClick={handleDelete}>삭제</button>
        </div>
      )}

      {/* 댓글 섹션 (발행된 글만 허용) */}
      {posts.published === true && (
        <div className='comment-section'>
          <h3>댓글</h3>
          <div className='comment-input'>
            <textarea
              placeholder='댓글을 입력하세요...'
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button onClick={handleAddComment}>등록</button>
          </div>

          <div className='comment-list'>
            {comments.length === 0 ? (
              <p className='noComment'>아직 댓글이 없습니다.</p>
            ) : (
              renderComments(comments)
            )}
          </div>
        </div>
      )}

      <div className='buttons'>
        <button onClick={handleBack}>뒤로가기</button>
      </div>
    </div>
  );
};

export default NoticeBoardDetail;
