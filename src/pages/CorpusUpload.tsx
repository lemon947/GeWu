import { Fragment, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Copy,
  FileText,
  FolderArchive,
  Github,
  ImageUp,
  Link2,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { useApp } from '../context/app-context'
import { corpusRecords } from './CorpusSearch'

type Author = { name: string; contact: string; organization: string }
type UploadGroupKey = 'sample' | 'public' | 'all'
type UploadGroupState = { mode: 'local' | 'link' | 'cli'; files: string[]; link: string; linkKind: 'url' | 'github' }

export const subjects = ['数学', '物理', '化学', '天文', '地理', '生物']
export const subjectChildren: Record<string, string[]> = {
  化学: ['碳材料', 'f族元素', '生物医药', '能源材料', '催化', '教育教学'],
  地理: ['地球世界模型', '地表环境与城市', '教育教学'],
  生物: ['生命', '医学'],
}
export const universities = ['北京大学', '清华大学', '复旦大学', '上海交通大学', '南京大学', '武汉大学', '厦门大学', '其他']
export const pkuDepartments = ['数学科学学院', '物理学院', '物理学院大气与海洋科学系', '物理学院技术物理系', '物理学院现代光学研究所', '物理学院电子显微镜专业实验室', '化学与分子工程学院', '地球与空间科学学院', '材料科学与工程学院', '生命科学学院', '现代农学院', '基础医学院', '药学院', '药学院天然药物及仿生药物全国重点实验室', '公共卫生学院', '人工智能研究院', '定量生物学中心', '生物医学前沿创新中心', '健康医疗大数据国家研究院', '核糖核酸北京研究中心', '国际机器学习研究中心', '北京国际数学研究中心', '遥感与地理信息系统研究所', '科维理天文与天体物理研究所', '国际癌症研究院', '肿瘤医院', '第一医院肾内科', '鄞州数智健康联合研究院', '深圳研究生院新材料学院', '其他']
export const provinces = ['北京市', '天津市', '河北省', '山西省', '内蒙古自治区', '辽宁省', '吉林省', '黑龙江省', '上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省', '湖北省', '湖南省', '广东省', '广西壮族自治区', '海南省', '重庆市', '四川省', '贵州省', '云南省', '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区']

const emptyAuthor = (): Author => ({ name: '', contact: '', organization: '' })
const emptyUpload = (): UploadGroupState => ({ mode: 'local', files: [], link: '', linkKind: 'url' })
const cli_upload_cmd = 'corpusware upload --corpus <语料ID> --data ./corpus'

type UploadDraftData = {
  taskName: string
  authors: Author[]
  corpusName: string
  introduction: string
  keywords: string[]
  dataSource: string
  subject: string
  corpusType: string
  orgType: string
  organization: string
  customOrganization: string
  orgTags: string[]
  language: string
  languageCustom: string
  format: string
  timeSpan: string
  province: string
  corpusSize: string
  corpusSizeDetail: string
  storageSize: string
  storageSizeDetail: string
  supplyStatus: string
  supplyMode: string
  license: string
  openness: string
  uploads: Record<UploadGroupKey, UploadGroupState>
}
type UploadDraft = { id: string; savedAt: string; step: number; data: UploadDraftData }

const draftStorageKey = (account: string) => `gw-upload-drafts-${account}`

function loadDraftList(account: string): UploadDraft[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(draftStorageKey(account)) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistDraftList(account: string, list: UploadDraft[]) {
  window.localStorage.setItem(draftStorageKey(account), JSON.stringify(list))
}

function draftStamp() {
  const pad = (value: number) => String(value).padStart(2, '0')
  const date = new Date()
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function groupLabel(state: UploadGroupState) {
  if (state.mode === 'local') return `${state.files.length} 个文件`
  if (state.mode === 'link') return state.link || '—'
  return '终端命令上传'
}

function UploadGroup({ title, required, description, state, onChange }: { title: string; required?: boolean; description: string; state: UploadGroupState; onChange: (value: UploadGroupState) => void }) {
  const inputKey = title.replace(/\s/g, '')
  const updateFiles = (files: FileList | null) => onChange({ ...state, files: files ? Array.from(files).map((file) => file.name) : [] })
  return (
    <section className="upload-file-group">
      <div className="upload-file-group-head"><div><h3>{title}{required && <b> *</b>}</h3><p>{description}</p></div><div className="upload-source-tabs"><button type="button" className={state.mode === 'local' ? 'is-active' : ''} onClick={() => onChange({ ...state, mode: 'local' })}>本地上传</button><button type="button" className={state.mode === 'link' ? 'is-active' : ''} onClick={() => onChange({ ...state, mode: 'link' })}>外部链接导入</button><button type="button" className={state.mode === 'cli' ? 'is-active' : ''} onClick={() => onChange({ ...state, mode: 'cli' })}>命令行上传</button></div></div>
      {state.mode === 'local' && (
        <div className="upload-file-drop upload-drop-v2" onDragOver={() => false} onDrop={(event) => { event.preventDefault(); updateFiles(event.dataTransfer.files) }}>
          <span className="upload-drop-icon"><ImageUp size={54} /></span>
          <div className="upload-drop-copy">
            <strong>{state.files.length ? `已选择 ${state.files.length} 个文件` : '选择需要上传的语料文件'}</strong>
            <span>{state.files.length ? state.files.slice(0, 3).join('、') : '单次上传数据大小不超过 2GB，上传后将发送给管理员审核'}</span>
            <div>
              <label className="upload-browse-btn" htmlFor={`${inputKey}-files`}>上传文件</label>
              <input id={`${inputKey}-files`} hidden type="file" multiple onChange={(event) => { updateFiles(event.target.files); event.currentTarget.value = '' }} />
              <label className="upload-browse-btn is-ghost" htmlFor={`${inputKey}-folder`}>选择文件夹</label>
              <input id={`${inputKey}-folder`} hidden type="file" multiple ref={(node) => node?.setAttribute('webkitdirectory', '')} onChange={(event) => { updateFiles(event.target.files); event.currentTarget.value = '' }} />
            </div>
          </div>
        </div>
      )}
      {state.mode === 'link' && (
        <div className="upload-link-panel">
          <div className="upload-link-cards">
            <button type="button" className={`upload-link-card${state.linkKind === 'url' ? ' is-active' : ''}`} onClick={() => onChange({ ...state, linkKind: 'url' })}>
              <span className="upload-link-dot">{state.linkKind === 'url' && <Check size={14} />}</span>
              <i className="upload-link-icon"><Link2 size={18} /></i>
              <strong>远程 URL</strong><small>从远程 URL 创建语料资源，URL 需指向具体文件</small>
            </button>
            <button type="button" className={`upload-link-card${state.linkKind === 'github' ? ' is-active' : ''}`} onClick={() => onChange({ ...state, linkKind: 'github' })}>
              <span className="upload-link-dot">{state.linkKind === 'github' && <Check size={14} />}</span>
              <i className="upload-link-icon"><Github size={18} /></i>
              <strong>GitHub 仓库</strong><small>从 GitHub 仓库归档导入，使用仓库地址或任意深层链接</small>
            </button>
          </div>
          <label className="upload-link-input"><span>{state.linkKind === 'url' ? 'URL' : 'GitHub 仓库链接'}</span><input value={state.link} onChange={(event) => onChange({ ...state, link: event.target.value })} placeholder={state.linkKind === 'url' ? '请输入远程 URL，如 https://…/data.zip' : '请输入 GitHub 仓库链接'} /></label>
        </div>
      )}
      {state.mode === 'cli' && (
        <div className="upload-cli-panel">
          <p className="cli-guide-intro">1. 安装 CLI：<code>pip install corpusware-cli</code><br />2. 在终端运行以下命令上传语料：</p>
          <div className="download-code-block">
            <div className="download-code-head"><button type="button" onClick={() => navigator.clipboard?.writeText(cli_upload_cmd)}><Copy size={15} />复制</button></div>
            <pre><code>{cli_upload_cmd}</code></pre>
          </div>
          <p className="cli-guide-more">更多更丰富的命令行上传选项，可参见 <a>具体文档</a>。</p>
        </div>
      )}
    </section>
  )
}

export default function CorpusUpload() {
  const { user, openAuth } = useApp()
  const [searchParams] = useSearchParams()
  const editRecord = useMemo(() => corpusRecords.find((item) => item.id === searchParams.get('edit')), [searchParams])
  const [step, setStep] = useState(1)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [draftsOpen, setDraftsOpen] = useState(false)
  const [draftList, setDraftList] = useState<UploadDraft[]>(() => user ? loadDraftList(user.account) : [])
  const [toast, setToast] = useState('')
  const [authors, setAuthors] = useState<Author[]>([emptyAuthor()])
  const [taskName, setTaskName] = useState('')
  const [corpusName, setCorpusName] = useState(editRecord?.title ?? '')
  const [introduction, setIntroduction] = useState(editRecord?.summary ?? '')
  const [keywordInput, setKeywordInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>(editRecord?.keywords ?? [])
  const [dataSource, setDataSource] = useState(editRecord ? '高校专业教材、科研文献、课程资源及经专家校验的领域数据' : '')
  const [subject, setSubject] = useState(editRecord ? editRecord.subject : '')
  const [corpusType, setCorpusType] = useState(editRecord?.corpusType.includes('后训练') ? '后训练' : editRecord?.corpusType.includes('RAG') ? 'RAG' : '')
  const [orgType, setOrgType] = useState(editRecord ? (editRecord.organization.includes('大学') ? '高校' : editRecord.organization.includes('研究院') ? '新型研发机构' : '企业') : '')
  const [organization, setOrganization] = useState(editRecord
    ? (editRecord.organization === '北京大学' && editRecord.authors.startsWith('北京大学') ? `${editRecord.organization}·${editRecord.authors.replace('北京大学', '')}` : editRecord.organization)
    : '')
  const [customOrganization, setCustomOrganization] = useState('')
  const [orgTags, setOrgTags] = useState<string[]>([])
  const [orgTagInput, setOrgTagInput] = useState('')
  const [language, setLanguage] = useState('')
  const [languageCustom, setLanguageCustom] = useState('')
  const [format, setFormat] = useState('')
  const [timeSpan, setTimeSpan] = useState('')
  const [province, setProvince] = useState('')
  const [corpusSize, setCorpusSize] = useState('')
  const [corpusSizeDetail, setCorpusSizeDetail] = useState('')
  const [storageSize, setStorageSize] = useState('')
  const [storageSizeDetail, setStorageSizeDetail] = useState('')
  const [supplyStatus, setSupplyStatus] = useState('')
  const [supplyMode, setSupplyMode] = useState('')
  const [license, setLicense] = useState('')
  const [openness, setOpenness] = useState('')
  const [uploads, setUploads] = useState<Record<UploadGroupKey, UploadGroupState>>({ sample: emptyUpload(), public: emptyUpload(), all: emptyUpload() })

  useEffect(() => {
    if (!user) openAuth('/upload/form')
  }, [openAuth, user])

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  const updateAuthor = (index: number, key: keyof Author, value: string) => setAuthors((current) => current.map((author, position) => position === index ? { ...author, [key]: value } : author))

  const addOrgTag = () => {
    const value = orgTagInput.trim()
    if (!value) return
    if (orgTags.includes(value)) {
      setOrgTagInput('')
      return
    }
    if (orgTags.length >= 10) {
      notify('最多添加 10 个机构名称')
      return
    }
    setOrgTags((current) => [...current, value])
    setOrgTagInput('')
  }

  const addKeyword = () => {
    const value = keywordInput.trim()
    if (!value) return
    if (keywords.includes(value)) {
      setKeywordInput('')
      return
    }
    if (keywords.length >= 10) {
      notify('最多添加 10 个关键词')
      return
    }
    setKeywords((current) => [...current, value])
    setKeywordInput('')
  }
  const updateUpload = (key: UploadGroupKey, value: UploadGroupState) => setUploads((current) => ({ ...current, [key]: value }))

  const saveDraft = (silent = false) => {
    if (!user) return draftId
    const id = draftId ?? `draft-${Date.now()}`
    const record: UploadDraft = {
      id,
      savedAt: draftStamp(),
      step,
      data: { taskName, authors, corpusName, introduction, keywords, dataSource, subject, corpusType, orgType, organization, customOrganization, orgTags, language, languageCustom, format, timeSpan, province, corpusSize, corpusSizeDetail, storageSize, storageSizeDetail, supplyStatus, supplyMode, license, openness, uploads },
    }
    const next = [record, ...loadDraftList(user.account).filter((item) => item.id !== id)]
    persistDraftList(user.account, next)
    setDraftList(next)
    setDraftId(id)
    if (!silent) notify('当前内容已保存到草稿箱')
    return id
  }

  const applyDraft = (record: UploadDraft) => {
    const data = record.data
    setTaskName(data.taskName ?? '')
    setAuthors(data.authors)
    setCorpusName(data.corpusName)
    setIntroduction(data.introduction)
    setKeywords(data.keywords ?? [])
    setDataSource(data.dataSource)
    setSubject(data.subject ?? '')
    setCorpusType(data.corpusType)
    setOrgType(data.orgType)
    setOrganization(data.organization)
    setCustomOrganization(data.customOrganization)
    setOrgTags(data.orgTags ?? [])
    setLanguage(data.language ?? '')
    setLanguageCustom(data.languageCustom ?? '')
    setFormat(data.format ?? '')
    setTimeSpan(data.timeSpan ?? '')
    setProvince(data.province)
    setCorpusSize(data.corpusSize)
    setCorpusSizeDetail(data.corpusSizeDetail)
    setStorageSize(data.storageSize)
    setStorageSizeDetail(data.storageSizeDetail)
    setSupplyStatus(data.supplyStatus)
    setSupplyMode(data.supplyMode)
    setLicense(data.license)
    setOpenness(data.openness)
    setUploads(data.uploads)
    setDraftId(record.id)
    setStep(Math.min(Math.max(record.step, 1), 3))
    setDraftsOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    notify(`已载入草稿（第 ${Math.min(Math.max(record.step, 1), 3)} 步）`)
  }

  const removeDraft = (id: string) => {
    if (!user) return
    const next = loadDraftList(user.account).filter((item) => item.id !== id)
    persistDraftList(user.account, next)
    setDraftList(next)
    if (draftId === id) setDraftId(null)
    notify('草稿已删除')
  }

  const nameSuggestions = corpusName.trim().length > 1 ? corpusRecords.filter((item) => item.title.includes(corpusName.trim()) && item.title !== corpusName).slice(0, 5) : []
  const effectiveOrganization = orgType === '个人'
    ? '个人'
    : orgType === '企业' || orgType === '新型研发机构'
      ? orgTags.join('、')
      : (organization === '其他' || organization === '北京大学·其他') ? customOrganization : organization

  const submitBasic = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!taskName.trim()) return notify('请填写任务名称')
    if (!subject) return notify('请选择学科领域')
    if (!keywords.length) return notify('请至少添加一个语料库关键词')
    if (!language) return notify('请选择语种类别')
    if (language === '其他' && !languageCustom.trim()) return notify('请填写语种类别')
    if (!format.trim()) return notify('请填写语料格式')
    if (!timeSpan.trim()) return notify('请填写时间跨度')
    if (orgType === '高校') {
      if (!organization) return notify('请选择发布机构')
      if ((organization === '其他' || organization === '北京大学·其他') && !customOrganization.trim()) return notify('请填写机构名称')
    }
    if ((orgType === '企业' || orgType === '新型研发机构') && orgTags.length === 0) return notify('请至少填写一个机构名称')
    if (!corpusType) return notify('请选择语料类型')
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const uploadReady = (key: UploadGroupKey) => {
    const group = uploads[key]
    if (group.mode === 'local') return group.files.length > 0
    if (group.mode === 'link') return Boolean(group.link.trim())
    return true
  }
  const submitFiles = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!license || !openness) return notify('请选择许可协议和开放程度')
    if (!uploadReady('sample')) return notify('请上传示例数据')
    if (!uploadReady('all')) return notify('请上传全部数据')
    setStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submitReview = () => {
    if (user && draftId) {
      const next = loadDraftList(user.account).filter((item) => item.id !== draftId)
      persistDraftList(user.account, next)
      setDraftList(next)
      setDraftId(null)
    }
    setStep(4)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!user) {
    return (
      <main className="corpus-upload-page upload-access-page">
        <div className="upload-access-card"><ShieldCheck size={42} /><h1>上传语料库</h1><h2>请先登录平台</h2><p>登录后可上传语料库，以保障语料权属清晰、操作可追溯。</p><button type="button" onClick={() => openAuth('/upload/form')}>登录平台</button></div>
      </main>
    )
  }

  return (
    <main className="corpus-upload-page">
      <div className="corpus-upload-shell">
        <div className="upload-page-heading">
          <div><span>{editRecord ? '编辑已有语料库' : '规范化语料汇交'}</span><h1>上传语料库</h1><p>请按照步骤完善语料库信息并提交审核</p></div>
          <button className="upload-drafts-btn" type="button" onClick={() => setDraftsOpen(true)}><FolderArchive size={16} />草稿箱（{draftList.length}）</button>
        </div>
        <div className="upload-workspace">
          <aside className="upload-stepper">
            {[['基本信息', '填写作者与语料库信息'], ['上传语料库', '设置开放范围并上传文件'], ['确认信息', '核对全部提交内容'], ['上传成功', '查看审核和上传结果']].map(([title, description], index) => <div key={title} className={`${step === index + 1 ? 'is-active ' : ''}${step > index + 1 ? 'is-complete' : ''}`}><i>{step > index + 1 ? <Check size={15} /> : index + 1}</i><span><strong>{title}</strong><small>{description}</small></span></div>)}
          </aside>

          <section className="upload-form-card">
            {step === 1 && (
              <form onSubmit={submitBasic}>
                <header className="upload-form-title"><div><span>第一步</span><h2>基本信息</h2></div><p>带 * 的项目为必填或必选项</p></header>
                <section className="upload-form-section">
                  <div className="upload-section-title"><div><ClipboardList size={18} /><h3>任务名称</h3></div><p>任务名称用于在草稿箱和汇交记录中标识本次汇交任务，请使用清晰易识别的名称。</p></div>
                  <label className="upload-task-name"><span>任务名称 *</span><input required value={taskName} onChange={(event) => setTaskName(event.target.value)} placeholder="如：天然产物结构语料汇交（2026-09）" /></label>
                </section>
                <section className="upload-form-section">
                  <div className="upload-section-title"><div><UserRound size={18} /><h3>作者信息</h3></div><p>请明确提供可用于联络作者的联系方式，以便有任何疑惑可联络解决。</p></div>
                  <div className="author-list">{authors.map((author, index) => <div className="author-row" key={index}><label><span>姓名 *</span><input required value={author.name} onChange={(event) => updateAuthor(index, 'name', event.target.value)} placeholder="作者姓名" /></label><label><span>联系方式（邮箱/手机号）*</span><input required value={author.contact} onChange={(event) => updateAuthor(index, 'contact', event.target.value)} placeholder="邮箱或手机号" /></label><label><span>所在单位 *</span><input required value={author.organization} onChange={(event) => updateAuthor(index, 'organization', event.target.value)} placeholder="作者所在单位" /></label>{authors.length > 1 && <button type="button" aria-label="删除作者" onClick={() => setAuthors((current) => current.filter((_, position) => position !== index))}><Trash2 size={17} /></button>}{index === authors.length - 1 && <button type="button" className="add-author" aria-label="添加作者" onClick={() => setAuthors((current) => [...current, emptyAuthor()])}><Plus size={18} /></button>}</div>)}</div>
                </section>

                <section className="upload-form-section">
                  <div className="upload-section-title"><div><FileText size={18} /><h3>语料库信息</h3></div></div>
                  <div className="upload-field-grid">
                    <label className="is-wide corpus-name-field"><span>语料库名称 *</span><input required value={corpusName} onChange={(event) => setCorpusName(event.target.value)} placeholder="请填写语料库的名称，如天然产物" />{nameSuggestions.length > 0 && <div className="corpus-name-suggestions"><small>发现已有语料库</small>{nameSuggestions.map((item) => <button type="button" key={item.id} onClick={() => setCorpusName(item.title)}>{item.title}<ChevronRight size={14} /></button>)}</div>}</label>
                    <div className="is-wide example-field-row"><label><span>语料库摘要 *</span><textarea required value={introduction} onChange={(event) => setIntroduction(event.target.value)} placeholder="请给出语料库的简要介绍" /></label><aside><strong>填写样例</strong><p>该数据集面向天然产物结构信息整理，记录分子结构及相关基础信息，可支撑天然产物识别、检索和药物发现研究。来源于北京大学相关课题组自建数据，主要服务模型后训练、知识增强和检索应用。</p><small>以上仅供参考，请使用一个或多个自然段组织提交。</small></aside></div>
                    <label className="is-wide"><span>语料库关键词 *</span>
                    <div className="keyword-box">
                      <input value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addKeyword() } }} placeholder="输入后按回车添加，最多 10 个关键词" />
                      {keywords.length > 0 && <div className="keyword-chips">{keywords.map((keyword) => <span key={keyword}>{keyword}<button type="button" aria-label={`删除关键词 ${keyword}`} onClick={() => setKeywords((current) => current.filter((item) => item !== keyword))}><X size={11} /></button></span>)}</div>}
                    </div>
                    </label>
                    <div className="is-wide example-field-row"><label><span>语料库主要数据来源 *</span><textarea required value={dataSource} onChange={(event) => setDataSource(event.target.value)} placeholder="请说明语料库的主要数据来源" /></label><aside><strong>填写样例</strong><p>北京大学出版社、北京大学101计划、科学出版社、高等教育出版社；数学各二级学科教材；分类参考：GB/T 13745、NSFC数学学科分类。</p><small>以上仅供参考，请根据实际语料库建设的数据来源填写。</small></aside></div>
                  </div>

                  <div className="upload-choice-field">
                    <span>学科领域 *</span>
                    <select className="upload-subject-select" required value={subject} onChange={(event) => setSubject(event.target.value)}>
                      <option value="" disabled>请选择学科领域</option>
                      {subjects.map((name) => (
                        <Fragment key={name}>
                          <option value={name}>{name}</option>
                          {(subjectChildren[name] ?? []).map((child) => <option value={`${name}·${child}`} key={child}>{`　　${child}`}</option>)}
                        </Fragment>
                      ))}
                    </select>
                  </div>
                  <div className="upload-choice-field"><span>语料类型 *</span><div className="option-pill-row">{['预训练', '后训练', 'RAG', '微调'].map((item) => <label className={corpusType === item ? 'is-selected' : ''} key={item}><input type="radio" name="corpus-type" checked={corpusType === item} onChange={() => setCorpusType(item)} />{item}</label>)}</div></div>

                  <div className="upload-field-grid">
                    <label><span>语种类别 *</span><select required value={language} onChange={(event) => setLanguage(event.target.value)}><option value="">请选择</option><option>中文/英文</option><option>中文</option><option>英文</option><option>其他</option></select></label>
                    {language === '其他' && <label><span>其他语种类别 *</span><input required value={languageCustom} onChange={(event) => setLanguageCustom(event.target.value)} placeholder="请填写语种类别" /></label>}
                    <label><span>语料格式 *</span><input required value={format} onChange={(event) => setFormat(event.target.value)} placeholder="如 CSV / JSON / SQL" /></label>
                    <label><span>时间跨度 *</span><input required value={timeSpan} onChange={(event) => setTimeSpan(event.target.value)} placeholder="如 2000年-至今" /></label>
                  </div>

                  <div className="upload-field-grid compact-grid">
                    <label><span>发布机构类型 *</span><select required value={orgType} onChange={(event) => { setOrgType(event.target.value); setOrganization(''); setCustomOrganization(''); setOrgTags([]); setOrgTagInput('') }}><option value="">请选择</option><option>高校</option><option>企业</option><option>新型研发机构</option><option>个人</option></select></label>
                    {orgType === '高校' && (
                      <label><span>发布机构 *</span>
                        <select required value={organization} onChange={(event) => setOrganization(event.target.value)}>
                          <option value="">请选择</option>
                          <option value="北京大学">北京大学</option>
                          {pkuDepartments.map((name) => <option value={name === '其他' ? '北京大学·其他' : `北京大学·${name}`} key={name}>{`　　${name}`}</option>)}
                          {universities.filter((name) => name !== '北京大学' && name !== '其他').map((name) => <option key={name}>{name}</option>)}
                          <option value="其他">其他</option>
                        </select>
                      </label>
                    )}
                    {orgType === '高校' && (organization === '其他' || organization === '北京大学·其他') && (
                      <label><span>{organization === '其他' ? '其他高校名称 *' : '其他院系名称 *'}</span><input required value={customOrganization} onChange={(event) => setCustomOrganization(event.target.value)} placeholder="请输入机构名称" /></label>
                    )}
                    {(orgType === '企业' || orgType === '新型研发机构') && (
                      <div className="is-wide upload-org-tags">
                        <span>{orgType === '企业' ? '企业名称 *（至少填写一个）' : '机构名称 *（至少填写一个）'}</span>
                        <div className="keyword-box">
                          <input value={orgTagInput} onChange={(event) => setOrgTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addOrgTag() } }} placeholder="输入后按回车添加，支持添加多个" />
                          {orgTags.length > 0 && <div className="keyword-chips">{orgTags.map((tag) => <span key={tag}>{tag}<button type="button" aria-label={`删除 ${tag}`} onClick={() => setOrgTags((current) => current.filter((item) => item !== tag))}><X size={11} /></button></span>)}</div>}
                        </div>
                      </div>
                    )}
                    <label><span>发布机构所在省份 *</span><select required value={province} onChange={(event) => setProvince(event.target.value)}><option value="">请选择省份</option>{provinces.map((item) => <option key={item}>{item}</option>)}</select></label>
                    <div className="upload-size-cell"><span>语料规模 *</span><div className="upload-size-controls"><select required value={corpusSize} onChange={(event) => setCorpusSize(event.target.value)}><option value="">请选择</option>{['1千以下', '1千-1万', '1万-10万', '10万-100万', '100万以上'].map((item) => <option key={item}>{item}</option>)}</select><input value={corpusSizeDetail} onChange={(event) => setCorpusSizeDetail(event.target.value)} placeholder="请填写具体语料条数如1000" /></div></div>
                    <div className="upload-size-cell"><span>存储容量 *</span><div className="upload-size-controls"><select required value={storageSize} onChange={(event) => setStorageSize(event.target.value)}><option value="">请选择</option>{['<500GB', '500GB-1TB', '1-2TB', '>2TB'].map((item) => <option key={item}>{item}</option>)}</select><input value={storageSizeDetail} onChange={(event) => setStorageSizeDetail(event.target.value)} placeholder="请填写具体语料规模如15GB" /></div></div>
                    <label><span>对外供给情况 *</span><select required value={supplyStatus} onChange={(event) => setSupplyStatus(event.target.value)}><option value="">请选择</option>{['部分提供公开检索服务', '提供对外供给服务', '提供公开检索服务', '无对外供给', '依申请开放', '已公开提供'].map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label><span>供给方式 *</span><select required value={supplyMode} onChange={(event) => setSupplyMode(event.target.value)}><option value="">请选择</option><option>开源</option><option>闭源</option><option>定向</option></select></label>
                  </div>
                </section>
                <div className="upload-form-actions"><button type="button" onClick={() => saveDraft()}><Save size={16} />保存</button><button type="submit" className="is-primary">下一步<ChevronRight size={16} /></button></div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={submitFiles}>
                <header className="upload-form-title"><div><span>第二步</span><h2>上传语料库</h2></div><p>示例数据与全部数据均为必传内容</p></header>
                <section className="upload-form-section">
                  <div className="upload-field-grid compact-grid"><label><span>语料库文件的许可协议 *</span><select required value={license} onChange={(event) => setLicense(event.target.value)}><option value="">请选择许可协议</option>{['CC0（完全开放无版权限制）', 'CC BY 4.0 保留作者署名', 'CC BY-SA 4.0 保留作者署名并要求使用者以相同许可协议分发其衍生作品', 'CC BY-NC 4.0 保留作者署名并禁止该数据用于任何商业目的', 'CC BY-NC-SA 4.0 保留作者署名，禁止该数据用于任何商业目的，并要求使用者以相同许可协议分发其衍生作品', 'CC BY-ND 4.0 保留作者署名并禁止使用者对数据进行修改、转换或创作', 'CC BY-NC-ND 4.0 保留作者署名，禁止该数据用于任何商业目的，并禁止使用者对数据进行修改、转换或创作'].map((item) => <option key={item}>{item}</option>)}</select></label><label><span>开放程度 *</span><select required value={openness} onChange={(event) => setOpenness(event.target.value)}><option value="">请选择开放程度</option><option>公开</option><option>不公开</option></select></label></div>
                  <div className="upload-open-note"><ShieldCheck size={18} /><p>开放程度决定公众可下载的数据范围。平台管理员及被授权成员仍可按权限使用完整数据。</p></div>
                  <UploadGroup title="示例数据上传" required description="公开与不公开语料库均需提供可展示的示例数据" state={uploads.sample} onChange={(value) => updateUpload('sample', value)} />
                  <UploadGroup title="全部数据" required description="上传语料库完整数据，实际下载范围将依据用户权限和开放程度控制" state={uploads.all} onChange={(value) => updateUpload('all', value)} />
                </section>
                <div className="upload-form-actions"><button type="button" onClick={() => saveDraft()}><Save size={16} />保存</button><button type="button" onClick={() => setStep(1)}>上一步</button><button type="submit" className="is-primary">下一步<ChevronRight size={16} /></button></div>
              </form>
            )}

            {step === 3 && (
              <div>
                <header className="upload-form-title"><div><span>第三步</span><h2>确认信息</h2></div><p>请核对以下内容，确认无误后提交审核</p></header>
                <section className="upload-confirm-section"><h3>作者信息</h3>{authors.map((author, index) => <div className="confirm-author" key={index}><strong>{author.name}</strong><span>{author.contact}</span><span>{author.organization}</span></div>)}</section>
                <section className="upload-confirm-section"><h3>语料库信息</h3><dl><div><dt>语料库名称</dt><dd>{corpusName}</dd></div><div><dt>语料库关键词</dt><dd>{keywords.join('、')}</dd></div><div className="is-wide"><dt>语料库介绍</dt><dd>{introduction}</dd></div><div className="is-wide"><dt>主要数据来源</dt><dd>{dataSource}</dd></div><div><dt>学科领域</dt><dd>{subject}</dd></div><div><dt>语料类型</dt><dd>{corpusType}</dd></div><div><dt>语种类别</dt><dd>{language === '其他' ? languageCustom : language}</dd></div><div><dt>语料格式</dt><dd>{format}</dd></div><div><dt>时间跨度</dt><dd>{timeSpan}</dd></div><div><dt>发布机构</dt><dd>{effectiveOrganization}</dd></div><div><dt>所在省份</dt><dd>{province}</dd></div><div><dt>语料规模</dt><dd>{corpusSize}</dd></div><div><dt>存储容量</dt><dd>{storageSize}</dd></div><div><dt>对外供给</dt><dd>{supplyStatus}</dd></div><div><dt>供给方式</dt><dd>{supplyMode}</dd></div></dl></section>
                <section className="upload-confirm-section"><h3>文件与开放信息</h3><dl><div><dt>许可协议</dt><dd>{license}</dd></div><div><dt>开放程度</dt><dd>{openness}</dd></div><div><dt>示例数据</dt><dd>{groupLabel(uploads.sample)}</dd></div><div><dt>全部数据</dt><dd>{groupLabel(uploads.all)}</dd></div></dl></section>
                <div className="upload-form-actions"><button type="button" onClick={() => saveDraft()}><Save size={16} />保存</button><button type="button" onClick={() => setStep(2)}>上一步</button><button type="button" className="is-primary" onClick={submitReview}>提交审核</button></div>
              </div>
            )}

            {step === 4 && <div className="upload-success"><CheckCircle2 size={64} /><span>第四步</span><h2>语料库上传成功</h2><p>平台已收到您的语料库信息和文件，审核进度与结果可在个人主页查看。</p><div><Link to="/profile">前往个人主页</Link></div></div>}
          </section>
        </div>
      </div>
      {draftsOpen && (
        <div className="dataset-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setDraftsOpen(false) }}>
          <section className="dataset-modal upload-drafts-modal" role="dialog" aria-modal="true">
            <div className="dataset-modal-title"><div><FolderArchive size={21} /><h2>草稿箱</h2></div><button type="button" onClick={() => setDraftsOpen(false)} aria-label="关闭"><X size={18} /></button></div>
            {draftList.length > 0 ? (
              <div className="upload-draft-list">
                {draftList.map((record) => (
                  <article className="upload-draft-card" key={record.id}>
                    <div className="upload-draft-copy">
                      <h3>{record.data.taskName?.trim() || record.data.corpusName?.trim() || '未命名语料草稿'}</h3>
                      <p>保存于 {record.savedAt} · 第 {Math.min(Math.max(record.step, 1), 3)} 步</p>
                    </div>
                    <div className="upload-draft-actions">
                      <button type="button" className="is-primary" onClick={() => applyDraft(record)}>继续填写</button>
                      <button type="button" onClick={() => removeDraft(record.id)}><Trash2 size={15} />删除</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : <p className="upload-draft-empty">暂无草稿</p>}
          </section>
        </div>
      )}

      {toast && <div className="upload-toast"><Check size={16} />{toast}</div>}
    </main>
  )
}
