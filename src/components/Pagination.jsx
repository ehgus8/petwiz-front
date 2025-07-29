import React from 'react';
import './Pagination.scss';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = [...Array(totalPages)].map((_, i) => i);

    return (
        <div className="flex justify-center mt-6 space-x-2">
            {pages.map((p) => (
                <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`px-3 py-1 rounded ${p === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                    {p + 1}
                </button>
            ))}
        </div>
    );
};

export default Pagination;
