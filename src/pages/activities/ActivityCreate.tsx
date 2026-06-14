import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { AppLayout } from "@/components/layout/AppLayout";
import { useActivityStore } from "@/store/useActivityStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import type { ActivityType } from "@/types";
import { SKILL_OPTIONS } from "@/constants/skills";

const typeOptions = [
  { value: "environmental", label: "环境保护" },
  { value: "educational", label: "教育支持" },
  { value: "elderly", label: "敬老助老" },
  { value: "community", label: "社区服务" },
  { value: "medical", label: "医疗辅助" },
  { value: "other", label: "其他活动" },
];

const skillOptions = [...SKILL_OPTIONS];

export function ActivityCreate() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const createActivity = useActivityStore((s) => s.createActivity);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [formData, setFormData] = useState({
    title: "",
    type: "environmental" as ActivityType,
    location: "",
    startTime: "",
    endTime: "",
    maxParticipants: 20,
    description: "",
    skillRequirements: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skillRequirements: prev.skillRequirements.includes(skill)
        ? prev.skillRequirements.filter((s) => s !== skill)
        : [...prev.skillRequirements, skill],
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "请输入活动标题";
    if (!formData.location.trim()) newErrors.location = "请输入活动地点";
    if (!formData.startTime) newErrors.startTime = "请选择开始时间";
    if (!formData.endTime) newErrors.endTime = "请选择结束时间";
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = "结束时间必须晚于开始时间";
    }
    if (!formData.maxParticipants || formData.maxParticipants < 1) {
      newErrors.maxParticipants = "人数上限必须大于0";
    }
    if (!formData.description.trim()) newErrors.description = "请输入活动描述";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (!currentUser) return;

    const activityId = createActivity({
      ...formData,
      organizerId: currentUser.id,
    });

    addNotification({
      userId: "admin",
      type: "approval",
      title: "新活动待审批",
      content: `活动「${formData.title}」已提交审批，请及时处理。`,
    });

    navigate(`/activities/${activityId}`);
  };

  return (
    <AppLayout title="发布活动">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/activities")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回活动列表
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>活动基本信息</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="活动标题"
                name="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                error={errors.title}
                placeholder="请输入活动标题"
              />
              <Select
                label="活动类型"
                name="type"
                value={formData.type}
                onChange={(e) => handleChange("type", e.target.value)}
                options={typeOptions}
              />
            </div>

            <Input
              label="活动地点"
              name="location"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              error={errors.location}
              placeholder="请输入活动详细地址"
            />

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="开始时间"
                name="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => handleChange("startTime", e.target.value)}
                error={errors.startTime}
              />
              <Input
                label="结束时间"
                name="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => handleChange("endTime", e.target.value)}
                error={errors.endTime}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="人数上限"
                name="maxParticipants"
                type="number"
                min={1}
                value={formData.maxParticipants}
                onChange={(e) => handleChange("maxParticipants", parseInt(e.target.value) || 0)}
                error={errors.maxParticipants}
              />
            </div>

            <Textarea
              label="活动描述"
              name="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              error={errors.description}
              placeholder="请详细描述活动内容、目的、流程等信息"
              rows={5}
            />

            <div>
              <label className="form-label">技能要求（可选）</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {skillOptions.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      formData.skillRequirements.includes(skill)
                        ? "bg-primary-500 text-white border-primary-500"
                        : "bg-white text-gray-600 border-gray-300 hover:border-primary-400"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                已选择 {formData.skillRequirements.length} 项技能
              </p>
            </div>
          </div>
        </CardBody>
        <CardFooter className="justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/activities")}>
            <X className="w-4 h-4 mr-2" />
            取消
          </Button>
          <Button onClick={handleSubmit}>
            <Save className="w-4 h-4 mr-2" />
            提交审批
          </Button>
        </CardFooter>
      </Card>
    </AppLayout>
  );
}
