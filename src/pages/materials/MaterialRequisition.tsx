import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  ArrowLeft,
  Check,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { AppLayout } from "@/components/layout/AppLayout";
import { useMaterialStore } from "@/store/useMaterialStore";
import { useActivityStore } from "@/store/useActivityStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import type { Material } from "@/types";

export function MaterialRequisition() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const materials = useMaterialStore((s) => s.materials);
  const requisitionMaterial = useMaterialStore((s) => s.requisitionMaterial);
  const activities = useActivityStore((s) => s.activities);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [selectedActivity, setSelectedActivity] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [resultSuccess, setResultSuccess] = useState(true);
  const [resultWarning, setResultWarning] = useState(false);

  const availableActivities = useMemo(() => {
    return activities.filter(
      (a) =>
        (a.status === "published" || a.status === "ongoing") &&
        a.organizerId === currentUser?.id
    );
  }, [activities, currentUser]);

  const currentMaterial = useMemo(() => {
    return materials.find((m) => m.id === selectedMaterial);
  }, [materials, selectedMaterial]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedActivity) newErrors.activity = "请选择关联活动";
    if (!selectedMaterial) newErrors.material = "请选择领用物资";
    if (!quantity || quantity < 1) newErrors.quantity = "领用数量必须大于0";
    if (currentMaterial && quantity > currentMaterial.currentStock) {
      newErrors.quantity = `库存不足，当前库存：${currentMaterial.currentStock}${currentMaterial.unit}`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const result = requisitionMaterial(selectedActivity, selectedMaterial, quantity);
    setResultSuccess(result.success);
    setResultWarning(!!result.warning);
    setResultMessage(result.message || (result.success ? "领用成功" : "领用失败"));
    setShowResultModal(true);

    if (result.success && result.warning) {
      addNotification({
        userId: currentUser?.id || "",
        type: "stock",
        title: "库存预警",
        content: result.message || "部分物资库存已低于安全库存",
      });
    }
  };

  const handleCloseResult = () => {
    setShowResultModal(false);
    if (resultSuccess) {
      setSelectedMaterial("");
      setQuantity(1);
    }
  };

  const activityOptions = [
    { value: "", label: "请选择活动" },
    ...availableActivities.map((a) => ({ value: a.id, label: a.title })),
  ];

  const materialOptions = [
    { value: "", label: "请选择物资" },
    ...materials.map((m) => ({
      value: m.id,
      label: `${m.name} (库存: ${m.currentStock}${m.unit})`,
    })),
  ];

  return (
    <AppLayout title="物资领用">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/materials")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回物资列表
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>领用申请</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-5">
              <Select
                label="关联活动"
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                options={activityOptions}
                error={errors.activity}
              />

              <Select
                label="领用物资"
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                options={materialOptions}
                error={errors.material}
              />

              {currentMaterial && (
                <div className="p-4 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          currentMaterial.warning ? "bg-danger-100" : "bg-primary-100"
                        }`}
                      >
                        <Package
                          className={`w-5 h-5 ${
                            currentMaterial.warning ? "text-danger-600" : "text-primary-600"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{currentMaterial.name}</p>
                        <p className="text-xs text-gray-500">{currentMaterial.category}</p>
                      </div>
                    </div>
                    {currentMaterial.warning && (
                      <Badge variant="danger" className="gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        库存预警
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-gray-500">当前库存</p>
                      <p className="font-semibold">
                        {currentMaterial.currentStock} {currentMaterial.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">安全库存</p>
                      <p className="font-semibold">
                        {currentMaterial.safetyStock} {currentMaterial.unit}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Input
                label="领用数量"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                error={errors.quantity}
                hint={currentMaterial ? `最多可领 ${currentMaterial.currentStock} ${currentMaterial.unit}` : ""}
              />
            </div>
          </CardBody>
          <CardFooter className="justify-end">
            <Button onClick={handleSubmit}>
              <FileText className="w-4 h-4 mr-2" />
              提交领用申请
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>领用说明</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary-600">1</span>
                </div>
                <p>物资领用必须关联具体的活动，仅可领用您负责的活动所需物资。</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary-600">2</span>
                </div>
                <p>领用数量不得超过当前库存，系统将自动扣减对应库存。</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary-600">3</span>
                </div>
                <p>当库存低于安全库存阈值时，系统将自动发出预警通知。</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-warning-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning-600" />
                </div>
                <p className="text-warning-600">
                  标有「库存预警」的物资请按需领用，并及时通知管理员补货。
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Modal
        open={showResultModal}
        onClose={handleCloseResult}
        title={resultSuccess ? "领用成功" : "领用失败"}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              resultSuccess
                ? resultWarning
                  ? "bg-warning-100"
                  : "bg-success-100"
                : "bg-danger-100"
            }`}
          >
            {resultSuccess ? (
              <Check
                className={`w-6 h-6 ${
                  resultWarning ? "text-warning-600" : "text-success-600"
                }`}
              />
            ) : (
              <AlertTriangle className="w-6 h-6 text-danger-600" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {resultSuccess ? "物资领用成功" : "物资领用失败"}
            </p>
            <p className="text-sm text-gray-500 mt-1">{resultMessage}</p>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={handleCloseResult}>确定</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
