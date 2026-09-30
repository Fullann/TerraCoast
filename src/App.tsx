import { useEffect, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider, useNotifications } from "./contexts/NotificationContext";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

import { AuthLayout } from "./components/auth/AuthLayout";
import { LoginForm } from "./components/auth/LoginForm";
import { RegisterForm } from "./components/auth/RegisterForm";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminDashboardLayout } from "./components/admin/layout/AdminDashboardLayout";
import { LegalDocumentPage } from "./components/legal/LegalDocumentPage";
import { PageTransition } from "./components/ui/PageTransition";
import { ToastContainer } from "./components/common/ToastContainer";
import { OfflineIndicator } from "./components/common/OfflineIndicator";
import { ConfettiContainer } from "./components/common/Confetti";
import { GlobalAnnouncementBanner } from "./components/layout/GlobalAnnouncementBanner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { RadioGlobeProvider } from "./contexts/RadioGlobeContext";
import { RadioGlobeFloatingPlayer } from "./components/audio/RadioGlobeFloatingPlayer";
import { RadioAnecdoteBanner } from "./components/audio/RadioAnecdoteBanner";

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
const ConquestPage = lazyWithRetry(() => import("./components/conquest/ConquestPage").then(m => ({ default: m.ConquestPage })));
const ChatPage = lazyWithRetry(() => import("./components/chat/ChatPage").then(m => ({ default: m.ChatPage })));

// Nouveaux Modes de Jeu (Gameplay & Arcade)
const GamesHubPage = lazyWithRetry(() => import("./components/games/GamesHubPage").then(m => ({ default: m.GamesHubPage })));
const SilhouetteGamePage = lazyWithRetry(() => import("./components/games/silhouette/SilhouetteGamePage").then(m => ({ default: m.SilhouetteGamePage })));
const HigherLowerGamePage = lazyWithRetry(() => import("./components/games/higher-lower/HigherLowerGamePage").then(m => ({ default: m.HigherLowerGamePage })));
const ChronoRushGamePage = lazyWithRetry(() => import("./components/games/chrono-rush/ChronoRushGamePage").then(m => ({ default: m.ChronoRushGamePage })));
const GeoDetectiveGamePage = lazyWithRetry(() => import("./components/games/geo-detective/GeoDetectiveGamePage").then(m => ({ default: m.GeoDetectiveGamePage })));
const SrsStudyPage = lazyWithRetry(() => import("./components/games/srs/SrsStudyPage").then(m => ({ default: m.SrsStudyPage })));
const TravleGamePage = lazyWithRetry(() => import("./components/games/travle/TravleGamePage").then(m => ({ default: m.TravleGamePage })));
const MapBlitzGamePage = lazyWithRetry(() => import("./components/games/map-blitz/MapBlitzGamePage").then(m => ({ default: m.MapBlitzGamePage })));
const PhysicalGeoGamePage = lazyWithRetry(() => import("./components/games/physical-geo/PhysicalGeoGamePage").then(m => ({ default: m.PhysicalGeoGamePage })));
const ShopPage = lazyWithRetry(() => import("./components/shop/ShopPage").then(m => ({ default: m.ShopPage })));

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
const HomepageTestimonialsManagementPage = lazyWithRetry(() => import("./components/admin/HomepageTestimonialsManagementPage").then(m => ({ default: m.HomepageTestimonialsManagementPage })));
const PathManagementPage = lazyWithRetry(() => import("./components/admin/PathManagementPage").then(m => ({ default: m.PathManagementPage })));
const CountryTrackingPage = lazyWithRetry(() => import("./components/admin/CountryTrackingPage").then(m => ({ default: m.CountryTrackingPage })));
const SiteConfigPage = lazyWithRetry(() => import("./components/admin/SiteConfigPage").then(m => ({ default: m.SiteConfigPage })));
const GeoDetectiveManagementPage = lazyWithRetry(() => import("./components/admin/GeoDetectiveManagementPage").then(m => ({ default: m.GeoDetectiveManagementPage })));

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

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function AppContent() {
  const { user } = useAuth();
  const { t } = useLanguage();
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
      <ScrollToTop />
      <ToastContainer />
      <OfflineIndicator />
      <ConfettiContainer />
      <GlobalAnnouncementBanner />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
      {/* ── Routes publiques ── statiques, transition immédiate */}
      <Route path="/" element={!user ? <Lazy><LandingPage /></Lazy> : <Navigate to="/terra" replace />} />

      <Route path="/login" element={!user ? (
        <PageTransition>
          <AuthLayout
            activeTab="login"
            title={t("auth.loginTitle") || "Connexion à TerraCoast"}
            subtitle={t("auth.loginSubtitle") || "Accédez à vos conquêtes, vos ligues et vos duels"}
          >
            <LoginForm onSwitchToRegister={() => navigate("/register")} />
          </AuthLayout>
        </PageTransition>
      ) : <Navigate to="/terra" replace />} />

      <Route path="/register" element={!user ? (
        <PageTransition>
          <AuthLayout
            activeTab="register"
            title={t("auth.registerTitle") || "Rejoindre l'Aventure"}
            subtitle={t("auth.registerSubtitle") || "Créez votre profil d'explorateur et recevez 500 XP offerts"}
          >
            <RegisterForm
              onSwitchToLogin={() => navigate("/login")}
              onShowTerms={() => navigate("/terms")}
              onShowPrivacy={() => navigate("/privacy")}
            />
          </AuthLayout>
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
        <Route path="/conquest" element={<Lazy><ConquestPage /></Lazy>} />
        <Route path="/games" element={<Lazy><GamesHubPage /></Lazy>} />
        <Route path="/games/silhouette" element={<Lazy><SilhouetteGamePage /></Lazy>} />
        <Route path="/games/higher-lower" element={<Lazy><HigherLowerGamePage /></Lazy>} />
        <Route path="/games/chrono-rush" element={<Lazy><ChronoRushGamePage /></Lazy>} />
        <Route path="/games/geo-detective" element={<Lazy><GeoDetectiveGamePage /></Lazy>} />
        <Route path="/games/srs" element={<Lazy><SrsStudyPage /></Lazy>} />
        <Route path="/games/travle" element={<Lazy><TravleGamePage /></Lazy>} />
        <Route path="/games/map-blitz" element={<Lazy><MapBlitzGamePage /></Lazy>} />
        <Route path="/games/physical-geo" element={<Lazy><PhysicalGeoGamePage /></Lazy>} />
        <Route path="/shop" element={<Lazy><ShopPage /></Lazy>} />
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
          <Route path="countries" element={<Lazy><CountryTrackingPage /></Lazy>} />
          <Route path="site-config" element={<Lazy><SiteConfigPage /></Lazy>} />
          <Route path="path" element={<Lazy><PathManagementPage /></Lazy>} />
          <Route path="geodetective" element={<Lazy><GeoDetectiveManagementPage /></Lazy>} />
          <Route path="geo-detective" element={<Navigate to="/admin/geodetective" replace />} />
          <Route path="homepage-testimonials-management" element={<Lazy><HomepageTestimonialsManagementPage /></Lazy>} />
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
            <RadioGlobeProvider>
              <AppContent />
              <RadioGlobeFloatingPlayer />
              <RadioAnecdoteBanner />
            </RadioGlobeProvider>
          </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
