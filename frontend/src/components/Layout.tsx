import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Leaf,
  Upload,
  BarChart3,
  LogOut,
  Calculator,
  FolderOpen,
  Settings,
} from "lucide-react";
import CookieConsent from "./CookieConsent";
import ProfileCompleteModal from "./ProfileCompleteModal";

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: BarChart3 },
    { path: "/upload", label: "Upload Bills", icon: Upload },
    { path: "/manual", label: "Manual Entry", icon: Calculator },
    { path: "/calculations", label: "Calculations", icon: BarChart3 },
    { path: "/my-documents", label: "My Documents", icon: FolderOpen },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Leaf className="text-primary-500" size={28} strokeWidth={2} />
              <h1 className="text-lg font-medium text-gray-900">
                Carbon Tracker
              </h1>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-600 font-medium">
                {user?.companyName}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <LogOut size={18} strokeWidth={2} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-5 py-4 transition-all border-b-2 ${
                    isActive
                      ? "text-primary-500 border-primary-500"
                      : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <Icon size={18} strokeWidth={2} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Page Content */}
        <Outlet />
      </div>

      {/* Profile Complete Modal */}
      <ProfileCompleteModal />

      {/* Cookie Consent - показывается только авторизованным */}
      <CookieConsent />
    </div>
  );
}
