// src/components/Editor.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FaListOl, FaStrikethrough } from 'react-icons/fa'; // FontAwesome에서 번호목록 아이콘 가져오기
// import FontFamily from '@tiptap/extension-font-family';
// import FontSize from '@tiptap/extension-font-size';
// import LineHeight from '@tiptap/extension-line-height';
import { UserContext } from '../context/UserContext'; // UserContext import
import './Editor.scss';

import { FontSize } from '../extensions/FontSize';
import { FontFamily } from '../extensions/FontFamily';
import { LineHeight } from '../extensions/LineHeight';
import { TextStyleBackground } from '../extensions/TextStyleBackground';

import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiRotateCcw,
  FiRotateCw,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiType,
  FiDroplet,
  FiMinus,
} from 'react-icons/fi';

// font-family 옵션들
const FONT_FAMILIES = [
  { name: '기본', value: '' },
  { name: '돋움', value: 'dotum, 돋움, sans-serif' },
  { name: '굴림', value: 'gulim, 굴림, sans-serif' },
  { name: '맑은 고딕', value: "'Malgun Gothic', 맑은 고딕, sans-serif" },
  { name: '나눔고딕', value: "'Nanum Gothic', 나눔고딕, sans-serif" },
  { name: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { name: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { name: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { name: 'Trebuchet MS', value: "'Trebuchet MS', Helvetica, sans-serif" },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { name: 'Courier New', value: '"Courier New", Courier, monospace' },
  { name: 'Comic Sans MS', value: '"Comic Sans MS", cursive, sans-serif' },
];

// font-size 옵션(px 단위)
const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

// line-height 옵션
const LINE_HEIGHTS = [1, 1.15, 1.5, 1.75, 2];

// 불필요한 기본값들을 필터링하는 함수
const sanitizeContent = (content) => {
  if (!content) return '';

  // "ㅁㄴㅇㄹ" 같은 불필요한 기본값들 제거
  const unwantedDefaults = ['ㅁㄴㅇㄹ', 'test', '테스트', '내용을 입력하세요'];
  const trimmedContent = content.trim();

  if (
    unwantedDefaults.some((defaultVal) => trimmedContent.includes(defaultVal))
  ) {
    return '';
  }

  return content;
};

const Editor = ({ content, onChange }) => {
  const { accessToken } = useContext(UserContext);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: true,
        // paragraph: false
      }), // paragraph는 LineHeight로 덮어쓸 것이므로 false 처리
      Underline,
      TextStyle,
      Color,
      FontSize,
      FontFamily,
      TextStyleBackground,
      LineHeight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    // onUpdate: ({ editor }) => {
    //     onChange(editor.getHTML());
    // },
    onUpdate: async ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  // 컨트롤용 상태 (선택된 값 유지용)
  const [fontFamily, setFontFamily] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [fontColor, setFontColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');

  // useEffect(() => {
  //     if (editor && content !== editor.getHTML()) {
  //         editor.commands.setContent(content);
  //     }
  // }, [content]);

  // 선택된 커서 위치에 맞는 스타일 업데이트
  useEffect(() => {
    if (!editor) return;

    const updateStyles = () => {
      const state = editor.state;
      const { from, to } = editor.state.selection;

      // font-family
      const family = editor.getAttributes('textStyle').fontFamily || '';
      setFontFamily(family);

      // font-size (px)
      const size = editor.getAttributes('textStyle').fontSize || 16;
      setFontSize(parseInt(size));

      // color
      const color = editor.getAttributes('textStyle').color || '#000000';
      setFontColor(color);

      // background color
      const backgroundColor =
        editor.getAttributes('textStyle').backgroundColor || '#ffffff';
      setBgColor(backgroundColor);

      // line-height (paragraph)
      const line = editor.getAttributes('paragraph').lineHeight || 1.5;
      setLineHeight(Number(line));
    };

    editor.on('selectionUpdate', updateStyles);
    editor.on('transaction', updateStyles);

    updateStyles();

    return () => {
      editor.off('selectionUpdate', updateStyles);
      editor.off('transaction', updateStyles);
    };
  }, [editor]);

  // 스타일 변경 함수
  const setFontFamilyHandler = (family) => {
    if (!editor) return;
    editor.chain().focus().setFontFamily(family).run();
  };

  const setFontSizeHandler = (size) => {
    if (!editor) return;
    editor.chain().focus().setFontSize(`${size}px`).run();
  };

  const setLineHeightHandler = (height) => {
    if (!editor) return;
    editor.chain().focus().setLineHeight(height).run();
  };

  const setFontColorHandler = (color) => {
    editor.chain().focus().setColor(color).run();
  };

  const setBgColorHandler = (color) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .setMark('textStyle', { backgroundColor: color })
      .run();
  };

  // content prop이 변경될 때 에디터 내용 업데이트
  useEffect(() => {
    if (editor) {
      const sanitizedContent = sanitizeContent(content);
      if (sanitizedContent !== editor.getHTML()) {
        editor.commands.setContent(sanitizedContent);
      }
    }
  }, [content, editor]);

  return (
    <div className='tiptap-editor'>
      <div className='toolbar'>
        <button
          type='button'
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor?.isActive('bold') ? 'active' : ''}
          title='굵게 (Ctrl+B)'
        >
          {/* <b>굵게</b> */}
          <FiBold />
        </button>
        <button
          type='button'
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor?.isActive('italic') ? 'active' : ''}
          title='기울임 (Ctrl+I)'
        >
          {/* <i>기울임</i> */}
          <FiItalic />
        </button>
        <button
          type='button'
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor?.isActive('underline') ? 'active' : ''}
          title='밑줄 (Ctrl+U)'
        >
          {/* 밑줄 */}
          <FiUnderline />
        </button>
        <button
          type='button'
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor?.isActive('strike') ? 'active' : ''}
          title='취소선'
        >
          {/* 취소선 */}
          <FaStrikethrough />
        </button>
        <button
          type='button'
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor?.isActive('bulletList') ? 'active' : ''}
          title='글머리 기호 목록'
        >
          {/* • 목록 */}
          <FiList />
        </button>
        <button
          type='button'
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor?.isActive('orderedList') ? 'active' : ''}
          title='번호 매기기 목록'
        >
          {/* 1. 목록 */}
          <FaListOl />
        </button>
        <button
          type='button'
          onClick={() => editor.chain().focus().undo().run()}
          title='되돌리기 (Ctrl+Z)'
        >
          {/* ↺ 되돌리기 */}
          <FiRotateCcw />
        </button>
        <button
          type='button'
          onClick={() => editor.chain().focus().redo().run()}
          title='다시 실행 (Ctrl+Y)'
        >
          {/* ↻ 다시실행 */}
          <FiRotateCw />
        </button>

        {/* 정렬 버튼 */}
        <button
          type='button'
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor?.isActive({ textAlign: 'left' }) ? 'active' : ''}
          title='왼쪽 정렬'
        >
          <FiAlignLeft />
        </button>
        <button
          type='button'
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor?.isActive({ textAlign: 'center' }) ? 'active' : ''}
          title='가운데 정렬'
        >
          <FiAlignCenter />
        </button>
        <button
          type='button'
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor?.isActive({ textAlign: 'right' }) ? 'active' : ''}
          title='오른쪽 정렬'
        >
          <FiAlignRight />
        </button>

        {/* 글자색 */}
        <div className='color-group'>
          <label htmlFor='fontColor'>글자색</label>
          <input
            type='color'
            title='글자 색상 선택'
            value={fontColor}
            onChange={(e) => setFontColorHandler(e.target.value)}
            className='color-input'
          />
          {/* 배경색 */}
          {/* <label htmlFor='bgColor'>배경색</label>
          <input
            type='color'
            title='글자 배경색 선택'
            value={bgColor}
            onChange={(e) => setBgColorHandler(e.target.value)}
            className='color-input'
          /> */}
        </div>

        {/* 글씨체 선택 */}
        <div className='font-group'>
          <label htmlFor='fontFamily'>글씨체</label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamilyHandler(e.target.value)}
            title='글씨체 선택'
          >
            {FONT_FAMILIES.map(({ name, value }) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>

          {/* 글자 크기 선택 */}
          <label htmlFor='fontSize'>글자 크기</label>
          <select
            value={fontSize}
            onChange={(e) => setFontSizeHandler(Number(e.target.value))}
            title='글자 크기 선택'
          >
            {FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>

          {/* 줄간격 선택 */}
          <label htmlFor='lineHeight'>줄 간격</label>
          <select
            value={lineHeight}
            onChange={(e) => setLineHeightHandler(Number(e.target.value))}
            title='줄 간격 선택'
          >
            {LINE_HEIGHTS.map((lh) => (
              <option key={lh} value={lh}>
                {lh}
              </option>
            ))}
          </select>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default Editor;
