import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    API_BASE_URL,
    NOTICE_SERVICE
} from '../../configs/host-config';
import { UserContext, UserContextProvider } from '../../context/UserContext'; // 로그인 유저 정보
import './NoticeBoardList.scss';
import Swal from 'sweetalert2';

const NoticeBoardList = () => {
    const navigate = useNavigate();
    const { isInit, userId, accessToken, departmentId, userPosition, userRole } = useContext(UserContext);

    const [viewMode, setViewMode] = useState('ALL'); // ALL | MY | DEPT
    const [posts, setPosts] = useState([]);
    const [notices, setNotices] = useState([]);
    const [generalNotices, setGeneralNotices] = useState([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        keyword: '',
        sortBy: 'createdAt',
        sortDir: 'desc',
    });
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10); // ✅ 보기 개수
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null); // 삭제 중인 공지 ID


    const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const dateTimeOptions = {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
    };

    const handleDeleteScheduled = async (noticeId) => {
        const result = await Swal.fire({
            title: '정말 삭제할까요?',
            text: '예약된 공지를 삭제하면 복구할 수 없습니다.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: '삭제',
            cancelButtonText: '취소'
        });

        if (!result.isConfirmed) return;

        try {
            setDeletingId(noticeId); // 삭제 중 상태
            const res = await fetch(`${API_BASE_URL}${NOTICE_SERVICE}/schedule/${noticeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!res.ok) {
                throw new Error('삭제 실패');
            }

            Swal.fire('삭제 완료', '해당 예약 공지가 삭제되었습니다.', 'success');
            setNotices(prev => prev.filter(n => n.noticeId !== noticeId));
        } catch (err) {
            console.error('삭제 실패:', err);
            Swal.fire('삭제 실패', '문제가 발생했습니다. 다시 시도해 주세요.', 'error');
        } finally {
            setDeletingId(null); // 로딩 상태 해제
        }
    };


    useEffect(() => {
        if (!isInit || !accessToken || !userId) return; // ✅ 초기화 완료 여부 확인

        const fetchPosts = async () => {
            setLoading(true);
            try {
                const { keyword, startDate, endDate, sortBy, sortDir } = filters;
                const params = new URLSearchParams({
                    keyword: filters.keyword.trim(),
                    fromDate: startDate,
                    toDate: endDate,
                    sortBy,
                    sortDir,
                    page,
                    pageSize,
                });

                let url;

                console.log('viewMode : ', viewMode);
                console.log('departmentId : ', departmentId);
                if (viewMode === 'MY') {
                    url = `${API_BASE_URL}${NOTICE_SERVICE}/my`;
                } else if (viewMode === 'SCHEDULE') {
                    url = `${API_BASE_URL}${NOTICE_SERVICE}/schedule`;
                }
                else {
                    url = `${API_BASE_URL}${NOTICE_SERVICE}?${params.toString()}`;
                }

                const res = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    }
                });

                if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
                const data = await res.json();

                console.log('data : ', data);
                console.log('data.generalNotices : ', data.generalNotices);
                console.log('data.notices : ', data.notices);
                console.log('data.posts : ', data.posts);

                if (viewMode === 'MY') {
                    setGeneralNotices([])
                    setNotices(data.mynotices || []);
                    // setNotices(Array.isArray(data) ? data : data.data || []);
                    setTotalPages(1); // 페이징 미적용이므로 1로 고정
                } else if (viewMode === 'SCHEDULE') {
                    setGeneralNotices([])
                    setNotices(data.myschedule || []);
                    setTotalPages(1);
                } else {
                    setGeneralNotices(data.generalNotices || []);
                    setNotices(data.notices || []);
                    setTotalPages(data.totalPages || 1);
                }
            } catch (err) {
                console.error('게시글 불러오기 실패:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [filters, page, pageSize, departmentId, isInit, viewMode, accessToken, userId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = () => setPage(0);

    const handlePageSizeChange = (e) => {
        console.log('Number(e.target.value) : ', Number(e.target.value));
        setPageSize(Number(e.target.value));
        setPage(0); // 첫 페이지로 초기화
    };

    return (
        <div className="notice-board">
            <div className="header">
                <h2>공지사항</h2>
                <div className="filters">
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleInputChange} />
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleInputChange} />
                    <input type="text"
                        name="keyword"
                        value={filters.keyword}
                        placeholder="제목 검색"
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearch();
                        }}
                    />

                    <div className="sort-options" style={{ display: 'flex', alignItems: 'center' }}>
                        <select
                            name="sortBy"
                            value={filters.sortBy}
                            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                        >
                            <option value="createdAt">등록일</option>
                            <option value="title">제목</option>
                            <option value="viewCount">조회수</option>
                        </select>

                        <button
                            onClick={() =>
                                setFilters(prev => ({
                                    ...prev,
                                    sortDir: prev.sortDir === 'asc' ? 'desc' : 'asc'
                                }))
                            }
                            style={{
                                marginLeft: '8px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.2em',
                            }}
                            title={filters.sortDir === 'asc' ? '오름차순' : '내림차순'}
                        >
                            {filters.sortDir === 'asc' ? '⬆️' : '⬇️'}
                        </button>
                    </div>


                    <button onClick={handleSearch}>검색</button>
                    <button
                        className="reset-button"
                        onClick={() => {
                            setFilters({
                                startDate: '',
                                endDate: '',
                                keyword: '',
                                sortBy: 'createdAt',
                                sortDir: 'desc'
                            });
                            setPage(0);
                            setPageSize(10);
                        }}
                    >
                        초기화
                    </button>

                    <div className="view-mode-buttons">
                        <button className={viewMode === 'ALL' ? 'active' : ''} onClick={() => { setViewMode('ALL'); setPage(0); navigate('/notice') }}>
                            전체
                        </button>
                        <button className={viewMode === 'MY' ? 'active' : ''} onClick={() => { setViewMode('MY'); setPage(0); navigate('/notice/my') }}>
                            내가 쓴 글
                        </button>
                        <button className={viewMode === 'SCHEDULE' ? 'active' : ''} onClick={() => { setViewMode('SCHEDULE'); setPage(0); navigate(`/notice/schedule`) }}>
                            예약목록
                        </button>
                    </div>

                    <div className="write-button-wrapper">
                        <button className="write-button" onClick={() => navigate('/notice/write')}>
                            작성하기
                        </button>
                    </div>

                </div>
            </div>

            {loading ? (
                <p>불러오는 중...</p>
            ) : (
                <>
                    <table className="notice-table">
                        <thead>
                            <tr>
                                <th>구분</th>
                                <th></th>
                                <th>제목</th>
                                <th>작성자</th>
                                <th>{viewMode === 'SCHEDULE' ? '예약일' : '작성일'}</th>
                                <th>조회수</th>
                                {viewMode === 'SCHEDULE' && <th>삭제</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {generalNotices.map(post => (
                                <tr
                                    key={`generalnotice-${post.noticeId}`} className="generalnotice-row" onClick={() => navigate(`/notice/${post.noticeId}`)}>
                                    <td style={{
                                        color: post.position === userPosition ? '#28c309' : '#000',
                                        fontWeight: post.position === userPosition ? 'bold' : 'normal'
                                    }}>{post.noticeId}</td>
                                    <td>{post.attachmentUri && post.attachmentUri.length > 0 && post.attachmentUri != '[]' ? '📎' : ''}</td>
                                    <td style={{
                                        color: post.position === userPosition ? '#28c309' : '#000',
                                        fontWeight: post.position === userPosition ? 'bold' : 'normal'
                                    }}>{post.title}</td>
                                    <td style={{
                                        color: post.position === userPosition ? '#28c309' : '#000',
                                        fontWeight: post.position === userPosition ? 'bold' : 'normal'
                                    }}>
                                        {post.employStatus === 'INACTIVE' ?
                                            (<span style={{ color: '#aaa', fontStyle: 'italic', marginLeft: '4px' }}>
                                                `${post.name}(퇴사)`
                                            </span>)
                                            : `${post.name}`
                                        }
                                    </td>
                                    <td style={{
                                        color: post.position === userPosition ? '#28c309' : '#000',
                                        fontWeight: post.position === userPosition ? 'bold' : 'normal'
                                    }}>{viewMode === 'SCHEDULE'
                                        ? new Date(post.scheduledAt).toLocaleString('ko-KR', dateTimeOptions)
                                        : new Date(post.createdAt).toLocaleDateString('ko-KR', dateOptions)
                                        }
                                    </td>
                                    <td style={{
                                        color: post.position === userPosition ? '#28c309' : '#000',
                                        fontWeight: post.position === userPosition ? 'bold' : 'normal'
                                    }}>{post.viewCount}</td>

                                    {/* ❌ 삭제 버튼 */}
                                    {viewMode === 'SCHEDULE' && (
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleDeleteScheduled(post.noticeId)}
                                                disabled={deletingId === post.noticeId}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'red',
                                                    fontSize: '1.1em',
                                                    cursor: deletingId === post.noticeId ? 'not-allowed' : 'pointer',
                                                    transition: 'color 0.2s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (deletingId !== post.noticeId) e.currentTarget.style.color = '#ff4444';
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (deletingId !== post.noticeId) e.currentTarget.style.color = 'red';
                                                }}
                                                title="예약 공지 삭제"
                                            >
                                                {deletingId === post.noticeId ? '🔄' : '❌'}
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}

                            {/* 🔻 전체공지와 부서공지 사이 구분선 추가 */}
                            {generalNotices.length > 0 && notices.length > 0 && (
                                <tr className="divider-row">
                                    <td colSpan="6"><hr /></td>
                                </tr>
                            )}


                            {notices.map(post => (
                                <tr
                                    key={`notice-${post.noticeId}`} className="notice-row" onClick={() => navigate(`${post.noticeId}`)}>
                                    <td style={{
                                        color: post.position === userPosition ? '#21429e' : '#000',
                                        fontWeight: post.position === userPosition ? 'bold' : 'normal'
                                    }}>{post.noticeId}</td>
                                    <td>{post.attachmentUri && post.attachmentUri.length > 0 && post.attachmentUri != '[]' ? '📎' : ''}</td>
                                    {/* <td>{post.title}</td> */}
                                    <td style={{
                                        color: post.position === userPosition ? '#21429e' : '#000',
                                        fontWeight: post.position === userPosition ? 'bold' : 'normal'
                                    }}>
                                        {post.commentCount === 0 ?
                                            (`${post.title}`)
                                            : `${post.title}(${post.commentCount})`
                                        }
                                    </td>
                                    <td style={{
                                        color: post.position === userPosition ? '#21429e' : '#000',
                                        fontWeight: post.position === userPosition ? 'bold' : 'normal'
                                    }}>
                                        {post.employStatus === 'INACTIVE' ?
                                            (<span style={{ color: '#aaa', fontStyle: 'italic', marginLeft: '4px' }}>
                                                `${post.name}(퇴사)`
                                            </span>)
                                            : `${post.name}`
                                        }
                                    </td>
                                    <td style={{
                                        color: post.position === userPosition ? '#21429e' : '#000',
                                        fontWeight: post.position === userPosition ? 'bold' : 'normal'
                                    }}>{viewMode === 'SCHEDULE'
                                        ? new Date(post.scheduledAt).toLocaleString('ko-KR', dateTimeOptions)
                                        : new Date(post.createdAt).toLocaleDateString('ko-KR', dateOptions)
                                        }
                                    </td>
                                    <td style={{
                                        color: post.position === userPosition ? '#21429e' : '#000',
                                        fontWeight: post.position === userPosition ? 'bold' : 'normal'
                                    }}>{post.viewCount}</td>
                                    {/* ❌ 삭제 버튼 */}
                                    {viewMode === 'SCHEDULE' && (
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleDeleteScheduled(post.noticeId)}
                                                disabled={deletingId === post.noticeId}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'red',
                                                    fontSize: '1.1em',
                                                    cursor: deletingId === post.noticeId ? 'not-allowed' : 'pointer',
                                                    transition: 'color 0.2s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (deletingId !== post.noticeId) e.currentTarget.style.color = '#ff4444';
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (deletingId !== post.noticeId) e.currentTarget.style.color = 'red';
                                                }}
                                                title="예약 공지 삭제"
                                            >
                                                {deletingId === post.noticeId ? '🔄' : '❌'}
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}


                        </tbody>
                    </table>

                    <div className="pagination">
                        <button onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0}>Previous</button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button key={i} className={page === i ? 'active' : ''} onClick={() => setPage(i)}>
                                {i + 1}
                            </button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))} disabled={page === totalPages - 1}>Next</button>
                    </div>

                    <div className="page-size-selector">
                        <label>보기 개수:&nbsp;</label>
                        <select value={pageSize} onChange={handlePageSizeChange}>
                            {[10, 15, 20, 25, 30].map(size => (
                                <option key={size} value={size}>{size}개씩 보기</option>
                            ))}
                        </select>
                    </div>
                </>
            )}
        </div>
    );
};

export default NoticeBoardList;
