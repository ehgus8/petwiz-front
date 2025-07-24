import React, { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css"; // snow 테마 CSS

const QuillEditor = ({ value, onChange, placeholder, readOnly = false }) => {
  const editorRef = useRef(null);
  const quillInstanceRef = useRef(null); // Quill 인스턴스를 저장할 ref

  useEffect(() => {
    // 1. 이미 Quill 인스턴스가 있다면 새로 생성하지 않고 종료
    if (quillInstanceRef.current) {
      return;
    }

    // 2. editorRef가 마운트된 후에만 Quill 인스턴스 생성
    if (editorRef.current) {
      quillInstanceRef.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ align: [] }],
            ["clean"],
          ],
        },
        placeholder,
        readOnly,
      });

      const quill = quillInstanceRef.current;

      // 초기값이 있다면 에디터에 설정합니다.
      // (단, 초기값 설정 후 변경 감지를 위해 text-change 이벤트는 나중에 붙여야 함)
      // 또는 value prop이 변경될 때만 설정하도록 별도의 useEffect에서 처리
      // 여기서는 초기값 설정만 담당합니다.
      if (value) {
        quill.root.innerHTML = value;
      }

      // 사용자가 내용을 변경했을 때의 이벤트 핸들러
      quill.on("text-change", (delta, oldDelta, source) => {
        if (source === "user") {
          onChange(quill.root.innerHTML);
        }
      });
    }

    // 컴포넌트가 언마운트될 때 Quill 인스턴스를 정리하는 로직
    return () => {
      if (quillInstanceRef.current) {
        quillInstanceRef.current.off('text-change'); // 이벤트 리스너 해제
        // quillInstanceRef.current.destroy(); // <--- 이 라인을 제거하세요!
        quillInstanceRef.current = null; // ref 초기화
      }
    };
  }, []); // 의존성 배열은 빈 배열 유지 (컴포넌트 마운트/언마운트 시에만 실행)

  // value prop이 변경될 때마다 에디터 내용 업데이트 (사용자 입력 중이 아닐 때만)
  useEffect(() => {
    const quill = quillInstanceRef.current;
    if (quill && value !== quill.root.innerHTML && !quill.hasFocus()) {
      quill.root.innerHTML = value || '';
    }
  }, [value]);

  // readOnly prop이 변경될 때마다 에디터 활성화/비활성화
  useEffect(() => {
    const quill = quillInstanceRef.current;
    if (quill) {
      quill.enable(!readOnly);
    }
  }, [readOnly]);

  return <div ref={editorRef} style={{ minHeight: "300px" }} />;
};

export default QuillEditor;