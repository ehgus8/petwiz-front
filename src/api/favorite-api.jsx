import axios from 'axios';
import { API_BASE_URL } from '../configs/host-config';

export const toggleFavoriteNotice = async (noticeId, accessToken) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/notice/favorites/${noticeId}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('즐겨찾기 토글 실패:', error);
        throw error;
    }
};

export const fetchFavoriteNotices = async (accessToken) => {
    const response = await axios.get(`${API_BASE_URL}/notice/favorites`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    return response.data; // [1, 2, 3] 형식의 noticeId 배열
};
