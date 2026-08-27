import { useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider, useNotifications } from "./contexts/NotificationContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Auth & Layout (statiques - chargés immédiatement, sans Suspense)
import { LoginForm } from "./components/auth/LoginForm";
import { RegisterForm } from "./components/auth/RegisterForm";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LandingPage } from "./components/landing/LandingPage";
import { AdminDashboardLayout } from "./components/admin/layout/AdminDashboardLayout";
import { LegalDocumentPage } from "./components/legal/LegalDocumentPage";
import { PageTransition } from "./components/ui/PageTransition";

// Pages protégées (Lazy Loading - chargées uniquement si l'utilisateur est connecté)
const HomePage = lazy(() => import("./components/home/HomePage").then(m => ({ default: m.HomePage })));
const ProfilePage = lazy(() => import("./components/profile/ProfilePage").then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import("./components/profile/SettingsPage").then(m => ({ default: m.SettingsPage })));
const AccountDetailsPage = lazy(() => import("./components/profile/AccountDetailsPage").then(m => ({ default: m.AccountDetailsPage })));
const QuizzesPage = lazy(() => import("./components/quizzes/QuizzesPage").then(m => ({ default: m.QuizzesPage })));
const CreateQuizPage = lazy(() => import("./components/quizzes/CreateQuizPage").then(m => ({ default: m.CreateQuizPage })));
const EditQuizPage = lazy(() => import("./components/quizzes/EditQuizPage").then(m => ({ default: m.EditQuizPage })));
const PlayQuizPage = lazy(() => import("./components/quizzes/PlayQuizPage").then(m => ({ default: m.PlayQuizPage })));
const TrainingModePage = lazy(() => import("./components/quizzes/TrainingModePage").then(m => ({ default: m.TrainingModePage })));
const LeaderboardPage = lazy(() => import("./components/leaderboard/LeaderboardPage").then(m => ({ default: m.LeaderboardPage })));
const FriendsPage = lazy(() => import("./components/friends/FriendsPage").then(m => ({ default: m.FriendsPage })));
const DuelsPage = lazy(() => import("./components/duels/DuelsPage").then(m => ({ default: m.DuelsPage })));
const ChatPage = lazy(() => import("./components/chat/ChatPage").then(m => ({ default: m.ChatPage })));

// Admin Pages (Lazy Loading)
const AdminPage = lazy(() => import("./components/admin/AdminPage").then(m => ({ default: m.AdminPage })));
const BadgeManagementPage = lazy(() => import("./components/admin/BadgeManagementPage").then(m => ({ default: m.BadgeManagementPage })));
const TitleManagementPage = lazy(() => import("./components/admin/TitleManagementPage").then(m => ({ default: m.TitleManagementPage })));
const CategoryManagementPage = lazy(() => import("./components/admin/CategoryManagementPage").then(m => ({ default: m.CategoryManagementPage })));
const DifficultyManagementPage = lazy(() => import("./components/admin/DifficultyManagementPage").then(m => ({ default: m.DifficultyManagementPage })));
const QuizValidationPage = lazy(() => import("./components/admin/QuizValidationPage").then(m => ({ default: m.QuizValidationPage })));
const WarningsManagementPage = lazy(() => import("./components/admin/WarningsManagementPage").then(m => ({ default: m.WarningsManagementPage })));
const QuizTypeManagementPage = lazy(() => import("./components/admin/QuizTypeManagementPage").then(m => ({ default: m.QuizTypeManagementPage })));
const UserManagementPage = lazy(() => import("./components/admin/UserManagementPage").then(m => ({ default: m.UserManagementPage })));
const QuizManagementPage = lazy(() => import("./components/admin/QuizManagementPage").then(m => ({ default: m.QuizManagementPage })));
const DuelFeaturesPage = lazy(() => import("./components/admin/DuelFeaturesPage").then(m => ({ default: m.DuelFeaturesPage })));
const GeoJsonMapsManagementPage = lazy(() => import("./components/admin/GeoJsonMapsManagementPage").then(m => ({ default: m.GeoJsonMapsManagementPage })));
const AdminAnalyticsPage = lazy(() => import("./components/admin/AdminAnalyticsPage").then(m => ({ default: m.AdminAnalyticsPage })));

// Loader affiché pendant le chargement des pages lazy
function PageLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-700 text-lg font-medium">Chargement...</p>
      </div>
    </div>
  );
}

// Wrapper Suspense pour chaque page lazy individuelle
function Lazy({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <PageTransition>{children}</PageTransition>
    </Suspense>
  );
}

function AppContent() {
  const { user } = useAuth();
  const { setNavigationCallback } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setNavigationCallback((view: string, data?: any) => {
      if (view === "duels") {
        navigate("/duels", { state: data });
      } else if (view === "chat" && data?.friendId) {
        navigate(`/chat/${data.friendId}`);
      } else {
        navigate(`/${view}`);
      }
    });
  }, [navigate, setNavigationCallback]);

  return (
    // PAS de Suspense global ici - chaque route lazy a le sien
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
      {/* ── Routes publiques ── statiques, transition immédiate */}
      <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/terra" replace />} />

      <Route path="/login" element={!user ? (
        <PageTransition>
          <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md mx-auto">
              <button onClick={() => navigate("/")} className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center mb-4">
                ← Retour à l'accueil
              </button>
              <LoginForm onSwitchToRegister={() => navigate("/register")} />
            </div>
          </div>
        </PageTransition>
      ) : <Navigate to="/terra" replace />} />

      <Route path="/register" element={!user ? (
        <PageTransition>
          <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md mx-auto">
              <button onClick={() => navigate("/")} className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center mb-4">
                ← Retour à l'accueil
              </button>
              <RegisterForm
                onSwitchToLogin={() => navigate("/login")}
                onShowTerms={() => navigate("/terms")}
                onShowPrivacy={() => navigate("/privacy")}
              />
            </div>
          </div>
        </PageTransition>
      ) : <Navigate to="/terra" replace />} />

      <Route path="/terms" element={<LegalDocumentPage type="terms" onBack={() => navigate(-1)} />} />
      <Route path="/privacy" element={<LegalDocumentPage type="privacy" onBack={() => navigate(-1)} />} />

      {/* ── Routes protégées ── chaque page lazy a son propre Suspense */}
      <Route element={<ProtectedRoute />}>
        <Route path="/terra" element={<Lazy><HomePage /></Lazy>} />
        <Route path="/profile" element={<Lazy><ProfilePage /></Lazy>} />
        <Route path="/profile/:userId" element={<Lazy><ProfilePage /></Lazy>} />
        <Route path="/settings" element={<Lazy><SettingsPage /></Lazy>} />
        <Route path="/account-details" element={<Lazy><AccountDetailsPage /></Lazy>} />

        <Route path="/quizzes" element={<Lazy><QuizzesPage /></Lazy>} />
        <Route path="/quizzes/create" element={<Lazy><CreateQuizPage /></Lazy>} />
        <Route path="/quizzes/edit/:quizId" element={<Lazy><EditQuizPage /></Lazy>} />
        <Route path="/quizzes/play/:quizId" element={<Lazy><PlayQuizPage /></Lazy>} />
        <Route path="/quizzes/training" element={<Lazy><TrainingModePage /></Lazy>} />

        <Route path="/leaderboard" element={<Lazy><LeaderboardPage /></Lazy>} />
        <Route path="/friends" element={<Lazy><FriendsPage /></Lazy>} />
        <Route path="/duels" element={<Lazy><DuelsPage /></Lazy>} />
        <Route path="/chat" element={<Lazy><ChatPage /></Lazy>} />
        <Route path="/chat/:friendId" element={<Lazy><ChatPage /></Lazy>} />
      </Route>

      {/* ── Routes Admin ── */}
      <Route path="/admin" element={<ProtectedRoute requireAdmin={true} />}>
        <Route element={<AdminDashboardLayout />}>
          <Route index element={<Lazy><AdminPage /></Lazy>} />
          <Route path="users" element={<Lazy><UserManagementPage /></Lazy>} />
          <Route path="quizzes" element={<Lazy><QuizManagementPage /></Lazy>} />
          <Route path="badges" element={<Lazy><BadgeManagementPage /></Lazy>} />
          <Route path="titles" element={<Lazy><TitleManagementPage /></Lazy>} />
          <Route path="categories" element={<Lazy><CategoryManagementPage /></Lazy>} />
          <Route path="difficulties" element={<Lazy><DifficultyManagementPage /></Lazy>} />
          <Route path="validation" element={<Lazy><QuizValidationPage /></Lazy>} />
          <Route path="warnings" element={<Lazy><WarningsManagementPage /></Lazy>} />
          <Route path="types" element={<Lazy><QuizTypeManagementPage /></Lazy>} />
          <Route path="duels" element={<Lazy><DuelFeaturesPage /></Lazy>} />
          <Route path="geojson" element={<Lazy><GeoJsonMapsManagementPage /></Lazy>} />
          <Route path="analytics" element={<Lazy><AdminAnalyticsPage /></Lazy>} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
