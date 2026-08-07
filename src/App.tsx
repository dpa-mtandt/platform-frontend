import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute, RequireModule, RequirePermission } from '@/routes/guards';
import AppShell from '@/components/layout/app-shell';
import LoginPage from '@/pages/login';
import LauncherPage from '@/pages/launcher';
import { useAuth } from '@/context/auth-context';
import ProfilePage from '@/pages/profile';
import ReportsPage from '@/modules/reports/pages/reports-page';
import LmsCatalog from '@/modules/lms/pages/lms-catalog';
import CourseDetail from '@/modules/lms/pages/course-detail';
import CoursePlayer from '@/modules/lms/pages/course-player';
import QuizAttempt from '@/modules/lms/pages/quiz-attempt';
import Certificates from '@/modules/lms/pages/certificates';
import CertificateDetail from '@/modules/lms/pages/certificate-detail';
import ManageCourses from '@/modules/lms/pages/admin/manage-courses';
import CourseEditor from '@/modules/lms/pages/admin/course-editor';
import ManageQuizzes from '@/modules/lms/pages/admin/manage-quizzes';
import QuizEditor from '@/modules/lms/pages/admin/quiz-editor';
import DownloadRequests from '@/modules/lms/pages/admin/download-requests';
import DashboardHome from '@/modules/dashboard/pages/dashboard-home';
import DashboardViewer from '@/modules/dashboard/pages/dashboard-viewer';
import ManageDashboards from '@/modules/dashboard/pages/manage-dashboards';
import FeedbackHome from '@/modules/feedback/pages/feedback-home';
import GiveFeedback from '@/modules/feedback/pages/give-feedback';
import FeedbackReports from '@/modules/feedback/pages/feedback-reports';
import FeedbackManage from '@/modules/feedback/pages/feedback-manage';
import AdminLayout from '@/pages/admin/admin-layout';
import AdminUsers from '@/pages/admin/admin-users';
import AdminRoles from '@/pages/admin/admin-roles';
import AdminModules from '@/pages/admin/admin-modules';
import AdminOrg from '@/pages/admin/admin-org';
import AdminAudit from '@/pages/admin/admin-audit';

export default function App() {
  const { profile } = useAuth();
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Authenticated app */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<LauncherPage />} />
          <Route path="profile" element={<ProfilePage />} />

          {/* Business modules — each gated by module access (403 on direct URL if not granted) */}
          <Route element={<RequireModule moduleKey="LMS" />}>
            <Route path="lms" element={<LmsCatalog />} />
            <Route path="lms/course/:slug" element={<CourseDetail />} />
            <Route path="lms/learn/:slug" element={<CoursePlayer />} />
            <Route path="lms/quiz/:id" element={<QuizAttempt />} />
            <Route path="lms/certificates" element={<Certificates />} />
            <Route path="lms/certificates/:certificateNo" element={<CertificateDetail />} />

            {/* Authoring (course/quiz managers only) */}
            <Route element={<RequirePermission anyOf={['lms.course.manage']} />}>
              <Route path="lms/manage/courses" element={<ManageCourses />} />
              <Route path="lms/manage/courses/new" element={<CourseEditor />} />
              <Route path="lms/manage/courses/:slug/edit" element={<CourseEditor />} />
            </Route>
            <Route element={<RequirePermission anyOf={['lms.quiz.manage']} />}>
              <Route path="lms/manage/quizzes" element={<ManageQuizzes />} />
              <Route path="lms/manage/quizzes/new" element={<QuizEditor />} />
              <Route path="lms/manage/quizzes/:id/edit" element={<QuizEditor />} />
            </Route>
            <Route element={<RequirePermission anyOf={['lms.download.approve']} />}>
              <Route path="lms/manage/download-requests" element={<DownloadRequests />} />
            </Route>
          </Route>
          <Route element={<RequireModule moduleKey="DASHBOARD" />}>
            <Route path="dashboard" element={<DashboardHome />} />
            <Route element={<RequirePermission anyOf={['dashboard.manage']} />}>
              <Route path="dashboard/manage" element={<ManageDashboards />} />
            </Route>
            <Route path="dashboard/:id" element={<DashboardViewer />} />
          </Route>
          <Route element={<RequireModule moduleKey="FEEDBACK" />}>
            <Route path="feedback" element={<FeedbackHome />} />
            <Route element={<RequirePermission anyOf={['feedback.submit']} />}>
              <Route path="feedback/give" element={<GiveFeedback />} />
            </Route>
            <Route element={<RequirePermission anyOf={['feedback.view']} />}>
              <Route path="feedback/reports" element={<FeedbackReports />} />
            </Route>
            <Route element={<RequirePermission anyOf={['feedback.manage']} />}>
              <Route path="feedback/manage" element={<FeedbackManage />} />
            </Route>
          </Route>
          <Route element={<RequireModule moduleKey="REPORTS" />}>
            <Route element={<RequirePermission anyOf={['reports.view']} />}>
              <Route path="reports" element={<ReportsPage />} />
            </Route>
          </Route>

          {/* Admin console */}
          <Route element={<RequireModule moduleKey="PLATFORM" />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/users" replace />} />
              <Route element={<RequirePermission anyOf={['platform.users.view']} />}>
                <Route path="users" element={<AdminUsers />} />
              </Route>
              <Route element={<RequirePermission anyOf={['platform.roles.view']} />}>
                <Route path="roles" element={<AdminRoles />} />
              </Route>
              <Route element={<RequirePermission anyOf={['platform.modules.view']} />}>
                <Route path="modules" element={<AdminModules />} />
              </Route>
              <Route element={<RequirePermission anyOf={['platform.org.manage']} />}>
                <Route path="organization" element={<AdminOrg />} />
              </Route>
              <Route element={<RequirePermission anyOf={['platform.audit.view']} />}>
                <Route path="audit" element={<AdminAudit />} />
              </Route>
            </Route>
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route
  path="*"
  element={
    profile ? (
      <Navigate to="/" replace />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>
    </Routes>
  );
}
