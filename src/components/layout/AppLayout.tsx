import { useState, ReactNode, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useActivityStore } from "@/store/useActivityStore";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const checkAndSendCheckinReminders = useActivityStore(
    (s) => s.checkAndSendCheckinReminders
  );

  useEffect(() => {
    const sent = checkAndSendCheckinReminders();
    if (sent > 0) {
      console.log(`已发送 ${sent} 条签到提醒`);
    }
    const interval = setInterval(() => {
      checkAndSendCheckinReminders();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAndSendCheckinReminders]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
