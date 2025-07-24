import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import styles from './TemplateForm.module.scss';
import QuillEditor from '../../components/editor/QuillEditor'; // 새로 만든 에디터 컴포넌트 import
import CustomFieldModal from '../../components/approval/CustomFieldModal';
import InfoChangeModal from '../../components/approval/InfoChangeModal';
import AddFieldModal from '../../components/approval/AddFieldModal';
import Swal from 'sweetalert2';

const ItemTypes = {
  FIELD: 'field',
};

const DraggableField = ({ field, index, moveField, children }) => {
  const ref = React.useRef(null);
  const [, drop] = useDrop({
    accept: ItemTypes.FIELD,
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveField(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.FIELD,
    item: { id: field.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  drag(drop(ref));
  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={styles.draggableField}
    >
      {children}
    </div>
  );
};

const initialDefaultFields = [
  {
    id: 'title',
    name: '제목',
    desc: '결재문서의 제목입니다.',
    multiSelect: false,
    required: true,
    enabled: true,
    isDefault: true,
  },
  {
    id: 'recipient',
    name: '수신참조',
    desc: '결재정보를 공유할 참조자입니다.',
    multiSelect: true,
    required: false,
    enabled: true,
    isDefault: true,
  },
  {
    id: 'ref_doc',
    name: '참조문서',
    desc: '관련 결재문서를 첨부합니다.',
    multiSelect: false,
    required: false,
    enabled: true,
    isDefault: true,
  },
  {
    id: 'enforcer',
    name: '시행자',
    desc: '결재문서의 시행자입니다.',
    multiSelect: true,
    required: false,
    enabled: true,
    isDefault: true,
  },
];

const componentLibrary = [
  { id: 'text', name: '텍스트' },
  { id: 'date_ym', name: '날짜(년.월)' },
  { id: 'date_ymd', name: '날짜(년.월.일)' },
  { id: 'period', name: '기간' },
  { id: 'number', name: '숫자' },
];

const TemplateForm = () => {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const isEditMode = !!templateId;

  // --- Right Pane State ---
  const [useEditor, setUseEditor] = useState('Y');
  const [requireAttachment, setRequireAttachment] = useState('N');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [categories, setCategories] = useState([]);

  // --- Left Pane State ---
  const [defaultFields, setDefaultFields] = useState(initialDefaultFields);
  const [customFields, setCustomFields] = useState([]);
  const [editorContent, setEditorContent] = useState('');

  // --- Modal State ---
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);
  const [isInfoChangeModalOpen, setIsInfoChangeModalOpen] = useState(false);
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);

  // --- Data Fetching ---
  useEffect(() => {
    // Reset form states when mode changes
    setTitle('');
    setDescription('');
    setTags([]);
    setUseEditor('Y');
    setRequireAttachment('N');
    setDefaultFields(initialDefaultFields);
    setCustomFields([]);
    setEditorContent('');

    const fetchCategories = async () => {
      try {
        const catRes = await axiosInstance.get(
          `${API_BASE_URL}${APPROVAL_SERVICE}/category`,
        );
        const categoriesData =
          catRes?.data?.result && Array.isArray(catRes.data.result)
            ? catRes.data.result
            : [];
        setCategories(categoriesData);
        return categoriesData;
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
        return [];
      }
    };

    const fetchTemplateData = async (templateId) => {
      try {
        const tplRes = await axiosInstance.get(
          `${API_BASE_URL}${APPROVAL_SERVICE}/templates/${templateId}`,
        );
        console.log(
          '수정 페이지 데이터 로딩 응답:',
          JSON.stringify(tplRes.data, null, 2),
        );
        const data = tplRes?.data?.result; // 백엔드 응답 형식에 따라 .data 또는 .result를 사용해야 할 수 있습니다.

        if (data) {
          setCategoryId(data.categoryId || '');
          if (data.template) {
            const {
              title,
              description,
              tags,
              useEditor,
              requireAttachment,
              defaultFields,
              content,
            } = data.template;
            setTitle(title || '');
            setDescription(description || '');
            setTags(tags || []);
            setUseEditor(useEditor || 'Y');
            setRequireAttachment(requireAttachment || 'N');
            if (defaultFields && defaultFields.length > 0) {
              setDefaultFields(defaultFields);
            }
            const customFieldData =
              content?.filter((c) => c.type !== 'editor') || [];
            const editorData = content?.find((c) => c.type === 'editor');
            setCustomFields(customFieldData);
            if (editorData) setEditorContent(editorData.value);
          }
        }
      } catch (error) {
        console.error('Error fetching template data:', error);
      }
    };

    const initializeForm = async () => {
      const categoriesData = await fetchCategories();

      if (isEditMode) {
        await fetchTemplateData(templateId);
      } else {
        if (categoriesData.length > 0) {
          setCategoryId(categoriesData[0].id);
        }
      }
    };

    initializeForm();
  }, [templateId, isEditMode]);

  // --- Field Handlers ---
  const handleDefaultFieldChange = (id, prop, value) => {
    setDefaultFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [prop]: value } : f)),
    );
  };

  const handleSaveDefaultFieldInfo = (id, data) => {
    setDefaultFields((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, name: data.name, desc: data.desc } : f,
      ),
    );
  };

  const handleCustomFieldChange = (id, prop, value) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [prop]: value } : f)),
    );
  };

  const handleOpenAddFieldModal = () => {
    setIsAddFieldModalOpen(true);
  };

  const handleAddFieldSelection = (type) => {
    setIsAddFieldModalOpen(false); // 모달 닫기

    if (type === 'custom') {
      // '새 항목 직접 만들기'를 선택한 경우, 기존의 커스텀 필드 생성 모달을 엽니다.
      handleOpenCustomFieldModal(null);
    } else {
      // 기본 컴포넌트(text, date 등)를 선택한 경우, 해당 컴포넌트를 바로 필드에 추가합니다.
      addComponentFromLibrary(type);
    }
  };

  const handleOpenCustomFieldModal = (field = null) => {
    setEditingField(field);
    setIsCustomFieldModalOpen(true);
  };

  const handleOpenInfoChangeModal = (field) => {
    setEditingField(field);
    setIsInfoChangeModalOpen(true);
  };

  const handleSaveCustomField = (fieldData) => {
    if (editingField) {
      // Update existing field
      setCustomFields((prev) =>
        prev.map((f) => (f.id === fieldData.id ? fieldData : f)),
      );
    } else {
      // Add new field
      const newField = {
        ...fieldData,
        id: `custom_${Date.now()}`,
      };
      setCustomFields((prev) => [...prev, newField]);
    }
  };

  const removeCustomField = (id) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  const moveCustomField = useCallback((dragIndex, hoverIndex) => {
    setCustomFields((prev) => {
      const newFields = [...prev];
      const [draggedItem] = newFields.splice(dragIndex, 1);
      newFields.splice(hoverIndex, 0, draggedItem);
      return newFields;
    });
  }, []);

  const addComponentFromLibrary = (componentType) => {
    // componentLibrary에서 선택된 타입에 맞는 정보를 찾습니다.
    const component = componentLibrary.find((c) => c.id === componentType);
    if (!component) return;

    const newField = {
      id: `custom_${Date.now()}`,
      libraryId: component.id,
      type: component.id, // type을 libraryId와 동일하게 설정 (예: 'text', 'date_ymd')
      header: component.name,
      description: '',
      required: false,
    };
    setCustomFields((prev) => [...prev, newField]);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      await Swal.fire('입력 필요', '양식명을 입력해주세요.', 'warning');
      return;
    }
    if (!categoryId) {
      await Swal.fire('선택 필요', '카테고리를 선택해주세요.', 'warning');
      return;
    }
    // 1. Nest all form builder data into a 'template' object
    const content = [...customFields];
    if (useEditor === 'Y') {
      content.push({ type: 'editor', value: editorContent });
    }

    const templateData = {
      title,
      description,
      tags,
      useEditor,
      requireAttachment,
      defaultFields: defaultFields.filter((f) => f.enabled),
      content,
    };

    // 2. Final payload matches backend DTO
    const payload = {
      categoryId: Number(categoryId),
      template: templateData,
    };

    console.log(
      '서버로 전송하는 최종 데이터(payload):',
      JSON.stringify(payload, null, 2),
    );

    try {
      if (isEditMode) {
        const response = await axiosInstance.put(
          `${API_BASE_URL}${APPROVAL_SERVICE}/templates/${templateId}`,
          payload,
        );
        console.log('Server response:', response.data);
      } else {
        const response = await axiosInstance.post(
          `${API_BASE_URL}${APPROVAL_SERVICE}/templates/create`,
          payload,
        );
        console.log('Server response:', response.data);
      }
      await Swal.fire('성공', '템플릿이 저장되었습니다.', 'success');
      navigate('/approval/admin/templates');
    } catch (error) {
      console.error(
        'Failed to save template:',
        error.response ? error.response.data : error.message,
      );
      alert('템플릿 저장에 실패했습니다.');
    }
  };

  // --- Render Methods ---
  const renderUnifiedPane = () => (
    <div className={styles.unifiedPane}>
      {/* 1. 추가 입력 정보(커스텀 필드) - 순서 변경: 이 부분이 먼저 오도록 이동 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>추가 입력 정보</h2>
        <div className={styles.infoNotice}>
          <span className={styles.infoIcon}>ℹ️</span>모든 결재 양식에는{' '}
          <b>[제목, 수신참조, 참조문서, 시행자]</b>가 자동 포함됩니다.
        </div>
        <div className={styles.infoNotice}>
          <span className={styles.infoIcon}>➕</span>필요하다면 결재 양식에 맞는
          입력 항목을 추가하세요.
        </div>
        <DndProvider backend={HTML5Backend}>
          {customFields.map((field, index) => (
            <DraggableField
              key={field.id}
              index={index}
              field={field}
              moveField={moveCustomField}
            >
              <div className={styles.fieldItem}>
                <div className={styles.fieldHeader}>
                  <span className={styles.fieldName}>{field.header}</span>
                  <span className={styles.fieldDesc}>{field.description}</span>
                </div>
                <div className={styles.fieldControls}>
                  <button
                    className={styles.controlButton}
                    onClick={() => handleOpenCustomFieldModal(field)}
                  >
                    수정
                  </button>
                  <button
                    className={`${styles.controlButton} ${styles.danger}`}
                    onClick={() => removeCustomField(field.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </DraggableField>
          ))}
        </DndProvider>
        <button className={styles.addButton} onClick={handleOpenAddFieldModal}>
          + 입력정보 추가
        </button>
      </section>

      {/* 2. 양식 정보 입력 - 순서 변경: 이 부분이 뒤로 이동 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>양식 정보 입력</h2>
        <div className={styles.formGroup}>
          <label>
            양식명 <span className={styles.required}>*</span>
          </label>
          <input
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='예: 휴가 신청서'
          />
        </div>
        <div className={styles.formGroup}>
          <label>
            카테고리 <span className={styles.required}>*</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value='' disabled>
              카테고리 선택
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.categoryName}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>양식설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='이 양식의 용도나 안내사항을 입력하세요'
          />
        </div>
      </section>
    </div>
  );

  return (
    <div className={styles.formBuilderPage}>
      <div className={styles.mainContent}>{renderUnifiedPane()}</div>
      <div className={styles.footer}>
        <button
          className={styles.cancelButton}
          onClick={() => navigate('/approval/admin/templates')}
        >
          취소
        </button>
        <button className={styles.saveButton} onClick={handleSave}>
          저장
        </button>
      </div>
      <CustomFieldModal
        isOpen={isCustomFieldModalOpen}
        onClose={() => setIsCustomFieldModalOpen(false)}
        onSave={handleSaveCustomField}
        field={editingField}
      />
      <InfoChangeModal
        isOpen={isInfoChangeModalOpen}
        onClose={() => setIsInfoChangeModalOpen(false)}
        onSave={handleSaveDefaultFieldInfo}
        field={editingField}
      />
      <AddFieldModal
        isOpen={isAddFieldModalOpen}
        onClose={() => setIsAddFieldModalOpen(false)}
        onSelect={handleAddFieldSelection}
      />
    </div>
  );
};

export default TemplateForm;
