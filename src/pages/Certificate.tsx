import { useState, useMemo } from "react";
import {
  Award,
  FileText,
  Search,
  Calendar,
  Download,
  Eye,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { AppLayout } from "@/components/layout/AppLayout";
import { useActivityStore } from "@/store/useActivityStore";
import { useVolunteerStore } from "@/store/useVolunteerStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ServiceCertificateView } from "@/components/business/Certificate";
import { StatCard } from "@/components/business/StatCard";
import { formatDate } from "@/utils/formatters";
import type { Certificate } from "@/types";

export function CertificatePage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const getCertificatesByVolunteer = useActivityStore(
    (s) => s.getCertificatesByVolunteer
  );
  const certificates = useActivityStore((s) => s.certificates);
  const getActivityById = useActivityStore((s) => s.getActivityById);
  const getVolunteerById = useVolunteerStore((s) => s.getVolunteerById);
  const getVolunteerByUserId = useVolunteerStore((s) => s.getVolunteerByUserId);

  const [search, setSearch] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  const myProfile = useMemo(() => {
    if (currentUser?.role === "volunteer") {
      return getVolunteerByUserId(currentUser.id);
    }
    return undefined;
  }, [currentUser, getVolunteerByUserId]);

  const myCertificates = useMemo(() => {
    if (currentUser?.role === "volunteer" && myProfile) {
      return getCertificatesByVolunteer(myProfile.id);
    }
    return certificates;
  }, [currentUser, myProfile, certificates, getCertificatesByVolunteer]);

  const filteredCertificates = useMemo(() => {
    if (!search) return myCertificates;
    const s = search.toLowerCase();
    return myCertificates.filter((cert) => {
      const activity = getActivityById(cert.activityId);
      const volunteer = getVolunteerById(cert.volunteerId);
      return (
        activity?.title.toLowerCase().includes(s) ||
        volunteer?.realName.toLowerCase().includes(s) ||
        cert.certificateNo.toLowerCase().includes(s)
      );
    });
  }, [myCertificates, search, getActivityById, getVolunteerById]);

  const stats = useMemo(() => {
    const totalHours = myCertificates.reduce((sum, c) => sum + c.hours, 0);
    return {
      count: myCertificates.length,
      totalHours,
    };
  }, [myCertificates]);

  const columns = [
    {
      key: "certificateNo",
      title: "证书编号",
      render: (row: Certificate) => (
        <span className="font-mono text-xs text-primary-600">{row.certificateNo}</span>
      ),
    },
    {
      key: "volunteerName",
      title: "志愿者",
      render: (row: Certificate) => {
        const volunteer = getVolunteerById(row.volunteerId);
        return <span className="font-medium">{volunteer?.realName || "-"}</span>;
      },
    },
    {
      key: "activityTitle",
      title: "活动名称",
      render: (row: Certificate) => {
        const activity = getActivityById(row.activityId);
        return <span>{activity?.title || "-"}</span>;
      },
    },
    {
      key: "hours",
      title: "服务工时",
      render: (row: Certificate) => (
        <span className="font-semibold text-success-600">{row.hours} h</span>
      ),
    },
    {
      key: "issueDate",
      title: "颁发日期",
      render: (row: Certificate) => (
        <span className="flex items-center gap-1 text-gray-600">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(row.issueDate)}
        </span>
      ),
    },
    {
      key: "actions",
      title: "操作",
      width: "w-24",
      render: (row: Certificate) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setSelectedCertificate(row);
            setShowDetailModal(true);
          }}
        >
          <Eye className="w-4 h-4 mr-1" />
          查看
        </Button>
      ),
    },
  ];

  const selectedVolunteerName = useMemo(() => {
    if (!selectedCertificate) return "";
    return getVolunteerById(selectedCertificate.volunteerId)?.realName || "";
  }, [selectedCertificate, getVolunteerById]);

  const selectedActivityTitle = useMemo(() => {
    if (!selectedCertificate) return "";
    return getActivityById(selectedCertificate.activityId)?.title || "";
  }, [selectedCertificate, getActivityById]);

  return (
    <AppLayout title="服务证书">
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <StatCard
          title="证书总数"
          value={stats.count}
          icon={<Award className="w-5 h-5" />}
          variant="primary"
        />
        <StatCard
          title="累计服务工时"
          value={`${stats.totalHours}h`}
          icon={<FileText className="w-5 h-5" />}
          variant="success"
        />
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索证书编号、活动名称、志愿者姓名..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>证书列表</CardTitle>
        </CardHeader>
        <CardBody className="!p-0">
          <Table
            columns={columns}
            data={filteredCertificates}
            rowKey={(row) => row.id}
            emptyText="暂无证书记录"
          />
        </CardBody>
      </Card>

      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="证书详情"
        size="lg"
      >
        {selectedCertificate && (
          <ServiceCertificateView
            certificate={selectedCertificate}
            volunteerName={selectedVolunteerName}
            activityTitle={selectedActivityTitle}
          />
        )}
      </Modal>
    </AppLayout>
  );
}
