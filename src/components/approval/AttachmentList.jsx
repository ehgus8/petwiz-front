import React from 'react';
import styles from './AttachmentList.module.scss';

const AttachmentList = ({ attachments = [], onRemove, readonly = false }) => {
  const handleDownload = async (file) => {
    try {
      const response = await fetch(file.url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName || file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  };

  // ★★★ 추가: 파일 이름으로 이미지 여부를 판단하는 헬퍼 함수 ★★★
  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension);
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return '📎';
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc': case 'docx': return '📝';
      case 'xls': case 'xlsx': return '📊';
      case 'ppt': case 'pptx': return '📈';
      case 'zip': case 'rar': return '📦';
      default: return '📎';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (attachments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>📎</span>
        <p>첨부된 파일이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={styles.attachmentList}>
      <h4 className={styles.title}>첨부파일 ({attachments.length})</h4>
      <div className={styles.fileList}>
        {attachments.map((file, index) => (
          <div key={index} className={styles.fileItem}>
            <div className={styles.fileInfo}>
              {/* ★★★ 수정: 이미지 파일일 경우 썸네일을, 아닐 경우 아이콘을 보여주는 조건부 렌더링 ★★★ */}
              {isImageFile(file.fileName || file.name) ? (
                <div className={styles.imageThumbnail}>
                  <img
                    src={file.url}
                    alt={file.fileName || file.name}
                    className={styles.thumbnailImage}
                    onError={(e) => {
                      // 이미지 로드 실패 시 아이콘으로 대체
                      e.target.style.display = 'none';
                      const fallback = e.target.nextSibling;
                      if (fallback) fallback.style.display = 'inline';
                    }}
                  />
                  <span className={styles.fallbackIcon} style={{ display: 'none' }}>
                    {getFileIcon(file.fileName || file.name)}
                  </span>
                </div>
              ) : (
                <span className={styles.fileIcon}>
                  {getFileIcon(file.fileName || file.name)}
                </span>
              )}
              <div className={styles.fileDetails}>
                <span className={styles.fileName}>
                  {file.fileName || file.name}
                </span>
                {file.size && (
                  <span className={styles.fileSize}>
                    {formatFileSize(file.size)}
                  </span>
                )}
              </div>
            </div>
            <div className={styles.fileActions}>
              <button
                type="button"
                onClick={() => handleDownload(file)}
                className={styles.downloadButton}
                title="다운로드"
              >
                📥
              </button>
              {!readonly && onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className={styles.removeButton}
                  title="삭제"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachmentList;