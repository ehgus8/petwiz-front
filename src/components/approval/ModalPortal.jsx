import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const ModalPortal = ({ children }) => {
  const [element, setElement] = useState(null);

  // useEffect는 컴포넌트가 처음 렌더링(마운트)된 후에 실행됩니다.
  // 이 시점에는 document 객체에 접근하는 것이 안전합니다.
  useEffect(() => {
    const modalRoot = document.getElementById('modal-root');
    setElement(modalRoot);
  }, []); // 빈 배열을 전달하여, 컴포넌트가 처음 마운트될 때 딱 한 번만 실행되도록 합니다.

  // element가 설정되기 전까지는 아무것도 렌더링하지 않습니다.
  if (!element) {
    return null;
  }
  
  // element가 유효한 DOM 노드일 때만 포탈을 생성합니다.
  return ReactDOM.createPortal(children, element);
};

export default ModalPortal;