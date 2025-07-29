import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PostCard.scss';

const PostCard = ({ post }) => {
    const navigate = useNavigate();

    const goToDetail = () => {
        navigate(`/notices/${post.id}`);
    };

    return (
        <div
            className="border p-4 rounded shadow hover:shadow-md transition cursor-pointer"
            onClick={goToDetail}
        >
            <h3 className="text-lg font-semibold">{post.title}</h3>
            <p className="text-sm text-gray-600">{post.writerName} · {post.createdAt?.split('T')[0]}</p>
            <p className="text-sm text-gray-700 mt-1">댓글 {post.commentCount}</p>
        </div>
    );
};

export default PostCard;
