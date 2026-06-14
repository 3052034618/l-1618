export const SKILL_OPTIONS = [
  "急救技能",
  "教学经验",
  "驾驶执照",
  "外语能力",
  "摄影摄像",
  "活动策划",
  "医疗背景",
  "心理咨询",
  "手语能力",
  "法律知识",
  "IT技术",
  "手工技能",
  "烹饪技能",
  "音乐艺术",
] as const;

export type SkillOption = (typeof SKILL_OPTIONS)[number];
