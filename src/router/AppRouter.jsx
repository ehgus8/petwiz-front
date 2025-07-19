import React, { useContext } from 'react';
import Home from '../components/Home';
import { Route, Routes, Navigate } from 'react-router-dom';
import PrivateRouter from './PrivateRouter';
import { UserContext } from '../context/UserContext';
import Login from '../components/Login';
import MainLayout from '../components/MainLayout';
import HRPage from '../pages/hr/HRPage';
import EmployeeDetail from '../pages/hr/EmployeeDetail';
import EmployeeRegister from '../pages/hr/EmployeeRegister';
import EmployeeEdit from '../pages/hr/EmployeeEdit';
import EmployeeList from '../pages/hr/EmployeeList';
import EvaluationForm from '../pages/hr/EvaluationForm';
import NoticeBoardList from '../pages/NoticeBoard/NoticeBoardList';
import NoticeBoardWrite from '../pages/NoticeBoard/NoticeBoardWrite';
import NoticeBoardDetail from '../pages/NoticeBoard/NoticeBoardDetail';
import NoticeAlertPage from '../pages/NoticeBoard/NoticeAlertPage';
import EmployeeViewList from '../pages/hr/EmployeeViewList';
import ContactList from '../pages/contacts/ContactList';
import MyEvaluationList from '../pages/hr/MyEvaluationList';
import ApprovalPage from '../pages/approval/ApprovalPage';
import ApprovalBoxList from '../pages/approval/ApprovalBoxList';
import ApprovalPendingList from '../pages/approval/ApprovalPendingList';
import ApprovalDetail from '../pages/approval/ApprovalDetail';
import TemplateList from '../pages/approval/TemplateList';
import DraftBoxList from '../pages/approval/DraftBoxList';
import ApprovalForm from '../pages/approval/ApprovalForm';
import TemplateForm from '../pages/approval/TemplateForm';
import ApprovalHome from '../pages/approval/ApprovalHome';
import CompletedBox from '../pages/approval/CompletedBox';
import CcBox from '../pages/approval/CcBox';
import MyReportsList from '../pages/approval/MyReportsList';
import ApprovalNew from '../pages/approval/ApprovalNew';
import TemplateAdminPage from '../pages/approval/TemplateAdminPage';
import AdminRoute from './AdminRoute';
import RejectedBox from '../pages/approval/RejectedBox';

const AppRouter = () => {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <Routes>
      <Route path='/' element={<Login />} />
      <Route element={<MainLayout />}>       
        <Route path='/dashboard' element={<HRPage />} />
        <Route path='/hr' element={<EmployeeList />} />
        <Route path='/hr/employee-list' element={<EmployeeList />} />
        <Route path='/hr/employee-register' element={<EmployeeRegister />} />
        <Route path='/hr/employee-edit' element={<EmployeeEdit />} />
        <Route path='/hr/employee-eval' element={<EvaluationForm />} />
        <Route path='/hr/employee-eval-list' element={<EmployeeViewList />} />
        <Route path='/hr/my-evaluations' element={<MyEvaluationList />} />

        <Route path='/approval' element={<ApprovalPage />}>
          <Route index element={<Navigate to='home' replace />} />
          <Route path='home' element={<ApprovalHome />} />
          <Route path='new' element={<ApprovalNew />} /> {/* 새 문서 작성 */}
          <Route path='reports/new/:templateId' element={<ApprovalNew />} /> {/* 템플릿 기반 새 문서 작성 */}
          <Route path='edit/:reportId' element={<ApprovalNew />} /> {/* 임시 저장 문서 수정 */}
          <Route path='drafts' element={<DraftBoxList />} />
          <Route path='in-progress' element={<MyReportsList />} />
          <Route path='completed' element={<CompletedBox />} />
          <Route path='rejected' element={<RejectedBox />} />
          <Route path='cc' element={<CcBox />} />
          <Route path='pending' element={<ApprovalPendingList />} />
          <Route path='reports/:reportId' element={<ApprovalDetail />} />
          <Route path='templates/list' element={<TemplateList />} />
          <Route path='templates/form' element={<TemplateForm />} />
          <Route path='templates/form/:templateId' element={<TemplateForm />} />
          <Route path='templates/edit/:templateId' element={<TemplateForm />} />
          
          <Route element={<AdminRoute />}>
            <Route path='admin/templates' element={<TemplateAdminPage />} />
            <Route path='admin/templates/new' element={<TemplateForm />} />
            <Route path='admin/templates/edit/:templateId' element={<TemplateForm />} />
          </Route>
        </Route>

        <Route path='/noticeboard' element={<NoticeBoardList />} />
        <Route path='/noticeboard/my' element={<NoticeBoardList />} />
        <Route path='/noticeboard/mydepartment' element={<NoticeBoardList />} />
        <Route
          path='/noticeboard/write'
          element={<NoticeBoardWrite isEdit={false} />}
        />
        <Route
          path='/noticeboard/edit/:id'
          element={<NoticeBoardWrite isEdit={true} />}
        />
        <Route path='/noticeboard/alert' element={<NoticeAlertPage />} />
        <Route path='/noticeboard/:id' element={<NoticeBoardDetail />} />
        <Route path='/mail' element={<></>} />
        <Route path='/board' element={<></>} />
        <Route path='/contacts' element={<ContactList />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;
