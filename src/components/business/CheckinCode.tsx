import { Card, CardBody } from "@/components/ui/Card";
import { QrCode } from "lucide-react";

interface CheckinCodeProps {
  code: string;
  activityTitle: string;
}

export function CheckinCode({ code, activityTitle }: CheckinCodeProps) {
  return (
    <Card>
      <CardBody className="text-center">
        <p className="text-sm text-gray-500 mb-2">{activityTitle}</p>
        <div className="bg-gray-50 rounded-xl p-6 mb-4 inline-block">
          <QrCode className="w-32 h-32 text-gray-800" strokeWidth={1.5} />
        </div>
        <p className="text-xs text-gray-500 mb-1">签到码</p>
        <p className="text-2xl font-mono font-bold text-primary-600 tracking-widest">{code}</p>
        <p className="text-xs text-gray-400 mt-2">活动开始前请出示此签到码</p>
      </CardBody>
    </Card>
  );
}
