import { Award, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/utils/formatters";
import { exportCertificateAsPDF } from "@/utils/pdfExport";
import type { Certificate as CertificateType } from "@/types";

interface CertificateProps {
  certificate: CertificateType;
  volunteerName: string;
  activityTitle: string;
}

export function ServiceCertificateView({ certificate, volunteerName, activityTitle }: CertificateProps) {
  const handleExport = async () => {
    await exportCertificateAsPDF("certificate-content", `志愿服务证书_${certificate.certificateNo}.pdf`);
  };

  return (
    <div>
      <div
        id="certificate-content"
        className="bg-white border-4 border-double border-primary-200 p-12 rounded-sm"
      >
        <div className="text-center">
          <Award className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-wider">志愿服务证书</h1>
          <div className="w-24 h-1 bg-primary-500 mx-auto mb-8" />

          <div className="text-lg text-gray-700 space-y-4 my-8 leading-relaxed">
            <p>
              兹证明 <span className="font-bold text-primary-700 text-xl">{volunteerName}</span>
            </p>
            <p>
              于 <span className="font-semibold">{formatDate(certificate.issueDate, "YYYY年MM月DD日")}</span>
            </p>
            <p>
              参与 <span className="font-semibold">「{activityTitle}」</span> 志愿服务活动
            </p>
            <p className="mt-6">
              累计服务时长 <span className="font-bold text-success-600 text-2xl">{certificate.hours}</span> 小时
            </p>
          </div>

          <div className="mt-12 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">证书编号</p>
            <p className="font-mono text-primary-600">{certificate.certificateNo}</p>
          </div>

          <div className="mt-8 flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-600">志愿者服务管理中心</p>
              <p className="text-sm text-gray-500">{formatDate(certificate.issueDate, "YYYY年MM月DD日")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Button leftIcon={<Download className="w-4 h-4" />} onClick={handleExport}>
          下载证书 PDF
        </Button>
      </div>
    </div>
  );
}
