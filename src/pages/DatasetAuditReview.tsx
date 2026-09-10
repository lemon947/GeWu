import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft, Copy, Download, FileArchive, FileText, Link2 } from 'lucide-react'
import { corpusRecords } from './CorpusSearch'
import { loadAuditItems, saveAuditItems, updateAuditItem } from '../data/audit-work'

const uploadGroups = [
  { title: '示例数据', files: ['sample_0001.jsonl', 'sample_0002.jsonl'], link: 'https://corpus.example.org/samples/math-education.zip' },
  { title: '全部数据', files: ['full_dataset_v1.zip', 'fields_schema.json', 'README.md'], link: 'https://github.com/example/math-education-corpus' },
]

function nowStamp() {
  const pad = (value: number) => String(value).padStart(2, '0')
  const date = new Date()
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function DatasetAuditReview() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const item = loadAuditItems().find((entry) => String(entry.id) === id) ?? null
  const record = item ? corpusRecords.find((entry) => entry.id === item.corpusId) ?? null : null

  const [opinion, setOpinion] = useState(item?.opinion ?? '')
  const [opinionAction, setOpinionAction] = useState<'return' | 'reject' | null>(item?.opinion ? 'return' : null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    // 打开审核界面即进入「审核中」
    if (!item) return
    const items = loadAuditItems()
    const target = items.find((entry) => entry.id === item.id)
    if (!target) return
    if (target.status === '待审核' || target.status === '待重新审核') {
      saveAuditItems(items.map((entry) => entry.id === item.id ? { ...entry, status: '审核中', auditAt: nowStamp() } : entry))
    }
  }, [item?.id])

  const flashToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/profile?tab=audit')
  }

  if (!item || !record) {
    return (
      <main className="dataset-audit-review-page">
        <button className="dataset-back-button" type="button" onClick={goBack}><ArrowLeft size={17} />返回</button>
        <section className="audit-review-shell">
          <div className="audit-empty"><FileText size={46} /><p>未找到对应的审核任务</p></div>
        </section>
      </main>
    )
  }

  const fields: Array<[string, string]> = [
    ['语料库名称', record.title],
    ['语料库摘要', record.summary],
    ['主要数据来源', '高校专业教材、科研文献、课程资源及经专家校验的领域数据'],
    ['学科领域', record.subject],
    ['语料类型', record.corpusType],
    ['语种类别', record.subject === '数学' || record.subject === '物理' ? '中文/英文' : '中文'],
    ['语料格式', record.subject === '化学' ? '反应SMARTS + 结构化文本' : 'CSV / JSON / SQL'],
    ['时间跨度', record.subject === '数学' ? '2000年-至今' : '2020年-至今'],
    ['发布机构', `${record.organization} - ${record.authors}`],
    ['所在省份', '北京市'],
    ['语料规模', '1千-1万'],
    ['存储容量', '500GB-1TB'],
    ['对外供给', record.openness === '开放共享' ? '已公开提供' : '依申请开放'],
    ['供给方式', '开源'],
    ['许可协议', 'CC BY 4.0 保留作者署名'],
    ['开放程度', record.openness === '不公开' ? '不公开' : '公开'],
  ]

  const approve = () => {
    saveAuditItems(loadAuditItems().map((entry) => entry.id === item.id ? { ...entry, status: '已通过', auditAt: nowStamp() } : entry))
    flashToast('审核已通过，语料将进入发布环节')
    window.setTimeout(goBack, 900)
  }

  const returnForRevision = () => {
    if (!opinion.trim()) {
      flashToast('请先填写审核意见')
      return
    }
    saveAuditItems(loadAuditItems().map((entry) => entry.id === item.id ? { ...entry, status: '待重新审核', opinion: opinion.trim(), auditAt: nowStamp() } : entry))
    flashToast('已退回修改，意见将同步给申请人')
    window.setTimeout(goBack, 900)
  }

  const saveOpinion = () => {
    updateAuditItem(item.id, { opinion: opinion.trim() })
    flashToast('审核意见已保存，任务仍在审核中')
  }

  const reject = () => {
    if (!opinion.trim()) {
      flashToast('请填写不予通过原因')
      return
    }
    saveAuditItems(loadAuditItems().map((entry) => entry.id === item.id ? { ...entry, status: '已拒绝', reason: opinion.trim(), auditAt: nowStamp() } : entry))
    flashToast('已标记为不予通过')
    window.setTimeout(goBack, 900)
  }

  return (
    <main className="dataset-audit-review-page">
      <button className="dataset-back-button" type="button" onClick={goBack}><ArrowLeft size={17} />返回审核工作台</button>

      <section className="audit-review-shell">
        <header className="audit-review-head">
          <h1>语料汇交审核</h1>
          <p>提交人：{item.submitter} · 提交时间：{item.submittedAt}</p>
        </header>

        <h2 className="audit-review-module">基本信息</h2>
        <dl className="audit-review-fields">
          {fields.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>

        <h2 className="audit-review-module">数据文件</h2>
        {uploadGroups.map((group) => (
          <section className="audit-review-upload" key={group.title}>
            <h3>{group.title}</h3>
            <div className="audit-review-files">
              {group.files.map((file) => (
                <div className="audit-review-file" key={file}>
                  <FileArchive size={16} />
                  <span>{file}</span>
                  <button type="button" onClick={() => flashToast(`已开始下载 ${file}`)}><Download size={14} />下载</button>
                </div>
              ))}
            </div>
            <div className="audit-review-link">
              <Link2 size={15} />
              <span>外部链接：</span>
              <a href={group.link} target="_blank" rel="noreferrer" onClick={(event) => { event.preventDefault(); flashToast('示例链接仅供演示') }}>{group.link}</a>
            </div>
          </section>
        ))}

        {opinionAction && (
          <div className="audit-opinion-wrap">
            <label className="audit-opinion">
              <span>{opinionAction === 'return' ? '退回修改意见' : '不予通过原因'}</span>
              <textarea rows={4} value={opinion} onChange={(event) => setOpinion(event.target.value)} placeholder={opinionAction === 'return' ? '请填写修改意见，将同步给申请人' : '请填写不予通过原因，将展示给申请人'} />
            </label>
            <div className="audit-opinion-save">
              <button type="button" onClick={saveOpinion}>保存审核意见</button>
            </div>
          </div>
        )}

        <footer className="audit-review-footer">
          {!opinionAction ? (
            <>
              <button type="button" className="is-return" onClick={() => { setOpinion(''); setOpinionAction('return') }}>退回修改</button>
              <button type="button" className="is-reject" onClick={() => { setOpinion(''); setOpinionAction('reject') }}>不予通过</button>
              <button type="button" className="is-primary" onClick={approve}>审核通过</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => { setOpinion(''); setOpinionAction(null) }}>返回</button>
              <button type="button" className="is-primary" onClick={opinionAction === 'return' ? returnForRevision : reject}>
                确认{opinionAction === 'return' ? '退回修改' : '不予通过'}
              </button>
            </>
          )}
        </footer>
      </section>

      {toast && <div className="dataset-toast"><Copy size={16} />{toast}</div>}
    </main>
  )
}
