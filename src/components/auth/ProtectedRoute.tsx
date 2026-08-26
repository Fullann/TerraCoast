import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { BannedPage } from "./BannedPage";
import { ForceUsernamePage } from "./ForceUsernamePage";
import { LoginForm } from "./LoginForm";
import { Navbar } from "../layout/Navbar";

export function ProtectedRoute({ requireAdmin = false }: { requireAdmin?: boolean }) {
  const { user, profile, loading, mfaRequired } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (mfaRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 flex items-center justify-center p-4">
        <div className="w-full">
          <LoginForm forceMfa={true} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">Préparation de votre compte...</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const isBanned = profile.is_banned;
  const banUntil = profile.ban_until ? new Date(profile.ban_until) : null;
  const isStillBanned = isBanned && (!banUntil || banUntil > now);

  if (isStillBanned) {
    return <BannedPage />;
  }

  if (profile.force_username_change) {
    return <ForceUsernamePage />;
  }

  if (requireAdmin && profile.role !== "admin") {
    return <Navigate to="/terra" replace />;
  }

  const hideNavbarPaths = ["/quizzes/play", "/quizzes/training", "/duels/play"];
  const shouldShowNavbar = !hideNavbarPaths.some(path => location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {shouldShowNavbar && <Navbar />}
      <main className={`flex-1 ${shouldShowNavbar ? "pb-8" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}
