import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, HeartHandshake, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { useAuthStore } from "@/store/useAuthStore";
import { useVolunteerStore } from "@/store/useVolunteerStore";
import {
  validateIdCard,
  validateAge,
  validateEmergencyContact,
  validatePhone,
  validateEmail,
} from "@/utils/validators";
import { cn } from "@/lib/utils";

const skillOptions = [
  "急救", "驾驶", "英语", "心理辅导", "教育", "音乐", "手语",
  "摄影", "计算机", "维修", "医疗知识", "烹饪", "手工", "法律",
];

const genderOptions = [
  { value: "male", label: "男" },
  { value: "female", label: "女" },
];

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  phone: string;
  realName: string;
  idCard: string;
  gender: "male" | "female";
  emergencyContact: string;
  emergencyPhone: string;
  skills: string[];
}

interface FormErrors {
  [key: string]: string | undefined;
  username?: string;
  password?: string;
  confirmPassword?: string;
  email?: string;
  phone?: string;
  realName?: string;
  idCard?: string;
  age?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export function Register() {
  const navigate = useNavigate();
  const registerVolunteer = useAuthStore((s) => s.registerVolunteer);
  const addVolunteer = useVolunteerStore((s) => s.addVolunteer);

  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    phone: "",
    realName: "",
    idCard: "",
    gender: "male",
    emergencyContact: "",
    emergencyPhone: "",
    skills: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [idCardInfo, setIdCardInfo] = useState<{ age?: number; birthDate?: string }>({});
  const [success, setSuccess] = useState(false);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleIdCardChange = (value: string) => {
    updateField("idCard", value);
    if (value.length === 18) {
      const result = validateIdCard(value);
      if (result.valid && result.birthDate && result.age !== undefined) {
        setIdCardInfo({
          age: result.age,
          birthDate: result.birthDate.toISOString().split("T")[0],
        });
        const ageResult = validateAge(result.birthDate);
        if (!ageResult.valid) {
          setErrors((prev) => ({ ...prev, age: ageResult.message }));
        } else {
          setErrors((prev) => {
            const { age, ...rest } = prev;
            return rest;
          });
        }
      } else if (!result.valid) {
        setErrors((prev) => ({ ...prev, idCard: result.message }));
        setIdCardInfo({});
      }
    } else {
      setIdCardInfo({});
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) newErrors.username = "请输入用户名";
    if (formData.username.length < 4) newErrors.username = "用户名至少4位";

    if (!formData.password) newErrors.password = "请输入密码";
    if (formData.password.length < 6) newErrors.password = "密码至少6位";

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "两次密码输入不一致";
    }

    const emailResult = validateEmail(formData.email);
    if (!emailResult.valid) newErrors.email = emailResult.message;

    const phoneResult = validatePhone(formData.phone);
    if (!phoneResult.valid) newErrors.phone = phoneResult.message;

    if (!formData.realName.trim()) newErrors.realName = "请输入真实姓名";

    const idCardResult = validateIdCard(formData.idCard);
    if (!idCardResult.valid) {
      newErrors.idCard = idCardResult.message;
    } else if (idCardResult.birthDate) {
      const ageResult = validateAge(idCardResult.birthDate);
      if (!ageResult.valid) newErrors.age = ageResult.message;
    }

    const contactResult = validateEmergencyContact(
      formData.emergencyContact,
      formData.emergencyPhone
    );
    if (!contactResult.valid) newErrors.emergencyContact = contactResult.message;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const authResult = registerVolunteer({
      username: formData.username,
      password: formData.password,
      email: formData.email,
      phone: formData.phone,
    });

    if (!authResult.success) {
      setErrors({ username: authResult.message });
      return;
    }

    const volunteerResult = addVolunteer({
      userId: authResult.userId!,
      realName: formData.realName,
      idCard: formData.idCard,
      gender: formData.gender,
      emergencyContact: formData.emergencyContact,
      emergencyPhone: formData.emergencyPhone,
      skills: formData.skills,
    });

    if (!volunteerResult.success && volunteerResult.errors) {
      setErrors(volunteerResult.errors);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-scale-in">
          <CardBody className="p-8 text-center">
            <div className="w-20 h-20 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-success-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">注册提交成功</h2>
            <p className="text-gray-500 mb-6">
              您的志愿者资料已提交，请等待管理员审核。
              <br />
              审核通过后即可登录系统参与志愿活动。
            </p>
            <Link to="/login">
              <Button className="w-full" size="lg">
                返回登录页面
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/login" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          返回登录
        </Link>

        <Card className="animate-slide-up">
          <CardBody className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <HeartHandshake className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">志愿者注册</h1>
                <p className="text-gray-500 text-sm">请如实填写以下信息，我们将保护您的个人隐私</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 pb-2 border-b">
                  <UserPlus className="w-4 h-4 text-primary-600" />
                  账号信息
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="用户名"
                    value={formData.username}
                    onChange={(e) => updateField("username", e.target.value)}
                    error={errors.username}
                    placeholder="至少4位字符"
                  />
                  <Input
                    label="邮箱"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    error={errors.email}
                    placeholder="用于接收活动通知"
                  />
                  <Input
                    label="密码"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    error={errors.password}
                    placeholder="至少6位字符"
                  />
                  <Input
                    label="确认密码"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    error={errors.confirmPassword}
                    placeholder="再次输入密码"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 pb-2 border-b">
                  <AlertCircle className="w-4 h-4 text-primary-600" />
                  身份信息（系统将自动校验）
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="真实姓名"
                    value={formData.realName}
                    onChange={(e) => updateField("realName", e.target.value)}
                    error={errors.realName}
                    placeholder="请输入身份证上的姓名"
                  />
                  <Select
                    label="性别"
                    value={formData.gender}
                    onChange={(e) => updateField("gender", e.target.value as "male" | "female")}
                    options={genderOptions}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="身份证号"
                      value={formData.idCard}
                      onChange={(e) => handleIdCardChange(e.target.value)}
                      error={errors.idCard || errors.age}
                      hint={idCardInfo.age ? `识别年龄：${idCardInfo.age} 岁` : "输入18位身份证号，系统自动校验"}
                      maxLength={18}
                      placeholder="请输入18位身份证号"
                    />
                    {errors.age && (
                      <p className="mt-1 text-xs text-danger-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.age}
                      </p>
                    )}
                  </div>
                  <Input
                    label="手机号"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    error={errors.phone}
                    placeholder="11位手机号码"
                    maxLength={11}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 pb-2 border-b">
                  <AlertCircle className="w-4 h-4 text-warning-500" />
                  紧急联系人信息
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="紧急联系人姓名"
                    value={formData.emergencyContact}
                    onChange={(e) => updateField("emergencyContact", e.target.value)}
                    placeholder="请输入紧急联系人姓名"
                  />
                  <Input
                    label="紧急联系人电话"
                    value={formData.emergencyPhone}
                    onChange={(e) => updateField("emergencyPhone", e.target.value)}
                    error={errors.emergencyContact}
                    placeholder="11位手机号码"
                    maxLength={11}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 pb-2 border-b">个人技能（可选，多选）</h3>
                <div className="flex flex-wrap gap-2">
                  {skillOptions.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm transition-all border",
                        formData.skills.includes(skill)
                          ? "bg-primary-50 border-primary-500 text-primary-700"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  已选择 {formData.skills.length} 项技能
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Link to="/login" className="flex-1">
                  <Button variant="secondary" className="w-full" size="lg">
                    取消
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" size="lg">
                  提交注册申请
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
