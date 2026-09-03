import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  FileArchive,
  FileText,
  Github,
  Link2,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'
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
export const pkuDepartments = ['数学科学学院', '物理学院', '化学与分子工程学院', '天文学院-科维理天文与天体物理研究所', '环境科学与工程学院', '城市与环境学院', '地球与空间科学学院', '遥感与地理信息系统研究所', '北京未来基因诊断高精尖创新中心', '生命科学学院', '药学院', '健康医疗大数据国家研究院', '护理学院', '其他']
export const provinces = ['北京市', '天津市', '河北省', '山西省', '内蒙古自治区', '辽宁省', '吉林省', '黑龙江省', '上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省', '湖北省', '湖南省', '广东省', '广西壮族自治区', '海南省', '重庆市', '四川省', '贵州省', '云南省', '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区']

const emptyAuthor = (): Author => ({ name: '', contact: '', organization: '' })
const emptyUpload = (): UploadGroupState => ({ mode: 'local', files: [], link: '', linkKind: 'url' })
const cli_upload_cmd = 'corpusware upload --corpus <语料ID> --data ./corpus'

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
      <div className="upload-file-group-head"><div><h3>{title}{required && <b> *</b>}</h3><p>{description}</p></div><div className="upload-source-tabs"><button type="button" className={state.mode === 'local' ? 'is-active' : ''} onClick={() => onChange({ ...state, mode: 'local' })}>本地文件</button><button type="button" className={state.mode === 'link' ? 'is-active' : ''} onClick={() => onChange({ ...state, mode: 'link' })}>链接</button><button type="button" className={state.mode === 'cli' ? 'is-active' : ''} onClick={() => onChange({ ...state, mode: 'cli' })}>命令行</button></div></div>
      {state.mode === 'local' && (
        <div className="upload-file-drop upload-drop-v2" onDragOver={() => false} onDrop={(event) => { event.preventDefault(); updateFiles(event.dataTransfer.files) }}>
          <span className="upload-drop-icon"><FileArchive size={30} /></span>
          <div className="upload-drop-copy">
            <strong>{state.files.length ? `已选择 ${state.files.length} 个文件` : '拖拽文件到此处上传'}</strong>
            <span>{state.files.length ? state.files.slice(0, 3).join('、') : '支持单个文件、多个文件或整个文件夹'}</span>
            <div>
              <label className="upload-browse-btn" htmlFor={`${inputKey}-files`}>浏览文件</label>
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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editRecord = useMemo(() => corpusRecords.find((item) => item.id === searchParams.get('edit')), [searchParams])
  const [step, setStep] = useState(1)
  const [toast, setToast] = useState('')
  const [authors, setAuthors] = useState<Author[]>([emptyAuthor()])
  const [corpusName, setCorpusName] = useState(editRecord?.title ?? '')
  const [introduction, setIntroduction] = useState(editRecord?.summary ?? '')
  const [keywordInput, setKeywordInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>(editRecord?.keywords ?? [])
  const [dataSource, setDataSource] = useState(editRecord ? '高校专业教材、科研文献、课程资源及经专家校验的领域数据' : '')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(editRecord ? [editRecord.subject] : [])
  const [selectedChildren, setSelectedChildren] = useState<Record<string, string[]>>(() => editRecord && subjectChildren[editRecord.subject] ? { [editRecord.subject]: subjectChildren[editRecord.subject] } : {})
  const [corpusType, setCorpusType] = useState(editRecord?.corpusType.includes('后训练') ? '后训练' : editRecord?.corpusType.includes('RAG') ? 'RAG' : '')
  const [orgType, setOrgType] = useState(editRecord ? (editRecord.organization.includes('大学') ? '高校' : editRecord.organization.includes('研究院') ? '新型研发机构' : '企业') : '')
  const [organization, setOrganization] = useState(editRecord?.organization ?? '')
  const [department, setDepartment] = useState(editRecord?.organization === '北京大学' ? editRecord.authors.replace('北京大学', '') : '')
  const [customOrganization, setCustomOrganization] = useState('')
  const [customDepartment, setCustomDepartment] = useState('')
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
    if (!user) openAuth('/upload')
  }, [openAuth, user])

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  const updateAuthor = (index: number, key: keyof Author, value: string) => setAuthors((current) => current.map((author, position) => position === index ? { ...author, [key]: value } : author))

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

  const toggleSubject = (subject: string) => {
    const selected = selectedSubjects.includes(subject)
    setSelectedSubjects((current) => selected ? current.filter((item) => item !== subject) : [...current, subject])
    if (subjectChildren[subject]) setSelectedChildren((current) => ({ ...current, [subject]: selected ? [] : subjectChildren[subject] }))
  }

  const toggleChild = (subject: string, child: string) => {
    const current = selectedChildren[subject] ?? []
    const next = current.includes(child) ? current.filter((item) => item !== child) : [...current, child]
    setSelectedChildren((all) => ({ ...all, [subject]: next }))
    if (!next.length) setSelectedSubjects((items) => items.filter((item) => item !== subject))
  }

  const saveDraft = () => {
    if (!user) return
    window.localStorage.setItem(`gw-upload-draft-${user.account}`, JSON.stringify({ authors, corpusName, introduction, keywords, dataSource, selectedSubjects, selectedChildren, corpusType, orgType, organization, department, customOrganization, customDepartment, province, corpusSize, corpusSizeDetail, storageSize, storageSizeDetail, supplyStatus, supplyMode, license, openness, uploads, step }))
    notify('当前内容已保存')
  }

  const nameSuggestions = corpusName.trim().length > 1 ? corpusRecords.filter((item) => item.title.includes(corpusName.trim()) && item.title !== corpusName).slice(0, 5) : []
  const effectiveOrganization = orgType === '个人' ? '个人' : organization === '其他' ? customOrganization : organization
  const effectiveDepartment = department === '其他' ? customDepartment : department

  const submitBasic = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedSubjects.length) return notify('请选择至少一个学科领域')
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
    if (openness === '部分公开' && !uploadReady('public')) return notify('请上传对外公开的部分数据')
    if (!uploadReady('all')) return notify('请上传全部数据')
    setStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submitReview = () => {
    saveDraft()
    setStep(4)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!user) {
    return (
      <main className="corpus-upload-page upload-access-page">
        <div className="upload-access-card"><ShieldCheck size={42} /><h1>上传语料库</h1><h2>请先登录平台</h2><p>登录后可上传语料库，以保障语料权属清晰、操作可追溯。</p><button type="button" onClick={() => openAuth('/upload')}>登录平台</button></div>
      </main>
    )
  }

  return (
    <main className="corpus-upload-page">
      <div className="corpus-upload-shell">
        <div className="upload-page-heading"><div><span>{editRecord ? '编辑已有语料库' : '规范化语料汇交'}</span><h1>上传语料库</h1></div><p>请按照步骤完善语料库信息并提交审核</p></div>
        <div className="upload-workspace">
          <aside className="upload-stepper">
            {[['基本信息', '填写作者与语料库信息'], ['上传语料库', '设置开放范围并上传文件'], ['确认信息', '核对全部提交内容'], ['上传成功', '查看审核和上传结果']].map(([title, description], index) => <div key={title} className={`${step === index + 1 ? 'is-active ' : ''}${step > index + 1 ? 'is-complete' : ''}`}><i>{step > index + 1 ? <Check size={15} /> : index + 1}</i><span><strong>{title}</strong><small>{description}</small></span></div>)}
          </aside>

          <section className="upload-form-card">
            {step === 1 && (
              <form onSubmit={submitBasic}>
                <header className="upload-form-title"><div><span>第一步</span><h2>基本信息</h2></div><p>带 * 的项目为必填或必选项</p></header>
                <section className="upload-form-section">
                  <div className="upload-section-title"><div><UserRound size={18} /><h3>作者信息</h3></div><p>请明确提供可用于联络作者的联系方式，以便有任何疑惑可联络解决。</p></div>
                  <div className="author-list">{authors.map((author, index) => <div className="author-row" key={index}><label><span>姓名 *</span><input required value={author.name} onChange={(event) => updateAuthor(index, 'name', event.target.value)} placeholder="作者姓名" /></label><label><span>联系方式（邮箱/手机号）*</span><input required value={author.contact} onChange={(event) => updateAuthor(index, 'contact', event.target.value)} placeholder="邮箱或手机号" /></label><label><span>所在单位 *</span><input required value={author.organization} onChange={(event) => updateAuthor(index, 'organization', event.target.value)} placeholder="作者所在单位" /></label>{authors.length > 1 && <button type="button" aria-label="删除作者" onClick={() => setAuthors((current) => current.filter((_, position) => position !== index))}><Trash2 size={17} /></button>}{index === authors.length - 1 && <button type="button" className="add-author" aria-label="添加作者" onClick={() => setAuthors((current) => [...current, emptyAuthor()])}><Plus size={18} /></button>}</div>)}</div>
                </section>

                <section className="upload-form-section">
                  <div className="upload-section-title"><div><FileText size={18} /><h3>语料库信息</h3></div></div>
                  <div className="upload-field-grid">
                    <label className="is-wide corpus-name-field"><span>语料库名称 *</span><input required value={corpusName} onChange={(event) => setCorpusName(event.target.value)} placeholder="请填写语料库的名称，如天然产物" />{nameSuggestions.length > 0 && <div className="corpus-name-suggestions"><small>发现已有语料库</small>{nameSuggestions.map((item) => <button type="button" key={item.id} onClick={() => setCorpusName(item.title)}>{item.title}<ChevronRight size={14} /></button>)}</div>}</label>
                    <div className="is-wide example-field-row"><label><span>语料库摘要 *</span><textarea required value={introduction} onChange={(event) => setIntroduction(event.target.value)} placeholder="请给出语料库的简要介绍" /></label><aside><strong>填写样例</strong><p>该数据集面向天然产物结构信息整理，记录分子结构及相关基础信息，可支撑天然产物识别、检索和药物发现研究。来源于北京大学相关课题组自建数据，主要服务模型后训练、知识增强和检索应用。</p><small>以上仅供参考，请使用一个或多个自然段组织提交。</small></aside></div>
                    <label className="is-wide"><span>语料库关键词</span>
                    <div className="keyword-box">
                      <input value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addKeyword() } }} placeholder="输入后按回车添加，最多 10 个关键词" />
                      {keywords.length > 0 && <div className="keyword-chips">{keywords.map((keyword) => <span key={keyword}>{keyword}<button type="button" aria-label={`删除关键词 ${keyword}`} onClick={() => setKeywords((current) => current.filter((item) => item !== keyword))}><X size={11} /></button></span>)}</div>}
                    </div>
                    </label>
                    <div className="is-wide example-field-row"><label><span>语料库主要数据来源 *</span><textarea required value={dataSource} onChange={(event) => setDataSource(event.target.value)} placeholder="请说明语料库的主要数据来源" /></label><aside><strong>填写样例</strong><p>北京大学出版社、北京大学101计划、科学出版社、高等教育出版社；数学各二级学科教材；分类参考：GB/T 13745、NSFC数学学科分类。</p><small>以上仅供参考，请根据实际语料库建设的数据来源填写。</small></aside></div>
                  </div>

                  <div className="upload-choice-field"><span>学科领域 *</span><div className="subject-choice-grid">{subjects.map((subject) => <div key={subject} className={selectedSubjects.includes(subject) ? 'is-selected' : ''}><label><input type="checkbox" checked={selectedSubjects.includes(subject)} onChange={() => toggleSubject(subject)} /><strong>{subject}</strong></label>{selectedSubjects.includes(subject) && subjectChildren[subject] && <div>{subjectChildren[subject].map((child) => <label key={child}><input type="checkbox" checked={(selectedChildren[subject] ?? []).includes(child)} onChange={() => toggleChild(subject, child)} />{child}</label>)}</div>}</div>)}</div></div>

                  <div className="upload-choice-field"><span>语料类型 *</span><div className="option-pill-row">{['预训练', '后训练', 'RAG', '微调'].map((item) => <label className={corpusType === item ? 'is-selected' : ''} key={item}><input type="radio" name="corpus-type" checked={corpusType === item} onChange={() => setCorpusType(item)} />{item}</label>)}</div></div>

                  <div className="upload-field-grid compact-grid">
                    <label><span>发布机构类型 *</span><select required value={orgType} onChange={(event) => { setOrgType(event.target.value); setOrganization(''); setDepartment('') }}><option value="">请选择</option><option>高校</option><option>企业</option><option>新型研发机构</option><option>个人</option></select></label>
                    {orgType && orgType !== '个人' && <label><span>发布机构 *</span><select required value={organization} onChange={(event) => { setOrganization(event.target.value); setDepartment('') }}><option value="">请选择</option>{(orgType === '高校' ? universities : orgType === '企业' ? ['深势科技', '其他'] : ['北京科学智能研究院', '其他']).map((item) => <option key={item}>{item}</option>)}</select></label>}
                    {orgType === '高校' && organization === '北京大学' && <label><span>院系单位 *</span><select required value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">请选择</option>{pkuDepartments.map((item) => <option key={item}>{item}</option>)}</select></label>}
                    {organization === '其他' && <label><span>其他机构名称 *</span><input required value={customOrganization} onChange={(event) => setCustomOrganization(event.target.value)} placeholder="请输入机构名称" /></label>}
                    {department === '其他' && <label><span>其他院系名称 *</span><input required value={customDepartment} onChange={(event) => setCustomDepartment(event.target.value)} placeholder="请输入院系名称" /></label>}
                    <label><span>发布机构所在省份 *</span><select required value={province} onChange={(event) => setProvince(event.target.value)}><option value="">请选择省份</option>{provinces.map((item) => <option key={item}>{item}</option>)}</select></label>
                    <div className="upload-size-cell"><label><span>语料规模 *</span><select required value={corpusSize} onChange={(event) => setCorpusSize(event.target.value)}><option value="">请选择</option>{['1千以下', '1千-1万', '1万-10万', '10万-100万', '100万以上'].map((item) => <option key={item}>{item}</option>)}</select></label>{corpusSize && <input value={corpusSizeDetail} onChange={(event) => setCorpusSizeDetail(event.target.value)} placeholder="请填写具体语料条数如1000" />}</div>
                    <div className="upload-size-cell"><label><span>存储容量 *</span><select required value={storageSize} onChange={(event) => setStorageSize(event.target.value)}><option value="">请选择</option>{['<500GB', '500GB-1TB', '1-2TB', '>2TB'].map((item) => <option key={item}>{item}</option>)}</select></label>{storageSize && <input value={storageSizeDetail} onChange={(event) => setStorageSizeDetail(event.target.value)} placeholder="请填写具体语料规模如15GB" />}</div>
                    <label><span>对外供给情况 *</span><select required value={supplyStatus} onChange={(event) => setSupplyStatus(event.target.value)}><option value="">请选择</option>{['部分提供公开检索服务', '提供对外供给服务', '提供公开检索服务', '无对外供给', '依申请开放', '已公开提供'].map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label><span>供给方式 *</span><select required value={supplyMode} onChange={(event) => setSupplyMode(event.target.value)}><option value="">请选择</option><option>开源</option><option>闭源</option><option>定向</option></select></label>
                  </div>
                </section>
                <div className="upload-form-actions"><button type="button" onClick={saveDraft}><Save size={16} />保存</button><button type="submit" className="is-primary">下一步<ChevronRight size={16} /></button></div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={submitFiles}>
                <header className="upload-form-title"><div><span>第二步</span><h2>上传语料库</h2></div><p>示例数据与全部数据均为必传内容</p></header>
                <section className="upload-form-section">
                  <div className="upload-field-grid compact-grid"><label><span>语料库文件的许可协议 *</span><select required value={license} onChange={(event) => setLicense(event.target.value)}><option value="">请选择许可协议</option>{['CC0（完全开放无版权限制）', 'CC BY 4.0 保留作者署名', 'CC BY-SA 4.0 保留作者署名并要求使用者以相同许可协议分发其衍生作品', 'CC BY-NC 4.0 保留作者署名并禁止该数据用于任何商业目的', 'CC BY-NC-SA 4.0 保留作者署名，禁止该数据用于任何商业目的，并要求使用者以相同许可协议分发其衍生作品', 'CC BY-ND 4.0 保留作者署名并禁止使用者对数据进行修改、转换或创作', 'CC BY-NC-ND 4.0 保留作者署名，禁止该数据用于任何商业目的，并禁止使用者对数据进行修改、转换或创作'].map((item) => <option key={item}>{item}</option>)}</select></label><label><span>开放程度 *</span><select required value={openness} onChange={(event) => setOpenness(event.target.value)}><option value="">请选择开放程度</option><option>公开</option><option>部分公开</option><option>不公开</option></select></label></div>
                  <div className="upload-open-note"><ShieldCheck size={18} /><p>开放程度决定公众可下载的数据范围。平台管理员及被授权成员仍可按权限使用完整数据。</p></div>
                  <UploadGroup title="示例数据上传" required description="公开、部分公开和不公开语料库均需提供可展示的示例数据" state={uploads.sample} onChange={(value) => updateUpload('sample', value)} />
                  {openness === '部分公开' && <UploadGroup title="公开部分数据" required description="上传允许公众直接浏览或下载的那部分数据" state={uploads.public} onChange={(value) => updateUpload('public', value)} />}
                  <UploadGroup title="全部数据" required description="上传语料库完整数据，实际下载范围将依据用户权限和开放程度控制" state={uploads.all} onChange={(value) => updateUpload('all', value)} />
                </section>
                <div className="upload-form-actions"><button type="button" onClick={saveDraft}><Save size={16} />保存</button><button type="button" onClick={() => setStep(1)}>上一步</button><button type="submit" className="is-primary">下一步<ChevronRight size={16} /></button></div>
              </form>
            )}

            {step === 3 && (
              <div>
                <header className="upload-form-title"><div><span>第三步</span><h2>确认信息</h2></div><p>请核对以下内容，确认无误后提交审核</p></header>
                <section className="upload-confirm-section"><h3>作者信息</h3>{authors.map((author, index) => <div className="confirm-author" key={index}><strong>{author.name}</strong><span>{author.contact}</span><span>{author.organization}</span></div>)}</section>
                <section className="upload-confirm-section"><h3>语料库信息</h3><dl><div><dt>语料库名称</dt><dd>{corpusName}</dd></div><div><dt>语料库关键词</dt><dd>{keywords.join('、')}</dd></div><div className="is-wide"><dt>语料库介绍</dt><dd>{introduction}</dd></div><div className="is-wide"><dt>主要数据来源</dt><dd>{dataSource}</dd></div><div><dt>学科领域</dt><dd>{selectedSubjects.join('、')}</dd></div><div><dt>语料类型</dt><dd>{corpusType}</dd></div><div><dt>发布机构</dt><dd>{[effectiveOrganization, effectiveDepartment].filter(Boolean).join(' - ')}</dd></div><div><dt>所在省份</dt><dd>{province}</dd></div><div><dt>语料规模</dt><dd>{corpusSize}</dd></div><div><dt>存储容量</dt><dd>{storageSize}</dd></div><div><dt>对外供给</dt><dd>{supplyStatus}</dd></div><div><dt>供给方式</dt><dd>{supplyMode}</dd></div></dl></section>
                <section className="upload-confirm-section"><h3>文件与开放信息</h3><dl><div><dt>许可协议</dt><dd>{license}</dd></div><div><dt>开放程度</dt><dd>{openness}</dd></div><div><dt>示例数据</dt><dd>{groupLabel(uploads.sample)}</dd></div>{openness === '部分公开' && <div><dt>公开部分数据</dt><dd>{groupLabel(uploads.public)}</dd></div>}<div><dt>全部数据</dt><dd>{groupLabel(uploads.all)}</dd></div></dl></section>
                <div className="upload-form-actions"><button type="button" onClick={saveDraft}><Save size={16} />保存</button><button type="button" onClick={() => setStep(2)}>上一步</button><button type="button" className="is-primary" onClick={submitReview}>提交审核</button></div>
              </div>
            )}

            {step === 4 && <div className="upload-success"><CheckCircle2 size={64} /><span>第四步</span><h2>语料库上传成功</h2><p>平台已收到您的语料库信息和文件，审核进度与结果可在个人主页查看。</p><div><Link to="/profile">前往个人主页</Link><button type="button" onClick={() => navigate(`/search/datasets/${editRecord?.id ?? corpusRecords[0].id}`)}>查看语料详情</button></div></div>}
          </section>
        </div>
      </div>
      {toast && <div className="upload-toast"><Check size={16} />{toast}</div>}
    </main>
  )
}
