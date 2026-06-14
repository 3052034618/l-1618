import { useState } from "react";
import { Bell, CheckCheck, X, AlertCircle, Calendar, Package, CheckSquare, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useNotificationStore } from "@/store/useNotificationStore";
import { formatDateTime } from "@/utils/formatters";
import type { Notification, NotificationType } from "@/types";
import { cn } from "@/lib/utils";

const typeIcons: Record<NotificationType, typeof AlertCircle> = {
  approval: CheckSquare,
  activity: Calendar,
  checkin: Bell,
  stock: Package,
  system: Info,
};

const typeBadgeVariant: Record<NotificationType, "primary" | "success" | "warning" | "danger" | "gray"> = {
  approval: "primary",
  activity: "success",
  checkin: "warning",
  stock: "danger",
  system: "gray",
};

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function NotificationPanel({ isOpen, onClose, userId }: NotificationPanelProps) {
  const notifications = useNotificationStore((s) => s.getNotificationsByUser(userId));
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const handleClick = (n: Notification) => {
    if (!n.isRead) markAsRead(n.id);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="通知中心" size="md">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">共 {notifications.length} 条通知</p>
        <Button variant="ghost" size="sm" leftIcon={<CheckCheck className="w-4 h-4" />} onClick={() => markAllAsRead(userId)}>
          全部已读
        </Button>
      </div>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p>暂无通知</p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = typeIcons[n.type];
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "p-4 rounded-lg border transition-all cursor-pointer",
                  n.isRead ? "bg-white border-gray-100 hover:bg-gray-50" : "bg-primary-50/50 border-primary-100 hover:bg-primary-50"
                )}
              >
                <div className="flex gap-3">
                  <div className={cn("p-2 rounded-lg h-fit", n.isRead ? "bg-gray-100 text-gray-500" : "bg-primary-100 text-primary-600")}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className={cn("font-medium", n.isRead ? "text-gray-700" : "text-gray-900")}>{n.title}</p>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                      </div>
                      <Badge variant={typeBadgeVariant[n.type]} className="flex-shrink-0">
                        {n.type === "approval" && "审批"}
                        {n.type === "activity" && "活动"}
                        {n.type === "checkin" && "签到"}
                        {n.type === "stock" && "库存"}
                        {n.type === "system" && "系统"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{n.content}</p>
                    <p className="text-xs text-gray-400 mt-2">{formatDateTime(n.createdAt)}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}
