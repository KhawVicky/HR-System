import image_a7e321551d78150f830b1e4870452ab5d2dd7d7e from "../assets/uwc-berhad-logo.png";
import { ChevronRight, CalendarCheck, LogOut, ShieldCheck, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { toast } from "sonner";
import {
  canManageUsers,
  canViewHrEfficiency,
  getStoredUser,
} from "../lib/api";
import { HeaderNotifications } from "./HeaderNotifications";

interface BreadcrumbItem {
  label: string;
  href?: string;
}
interface PageLayoutProps {
  breadcrumbs: BreadcrumbItem[];
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  useCard?: boolean;
}
export function PageLayout({
  breadcrumbs,
  title,
  subtitle,
  children,
  useCard = true,
}: PageLayoutProps) {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = () => {
    localStorage.removeItem("hr_authenticated");
    localStorage.removeItem("hr_user");
    localStorage.removeItem("hr_user_data");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 rounded-md transition-opacity hover:opacity-80"
              aria-label="Go to HR Dashboard"
            >
              <img
                src={
                  image_a7e321551d78150f830b1e4870452ab5d2dd7d7e
                }
                alt="UWC Logo"
                className="h-8 w-auto"
              />
              <span className="text-lg font-semibold text-slate-900">
                HR Dashboard
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/attendance")}
              >
                <CalendarCheck className="w-4 h-4 mr-2" />
                Attendance
              </Button>
              {canViewHrEfficiency(user) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/hr-efficiency")}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  HR Efficiency
                </Button>
              )}
              {canManageUsers(user) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/admin")}
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  User Management
                </Button>
              )}

              <HeaderNotifications />

              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0).toUpperCase() ||
                      localStorage.getItem("hr_user")?.charAt(0).toUpperCase() ||
                      "H"}
                  </div>
                  <span className="text-sm text-slate-600">
                    {user?.name || localStorage.getItem("hr_user")}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm mb-6">
          {breadcrumbs.map((crumb, index) => (
            <div
              key={index}
              className="flex items-center gap-2"
            >
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
              <Link
                to={crumb.href || "#"}
                className={
                  index === breadcrumbs.length - 1
                    ? "text-slate-900 font-medium hover:text-[#003B7A] transition-colors"
                    : "text-slate-500 hover:text-[#003B7A] transition-colors"
                }
              >
                {crumb.label}
              </Link>
            </div>
          ))}
        </div>
        {/* Page Title */}
        {title && (
        <div className="mb-6">
          {typeof title === "string" ? (
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {title}
            </h1>
          ) : (
            title
          )}
          {subtitle && (
            <div className="text-slate-600">{subtitle}</div>
          )}
        </div>
        )}
        {/* Page Content */}
        {useCard ? (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
