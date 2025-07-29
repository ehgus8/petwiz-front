import React, { useState } from 'react';

const CommentForm = ({ onSubmit, initialValue = '', isEdit = false, onCancel }) => {
    const [content, setContent] = useState(initialValue);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        onSubmit({ content });
        if (!isEdit) setContent('');
    };

    return (
        <form onSubmit={handleSubmit} className="comment-form">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                placeholder="댓글을 입력하세요"
            />
            <div>
                <button type="submit">{isEdit ? '수정' : '등록'}</button>
                {isEdit && <button type="button" onClick={onCancel}>취소</button>}
            </div>
        </form>
    );
};

export default CommentForm;
