import { ReactNode } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: "primary" | "success" | "warning" | "danger" | "info";
  variant?: "primary" | "success" | "warning" | "danger" | "info";
}

const colorClasses = {
  primary: "bg-primary-50 text-primary-600",
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
  danger: "bg-danger-50 text-danger-600",
  info: "bg-blue-50 text-blue-600",
};

export function StatCard({ title, value, icon, trend, trendUp, color, variant }: StatCardProps) {
  const finalColor = variant ?? color ?? "primary";
  return (
    <Card hover className="animate-slide-up">
      <CardBody className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={cn("text-xs mt-2", trendUp ? "text-success-600" : "text-danger-600")}>
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", colorClasses[finalColor])}>
          {icon}
        </div>
      </CardBody>
    </Card>
  );
}
