import { Message } from '../../ai/interfaces/message.interface';

type ResumeQuizLikeInput = {
  company?: string;
  positionName: string;
  jd: string;
  resumeContent: string;
  minSalary?: number;
  maxSalary?: number;
};

type InterviewContext = {
  interviewType: 'special' | 'comprehensive';
  resumeContent: string;
  company?: string;
  positionName?: string;
  jd?: string;
  conversationHistory: Array<{
    role: 'interviewer' | 'candidate';
    content: string;
  }>;
  elapsedMinutes: number;
  targetDuration: number;
};

export function buildLocalResumeAnalysis(
  resumeContent: string,
  jobDescription: string,
) {
  const resumeKeywords = extractKeywords(resumeContent);
  const jdKeywords = extractKeywords(jobDescription);
  const matched = jdKeywords.filter((keyword) => resumeKeywords.includes(keyword));
  const missing = jdKeywords.filter(
    (keyword) => !matched.includes(keyword),
  ).slice(0, 5);

  return {
    strengths: matched.slice(0, 5),
    risks: missing,
    summary: `本地 Mock 分析显示：你的经历与岗位存在一定匹配度，建议重点补足 ${missing.slice(0, 3).join('、') || '工程化表达'}。`,
    nextSteps: [
      '突出与目标岗位最相关的 2-3 个项目成果',
      '补充量化结果，例如性能、转化或效率提升',
      '准备 3 个能展开深挖的技术难点案例',
    ],
  };
}

export function buildLocalConversationContinuation(history: Message[]): string {
  const lastMessage = history[history.length - 1]?.content || '';
  return `本地 Mock 回复：我已经结合上下文理解了你的问题。针对“${lastMessage.slice(0, 30)}”，建议先说明背景，再补充你的关键动作、结果指标和复盘结论。`;
}

export function buildLocalResumeQuizQuestions(input: ResumeQuizLikeInput) {
  const role = input.positionName || '目标岗位';
  const company = input.company || '目标公司';

  return {
    questions: [
      {
        question: `请结合你最有代表性的项目，说明它为什么能支撑你胜任 ${company} 的 ${role}。`,
        answer:
          '建议按背景、目标、关键方案、量化结果四段作答，并突出你个人承担的核心决策。',
        category: 'project',
        difficulty: 'medium',
        tips: '优先说和目标岗位最相关的那个项目，避免流水账。',
        keywords: ['项目背景', '关键动作', '量化结果'],
      },
      {
        question: `如果让你复盘一个技术难点，你会如何说明问题定位、方案取舍与最终收益？`,
        answer:
          '可以围绕问题现象、定位方式、候选方案、为什么选当前方案、落地后的收益来回答。',
        category: 'technical',
        difficulty: 'medium',
        tips: '强调权衡过程，而不是只说最终答案。',
        keywords: ['排查过程', '方案对比', '收益'],
      },
      {
        question: `你的经历里有哪些地方体现了性能优化、稳定性治理或工程效率提升？`,
        answer:
          '建议至少准备一个性能案例和一个工程化案例，并给出明确指标变化。',
        category: 'problem-solving',
        difficulty: 'medium',
        tips: '量化指标比抽象描述更有说服力。',
        keywords: ['性能优化', '稳定性', '工程效率'],
      },
      {
        question: `如果面试官追问你与产品、设计或后端协作中的分歧，你会如何回答？`,
        answer:
          '可以从冲突背景、你的判断依据、对齐过程以及最终共识如何达成来展开。',
        category: 'soft-skill',
        difficulty: 'easy',
        tips: '避免把问题归因给别人，强调推动解决。',
        keywords: ['跨团队协作', '推动力', '共识'],
      },
      {
        question: `对于 ${role}，你接下来最需要补强的一项能力是什么，为什么？`,
        answer:
          '回答要坦诚，但要给出具体提升计划，体现自我驱动和成长速度。',
        category: 'behavioral',
        difficulty: 'easy',
        tips: '不要说“没有短板”，那会显得不真实。',
        keywords: ['复盘', '成长', '学习计划'],
      },
    ],
    summary: `本地 Mock 已为 ${role} 生成 5 道高频问题，覆盖项目经验、技术深度、工程能力、协作沟通和成长潜力。`,
  };
}

export function buildLocalResumeQuizAnalysis(input: ResumeQuizLikeInput) {
  const resumeKeywords = extractKeywords(input.resumeContent);
  const jdKeywords = extractKeywords(input.jd);
  const matchedSkills = jdKeywords
    .filter((keyword) => resumeKeywords.includes(keyword))
    .slice(0, 6);
  const missingSkills = jdKeywords
    .filter((keyword) => !matchedSkills.includes(keyword))
    .slice(0, 5);
  const matchScore = Math.max(
    68,
    Math.min(92, 70 + matchedSkills.length * 3 - missingSkills.length),
  );

  return {
    matchScore,
    matchLevel: matchScore >= 85 ? '高匹配' : matchScore >= 75 ? '较匹配' : '待提升',
    matchedSkills: matchedSkills.map((skill) => ({
      skill,
      matched: true,
      proficiency: 'good',
    })),
    missingSkills,
    knowledgeGaps:
      missingSkills.length > 0
        ? missingSkills.map((skill) => `${skill} 的场景化表达不足`)
        : ['建议补充更多量化成果描述'],
    learningPriorities: (missingSkills.length ? missingSkills : ['项目量化表达'])
      .slice(0, 3)
      .map((topic, index) => ({
        topic,
        priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
        reason: `本地 Mock 判断该项与 ${input.positionName} 的 JD 相关度较高`,
      })),
    radarData: [
      { dimension: '项目经验', score: Math.min(matchScore, 90) },
      { dimension: '技术深度', score: Math.max(matchScore - 4, 65) },
      { dimension: '工程能力', score: Math.max(matchScore - 2, 66) },
      { dimension: '协作沟通', score: Math.max(matchScore - 6, 64) },
      { dimension: '成长潜力', score: Math.min(matchScore + 3, 92) },
    ],
    strengths: matchedSkills.length
      ? matchedSkills.map((skill) => `简历中已体现 ${skill} 相关经验`)
      : ['具备基础岗位相关经验，适合作为面试表达的起点'],
    weaknesses:
      missingSkills.length > 0
        ? missingSkills.map((skill) => `${skill} 相关案例不够具体`)
        : ['需要进一步强化结果量化与业务影响表达'],
    interviewTips: [
      '优先讲最贴近目标岗位的项目，不要平均用力。',
      '每个案例尽量给出指标变化或业务结果。',
      '提前准备一段 1-2 分钟的自我介绍和一个技术难点复盘。',
    ],
  };
}

export function buildLocalInterviewQuestionContent(context: InterviewContext): string {
  const answerCount = context.conversationHistory.filter(
    (item) => item.role === 'candidate',
  ).length;
  const role = context.positionName || '目标岗位';
  const prompts = [
    {
      question: `请你展开讲一下一个最能体现你胜任 ${role} 的项目，重点说清楚你的关键决策。`,
      standardAnswer:
        '应围绕业务背景、目标、个人负责部分、技术方案、量化结果和复盘展开。',
    },
    {
      question: '这个项目里你遇到的最大技术挑战是什么？你是如何定位并解决它的？',
      standardAnswer:
        '先描述问题现象，再说明排查路径、方案取舍、风险控制和最终收益。',
    },
    {
      question: '如果现在让你重新做一次，你会如何优化这个方案？',
      standardAnswer:
        '可以从架构简化、性能、稳定性、可观测性和协作效率几个维度给出升级思路。',
    },
  ];

  const current = prompts[Math.min(answerCount - 1, prompts.length - 1)];
  const shouldEnd = answerCount >= prompts.length;

  return `${current.question}\n\n[STANDARD_ANSWER]\n${current.standardAnswer}${shouldEnd ? '\n\n[END_INTERVIEW]' : ''}`;
}

export async function* streamLocalText(
  text: string,
  chunkSize = 8,
): AsyncGenerator<string, void, undefined> {
  for (let index = 0; index < text.length; index += chunkSize) {
    yield text.slice(index, index + chunkSize);
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

export function buildLocalAssessment(context: {
  qaList: Array<{ question: string; answer: string }>;
}) {
  const answers = context.qaList || [];
  const totalLength = answers.reduce(
    (sum, item) => sum + (item.answer?.trim().length || 0),
    0,
  );
  const avgLength = answers.length > 0 ? totalLength / answers.length : 0;
  const emptyCount = answers.filter((item) => !item.answer?.trim()).length;
  const overallScore = Math.max(
    60,
    Math.min(90, Math.round(72 + avgLength / 30 - emptyCount * 8)),
  );

  return {
    overallScore,
    overallLevel:
      overallScore >= 85 ? '优秀' : overallScore >= 75 ? '良好' : '需提升',
    overallComment:
      avgLength > 80
        ? '本地 Mock 判断你的回答结构较完整，具备较好的展开能力。'
        : '本地 Mock 判断你的回答还可以更具体，建议加强案例细节和量化结果。',
    radarData: [
      { dimension: '技术能力', score: Math.max(overallScore - 2, 60) },
      { dimension: '项目经验', score: Math.max(overallScore + 1, 62) },
      { dimension: '问题解决', score: Math.max(overallScore - 1, 61) },
      { dimension: '学习能力', score: Math.min(overallScore + 3, 92) },
      { dimension: '沟通表达', score: Math.max(overallScore - 4, 58) },
    ],
    strengths: [
      '能够围绕项目背景和目标展开回答',
      '具备一定的复盘意识和方案取舍表达',
    ],
    weaknesses: [
      '部分回答还不够量化',
      '可以进一步突出你个人承担的关键动作',
    ],
    improvements: [
      {
        category: '回答结构',
        suggestion: '优先使用“背景-目标-行动-结果-复盘”结构作答',
        priority: 'high',
      },
      {
        category: '量化表达',
        suggestion: '每个案例尽量补充性能、效率或业务指标',
        priority: 'medium',
      },
    ],
    fluencyScore: Math.max(overallScore - 3, 60),
    logicScore: Math.max(overallScore - 1, 62),
    professionalScore: Math.max(overallScore - 2, 61),
  };
}

function extractKeywords(text: string): string[] {
  const dictionary = [
    'vue',
    'react',
    'typescript',
    'javascript',
    'node',
    'nest',
    '性能优化',
    '工程化',
    '组件',
    '前端',
    '后端',
    '数据库',
    '接口',
    '协作',
    '架构',
    '测试',
    '监控',
    '增长',
    '分析',
    'ai',
    'llm',
  ];

  const lower = text.toLowerCase();
  return dictionary.filter((item) => lower.includes(item.toLowerCase()));
}
