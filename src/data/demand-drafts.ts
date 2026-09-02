import type { DemandPost } from '../pages/DemandSquare'

export type DemandDraft = DemandPost & { savedAt: string }

const STORAGE_KEY = 'gewuyuku-demand-drafts'

/** 首次使用（无本地数据）时展示的演示草稿，与发布页草稿箱示例一致 */
const defaultDrafts: DemandDraft[] = [
  {
    id: 'draft-demo-001',
    title: '有没有伙伴一起建设一个医学影像语料',
    field: '格物 · 语料共建',
    corpusName: '医学影像多模态语料征集',
    author: '北',
    organization: '北京大学医学部',
    bio: '',
    status: '招募中',
    tags: ['文字需求', '医学影像', '多模态'],
    content: '希望寻找医学影像与临床报告配对数据伙伴，共同沉淀可用于模型训练、报告生成和辅助诊断评测的语料。',
    likes: 0,
    bookmarks: 0,
    comments: 0,
    template: 'blue',
    contact: { name: '北京大学医学部', unit: '北京大学医学部', email: 'medical-corpus@pku.edu.cn' },
    savedAt: '2026-08-31 11:27:26',
  },
  {
    id: 'draft-demo-002',
    title: '寻找方言伙伴共建语音与转写语料',
    field: '格物 · 语料共建',
    corpusName: '方言语音与转写语料',
    author: '南',
    organization: '南京大学',
    bio: '',
    status: '招募中',
    tags: ['文字需求', '语音转写'],
    content: '面向长三角方言采集、音频切分、文本转写与说话人信息标注。',
    likes: 0,
    bookmarks: 0,
    comments: 0,
    template: 'mint',
    contact: { name: '南京大学语言语音团队', unit: '南京大学', email: 'dialect@nju.edu.cn' },
    savedAt: '2026-08-31 11:05:13',
  },
  {
    id: 'draft-demo-003',
    title: '工业设备故障知识图谱语料',
    field: '格物 · 语料共建',
    corpusName: '工业设备故障知识图谱语料',
    author: '交',
    organization: '上海交通大学',
    bio: '',
    status: '共建中',
    tags: ['图像语料', '故障识别'],
    content: '汇聚设备图像、检修记录、传感器波形和故障原因文本。',
    likes: 0,
    bookmarks: 0,
    comments: 0,
    template: 'blue',
    image: 'industry',
    contact: { name: '上海交通大学工业智能团队', unit: '上海交通大学', email: 'industry-ai@sjtu.edu.cn' },
    savedAt: '2026-08-30 18:42:07',
  },
  {
    id: 'draft-demo-004',
    title: '征集珍稀植物四季生长图像语料',
    field: '格物 · 语料共建',
    corpusName: '珍稀植物多季相图像语料',
    author: '中',
    organization: '中国科学院',
    bio: '',
    status: '已完成',
    tags: ['植物图像'],
    content: '面向珍稀植物四季生长过程，征集连续观测图像、物候记录和环境信息。',
    likes: 0,
    bookmarks: 0,
    comments: 0,
    template: 'mint',
    contact: { name: '中国科学院生态团队', unit: '中国科学院', email: 'plant-corpus@cas.cn' },
    savedAt: '2026-08-30 16:18:35',
  },
]

export function loadDrafts(): DemandDraft[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return defaultDrafts
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveDrafts(drafts: DemandDraft[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
}

export function nowStamp(): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  const date = new Date()
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function removeDraft(id: string) {
  saveDrafts(loadDrafts().filter((draft) => draft.id !== id))
}
