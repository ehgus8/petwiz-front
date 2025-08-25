// CommunityPostsPage.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    API_BASE_URL,
    NOTICE_SERVICE,
    COMMUNITY_SERVICE
} from '../../configs/host-config';
import { UserContext, UserContextProvider } from '../../context/UserContext'; // 로그인 유저 정보
import { fetchFavoriteCommunity, toggleFavoriteCommunity } from '../../api/favorite-api';
import './CommunityPostsPage.scss';
import ListSkeleton from '../../components/common/Skeleton';

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

const CommunityPostsPage = () => {
    const navigate = useNavigate();
    const { isInit, userId, accessToken, departmentId, userRole, userPosition } = useContext(UserContext);
    const [favoriteList, setFavoriteList] = useState([]);
    const [viewMode, setViewMode] = useState('ALL'); // ALL | MY | DEPT
    const [posts, setPosts] = useState([]);
    const [hideReported, setHideReported] = useState(false);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

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
    const [reportCount, setReportCount] = useState(0);

    // DateInput: 텍스트 → date 전환 입력 컴포넌트
    const DateInput = ({ name, value, onChange, placeholder }) => {
        const [type, setType] = useState('text');

        return (
            <input
                className='custom-date-input'
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

    {/* {(hideReported ? posts.filter(post => !post.hidden) : posts).length > 0 ? (
                                (hideReported ? posts.filter(post => !post.hidden) : posts).map(post => ( */}

    const filteredCommunity = showFavoritesOnly
        ? posts.filter(posts => favoriteList.includes(posts.communityId))
        : posts;

    const truncateTitle = (title, maxLength = 35) => {
        return title.length > maxLength ? `${title.slice(0, maxLength)}...` : title;
    };

    // 게시글 목록 불러오기
    const fetchPosts = async () => {
        if (!accessToken || !userId) {
            setPosts([]);
            setTotalPages(1);
            return;
        }

        setLoading(true);

        try {
            const { keyword, startDate, endDate, sortBy, sortDir } = filters;
            const params = new URLSearchParams({
                keyword: keyword.trim(),
                fromDate: startDate,
                toDate: endDate,
                sortBy,
                sortDir,
                page,
                pageSize,
            });

            let url = '';
            if (viewMode === 'MY') {
                url = `${API_BASE_URL}${COMMUNITY_SERVICE}/my?${params.toString()}`;
            } else if (viewMode === 'DEPT') {
                url = `${API_BASE_URL}${COMMUNITY_SERVICE}/mydepartment?${params.toString()}`;
            } else {
                url = `${API_BASE_URL}${COMMUNITY_SERVICE}?${params.toString()}`;
            }

            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!res.ok) {
                throw new Error(`서버 오류: ${res.status}`);
            }

            const data = await res.json();

            if (viewMode === 'MY') {
                setPosts(data.myposts || []);
                setTotalPages(data.totalPages || 1);
                console.error('data.myposts:', data.myposts);
            } else if (viewMode === 'DEPT') {
                setPosts(data.mydepposts || []);
                setTotalPages(data.totalPages || 1);
                console.error('data.mydepposts:', data.mydepposts);
            } else {
                setPosts(data.posts || []);
                setTotalPages(data.totalPages || 1);
                console.error('data.posts:', data.posts);
            }
        } catch (err) {
            console.error('CommunityPostsPage 게시글 불러오기 실패:', err);
            setPosts([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    // 게시글 목록 fetch 트리거
    useEffect(() => {
        if (!isInit || !accessToken || !userId) {
            setPosts([]);
            setTotalPages(1);
            return;
        }
        fetchPosts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        filters,
        page,
        pageSize,
        departmentId,
        isInit,
        viewMode,
        accessToken,
        userId,
    ]);

    // 신고된 글 개수 fetch
    useEffect(() => {
        if (
            userRole === 'HR_MANAGER' &&
            (userPosition === 'MANAGER' ||
                userPosition === 'DIRECTOR' ||
                userPosition === 'CEO')
        ) {
            const fetchReportCount = async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/report/admin/list`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    });
                    if (!res.ok) throw new Error('신고 목록 조회 실패');

                    const data = await res.json();
                    setReportCount(data.posts?.length || 0);
                } catch (err) {
                    console.error('신고 수 조회 실패:', err);
                }
            };

            fetchReportCount();
        }
    }, [userRole, userPosition, accessToken]);

    // 핸들러
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };
    const handleSearch = () => setPage(0);

    const handlePageSizeChange = (e) => {
        console.log('Number(e.target.value) : ', Number(e.target.value));
        setPageSize(Number(e.target.value));
        setPage(0); // 첫 페이지로 초기화
    };

    useEffect(() => {
        if (accessToken) {
            fetchFavoriteCommunity(accessToken)
                .then(setFavoriteList)
                .catch(console.error);
        }
    }, [accessToken]);

    const handleFavoriteClick = async (communityId) => {
        try {
            await toggleFavoriteCommunity(communityId, accessToken);
            const updated = await fetchFavoriteCommunity(accessToken);
            setFavoriteList(updated);
        } catch (err) {
            alert('즐겨찾기 처리 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="notice-board">
            <div className="header">
                {userRole === 'HR_MANAGER' &&
                    (userPosition === 'MANAGER' || userPosition === 'DIRECTOR' || userPosition === 'CEO') && (
                        <div className="admin-controls">
                            <button
                                className="manage-button"
                                onClick={() => navigate('/report/admin/list')}
                            >
                                🔧 게시글 관리
                                {reportCount > 0 && <span className="report-badge">{reportCount}</span>}
                            </button>
                        </div>
                    )}
                <h2>게시판</h2>
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
                                // marginLeft: '8px',
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


                    {/* <button className='search-button' onClick={handleSearch}>검색</button> */}
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

                    <div
                        className="write-button-wrapper"
                    // style={{ marginLeft: '270px' }}
                    >
                        <button className="write-button" onClick={() => navigate('/community/write')}>작성하기</button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: 'auto' }}>
                        <div className="view-mode-buttons">
                            <button className={viewMode === 'ALL' ? 'active' : ''} onClick={() => { setViewMode('ALL'); setPage(0); navigate('/community') }}>
                                전체
                            </button>
                            <button className={viewMode === 'MY' ? 'active' : ''} onClick={() => { setViewMode('MY'); setPage(0); navigate('/community/my') }}>
                                내가 쓴 글
                            </button>
                            <button className={viewMode === 'DEPT' ? 'active' : ''} onClick={() => { setViewMode('DEPT'); setPage(0); navigate('/community/mydepartment') }}>
                                내 부서 글
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
                        <div className="hide-reported" style={{ display: 'flex', alignItems: 'left', marginRight: '1rem' }}>
                            <input
                                type="checkbox"
                                id="hideReported"
                                checked={hideReported}
                                onChange={(e) => setHideReported(e.target.checked)}
                                style={{ marginRight: '6px' }}
                            />
                            <label htmlFor="hideReported" className='hideReported' style={{ fontSize: '0.95rem', color: '#333' }}>
                                신고된 게시글 제외
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '12px 0' }}>
                    <ListSkeleton items={8} />
                </div>
            ) : (
                <>
                    <table className="notice-table">
                        <thead>
                            <tr>
                                <th>구분</th>
                                <th></th>
                                <th>제목</th>
                                <th>작성자</th>
                                <th>작성일</th>
                                <th>조회수</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(hideReported ? filteredCommunity.filter(post => !post.hidden) : filteredCommunity).length > 0 ? (
                                (hideReported ? filteredCommunity.filter(post => !post.hidden) : filteredCommunity).map(post => (
                                    // {filteredCommunity.map(post => (
                                    <tr
                                        key={`post-${post.communityId}`}

                                        style={{
                                            color: post.hidden ? 'rgba(171, 26, 26, 1)' : 'black',
                                            background: post.hidden ? '#f4d7d7' : 'white'
                                        }}
                                        className={post.notice ? 'bold-row' : ''}
                                    >
                                        <td>{post.communityId}</td>
                                        {/* <td>{post.attachmentUri && post.attachmentUri.length > 0 && post.attachmentUri !== '[]' ? '📎' : ''}</td> */}
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


                                        {/* <td>{post.hidden ? <span>🚨{post.title}</span> : post.title}</td> */}
                                        <td title={post.title}>
                                            {/* ⭐ 별 아이콘 표시 */}
                                            {viewMode !== 'SCHEDULE' && <button
                                                className={`favorite-btn ${favoriteList.includes(post.communityId) ? 'active' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // 클릭 이벤트 버블링 방지
                                                    handleFavoriteClick(post.communityId);
                                                }}
                                                title={favoriteList.includes(post.communityId) ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                                            >
                                                <span className="star-icon">{favoriteList.includes(post.communityId) ? '★' : '☆'}</span>
                                            </button>}
                                            {post.hidden ? (
                                                <span onClick={() => navigate(`/community/${post.communityId}`)}>
                                                    🚨{truncateTitle(post.title)}
                                                    {Number(post.commentCount) > 0 && (
                                                        <span style={{ color: '#777', fontSize: '0.9em' }}> ({post.commentCount})</span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span onClick={() => navigate(`/community/${post.communityId}`)}>
                                                    {truncateTitle(post.title)}
                                                    {Number(post.commentCount) > 0 && (
                                                        <span style={{ color: '#777', fontSize: '0.9em' }}> ({post.commentCount})</span>
                                                    )}
                                                </span>
                                            )}
                                        </td>



                                        <td>{post.employStatus === 'INACTIVE' ? (
                                            <span style={{ color: '#aaa', fontStyle: 'italic', marginLeft: '4px' }}>
                                                {post.name}(퇴사)
                                            </span>
                                        ) : post.name}</td>
                                        <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                                        <td>{post.viewCount}</td>
                                    </tr>
                                ))) : (
                                <tr>
                                    <td colSpan="6" className="no-post">게시글이 없습니다</td>
                                </tr>
                            )}
                            {/* ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="no-post">게시글이 없습니다</td>
                                </tr>
                            )} */}

                        </tbody>
                    </table>

                    {/* <div className="pagination">
                        <button onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0}>이전</button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button key={i} className={page === i ? 'active' : ''} onClick={() => setPage(i)}>
                                {i + 1}
                            </button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))} disabled={page === totalPages - 1}>다음</button>
                    </div> */}

                    <div className="pagination">
                        <button onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0}>
                            이전
                        </button>

                        {(() => {
                            const maxVisibleAround = 1; // 현재 페이지 앞뒤로 몇 개 보여줄지
                            const lastPage = totalPages - 1;
                            const pages = [];

                            // 10페이지 이하 → 전부 표시
                            if (totalPages <= 10) {
                                for (let i = 0; i < totalPages; i++) {
                                    pages.push(
                                        <button
                                            key={i}
                                            className={page === i ? 'active' : ''}
                                            onClick={() => setPage(i)}
                                        >
                                            {i + 1}
                                        </button>
                                    );
                                }
                                return pages;
                            }

                            // 항상 첫 페이지 표시
                            pages.push(
                                <button
                                    key={0}
                                    className={page === 0 ? 'active' : ''}
                                    onClick={() => setPage(0)}
                                >
                                    1
                                </button>
                            );

                            // 앞쪽 ...
                            if (page > maxVisibleAround + 1) {
                                pages.push(<span key="start-ellipsis">...</span>);
                            }

                            // 현재 페이지 앞뒤로 표시
                            const start = Math.max(1, page - maxVisibleAround);
                            const end = Math.min(lastPage - 1, page + maxVisibleAround);

                            for (let i = start; i <= end; i++) {
                                pages.push(
                                    <button
                                        key={i}
                                        className={page === i ? 'active' : ''}
                                        onClick={() => setPage(i)}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            }

                            // 뒤쪽 ...
                            if (page < lastPage - (maxVisibleAround + 1)) {
                                pages.push(<span key="end-ellipsis">...</span>);
                            }

                            // 항상 마지막 페이지 표시
                            pages.push(
                                <button
                                    key={lastPage}
                                    className={page === lastPage ? 'active' : ''}
                                    onClick={() => setPage(lastPage)}
                                >
                                    {lastPage + 1}
                                </button>
                            );

                            return pages;
                        })()}

                        <button onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))} disabled={page === totalPages - 1}>
                            다음
                        </button>
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

export default CommunityPostsPage;
