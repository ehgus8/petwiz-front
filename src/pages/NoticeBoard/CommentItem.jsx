import React, { useState } from 'react';
import CommentForm from './CommentForm';

const CommentItem = ({ comment, isMine, onUpdate, onDelete }) => {
    const [editing, setEditing] = useState(false);

    const handleEditSubmit = (data) => {
        onUpdate(comment.id, data.content);
        setEditing(false);
    };

    return (
        <div className="comment-item">
            <div className="comment-meta">
                <strong>{comment.writerName}</strong> · {new Date(comment.createdAt).toLocaleString()}
            </div>
            {editing ? (
                <CommentForm
                    initialValue={comment.content}
                    onSubmit={handleEditSubmit}
                    onCancel={() => setEditing(false)}
                    isEdit
                />
            ) : (
                <div className="comment-content">
                    <p>{comment.content}</p>
                    {isMine && (
                        <div className="comment-actions">
                            <button onClick={() => setEditing(true)}>수정</button>
                            <button onClick={() => onDelete(comment.id)}>삭제</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CommentItem;
