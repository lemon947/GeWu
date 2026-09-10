export type AuditWorkStatus = '待审核' | '审核中' | '待重新审核' | '已通过' | '已拒绝'

export type AuditWorkItem = {
  id: number
  corpusId: string
  corpusName: string
  submitter: string
  submittedAt: string
  auditAt: string
  status: AuditWorkStatus
  reason?: string
  opinion?: string
}

export const auditWorkStatusOptions: AuditWorkStatus[] = ['待审核', '审核中', '待重新审核', '已通过', '已拒绝']

const STORAGE_KEY = 'gewuyuku-audit-work-items'

const defaults: AuditWorkItem[] = [
  { id: 1, corpusId: 'math-01', corpusName: '数学教育教学语料库', submitter: '用户甲', submittedAt: '2026-09-07 10:25', auditAt: '—', status: '待审核' },
  { id: 2, corpusId: 'chem-02', corpusName: '天然产物结构语料库', submitter: '用户乙', submittedAt: '2026-09-06 15:40', auditAt: '—', status: '待审核' },
  { id: 3, corpusId: 'astro-04', corpusName: '天文观测语料库', submitter: '许青', submittedAt: '2026-09-05 09:32', auditAt: '2026-09-06 10:12', status: '审核中' },
  { id: 4, corpusId: 'geo-03', corpusName: '极端天气事件语料库', submitter: '王磊', submittedAt: '2026-09-04 18:12', auditAt: '2026-09-05 09:30', status: '待重新审核', opinion: '请补充时间跨度与数据来源说明' },
  { id: 5, corpusId: 'bio-02', corpusName: '代谢小分子语料库', submitter: '张伟', submittedAt: '2026-09-03 11:30', auditAt: '2026-09-04 14:20', status: '待重新审核', opinion: '字段口径需要与备案保持一致' },
  { id: 6, corpusId: 'physics-04', corpusName: '光学实验视频语料库', submitter: '李思远', submittedAt: '2026-09-02 09:20', auditAt: '2026-09-02 16:45', status: '已通过' },
  { id: 7, corpusId: 'chem-04', corpusName: '环境化学语料库', submitter: '何静', submittedAt: '2026-08-31 16:02', auditAt: '2026-09-01 10:33', status: '已拒绝', reason: '数据样例不足，请补充字段口径说明后重新提交' },
  { id: 8, corpusId: 'geo-02', corpusName: '地质环境影响语料库', submitter: '用户丙', submittedAt: '2026-08-29 10:45', auditAt: '2026-08-30 09:18', status: '已通过' },
  { id: 9, corpusId: 'physics-01', corpusName: '量子力学问题语料库', submitter: '用户甲', submittedAt: '2026-08-28 14:10', auditAt: '2026-08-29 11:02', status: '已拒绝', reason: '版权授权文件缺失' },
]

export function loadAuditItems(): AuditWorkItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return defaults
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveAuditItems(items: AuditWorkItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function updateAuditItem(id: number, patch: Partial<AuditWorkItem>) {
  saveAuditItems(loadAuditItems().map((item) => (item.id === id ? { ...item, ...patch } : item)))
}

export function removeAuditItemByCorpus(corpusName: string) {
  saveAuditItems(loadAuditItems().filter((item) => item.corpusName !== corpusName))
}
