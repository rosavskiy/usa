import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Leaf,
  Upload,
  BarChart3,
  Lightbulb,
  LogOut,
  Calculator,
  FolderOpen,
  Settings,
} from "lucide-react";
import CookieConsent from "./CookieConsent";

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: BarChart3 },
    { path: "/upload", label: "Upload Bills", icon: Upload },
    { path: "/manual", label: "Manual Entry", icon: Calculator },
    { path: "/calculations", label: "Calculations", icon: BarChart3 },
    { path: "/recommendations", label: "Recommendations", icon: Lightbulb },
    { path: "/my-documents", label: "My Documents", icon: FolderOpen },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Leaf className="text-primary-600" size={32} />
              <h1 className="text-xl font-bold text-gray-900">
                Carbon Tracker
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.companyName}</span>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="mb-8">
          <div className="flex gap-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Page Content */}
        <Outlet />
      </div>
      
      {/* Cookie Consent - показывается только авторизованным */}
      <CookieConsent />
    </div>
  );
}
