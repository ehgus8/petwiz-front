import React from 'react';
import { Navigate } from 'react-router-dom';

// --- 필요한 모든 페이지/컴포넌트들을 import 합니다 ---
// 공통
import Login from '../components/Login';
import MainLayout from '../components/MainLayout';

// HR
import HRPage from '../pages/hr/HRPage';
import EmployeeList from '../pages/hr/EmployeeList';
import EmployeeRegister from '../pages/hr/EmployeeRegister';
import EmployeeEdit from '../pages/hr/EmployeeEdit';
import EvaluationForm from '../pages/hr/EvaluationForm';
import EmployeeViewList from '../pages/hr/EmployeeViewList';
import MyEvaluationList from '../pages/hr/MyEvaluationList';

// 전자결재
import ApprovalPage from '../pages/approval/ApprovalPage';
import ApprovalHome from '../pages/approval/ApprovalHome';
import ApprovalNew from '../pages/approval/ApprovalNew';
import ApprovalDetail from '../pages/approval/ApprovalDetail';
import DraftBoxList from '../pages/approval/DraftBoxList';
import ApprovalInProgressBox from '../pages/approval/ApprovalInProgressBox';
import CompletedBox from '../pages/approval/CompletedBox';
import RejectedBox from '../pages/approval/RejectedBox';
import CcBox from '../pages/approval/CcBox';
import ApprovalPendingList from '../pages/approval/ApprovalPendingList';
import TemplateAdminPage from '../pages/approval/TemplateAdminPage';
import TemplateForm from '../pages/approval/TemplateForm';
import AdminRoute from './AdminRoute';
import ApprovalScheduled from "../pages/approval/ScheduledBox";
// (사용하지 않는 ApprovalForm, TemplateList 등은 제외했습니다)

// 공지사항
import NoticeBoardList from '../pages/NoticeBoard/NoticeBoardList';
import NoticeBoardWrite from '../pages/NoticeBoard/NoticeBoardWrite';
import CommunityWrite from '../pages/NoticeBoard/CommunityWrite';
import NoticeBoardDetail from '../pages/NoticeBoard/NoticeBoardDetail';
import CommunityDetail from '../pages/NoticeBoard/CommunityDetail';
import NoticeAlertPage from '../pages/NoticeBoard/NoticeAlertPage';
import CommunityPostsPage from '../pages/NoticeBoard/CommunityPostsPage';
import CommunityReport from '../pages/NoticeBoard/CommunityReport';
import AdminReportList from '../pages/NoticeBoard/AdminReportList';


// 주소록
import ContactList from '../pages/contacts/ContactList';

//직원 관리
import ImportEmployee from '../pages/hr/ImportEmployee';

// 라우팅 설정 객체 배열
const AppRouter = [
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: 'dashboard', element: <HRPage /> },

      // --- HR 라우트 (누락되었던 부분 추가) ---
      {
        path: 'hr',
        children: [
          { index: true, element: <EmployeeList /> }, // '/hr' 접속 시 기본 페이지
          { path: 'employee-list', element: <EmployeeList /> },
          { path: 'employee-register', element: <EmployeeRegister /> },
          { path: 'employee-edit', element: <EmployeeEdit /> },
          { path: 'employee-eval', element: <EvaluationForm /> },
          { path: 'employee-eval-list', element: <EmployeeViewList /> },
          { path: 'my-evaluations', element: <MyEvaluationList /> },
          { path: 'import-employee', element: <ImportEmployee /> },
        ],
      },

      // --- 전자결재 라우트 ---
      {
        path: 'approval',
        element: <ApprovalPage />,
        children: [
          { index: true, element: <Navigate to='home' replace /> },
          { path: 'home', element: <ApprovalHome /> },
          { path: 'new', element: <ApprovalNew /> },
          { path: 'reports/new/:templateId', element: <ApprovalNew /> },
          { path: 'edit/:reportId', element: <ApprovalNew /> },
          { path: 'drafts', element: <DraftBoxList /> },
          { path: 'in-progress', element: <ApprovalInProgressBox /> },
          { path: 'completed', element: <CompletedBox /> },
          { path: 'rejected', element: <RejectedBox /> },
          { path: 'cc', element: <CcBox /> },
          { path: 'pending', element: <ApprovalPendingList /> },
          { path: 'reports/:reportId', element: <ApprovalDetail /> },
          {
            element: <AdminRoute />,
            children: [
              { path: 'admin/templates', element: <TemplateAdminPage /> },
              { path: 'admin/templates/new', element: <TemplateForm /> },
              {
                path: 'admin/templates/edit/:templateId',
                element: <TemplateForm />,
              },
            ],
          },
        ],
      },

      // --- 공지사항 라우트 (누락되었던 부분 추가) ---
      {
        path: 'notice',
        children: [
          { index: true, element: <NoticeBoardList /> }, // '/noticeboard' 접속 시 기본 페이지
          { path: 'my', element: <NoticeBoardList /> },
          { path: 'schedule', element: <NoticeBoardList /> },
          { path: 'write', element: <NoticeBoardWrite isEdit={false} /> },
          { path: 'edit/:noticeId', element: <NoticeBoardWrite isEdit={true} /> },
          { path: ':noticeId', element: <NoticeBoardDetail /> },
          { path: 'alert', element: <NoticeAlertPage /> },
          { path: ':noticeId', element: <NoticeBoardDetail /> },
        ],
      },
      {
        path: 'community',
        children: [
          { index: true, element: <CommunityPostsPage /> }, // '/noticeboard' 접속 시 기본 페이지
          { path: 'my', element: <CommunityPostsPage /> },
          { path: 'mydepartment', element: <CommunityPostsPage /> },
          { path: 'write', element: <CommunityWrite isEdit={false} /> },
          {
            path: 'edit/:communityId',
            element: <CommunityWrite isEdit={true} />,
          },
          { path: ':communityId', element: <CommunityDetail /> },
        ],
      },
      {
        path: 'report',
        children: [
          { index: true, element: <AdminReportList /> }, // '/noticeboard' 접속 시 기본 페이지
          { path: 'admin/list', element: <AdminReportList /> },
          // { path: 'admin', element: <CommunityPostsPage /> },
          // { path: 'write', element: <CommunityWrite isEdit={false} /> },
          // {
          //   path: 'edit/:communityId',
          //   element: <CommunityWrite isEdit={true} />,
          // },
          { path: ':communityId', element: <CommunityReport /> },
        ],
      },

      // --- 주소록 라우트 (누락되었던 부분 추가) ---
      { path: 'contacts', element: <ContactList /> },
    ],
  },

  // --- 빈 경로들 (필요시 구현) ---
  { path: 'mail', element: <></> },
  { path: 'board', element: <></> },
];

export default AppRouter;