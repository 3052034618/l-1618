import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarPlus,
  ListChecks,
  CalendarDays,
  Package,
  BarChart3,
  LogOut,
  HeartHandshake,
  Award,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { roleMap } from "@/utils/formatters";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

interface MenuItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  { path: "/dashboard", label: "工作台", icon: LayoutDashboard, roles: ["volunteer", "organizer", "admin"] },
  { path: "/activities", label: "活动列表", icon: CalendarDays, roles: ["volunteer", "organizer", "admin"] },
  { path: "/activities/create", label: "发布活动", icon: CalendarPlus, roles: ["organizer", "admin"] },
  { path: "/activities/approval", label: "活动审批", icon: ListChecks, roles: ["admin"] },
  { path: "/volunteers", label: "志愿者管理", icon: Users, roles: ["organizer", "admin"] },
  { path: "/materials", label: "物资管理", icon: Package, roles: ["organizer", "admin"] },
  { path: "/materials/requisition", label: "物资领用", icon: Package, roles: ["organizer", "admin"] },
  { path: "/certificates", label: "服务证书", icon: Award, roles: ["volunteer", "organizer", "admin"] },
  { path: "/statistics", label: "统计报表", icon: BarChart3, roles: ["admin"] },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);

  const visibleItems = menuItems.filter((item) => currentUser && item.roles.includes(currentUser.role));

  return (
    <aside
      className={cn(
        "h-screen bg-gradient-to-b from-primary-700 to-primary-800 text-white flex flex-col transition-all duration-300 flex-shrink-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
          <HeartHandshake className="w-6 h-6" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <p className="font-semibold text-base leading-tight">志愿者管理</p>
            <p className="text-xs text-primary-200">服务系统</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  isActive
                    ? "bg-white/15 text-white shadow-inner"
                    : "text-primary-100 hover:bg-white/10 hover:text-white"
                )
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="animate-fade-in">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        {currentUser && (
          <div className={cn("mb-3 px-2", collapsed && "text-center")}>
            {!collapsed ? (
              <>
                <p className="text-sm font-medium truncate">{currentUser.username}</p>
                <p className="text-xs text-primary-200">{roleMap[currentUser.role]}</p>
              </>
            ) : (
              <div className="w-8 h-8 mx-auto rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
                {currentUser.username[0]}
              </div>
            )}
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-primary-100 hover:bg-white/10 hover:text-white transition-all",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>退出登录</span>}
        </button>
      </div>
    </aside>
  );
}
