import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import './CommunityWrite.scss';
import Swal from 'sweetalert2';
import { UserContext, UserContextProvider } from '../../context/UserContext';
import { API_BASE_URL, NOTICE_SERVICE, HR_SERVICE, COMMUNITY_SERVICE } from '../../configs/host-config';
import Editor from '../../components/Editor';

const CommunityWrite = ({ isEdit = false }) => {
    const { communityId } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState('post');
    const [files, setFiles] = useState([]);
    const [existingFiles, setExistingFiles] = useState([]); // ✅ 기존 파일 목록

    const [departmentId, setDepartmentId] = useState(''); // 🔹 부서 ID
    const [departments, setDepartments] = useState([]);   // 🔹 부서 리스트

    const { accessToken, userId, isInit, userRole } = useContext(UserContext); // ✅ 한 번에 구조 분해


    const parseAttachmentUri = (raw) => {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
            // 이미 JSON이 아닌 단일 문자열일 경우
            return [raw];
        }
    };


    // 수정 모드일 경우 게시글 불러오기
    useEffect(() => {
        if (isEdit && communityId) {
            axios.get(`${API_BASE_URL}${COMMUNITY_SERVICE}/${communityId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
            })
                .then((res) => {
                    setTitle(res.data.title ?? '');
                    setContent(res.data.content ?? '');
                    setType(res.data.notice ? 'notice' : 'post');
                    setDepartmentId(res.data.departmentId || '');

                    console.log('res.data.attachmentUri : ', res.data.attachmentUri);

                    if (res.data.attachmentUri) {
                        try {
                            const parsed = parseAttachmentUri(res.data.attachmentUri);
                            if (Array.isArray(parsed)) setExistingFiles(parsed);
                        } catch (e) {
                            console.error('첨부파일 파싱 실패', e);
                        }
                    }
                })
                .catch(err => {
                    console.error(err);
                    Swal.fire({
                        icon: 'error',
                        title: '오류',
                        text: '게시글을 불러오지 못했습니다.',
                        confirmButtonText: '확인',
                    });
                });
        }
    }, [isEdit, communityId, accessToken]);


    const handleDeleteExistingFile = (urlToDelete) => {
        setExistingFiles(prev => prev.filter(url => url !== urlToDelete));
    };


    const handleSubmit = async () => {

        // ✅ 제목 또는 내용이 비어있을 경우 알림
        if (!title.trim()) {
            Swal.fire({
                icon: 'warning',
                title: '제목을 입력해주세요.',
                confirmButtonText: '확인',
            });
            return;
        }

        if (!content.trim()) {
            Swal.fire({
                icon: 'warning',
                title: '내용을 입력해주세요.',
                confirmButtonText: '확인',
            });
            return;
        }

        const uploadedFileUrls = [];

        try {
            // ✅ 파일이 있다면 presigned URL 받아서 직접 업로드
            if (files.length > 0) {
                for (const file of files) {
                    // 1. presigned URL 요청
                    console.log('file.name, file.type : ', file.name, file.type);

                    const res = await axios.get(`${API_BASE_URL}${COMMUNITY_SERVICE}/upload-url`, {
                        params: {
                            fileName: file.name,
                            contentType: file.type || 'application/octet-stream',
                            // 'x-amz-acl': 'private',  // ✅ 꼭 필요
                        },
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': file.type,
                        },
                    });

                    const presignedUrl = res.data;
                    console.log('presignedUrl: ', presignedUrl);

                    const fileContentType = file.type || 'application/octet-stream';

                    // 2. S3에 파일 업로드
                    await axios.put(presignedUrl, file, {
                        headers: {
                            'Content-Type': fileContentType,
                            // 'x-amz-acl': 'private' // ✅ 이 헤더 추가
                            'x-amz-meta-contentType': fileContentType,
                            'x-amz-meta-fileType': fileContentType
                        },
                    });

                    // 3. 업로드된 S3의 정적 URL 추출
                    const uploadedUrl = presignedUrl.split('?')[0];
                    uploadedFileUrls.push(uploadedUrl);
                }
            }

            // ✅ 기존 파일 + 새 파일 합쳐서 전송
            const combinedFiles = [...existingFiles, ...uploadedFileUrls];

            // ✅ 게시글 데이터 구성
            let finalTitle = title.trim();
            if (type === 'notice') {
                if (!finalTitle.startsWith('[공지]')) {
                    finalTitle = `[공지] ${finalTitle}`;
                }
            }
            const noticeData = {
                title: finalTitle,
                content,
                notice: type === 'notice',
                departmentId: departmentId || null, // 🔥 부서 ID 포함
                attachmentUri: combinedFiles.length > 0 ? JSON.stringify(combinedFiles) : null,
            };
            console.log('noticeData : ', noticeData);

            if (isEdit) {
                const response = await axios.put(`${API_BASE_URL}${COMMUNITY_SERVICE}/${communityId}`, noticeData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                });
                const { message, type } = response.data;
                Swal.fire({
                    title: '알림',
                    text: message,
                    icon: type,
                    confirmButtonText: '확인',
                });
                navigate(-1);
            } else {
                const response = await axios.post(`${API_BASE_URL}${COMMUNITY_SERVICE}/write`, noticeData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                });
                const { message, type } = response.data;
                Swal.fire({
                    title: '알림',
                    text: message,
                    icon: type,
                    confirmButtonText: '확인',
                });
                navigate(-1);
            }

        } catch (err) {
            console.error(err);
            const errorData = err.response?.data;
            Swal.fire({
                title: '오류',
                text: errorData?.message || '처리 중 오류가 발생했습니다.',
                icon: errorData?.type || 'error',
                confirmButtonText: '확인',
            });
        }
    };

    const isImageFile = (url) => {
        return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
    };

    return (
        <div className="notice-write">
            <h2>{isEdit ? '게시글 수정' : '게시글 작성'}</h2>
            <input
                type="text"
                placeholder="제목을 입력하세요"
                className="title-input"

                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            {/* <textarea
                placeholder="내용을 입력하세요"
                className="content-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            /> */}
            <div className="editor-wrapper">
                <Editor content={content} onChange={setContent} />
            </div>


            {/* ✅ 기존 파일 목록 */}
            {isEdit && existingFiles.length > 0 && (
                <div className="existing-files">
                    <h4>기존 첨부파일</h4>
                    {existingFiles.map((url, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <a href={url} target="_blank" rel="noreferrer" style={{ marginRight: '10px' }}>
                                📎 {url.split('/').pop()}
                            </a>
                            <button onClick={() => handleDeleteExistingFile(url)}>❌ 삭제</button>
                        </div>
                    ))}
                </div>
            )}

            <div className="attachments">
                <input type="file" multiple onChange={(e) => setFiles([...e.target.files])} />
            </div>

            <div className="buttons">
                <button onClick={handleSubmit}>{isEdit ? '수정' : '저장'}</button>
                <button onClick={() => navigate(-1)}>뒤로가기</button>
            </div>
        </div>
    );
};

export default CommunityWrite;