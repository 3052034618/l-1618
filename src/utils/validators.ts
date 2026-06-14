import {
  IdCardValidationResult,
  ValidationResult,
  SkillMatchResult,
  CapacityCheckResult,
  StockCheckResult,
} from "@/types";

export function validateIdCard(idCard: string): IdCardValidationResult {
  if (!idCard) {
    return { valid: false, message: "身份证号不能为空" };
  }

  const idCardStr = idCard.trim().toUpperCase();

  if (!/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dX]$/.test(idCardStr)) {
    return { valid: false, message: "身份证号格式不正确" };
  }

  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCardStr[i], 10) * weights[i];
  }

  const checkCode = checkCodes[sum % 11];
  if (checkCode !== idCardStr[17]) {
    return { valid: false, message: "身份证号校验位不正确" };
  }

  const year = parseInt(idCardStr.substring(6, 10), 10);
  const month = parseInt(idCardStr.substring(10, 12), 10) - 1;
  const day = parseInt(idCardStr.substring(12, 14), 10);
  const birthDate = new Date(year, month, day);

  if (
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month ||
    birthDate.getDate() !== day
  ) {
    return { valid: false, message: "身份证号出生日期无效" };
  }

  const age = calculateAge(birthDate);

  return { valid: true, birthDate, age };
}

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function validateAge(birthDate: Date): ValidationResult & { age: number } {
  const age = calculateAge(birthDate);
  if (age < 18) {
    return { valid: false, message: "志愿者年龄必须年满18周岁", age };
  }
  if (age > 80) {
    return { valid: false, message: "志愿者年龄不能超过80周岁", age };
  }
  return { valid: true, age };
}

export function validateEmergencyContact(name: string, phone: string): ValidationResult {
  if (!name || !name.trim()) {
    return { valid: false, message: "紧急联系人姓名不能为空" };
  }
  if (!phone || !phone.trim()) {
    return { valid: false, message: "紧急联系人电话不能为空" };
  }
  if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
    return { valid: false, message: "紧急联系人电话格式不正确" };
  }
  return { valid: true };
}

export function validatePhone(phone: string): ValidationResult {
  if (!phone || !phone.trim()) {
    return { valid: false, message: "手机号不能为空" };
  }
  if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
    return { valid: false, message: "手机号格式不正确" };
  }
  return { valid: true };
}

export function validateEmail(email: string): ValidationResult {
  if (!email || !email.trim()) {
    return { valid: false, message: "邮箱不能为空" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { valid: false, message: "邮箱格式不正确" };
  }
  return { valid: true };
}

export function validateRequired(value: string | undefined | null, fieldName: string): ValidationResult {
  if (value === undefined || value === null || !String(value).trim()) {
    return { valid: false, message: `${fieldName}不能为空` };
  }
  return { valid: true };
}

export function checkSkillMatch(
  volunteerSkills: string[],
  requiredSkills: string[]
): SkillMatchResult {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { matched: true, matchedSkills: [], missingSkills: [] };
  }
  const matched = requiredSkills.filter((skill) => volunteerSkills.includes(skill));
  const missing = requiredSkills.filter((skill) => !volunteerSkills.includes(skill));
  return {
    matched: missing.length === 0,
    matchedSkills: matched,
    missingSkills: missing,
  };
}

export function checkCapacity(
  current: number,
  max: number
): CapacityCheckResult {
  const remaining = max - current;
  return {
    available: remaining > 0,
    remaining,
  };
}

export function checkSafetyStock(
  current: number,
  safety: number
): StockCheckResult {
  return {
    isWarning: current < safety,
    diff: safety - current,
  };
}
