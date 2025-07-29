import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    API_BASE_URL,
    NOTICE_SERVICE,
    COMMUNITY_SERVICE
} from '../../configs/host-config';
import { UserContext, UserContextProvider } from '../../context/UserContext'; // 로그인 유저 정보
// import './NoticeBoardList.scss';
import './CommunityPostsPage.scss';

const CommunityPostsPage = () => {
    const navigate = useNavigate();
    const { isInit, userId, accessToken, departmentId, userRole, userPosition } = useContext(UserContext);
    const [viewMode, setViewMode] = useState('ALL'); // ALL | MY | DEPT
    const [posts, setPosts] = useState([]);
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
                // if (departmentId != null && departmentId !== 'undefined') {
                //     url = `${API_BASE_URL}${NOTICE_SERVICE}/noticeboard/department/${departmentId}?${params.toString()}`;
                // } else {
                //     url = `${API_BASE_URL}${NOTICE_SERVICE}/noticeboard?${params.toString()}`;
                // }

                console.log('viewMode : ', viewMode);
                console.log('departmentId : ', departmentId);
                if (viewMode === 'MY') {
                    url = `${API_BASE_URL}${COMMUNITY_SERVICE}/my`;
                } else if (viewMode === 'DEPT') {
                    url = `${API_BASE_URL}${COMMUNITY_SERVICE}/mydepartment`;
                } else {
                    url = `${API_BASE_URL}${COMMUNITY_SERVICE}?${params.toString()}`;
                }

                const res = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    }
                });

                if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
                const data = await res.json();

                console.log('data : ', data);
                console.log('data.posts : ', data.posts);

                if (viewMode === 'MY' || viewMode === 'DEPT') {
                    setPosts(data || []); // 서버에서 단일 배열을 반환하므로 전체를 posts로 처리
                    setTotalPages(1); // 페이징 미적용이므로 1로 고정
                } else {
                    setPosts(data.posts || []);
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

    useEffect(() => {
        // HR_MANAGER일 경우에만 신고 수를 불러옴
        if (userRole === 'HR_MANAGER' && (userPosition === 'MANAGER' || userPosition === 'DIRECTOR' || userPosition === 'CEO')) {
            const fetchReportCount = async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/report/admin/list`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    });
                    if (!res.ok) throw new Error('신고 목록 조회 실패');

                    const data = await res.json();
                    setReportCount(data.posts.length);
                } catch (err) {
                    console.error('신고 수 조회 실패:', err);
                }
            };

            fetchReportCount();
        }
    }, [userRole, userPosition, accessToken]);

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
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
                        </div>

                        <div className="write-button-wrapper">
                            <button className="write-button" onClick={() => navigate('/community/write')}>작성하기</button>
                        </div>
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
                                <th>작성일</th>
                                <th>조회수</th>
                            </tr>
                        </thead>
                        <tbody>

                            {posts.length > 0 ? (
                                posts.map(post => (
                                    <tr
                                        key={`post-${post.communityId}`}
                                        onClick={() => navigate(`/community/${post.communityId}`)}
                                        style={{ fontWeight: post.notice ? 'bold' : 'normal' }} // ✅ 여기가 핵심
                                        className={post.notice ? 'bold-row' : ''}
                                    >
                                        <td>{post.communityId}</td>
                                        <td>{post.attachmentUri && post.attachmentUri.length > 0 && post.attachmentUri != '[]' ? '📎' : ''}</td>
                                        <td>{post.title}</td>
                                        <td>
                                            {post.employStatus === 'INACTIVE' ? (
                                                <span style={{ color: '#aaa', fontStyle: 'italic', marginLeft: '4px' }}>
                                                    {post.name}(퇴사)
                                                </span>
                                            ) : (
                                                post.name
                                            )}
                                        </td>
                                        <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                                        <td>{post.viewCount}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="no-post">게시글이 없습니다</td>
                                </tr>
                            )}

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

export default CommunityPostsPage;
