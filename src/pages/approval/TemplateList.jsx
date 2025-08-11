import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, APPROVAL_SERVICE } from '../../configs/host-config';
import styles from './TemplateList.module.scss';
import ListSkeleton from '../../components/common/Skeleton';
import { UserContext } from '../../context/UserContext';
import Swal from 'sweetalert2';

const TemplateList = () => {
  const navigate = useNavigate();
  const { userRole } = useContext(UserContext);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}${APPROVAL_SERVICE}/templates/list`,
      );
      console.log("템플릿 목록 API 응답:", res.data.result); // <--- 이 로그!

      // API 명세에 따라 'data' 키에서 배열을 가져오도록 수정
      console.log(res.data.result);
      if (res.data && Array.isArray(res.data.result)) {
        setTemplates(res.data.result);
      } else {
        setTemplates([]);
      }
    } catch (err) {
      setError('템플릿 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (templateId) => {
    const result = await Swal.fire({
      title: '정말로 이 템플릿을 삭제하시겠습니까?',
      text: '삭제 후 복구할 수 없습니다.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(
          `${API_BASE_URL}${APPROVAL_SERVICE}/templates/${templateId}`,
        );
        await Swal.fire('삭제됨', '템플릿이 삭제되었습니다.', 'success');
        fetchTemplates();
      } catch (err) {
        await Swal.fire('오류', '삭제 중 오류가 발생했습니다.', 'error');
      }
    }
  };

  if (loading) return <ListSkeleton items={6} />;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>보고서 템플릿 관리</h2>
        {userRole === 'ADMIN' && (
          <button
            onClick={() => navigate('/approval/templates/form')}
            className={styles.addButton}
          >
            + 새 템플릿 추가
          </button>
        )}
      </div>
      <ul className={styles.templateList}>
        {templates.length > 0 ? (
          templates.map((template) => (
            <li key={template.templateId} className={styles.templateItem}>
              <div className={styles.templateInfo}>
                <h3>{template.template.title}</h3>
                <p>{template.template.description}</p>
              </div>
              <div className={styles.buttonGroup}>
                <button
                  onClick={() =>
                    navigate(`/approval/reports/new/${template.templateId}`)
                  }
                  className={styles.useButton}
                >
                  사용
                </button>
                {userRole === 'ADMIN' && (
                  <>
                    <button
                      onClick={() =>
                        navigate(
                          `/approval/admin/templates/edit/${template.templateId}`,
                        )
                      }
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(template.templateId)}
                      className={styles.deleteButton}
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>
            </li>
          ))
        ) : (
          <p>생성된 템플릿이 없습니다.</p>
        )}
      </ul>
    </div>
  );
};

export default TemplateList;
