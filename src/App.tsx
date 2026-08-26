import { useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider, useNotifications } from "./contexts/NotificationContext";
import { LanguageProvider } from "./contexts/LanguageContext";

// Auth & Layout (Garder statique car critique au premier rendu)
import { LoginForm } from "./components/auth/LoginForm";
import { RegisterForm } from "./components/auth/RegisterForm";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LandingPage } from "./components/landing/LandingPage";
import { LegalDocumentPage } from "./components/legal/LegalDocumentPage";

// Pages (Chargement asynchrone - Lazy Loading)
const HomePage = lazy(() => import("./components/home/HomePage").then(module => ({ default: module.HomePage })));
const ProfilePage = lazy(() => import("./components/profile/ProfilePage").then(module => ({ default: module.ProfilePage })));
const SettingsPage = lazy(() => import("./components/profile/SettingsPage").then(module => ({ default: module.SettingsPage })));
const AccountDetailsPage = lazy(() => import("./components/profile/AccountDetailsPage").then(module => ({ default: module.AccountDetailsPage })));
const QuizzesPage = lazy(() => import("./components/quizzes/QuizzesPage").then(module => ({ default: module.QuizzesPage })));
const CreateQuizPage = lazy(() => import("./components/quizzes/CreateQuizPage").then(module => ({ default: module.CreateQuizPage })));
const EditQuizPage = lazy(() => import("./components/quizzes/EditQuizPage").then(module => ({ default: module.EditQuizPage })));
const PlayQuizPage = lazy(() => import("./components/quizzes/PlayQuizPage").then(module => ({ default: module.PlayQuizPage })));
const TrainingModePage = lazy(() => import("./components/quizzes/TrainingModePage").then(module => ({ default: module.TrainingModePage })));
const LeaderboardPage = lazy(() => import("./components/leaderboard/LeaderboardPage").then(module => ({ default: module.LeaderboardPage })));
const FriendsPage = lazy(() => import("./components/friends/FriendsPage").then(module => ({ default: module.FriendsPage })));
const DuelsPage = lazy(() => import("./components/duels/DuelsPage").then(module => ({ default: module.DuelsPage })));
const ChatPage = lazy(() => import("./components/chat/ChatPage").then(module => ({ default: module.ChatPage })));

// Admin Pages (Chargement asynchrone car lourd et utilisé que par les admins)
const AdminPage = lazy(() => import("./components/admin/AdminPage").then(module => ({ default: module.AdminPage })));
const BadgeManagementPage = lazy(() => import("./components/admin/BadgeManagementPage").then(module => ({ default: module.BadgeManagementPage })));
const TitleManagementPage = lazy(() => import("./components/admin/TitleManagementPage").then(module => ({ default: module.TitleManagementPage })));
const CategoryManagementPage = lazy(() => import("./components/admin/CategoryManagementPage").then(module => ({ default: module.CategoryManagementPage })));
const DifficultyManagementPage = lazy(() => import("./components/admin/DifficultyManagementPage").then(module => ({ default: module.DifficultyManagementPage })));
const QuizValidationPage = lazy(() => import("./components/admin/QuizValidationPage").then(module => ({ default: module.QuizValidationPage })));
const WarningsManagementPage = lazy(() => import("./components/admin/WarningsManagementPage").then(module => ({ default: module.WarningsManagementPage })));
const QuizTypeManagementPage = lazy(() => import("./components/admin/QuizTypeManagementPage").then(module => ({ default: module.QuizTypeManagementPage })));
const UserManagementPage = lazy(() => import("./components/admin/UserManagementPage").then(module => ({ default: module.UserManagementPage })));
const QuizManagementPage = lazy(() => import("./components/admin/QuizManagementPage").then(module => ({ default: module.QuizManagementPage })));
const DuelFeaturesPage = lazy(() => import("./components/admin/DuelFeaturesPage").then(module => ({ default: module.DuelFeaturesPage })));
const GeoJsonMapsManagementPage = lazy(() => import("./components/admin/GeoJsonMapsManagementPage").then(module => ({ default: module.GeoJsonMapsManagementPage })));
const AdminAnalyticsPage = lazy(() => import("./components/admin/AdminAnalyticsPage").then(module => ({ default: module.AdminAnalyticsPage })));

// Loading Component
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

function AppContent() {
  const { user } = useAuth();
  const { setNavigationCallback } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    // Adapter le NotificationContext pour utiliser React Router au lieu de l'ancien onNavigate
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
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/terra" replace />} />
        <Route path="/login" element={!user ? (
          <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md mx-auto">
              <button onClick={() => navigate("/")} className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center mb-4">
                ← Retour à l'accueil
              </button>
              <LoginForm onSwitchToRegister={() => navigate("/register")} />
            </div>
          </div>
        ) : <Navigate to="/terra" replace />} />
        <Route path="/register" element={!user ? (
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
        ) : <Navigate to="/terra" replace />} />
        <Route path="/terms" element={<LegalDocumentPage type="terms" onBack={() => navigate(-1)} />} />
        <Route path="/privacy" element={<LegalDocumentPage type="privacy" onBack={() => navigate(-1)} />} />

        {/* Protected Routes (Authenticated) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/terra" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/account-details" element={<AccountDetailsPage />} />
          
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/quizzes/create" element={<CreateQuizPage />} />
          <Route path="/quizzes/edit/:quizId" element={<EditQuizPage />} />
          <Route path="/quizzes/play/:quizId" element={<PlayQuizPage />} />
          <Route path="/quizzes/training" element={<TrainingModePage />} />
          
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/duels" element={<DuelsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:friendId" element={<ChatPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute requireAdmin={true} />}>
          <Route index element={<AdminPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="quizzes" element={<QuizManagementPage />} />
          <Route path="badges" element={<BadgeManagementPage />} />
          <Route path="titles" element={<TitleManagementPage />} />
          <Route path="categories" element={<CategoryManagementPage />} />
          <Route path="difficulties" element={<DifficultyManagementPage />} />
          <Route path="validation" element={<QuizValidationPage />} />
          <Route path="warnings" element={<WarningsManagementPage />} />
          <Route path="types" element={<QuizTypeManagementPage />} />
          <Route path="duels" element={<DuelFeaturesPage />} />
          <Route path="geojson" element={<GeoJsonMapsManagementPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
