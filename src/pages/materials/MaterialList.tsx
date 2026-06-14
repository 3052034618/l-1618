import { useState, useMemo } from "react";
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  ArrowUpCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { AppLayout } from "@/components/layout/AppLayout";
import { useMaterialStore } from "@/store/useMaterialStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { StatCard } from "@/components/business/StatCard";
import type { Material } from "@/types";
import { cn } from "@/lib/utils";

export function MaterialList() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const materials = useMaterialStore((s) => s.materials);
  const getLowStockMaterials = useMaterialStore((s) => s.getLowStockMaterials);
  const restockMaterial = useMaterialStore((s) => s.restockMaterial);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [warningOnly, setWarningOnly] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [restockQuantity, setRestockQuantity] = useState(10);

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "organizer";

  const categories = useMemo(() => {
    const set = new Set(materials.map((m) => m.category));
    return [{ value: "", label: "全部分类" }, ...Array.from(set).map((c) => ({ value: c, label: c }))];
  }, [materials]);

  const stats = useMemo(() => {
    const lowStock = getLowStockMaterials();
    return {
      totalTypes: materials.length,
      totalStock: materials.reduce((sum, m) => sum + m.currentStock, 0),
      lowStockCount: lowStock.length,
    };
  }, [materials, getLowStockMaterials]);

  const filteredMaterials = useMemo(() => {
    let result = materials;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(s));
    }
    if (categoryFilter) {
      result = result.filter((m) => m.category === categoryFilter);
    }
    if (warningOnly) {
      result = result.filter((m) => m.warning);
    }
    return result;
  }, [materials, search, categoryFilter, warningOnly]);

  const handleRestock = () => {
    if (!selectedMaterial || restockQuantity <= 0) return;
    restockMaterial(selectedMaterial.id, restockQuantity);
    addNotification({
      userId: currentUser?.id || "",
      type: "stock",
      title: "物资补货完成",
      content: `物资「${selectedMaterial.name}」已补货 ${restockQuantity}${selectedMaterial.unit}`,
    });
    setShowRestockModal(false);
    setSelectedMaterial(null);
    setRestockQuantity(10);
  };

  const columns = [
    {
      key: "name",
      title: "物资名称",
      render: (row: Material) => (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              row.warning ? "bg-danger-100" : "bg-primary-100"
            )}
          >
            <Package className={cn("w-4 h-4", row.warning ? "text-danger-600" : "text-primary-600")} />
          </div>
          <span className="font-medium">{row.name}</span>
          {row.warning && (
            <Badge variant="danger" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              库存预警
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "category",
      title: "分类",
      render: (row: Material) => (
        <Badge variant="gray">{row.category}</Badge>
      ),
    },
    {
      key: "currentStock",
      title: "当前库存",
      render: (row: Material) => (
        <span
          className={cn(
            "font-semibold",
            row.warning ? "text-danger-600" : "text-gray-900"
          )}
        >
          {row.currentStock} {row.unit}
        </span>
      ),
    },
    {
      key: "safetyStock",
      title: "安全库存",
      render: (row: Material) => (
        <span className="text-gray-500">
          {row.safetyStock} {row.unit}
        </span>
      ),
    },
    {
      key: "stockStatus",
      title: "库存状态",
      render: (row: Material) => {
        const ratio = row.currentStock / Math.max(row.safetyStock, 1);
        const percentage = Math.min(100, (row.currentStock / Math.max(row.safetyStock * 2, 1)) * 100);
        return (
          <div className="w-32">
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  ratio >= 1 ? "bg-success-500" : ratio >= 0.5 ? "bg-warning-500" : "bg-danger-500"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "actions",
      title: "操作",
      width: "w-24",
      render: (row: Material) =>
        isAdmin ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setSelectedMaterial(row);
              setRestockQuantity(Math.max(10, row.safetyStock - row.currentStock + 10));
              setShowRestockModal(true);
            }}
          >
            <ArrowUpCircle className="w-4 h-4 mr-1" />
            补货
          </Button>
        ) : null,
    },
  ];

  return (
    <AppLayout title="物资管理">
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard
          title="物资种类"
          value={stats.totalTypes}
          icon={<Package className="w-5 h-5" />}
          variant="primary"
        />
        <StatCard
          title="库存总数"
          value={stats.totalStock}
          icon={<Package className="w-5 h-5" />}
          variant="success"
        />
        <StatCard
          title="库存预警"
          value={stats.lowStockCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="danger"
        />
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索物资名称..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="w-40">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={categories}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={warningOnly}
                onChange={(e) => setWarningOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">仅显示预警物资</span>
            </label>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>物资库存列表</CardTitle>
        </CardHeader>
        <CardBody className="!p-0">
          <Table
            columns={columns}
            data={filteredMaterials}
            rowKey={(row) => row.id}
            emptyText="暂无物资数据"
          />
        </CardBody>
      </Card>

      <Modal
        open={showRestockModal}
        onClose={() => setShowRestockModal(false)}
        title="物资补货"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            为「{selectedMaterial?.name}」补货，当前库存：{selectedMaterial?.currentStock}
            {selectedMaterial?.unit}，安全库存：{selectedMaterial?.safetyStock}
            {selectedMaterial?.unit}
          </p>
          <Input
            label="补货数量"
            type="number"
            min={1}
            value={restockQuantity}
            onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowRestockModal(false)}>
            取消
          </Button>
          <Button onClick={handleRestock}>
            <Plus className="w-4 h-4 mr-2" />
            确认补货
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
