import axios from 'axios';
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    API_BASE_URL, NOTICE_SERVICE
} from '../../configs/host-config';
import { UserContext, UserContextProvider } from '../../context/UserContext'; // 로그인 유저 정보
import { fetchFavoriteNotices, toggleFavoriteNotice } from '../../api/favorite-api';
import './NoticeBoardList.scss';
import Swal from 'sweetalert2';

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

const NoticeBoardList = () => {

    const navigate = useNavigate();
    const { isInit, userId, accessToken, departmentId, userPosition, userRole } = useContext(UserContext);
    const [favoriteList, setFavoriteList] = useState([]); // 즐겨찾기된 noticeId 배열
    const [viewMode, setViewMode] = useState('ALL'); // ALL | MY | DEPT
    const [posts, setPosts] = useState([]);
    const [notices, setNotices] = useState([]);
    const [generalNotices, setGeneralNotices] = useState([]);
    const [filters, setFilters] = useState({
        startDate: '', endDate: '', keyword: '',
        sortBy: 'createdAt', sortDir: 'desc',
    });
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10); // ✅ 보기 개수
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null); // 삭제 중인 공지 ID
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    const DateInput = ({ name, value, onChange, placeholder }) => {
        const [type, setType] = useState('text');

        return (
            <input
                className="custom-date-input"
                type={type}
                name={name}
                value={value}
                placeholder={placeholder}
                onFocus={() => setType('date')}
                onBlur={() => {
                    if (!value) setType('text');
                }}
                onChange={onChange}
            />
        );
    };


    const filteredNotices = showFavoritesOnly
        ? notices.filter(notices => favoriteList.includes(notices.noticeId))
        : notices;

    const filteredGeneralNotices = showFavoritesOnly
        ? generalNotices.filter(generalNotices => favoriteList.includes(generalNotices.noticeId))
        : generalNotices;

    const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const dateTimeOptions = {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
    };

    const truncateTitle = (title, maxLength = 35) => {
        return title.length > maxLength ? `${title.slice(0, maxLength)}...` : title;
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
                headers: { 'Authorization': `Bearer ${accessToken}` }
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

    console.log("isInit:", isInit);
    console.log("accessToken:", accessToken);
    console.log("userId:", userId);

    useEffect(() => {
        // if (!isInit || !accessToken || !userId) return; // ✅ 초기화 완료 여부 확인

        const fetchPosts = async () => {
            setLoading(true);
            try {
                const { keyword, startDate, endDate, sortBy, sortDir } = filters;
                const params = new URLSearchParams({
                    keyword: filters.keyword.trim(),
                    fromDate: startDate,
                    toDate: endDate,
                    sortBy: sortBy,
                    sortDir: sortDir, page, pageSize: pageSize,
                });

                let url;
                console.log('viewMode : ', viewMode);
                console.log('departmentId : ', departmentId);
                if (viewMode === 'MY') {
                    // url = `${API_BASE_URL}${NOTICE_SERVICE}/my`;
                    url = `${API_BASE_URL}${NOTICE_SERVICE}/my?${params.toString()}`;
                } else if (viewMode === 'SCHEDULE') {
                    url = `${API_BASE_URL}${NOTICE_SERVICE}/schedule`;
                }
                else {
                    url = `${API_BASE_URL}${NOTICE_SERVICE}?${params.toString()}`;
                }

                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${accessToken}`, }
                });

                if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
                const data = await res.json();

                console.log('data : ', data);
                console.log('data.generalNotices : ', data.generalNotices);
                console.log('data.notices : ', data.notices);

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

    useEffect(() => {
        if (accessToken) {
            fetchFavoriteNotices(accessToken)
                .then(setFavoriteList)
                .catch(console.error);
        }
    }, [accessToken]);

    const handleFavoriteClick = async (noticeId) => {
        try {
            await toggleFavoriteNotice(noticeId, accessToken);
            const updated = await fetchFavoriteNotices(accessToken);
            setFavoriteList(updated);
        } catch (err) {
            alert('즐겨찾기 처리 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="notice-board">
            <div className="header">
                <h2>공지사항</h2>
                <div className="filters">
                    <div className="date-wrapper">
                        <DateInput
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleInputChange}
                            placeholder="시작일"
                        />
                    </div>
                    <div className="date-wrapper">
                        <DateInput
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleInputChange}
                            placeholder="종료일"
                        />
                    </div>

                    <input type="text" name="keyword" value={filters.keyword} placeholder="제목 검색"
                        onChange={handleInputChange}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} />

                    <div className="sort-options" style={{ display: 'flex', alignItems: 'center' }}>
                        <select name="sortBy" value={filters.sortBy}
                            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                        >
                            <option value="createdAt">등록일</option>
                            <option value="title">제목</option>
                            <option value="viewCount">조회수</option>
                        </select>

                        <button
                            onClick={() =>
                                setFilters(prev => ({
                                    ...prev, sortDir: prev.sortDir === 'asc' ? 'desc' : 'asc'
                                }))
                            }
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em',
                            }}
                            title={filters.sortDir === 'asc' ? '오름차순' : '내림차순'}
                        >
                            {filters.sortDir === 'asc' ? '⬆️' : '⬇️'}
                        </button>
                    </div>
                    <button
                        className="reset-button"
                        onClick={() => {
                            setFilters({
                                startDate: '', endDate: '', keyword: '',
                                sortBy: 'createdAt', sortDir: 'desc'
                            });
                            setPage(0);
                            setPageSize(10);
                        }}
                    >
                        초기화
                    </button>

                    <div className="write-button-wrapper">
                        {(userRole === 'ADMIN' && ['MANAGER', 'DIRECTOR', 'CEO'].includes(userPosition)) && (
                            <button className="write-button" onClick={() => navigate('/notice/write')}>
                                작성하기
                            </button>
                        )}
                    </div>

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
                        <button
                            className="favorite-toggle-icon"
                            onClick={() => setShowFavoritesOnly(prev => !prev)}
                            title={showFavoritesOnly ? '즐겨찾기 해제' : '즐겨찾기만 보기'}
                        >
                            <span className={showFavoritesOnly ? 'active-star' : 'star'}>
                                {showFavoritesOnly ? '★ ' : '☆ '}
                            </span>
                            <label>
                                즐겨찾기
                            </label>
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
                            {filteredGeneralNotices.map(post => (
                                <tr
                                    key={`generalnotice-${post.noticeId}`} className="generalnotice-row" onClick={() => navigate(`/notice/${post.noticeId}`)}>
                                    <td style={{
                                        color: post.position === userPosition ? '#28c309' : '#000',
                                        fontWeight: post.position === userPosition ? 'bold' : 'normal'
                                    }}>{post.noticeId}</td>
                                    <td>
                                        {(() => {
                                            try {
                                                const files = JSON.parse(post.attachmentUri); // attachmentUri는 JSON 문자열
                                                if (!Array.isArray(files) || files.length === 0) return null;

                                                if (files.length === 1) {
                                                    const ext = files[0].split('.').pop().toLowerCase();
                                                    const iconPath = fileIconMap[ext] || '/icons/default.png';
                                                    return <img src={iconPath} alt={ext} style={{ width: '20px', height: '20px' }} />;
                                                } else {
                                                    return <img src="/icons/multiple.png" alt="multiple files" style={{ width: '20px', height: '20px' }} />;
                                                }
                                            } catch (e) {
                                                return null;
                                            }
                                        })()}
                                    </td>
                                    <td style={{
                                        color: post.position === userPosition ? '#28c309' : '#000',
                                        fontWeight: post.position === userPosition ? 'bold' : 'normal'
                                    }}>
                                        {/* ⭐ 별 아이콘 표시 */}
                                        {viewMode !== 'SCHEDULE' && <button
                                            className={`favorite-btn ${favoriteList.includes(post.noticeId) ? 'active' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation(); // 클릭 이벤트 버블링 방지
                                                handleFavoriteClick(post.noticeId);
                                            }}
                                            title={favoriteList.includes(post.noticeId) ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                                        >
                                            <span className="star-icon">{favoriteList.includes(post.noticeId) ? '★' : '☆'}</span>
                                        </button>}

                                        <span onClick={() => navigate(`/notice/${post.noticeId}`)}>
                                            {post.departmentId === 0 ? (
                                                <span style={{ 'color': 'red', 'fontWeight': 'bold', 'marginRight': '4px' }}>
                                                    [전체]
                                                </span>
                                            ) : (
                                                <span></span>
                                            )}
                                            {post.commentCount === 0 ? (
                                                truncateTitle(`${post.title}`)
                                            ) : (
                                                <>
                                                    {truncateTitle(post.title)}
                                                    <span style={{ color: '#777', fontSize: '0.9em' }}> ({post.commentCount})</span>
                                                </>
                                            )}
                                        </span>
                                    </td>

                                    <td style={{
                                        color: post.position === userPosition ? '#28c309' : '#000',
                                        fontWeight: post.position === userPosition ? 'bold' : 'normal'
                                    }}>
                                        {post.employStatus === 'INACTIVE' ?
                                            (<span style={{ color: '#aaa', fontStyle: 'italic', marginLeft: '4px' }}>
                                                {`${post.name}(퇴사)`}
                                            </span>) : `${post.name}`
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
                                                    background: 'none', border: 'none', color: 'red',
                                                    fontSize: '1.1em', transition: 'color 0.2s',
                                                    cursor: deletingId === post.noticeId ? 'not-allowed' : 'pointer',
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

                            {filteredNotices.map(post => (
                                <tr
                                    key={`notice-${post.noticeId}`} className="notice-row">
                                    <td style={{
                                        color: post.position === userPosition ? '#21429e' : '#000',
                                        fontWeight: post.position === userPosition ? 'bold' : 'normal'
                                    }}>{post.noticeId}</td>
                                    {/* <td>{post.attachmentUri && post.attachmentUri.length > 0 && post.attachmentUri != '[]' ? '📎' : ''}</td> */}
                                    <td>
                                        {(() => {
                                            try {
                                                const files = JSON.parse(post.attachmentUri); // attachmentUri는 JSON 문자열
                                                if (!Array.isArray(files) || files.length === 0) return null;
                                                if (files.length === 1) {
                                                    const ext = files[0].split('.').pop().toLowerCase();
                                                    const iconPath = fileIconMap[ext] || '/icons/default.png';
                                                    return <img src={iconPath} alt={ext} style={{ width: '20px', height: '20px' }} />;
                                                } else {
                                                    return <img src="/icons/multiple.png" alt="multiple files" style={{ width: '20px', height: '20px' }} />;
                                                }
                                            } catch (e) {
                                                return null;
                                            }
                                        })()}
                                    </td>
                                    <td style={{
                                        color: post.position === userPosition ? '#21429e' : '#000',
                                        fontWeight: post.position === userPosition ? 'bold' : 'normal'
                                    }}>
                                        {/* ⭐ 별 아이콘 표시 */}
                                        {viewMode !== 'SCHEDULE' && <button
                                            className={`favorite-btn ${favoriteList.includes(post.noticeId) ? 'active' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation(); // 클릭 이벤트 버블링 방지
                                                handleFavoriteClick(post.noticeId);
                                            }}
                                            title={favoriteList.includes(post.noticeId) ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                                        >
                                            <span className="star-icon">{favoriteList.includes(post.noticeId) ? '★' : '☆'}</span>
                                        </button>}
                                        <span onClick={() => navigate(`/notice/${post.noticeId}`)}>
                                            {post.departmentId === 0 ? (
                                                <span style={{ 'color': 'red', 'fontWeight': 'bold', 'marginRight': '4px' }}>
                                                    [전체]
                                                </span>
                                            ) : (
                                                <span></span>
                                            )}
                                            {post.commentCount === 0 ? (
                                                truncateTitle(`${post.title}`)
                                            ) : (
                                                <>
                                                    {truncateTitle(post.title)}
                                                    <span style={{ color: '#777', fontSize: '0.9em' }}> ({post.commentCount})</span>
                                                </>
                                            )}
                                        </span>
                                    </td>
                                    <td style={{
                                        color: post.position === userPosition ? '#21429e' : '#000',
                                        fontWeight: post.position === userPosition ? 'bold' : 'normal'
                                    }}>
                                        {post.employStatus === 'INACTIVE' ?
                                            (<span style={{ color: '#aaa', fontStyle: 'italic', marginLeft: '4px' }}>
                                                {post.name}(퇴사)
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
                                                    background: 'none', border: 'none', color: 'red',
                                                    fontSize: '1.1em', transition: 'color 0.2s',
                                                    cursor: deletingId === post.noticeId ? 'not-allowed' : 'pointer',
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
                        <button onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0}>이전</button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button key={i} className={page === i ? 'active' : ''} onClick={() => setPage(i)}>
                                {i + 1}
                            </button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))} disabled={page === totalPages - 1}>다음</button>
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
            )
            }
        </div >
    );
};

export default NoticeBoardList;