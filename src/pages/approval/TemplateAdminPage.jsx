import React, { useState, useEffect, useCallback } from 'react';
import styles from './TemplateAdminPage.module.scss';
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import CategoryModal from '../../components/approval/CategoryModal';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const TemplateAdminPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [allTemplates, setAllTemplates] = useState([]); // 모든 템플릿 원본
  const [filteredTemplates, setFilteredTemplates] = useState([]); // 화면에 표시될 템플릿

  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'ACTIVE', 'INACTIVE'

  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/category`);
      console.log('서버에서 받은 카테고리 목록:', res.data);
      setCategories(res.data?.result || []);
    } catch (err) {
      setError('카테고리 목록을 불러오는 데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    // 카테고리 또는 전체 템플릿 목록이 변경될 때 필터링 다시 적용
    const applyFilters = () => {
      let templates = allTemplates;

      // 1. 카테고리 필터
      if (selectedCategory) {
        templates = templates.filter(t => t.categoryId === selectedCategory);
      }

      // 2. 상태 필터 (API에 status 필드가 추가되어야 함)
      // 현재는 임시로 모든 템플릿에 'ACTIVE' 상태가 있다고 가정
      if (statusFilter !== 'ALL') {
        templates = templates.filter(t => (statusFilter === 'ACTIVE' ? t.status === 'Y' : t.status === 'N'));
      }

      // 3. 검색어 필터
      if (searchTerm) {
        templates = templates.filter(t =>
          (t.template.title && t.template.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (t.template.description && t.template.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      setFilteredTemplates(templates);
    };

    applyFilters();
  }, [selectedCategory, statusFilter, searchTerm, allTemplates]);


  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setTemplatesLoading(true);
        const res = await axiosInstance.get(`${API_BASE_URL}${APPROVAL_SERVICE}/templates/list`);
        setAllTemplates(res.data?.result || []);

      } catch (err) {
        setTemplatesError('양식 목록을 불러오는 데 실패했습니다.');
        console.error(err);
      } finally {
        setTemplatesLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (categoryData, isDelete = false) => {
    try {
      if (isDelete) {
        const result = await Swal.fire({
          title: '정말로 이 카테고리를 삭제하시겠습니까?',
          text: '해당 카테고리에 포함된 템플릿도 함께 삭제됩니다.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: '예',
          cancelButtonText: '아니요',
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
        });

        if (!result.isConfirmed) return;

        await axiosInstance.delete(`${API_BASE_URL}${APPROVAL_SERVICE}/category/${editingCategory.id}`);
        await Swal.fire({
          icon: 'success',
          title: '삭제 완료',
          text: '카테고리가 삭제되었습니다.',
        });
      } else if (editingCategory && editingCategory.id) {
        await axiosInstance.put(`${API_BASE_URL}${APPROVAL_SERVICE}/category/${editingCategory.id}`, categoryData);
        await Swal.fire('수정 완료', '카테고리가 수정되었습니다.', 'success');
      } else {
        await axiosInstance.post(`${API_BASE_URL}${APPROVAL_SERVICE}/category/create`, categoryData);
        await Swal.fire('등록 완료', '카테고리가 추가되었습니다.', 'success');
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      Swal.fire('오류', '카테고리 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDelete = async (templateId) => {
    const result = await Swal.fire({
      title: '정말로 이 템플릿을 삭제하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '예',
      cancelButtonText: '아니요',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });

    if (!result.isConfirmed) return;

    try {
      await axiosInstance.delete(`${API_BASE_URL}${APPROVAL_SERVICE}/templates/${templateId}`);
      await Swal.fire('삭제 완료', '템플릿이 삭제되었습니다.', 'success');
      setAllTemplates(prevTemplates => prevTemplates.filter(t => t.templateId !== templateId));
    } catch (error) {
      console.error('Failed to delete template:', error);
      Swal.fire('삭제 실패', '템플릿 삭제에 실패했습니다.', 'error');
    }
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const renderCategoryList = () => {
    if (loading) {
      return <li key="loading">로딩 중...</li>;
    }
    if (error) {
      return <li key="error" className={styles.error}>{error}</li>;
    }
    if (categories.length === 0) {
      return <li key="no-category">카테고리가 없습니다.</li>;
    }

    return [
      <li
        key="all"
        className={`${styles.categoryItem} ${selectedCategory === null ? styles.active : ''}`}
        onClick={() => handleCategoryClick(null)}
      >
        전체
      </li>,
      ...categories.map((cat) => (
        <li
          key={cat.id}
          className={`${styles.categoryItem} ${selectedCategory === cat.id ? styles.active : ''}`}
          onClick={() => handleCategoryClick(cat.id)}
        >
          <div className={styles.categoryInfo}>
            <span className={styles.categoryName}>{cat.categoryName}</span>
            {cat.categoryDescription && <span className={styles.categoryDesc}>{cat.categoryDescription}</span>}
          </div>
          <button
            className={styles.editButton}
            onClick={(e) => {
              e.stopPropagation(); // li의 onClick 이벤트 전파 방지
              handleOpenEditModal(cat);
            }}
          >
            수정
          </button>
        </li>
      )),
    ];
  };

  return (
    <div className={styles.pageContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h4>카테고리</h4>
        </div>
        <ul className={styles.categoryList}>
          {renderCategoryList()}
        </ul>
        <button onClick={handleOpenCreateModal} className={styles.addCategoryButton}>+ 카테고리 추가</button>
      </aside>
      <main className={styles.mainContent}>
        <div className={styles.mainHeader}>
          <h2>문서양식관리</h2>
          {/* <p>결재양식을 생성하고 관리합니다.</p> */}
        </div>
        <div className={styles.controls}>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="카테고리, 문서명으로 검색하세요."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.filterTabs}>
            <button
              className={statusFilter === 'ALL' ? styles.active : ''}
              onClick={() => setStatusFilter('ALL')}
            >
              전체
            </button>
          </div>
          <div className={styles.actions}>
            <button className={styles.addButton} onClick={() => navigate('/approval/admin/templates/new')}>+ 양식 추가하기</button>
          </div>
        </div>
        <div className={styles.templateListContainer}>
          {templatesLoading && <p>로딩 중...</p>}
          {templatesError && <p className={styles.error}>{templatesError}</p>}
          {!templatesLoading && !templatesError && filteredTemplates.map(template => (
            <div key={template.templateId} className={styles.templateItem}>
              <div className={styles.checkboxContainer}>
                <input type="checkbox" />
              </div>
              <div className={styles.templateDetails}>
                <div className={styles.templateTitle}>
                  {template.template.title}

                </div>
                <div className={styles.templateDescription}>
                  {template.template.description}
                </div>
              </div>
              <div className={styles.templateActions}>
                <button onClick={() => navigate(`/approval/admin/templates/edit/${template.templateId}`)}>수정</button>
                <button onClick={() => handleDelete(template.templateId)} className={styles.deleteButton}>삭제</button>
              </div>
            </div>
          ))}
          {!templatesLoading && filteredTemplates.length === 0 && (
            <div className={styles.noResults}>
              <p>표시할 문서 양식이 없습니다.</p>
            </div>
          )}
        </div>
      </main>
      <CategoryModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveCategory}
        category={editingCategory}
      />
    </div>
  );
};

export default TemplateAdminPage; 