import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { HeartHandshake, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";
import { useAuthStore } from "@/store/useAuthStore";
import type { UserRole } from "@/types";

const roleOptions: { value: UserRole; label: string; desc: string }[] = [
  { value: "admin", label: "管理员", desc: "系统全局管理权限" },
  { value: "organizer", label: "活动组织者", desc: "发布活动和物资管理" },
  { value: "volunteer", label: "志愿者", desc: "参与志愿服务活动" },
];

export function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState("volunteer");
  const [password, setPassword] = useState("vol123");
  const [role, setRole] = useState<UserRole>("volunteer");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("请输入用户名和密码");
      return;
    }

    const result = login(username, password);
    if (!result.success) {
      setError(result.message || "登录失败");
      return;
    }

    const currentUser = useAuthStore.getState().currentUser;
    if (currentUser && currentUser.role !== role) {
      setError(`该账号不是${roleOptions.find((r) => r.value === role)?.label}`);
      useAuthStore.getState().logout();
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block text-white animate-slide-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur">
              <HeartHandshake className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">志愿者管理系统</h1>
              <p className="text-primary-200 text-sm">Volunteer Service Platform</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            让每一份爱心
            <br />
            都被温柔记录
          </h2>
          <p className="text-primary-100 text-lg leading-relaxed">
            高效管理志愿服务活动，实时追踪服务工时，
            <br />
            自动生成服务证书，让志愿服务更有温度。
          </p>
          <div className="mt-10 flex gap-6 text-primary-100 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">✓</div>
              <span>实名注册认证</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">✓</div>
              <span>智能签到管理</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">✓</div>
              <span>工时自动统计</span>
            </div>
          </div>
        </div>

        <Card className="animate-scale-in shadow-2xl">
          <CardBody className="p-8">
            <div className="md:hidden flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <HeartHandshake className="w-7 h-7 text-primary-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">志愿者管理系统</h1>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">欢迎登录</h2>
            <p className="text-gray-500 mb-6">请选择您的身份并输入账号信息</p>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {roleOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    role === opt.value
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <UserCheck
                    className={`w-5 h-5 mb-1 ${
                      role === opt.value ? "text-primary-600" : "text-gray-400"
                    }`}
                  />
                  <p
                    className={`text-sm font-medium ${
                      role === opt.value ? "text-primary-700" : "text-gray-700"
                    }`}
                  >
                    {opt.label}
                  </p>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="用户名"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                autoComplete="username"
              />
              <Input
                label="密码"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                autoComplete="current-password"
              />

              {error && (
                <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg text-sm text-danger-600 animate-fade-in">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg">
                登录系统
              </Button>
            </form>

            {role === "volunteer" && (
              <p className="mt-6 text-center text-sm text-gray-500">
                还没有账号？
                <Link to="/register" className="text-primary-600 font-medium hover:text-primary-700 ml-1">
                  立即注册成为志愿者
                </Link>
              </p>
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2 font-medium">测试账号：</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>管理员：admin / admin123</p>
                <p>组织者：organizer / org123</p>
                <p>志愿者：volunteer / vol123</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
