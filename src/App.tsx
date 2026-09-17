import { useEffect, Suspense } from "react";
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
import { AdminDashboardLayout } from "./components/admin/layout/AdminDashboardLayout";
import { LegalDocumentPage } from "./components/legal/LegalDocumentPage";
import { PageTransition } from "./components/ui/PageTransition";
import { ToastContainer } from "./components/common/ToastContainer";
import { OfflineIndicator } from "./components/common/OfflineIndicator";
import { ConfettiContainer } from "./components/common/Confetti";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

import { lazyWithRetry } from "./lib/lazyWithRetry";

// Pages avec Lazy Loading et reprise automatique en cas de mise à jour (stale chunk)
const LandingPage = lazyWithRetry(() => import("./components/landing/LandingPage").then(m => ({ default: m.LandingPage })));
const HomePage = lazyWithRetry(() => import("./components/home/HomePage").then(m => ({ default: m.HomePage })));
const ProfilePage = lazyWithRetry(() => import("./components/profile/ProfilePage").then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazyWithRetry(() => import("./components/profile/SettingsPage").then(m => ({ default: m.SettingsPage })));
const AccountDetailsPage = lazyWithRetry(() => import("./components/profile/AccountDetailsPage").then(m => ({ default: m.AccountDetailsPage })));
const QuizzesPage = lazyWithRetry(() => import("./components/quizzes/QuizzesPage").then(m => ({ default: m.QuizzesPage })));
const CreateQuizPage = lazyWithRetry(() => import("./components/quizzes/CreateQuizPage").then(m => ({ default: m.CreateQuizPage })));
const EditQuizPage = lazyWithRetry(() => import("./components/quizzes/EditQuizPage").then(m => ({ default: m.EditQuizPage })));
const PlayQuizPage = lazyWithRetry(() => import("./components/quizzes/PlayQuizPage").then(m => ({ default: m.PlayQuizPage })));
const TrainingModePage = lazyWithRetry(() => import("./components/quizzes/TrainingModePage").then(m => ({ default: m.TrainingModePage })));
const LeaderboardPage = lazyWithRetry(() => import("./components/leaderboard/LeaderboardPage").then(m => ({ default: m.LeaderboardPage })));
const FriendsPage = lazyWithRetry(() => import("./components/friends/FriendsPage").then(m => ({ default: m.FriendsPage })));
const DuelsPage = lazyWithRetry(() => import("./components/duels/DuelsPage").then(m => ({ default: m.DuelsPage })));
const PartyPage = lazyWithRetry(() => import("./components/party/PartyPage").then(m => ({ default: m.PartyPage })));
const AtlasPage = lazyWithRetry(() => import("./components/atlas/AtlasPage").then(m => ({ default: m.AtlasPage })));
const ChatPage = lazyWithRetry(() => import("./components/chat/ChatPage").then(m => ({ default: m.ChatPage })));

// Admin Pages (Lazy Loading avec reprise automatique)
const AdminPage = lazyWithRetry(() => import("./components/admin/AdminPage").then(m => ({ default: m.AdminPage })));
const BadgeManagementPage = lazyWithRetry(() => import("./components/admin/BadgeManagementPage").then(m => ({ default: m.BadgeManagementPage })));
const TitleManagementPage = lazyWithRetry(() => import("./components/admin/TitleManagementPage").then(m => ({ default: m.TitleManagementPage })));
const CategoryManagementPage = lazyWithRetry(() => import("./components/admin/CategoryManagementPage").then(m => ({ default: m.CategoryManagementPage })));
const DifficultyManagementPage = lazyWithRetry(() => import("./components/admin/DifficultyManagementPage").then(m => ({ default: m.DifficultyManagementPage })));
const QuizValidationPage = lazyWithRetry(() => import("./components/admin/QuizValidationPage").then(m => ({ default: m.QuizValidationPage })));
const WarningsManagementPage = lazyWithRetry(() => import("./components/admin/WarningsManagementPage").then(m => ({ default: m.WarningsManagementPage })));
const QuizTypeManagementPage = lazyWithRetry(() => import("./components/admin/QuizTypeManagementPage").then(m => ({ default: m.QuizTypeManagementPage })));
const UserManagementPage = lazyWithRetry(() => import("./components/admin/UserManagementPage").then(m => ({ default: m.UserManagementPage })));
const QuizManagementPage = lazyWithRetry(() => import("./components/admin/QuizManagementPage").then(m => ({ default: m.QuizManagementPage })));
const DuelFeaturesPage = lazyWithRetry(() => import("./components/admin/DuelFeaturesPage").then(m => ({ default: m.DuelFeaturesPage })));
const GeoJsonMapsManagementPage = lazyWithRetry(() => import("./components/admin/GeoJsonMapsManagementPage").then(m => ({ default: m.GeoJsonMapsManagementPage })));
const AdminAnalyticsPage = lazyWithRetry(() => import("./components/admin/AdminAnalyticsPage").then(m => ({ default: m.AdminAnalyticsPage })));

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
      <ToastContainer />
      <OfflineIndicator />
      <ConfettiContainer />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
      {/* ── Routes publiques ── statiques, transition immédiate */}
      <Route path="/" element={!user ? <Lazy><LandingPage /></Lazy> : <Navigate to="/terra" replace />} />

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

      {/* ── Route Party Multijoueur (Accessible aux joueurs connectés et invités sur smartphone) ── */}
      <Route path="/party" element={<Lazy><PartyPage /></Lazy>} />
      <Route path="/party/:code" element={<Lazy><PartyPage /></Lazy>} />

      {/* ── Routes protégées ── chaque page lazy a son propre Suspense */}
      <Route element={<ProtectedRoute />}>
        <Route path="/terra" element={<Lazy><HomePage /></Lazy>} />
        <Route path="/profile" element={<Lazy><ProfilePage /></Lazy>} />
        <Route path="/profile/:userId" element={<Lazy><ProfilePage /></Lazy>} />
        <Route path="/settings" element={<Lazy><SettingsPage /></Lazy>} />
        <Route path="/account-details" element={<Lazy><AccountDetailsPage /></Lazy>} />

        <Route path="/quizzes" element={<Lazy><QuizzesPage /></Lazy>} />
        <Route path="/atlas" element={<Lazy><AtlasPage /></Lazy>} />
        <Route path="/quizzes/create" element={<Lazy><CreateQuizPage /></Lazy>} />
        <Route path="/quizzes/edit/:quizId" element={<Lazy><EditQuizPage /></Lazy>} />
        <Route path="/quizzes/play/:quizId" element={<Lazy><PlayQuizPage /></Lazy>} />
        <Route path="/quizzes/training" element={<Lazy><TrainingModePage /></Lazy>} />
        <Route path="/quizzes/training/:quizId" element={<Lazy><PlayQuizPage trainingMode={true} /></Lazy>} />

        <Route path="/leaderboard" element={<Lazy><LeaderboardPage /></Lazy>} />
        <Route path="/friends" element={<Lazy><FriendsPage /></Lazy>} />
        <Route path="/duels" element={<Lazy><DuelsPage /></Lazy>} />
        <Route path="/duels/play/:duelId" element={<Lazy><PlayQuizPage mode="duel" /></Lazy>} />
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
