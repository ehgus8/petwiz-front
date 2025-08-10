import Swal from 'sweetalert2';

export const handleAxiosError = async (error, onLogout, navigate) => {
  const responseData = error.response?.data || {};

  if (responseData.statusMessage === 'EXPIRED_RT') {
    await Swal.fire({
      icon: 'warning',
      title: '세션 만료',
      text: '시간이 경과하여 재 로그인이 필요합니다.',
      confirmButtonColor: '#3085d6',
    });
    onLogout();
    navigate('/');
  } else if (responseData.message === 'NO_LOGIN') {
    await Swal.fire({
      icon: 'warning',
      title: '로그인 필요',
      text: '아예 로그인을 하지 않아서 재발급 요청 들어갈 수 없습니다.',
      confirmButtonColor: '#3085d6',
    });
    navigate('/');
  } else if (responseData.statusMessage === '재고 부족!') {
    await Swal.fire({
      icon: 'error',
      title: '재고 부족',
      text: '재고가 부족하여 주문이 불가능합니다. 관리자에게 문의하세요.',
      confirmButtonColor: '#d33',
    });
    navigate('/');
  } else {
    // 추가 예외 처리 필요 시 여기 else if로 확장 가능
    throw error;
  }
};
