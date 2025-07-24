import Swal from 'sweetalert2';

export const removeLocalStorageForLogout = () => {
  localStorage.removeItem('ACCESS_TOKEN');
  localStorage.removeItem('USER_ID');
  localStorage.removeItem('USER_ROLE');
  localStorage.removeItem('USER_NAME');
  localStorage.removeItem('USER_DEPARTMENT_ID');
  localStorage.removeItem('USER_POSITION');
  localStorage.removeItem('USER_IMAGE');
  localStorage.removeItem('USER_ICON');
  localStorage.setItem('IS_LOGGING_OUT', 'true'); // Set flag when logging out
};

export const succeed = (text) => {
  Swal.fire({
    title: '성공',
    text: text,
    icon: 'success',
    confirmButtonText: '확인',
  });
};

export const warn = (text) => {
  Swal.fire({
    title: '경고',
    text: text,
    icon: 'warning',
    confirmButtonText: '확인',
  });
};
export const swalError = (text) => {
  Swal.fire({
    title: '에러',
    text: text,
    icon: 'error',
    confirmButtonText: '확인',
  });
};

export const swalConfirm = (text) => {
  return Swal.fire({
    title: '알림',
    text: text,
    icon: 'warning',
    showCancelButton: true, // 취소 버튼 추가
    confirmButtonText: '확인',
    cancelButtonText: '취소',
  });
  // .then((result) => {
  //   if (result.isConfirmed) {
  //     // 확인 버튼 클릭 시
  //     // 여기에 원하는 동작
  //   } else if (result.isDismissed) {
  //     // 취소 버튼 클릭 시(또는 닫힘)
  //     // 여기에 원하는 동작
  //   }
  // });
};
