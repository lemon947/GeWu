import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft, ArrowUpFromLine, Check, Copy, FileArchive, FileText, FolderUp, Github, Link2, Plus, Trash2, X } from 'lucide-react'
import { corpusRecords, recordDisplayMeta } from './CorpusSearch'
import { provinces, pkuDepartments, subjectChildren, subjects, universities } from './CorpusUpload'

type Author = { name: string; contact: string; organization: string }
type SelectedFile = { id: string; name: string; size: number }

const maxUploadBytes = 2 * 1024 * 1024 * 1024
const emptyAuthor = (): Author => ({ name: '', contact: '', organization: '' })

type UploadSectionState = { mode: 'local' | 'link' | 'cli'; files: SelectedFile[]; link: string; linkKind: 'url' | 'github' }

const emptyUploadSection = (): UploadSectionState => ({ mode: 'local', files: [], link: '', linkKind: 'url' })

function UploadModule({ title, state, onChange, notify, corpusId }: { title: string; state: UploadSectionState; onChange: (next: UploadSectionState) => void; notify: (message: string) => void; corpusId: string }) {
  const handleFiles = (list: FileList | null) => {
    if (!list?.length) return
    const timestamp = Date.now()
    const next = Array.from(list).map((file, index) => ({
      id: `${timestamp}-${index}-${file.name}-${file.size}`,
      name: file.webkitRelativePath || file.name,
      size: file.size,
    }))
    const total = state.files.reduce((sum, file) => sum + file.size, 0) + next.reduce((sum, file) => sum + file.size, 0)
    if (total > maxUploadBytes) {
      notify('单次上传数据大小不超过 2GB，请压缩或分批上传')
      return
    }
    onChange({ ...state, files: [...state.files, ...next] })
  }

  return (
    <section className="editor-upload-module">
      <h3 className="editor-upload-module-title">{title}</h3>
      <div className="upload-mode-tabs">
        <button type="button" className={state.mode === 'local' ? 'is-active' : ''} onClick={() => onChange({ ...state, mode: 'local' })}>本地上传</button>
        <button type="button" className={state.mode === 'link' ? 'is-active' : ''} onClick={() => onChange({ ...state, mode: 'link' })}>外部链接导入</button>
        <button type="button" className={state.mode === 'cli' ? 'is-active' : ''} onClick={() => onChange({ ...state, mode: 'cli' })}>命令行上传</button>
      </div>
      {state.mode === 'local' && (
        <>
          <div className="upload-file-drop">
            <FileArchive size={26} />
            <div>
              <strong>{state.files.length ? `已选择 ${state.files.length} 个文件` : '选择需要上传的语料文件'}</strong>
              <span>{state.files.length ? state.files.slice(0, 3).map((file) => file.name).join('、') : '单次上传数据大小不超过 2GB，上传后将发送给管理员审核'}</span>
            </div>
            <div>
              <label htmlFor={`${title.replace(/\s/g, '')}-files`}><ArrowUpFromLine size={15} />上传文件</label>
              <label htmlFor={`${title.replace(/\s/g, '')}-folder`}><FolderUp size={15} />上传文件夹</label>
            </div>
            <input id={`${title.replace(/\s/g, '')}-files`} hidden type="file" multiple onChange={(event) => { handleFiles(event.target.files); event.currentTarget.value = '' }} />
            <input id={`${title.replace(/\s/g, '')}-folder`} hidden type="file" multiple ref={(node) => node?.setAttribute('webkitdirectory', '')} onChange={(event) => { handleFiles(event.target.files); event.currentTarget.value = '' }} />
          </div>
          {state.files.length > 0 && (
            <div className="upload-file-list">
              {state.files.map((file) => (
                <div className="upload-file-card" key={file.id}>
                  <FileText size={18} />
                  <div><strong>{file.name}</strong><small>{formatFileSize(file.size)}</small></div>
                  <button type="button" onClick={() => onChange({ ...state, files: state.files.filter((item) => item.id !== file.id) })} aria-label={`删除 ${file.name}`}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
        </>
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
            <div className="download-code-head"><button type="button" onClick={() => navigator.clipboard?.writeText(`corpusware upload --corpus ${corpusId} --data ./corpus`)}><Copy size={15} />复制</button></div>
            <pre><code>{`corpusware upload --corpus ${corpusId} --data ./corpus`}</code></pre>
          </div>
        </div>
      )}
    </section>
  )
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${size} B`
}

export default function DatasetEdit() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const item = corpusRecords.find((record) => record.id === id) ?? corpusRecords[0]
  const meta = recordDisplayMeta(item)
  const [authors, setAuthors] = useState<Author[]>([{ name: '张伟', contact: '', organization: item.authors }])
  const [subject, setSubject] = useState(item.subject)
  const [subjectChild, setSubjectChild] = useState(subjectChildren[item.subject]?.[0] ?? '')
  const [corpusName, setCorpusName] = useState(item.title)
  const [introduction, setIntroduction] = useState(item.summary)
  const [keywordInput, setKeywordInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>(item.keywords.slice(0, 10))
  const [dataSource, setDataSource] = useState('高校专业教材、科研文献、课程资源及经专家校验的领域数据')
  const [corpusType, setCorpusType] = useState(item.corpusType.includes('后训练') ? '后训练' : item.corpusType.includes('RAG') || item.corpusType.includes('检索') ? 'RAG' : item.corpusType.includes('微调') ? '微调' : '预训练')
  const [orgType, setOrgType] = useState(item.organization.includes('大学') ? '高校' : item.organization.includes('研究院') ? '新型研发机构' : '企业')
  const [organization, setOrganization] = useState(item.organization)
  const [department, setDepartment] = useState(item.organization === '北京大学' ? item.authors.replace('北京大学', '') : '')
  const [customOrganization, setCustomOrganization] = useState('')
  const [customDepartment, setCustomDepartment] = useState('')
  const [province, setProvince] = useState('')
  const [corpusSize, setCorpusSize] = useState(meta.corpusSize)
  const [corpusSizeDetail, setCorpusSizeDetail] = useState('')
  const [storageSize, setStorageSize] = useState(meta.storageSize)
  const [storageSizeDetail, setStorageSizeDetail] = useState('')
  const [supplyStatus, setSupplyStatus] = useState(item.openness === '依申请开放' || item.openness === '定向开放' ? '依申请开放' : '已公开提供')
  const [supplyMode, setSupplyMode] = useState('开源')
  const [license, setLicense] = useState('CC BY 4.0 保留作者署名')
  const [openness, setOpenness] = useState(item.openness === '不公开' ? '不公开' : '公开')
  const [language, setLanguage] = useState(item.subject === '数学' || item.subject === '物理' ? '中文/英文' : '中文')
  const [format, setFormat] = useState(item.subject === '化学' ? '反应SMARTS + 结构化文本' : item.subject === '地理' || item.subject === '天文' ? 'CSV、JSON、XML、API接口' : 'CSV / JSON / SQL')
  const [timeSpan, setTimeSpan] = useState(item.subject === '数学' ? '2000年-至今' : '2020年-至今')
  const [sampleUpload, setSampleUpload] = useState<UploadSectionState>(emptyUploadSection)
  const [allUpload, setAllUpload] = useState<UploadSectionState>(emptyUploadSection)
  const [remark, setRemark] = useState('')
  const [toast, setToast] = useState('')
  const [showSaved, setShowSaved] = useState(false)
  const [editTab, setEditTab] = useState<'basic' | 'upload'>('basic')

  const flashToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  const updateAuthor = (index: number, key: keyof Author, value: string) => setAuthors((current) => current.map((author, i) => i === index ? { ...author, [key]: value } : author))

  const addKeyword = () => {
    const value = keywordInput.trim()
    if (!value) return
    if (keywords.includes(value)) {
      setKeywordInput('')
      return
    }
    if (keywords.length >= 10) {
      flashToast('最多添加 10 个关键词')
      return
    }
    setKeywords((current) => [...current, value])
    setKeywordInput('')
  }

  const saveEdit = () => {
    if (!corpusName.trim() || !introduction.trim() || !corpusType || !format.trim() || !timeSpan.trim()) {
      flashToast('请完善必填信息')
      return
    }
    setShowSaved(true)
  }

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(`/search/datasets/${item.id}`)
  }

  return (
    <main className="dataset-edit-page">
      <button className="dataset-back-button" type="button" onClick={goBack}><ArrowLeft size={17} />返回</button>

      <section className="dataset-edit-shell">
        <header className="dataset-edit-head">
          <h1>编辑语料</h1>
          <p>修改语料库已有信息，并在下方选择需要补充上传的数据文件。</p>
        </header>
        <nav className="dataset-edit-tabs" aria-label="编辑页分类">
          <button type="button" className={editTab === 'basic' ? 'is-active' : ''} onClick={() => setEditTab('basic')}>基本信息</button>
          <button type="button" className={editTab === 'upload' ? 'is-active' : ''} onClick={() => setEditTab('upload')}>上传数据</button>
        </nav>

        {editTab === 'basic' && (
          <>
        <h2 className="dataset-edit-module-title"><b>01</b>基本信息</h2>
        <div className="author-list">
          {authors.map((author, index) => (
            <div className="author-row" key={index}>
              <label><span>姓名 *</span><input value={author.name} onChange={(event) => updateAuthor(index, 'name', event.target.value)} placeholder="作者姓名" /></label>
              <label><span>联系方式（邮箱/手机号）*</span><input value={author.contact} onChange={(event) => updateAuthor(index, 'contact', event.target.value)} placeholder="邮箱或手机号" /></label>
              <label><span>所在单位 *</span><input value={author.organization} onChange={(event) => updateAuthor(index, 'organization', event.target.value)} placeholder="作者所在单位" /></label>
              {authors.length > 1 && <button type="button" aria-label="删除作者" onClick={() => setAuthors((current) => current.filter((_, i) => i !== index))}><Trash2 size={17} /></button>}
              {index === authors.length - 1 && <button type="button" className="add-author" aria-label="添加作者" onClick={() => setAuthors((current) => [...current, emptyAuthor()])}><Plus size={18} /></button>}
            </div>
          ))}
        </div>

        <div className="dataset-edit-grid">
          <label className="dataset-edit-field is-wide"><span>语料库名称 *</span><input value={corpusName} onChange={(event) => setCorpusName(event.target.value)} placeholder="请填写语料库的名称" /></label>
        </div>
        <label className="dataset-edit-field"><span>语料库摘要 *</span><textarea rows={4} value={introduction} onChange={(event) => setIntroduction(event.target.value)} placeholder="请给出语料库的简要介绍" /></label>
        <label className="dataset-edit-field"><span>语料库关键词</span>
          <div className="keyword-box">
            <input value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addKeyword() } }} placeholder="输入后按回车添加，最多 10 个关键词" />
            {keywords.length > 0 && <div className="keyword-chips">{keywords.map((keyword) => <span key={keyword}>{keyword}<button type="button" aria-label={`删除关键词 ${keyword}`} onClick={() => setKeywords((current) => current.filter((item) => item !== keyword))}><X size={11} /></button></span>)}</div>}
          </div>
        </label>
        <label className="dataset-edit-field"><span>语料库主要数据来源 *</span><textarea rows={3} value={dataSource} onChange={(event) => setDataSource(event.target.value)} placeholder="请说明语料库的主要数据来源" /></label>

        <div className="dataset-edit-grid">
          <label className="dataset-edit-field"><span>学科领域 *</span><select value={subject} onChange={(event) => { setSubject(event.target.value); setSubjectChild(subjectChildren[event.target.value]?.[0] ?? '') }}>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
          {subjectChildren[subject] && (
            <label className="dataset-edit-field"><span>细分方向</span><select value={subjectChild} onChange={(event) => setSubjectChild(event.target.value)}>{subjectChildren[subject].map((child) => <option key={child}>{child}</option>)}</select></label>
          )}
          <label className="dataset-edit-field"><span>语料类型 *</span><select value={corpusType} onChange={(event) => setCorpusType(event.target.value)}>{['预训练', '后训练', 'RAG', '微调'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="dataset-edit-field"><span>语种类别 *</span><select value={language} onChange={(event) => setLanguage(event.target.value)}><option>中文/英文</option><option>中文</option><option>英文</option></select></label>
          <label className="dataset-edit-field"><span>语料格式 *</span><input value={format} onChange={(event) => setFormat(event.target.value)} placeholder="如 CSV / JSON / SQL" /></label>
          <label className="dataset-edit-field"><span>时间跨度 *</span><input value={timeSpan} onChange={(event) => setTimeSpan(event.target.value)} placeholder="如 2000年-至今" /></label>
        </div>

        <div className="dataset-edit-grid">
          <label className="dataset-edit-field"><span>发布机构类型 *</span><select value={orgType} onChange={(event) => { setOrgType(event.target.value); setOrganization(''); setDepartment('') }}><option>高校</option><option>企业</option><option>新型研发机构</option><option>个人</option></select></label>
          {orgType && orgType !== '个人' ? (
            <label className="dataset-edit-field"><span>发布机构 *</span><select value={organization} onChange={(event) => { setOrganization(event.target.value); setDepartment('') }}><option value="">请选择</option>{(orgType === '高校' ? universities : orgType === '企业' ? ['深势科技', '其他'] : ['北京科学智能研究院', '其他']).map((item) => <option key={item}>{item}</option>)}</select></label>
          ) : <div />}
          {orgType === '高校' && organization === '北京大学' && <label className="dataset-edit-field"><span>院系单位 *</span><select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">请选择</option>{pkuDepartments.map((item) => <option key={item}>{item}</option>)}</select></label>}
          {organization === '其他' && <label className="dataset-edit-field"><span>其他机构名称 *</span><input value={customOrganization} onChange={(event) => setCustomOrganization(event.target.value)} placeholder="请输入机构名称" /></label>}
          {department === '其他' && <label className="dataset-edit-field"><span>其他院系名称 *</span><input value={customDepartment} onChange={(event) => setCustomDepartment(event.target.value)} placeholder="请输入院系名称" /></label>}
          <label className="dataset-edit-field"><span>发布机构所在省份 *</span><select value={province} onChange={(event) => setProvince(event.target.value)}><option value="">请选择省份</option>{provinces.map((item) => <option key={item}>{item}</option>)}</select></label>
          <div className="dataset-edit-cell">
            <label className="dataset-edit-field"><span>语料规模 *</span><select value={corpusSize} onChange={(event) => setCorpusSize(event.target.value)}><option value="">请选择</option>{['1千以下', '1千-1万', '1万-10万', '10万-100万', '100万以上'].map((item) => <option key={item}>{item}</option>)}</select></label>
            {corpusSize && <input className="dataset-edit-detail" value={corpusSizeDetail} onChange={(event) => setCorpusSizeDetail(event.target.value)} placeholder="请填写具体语料条数如1000" />}
          </div>
          <div className="dataset-edit-cell">
            <label className="dataset-edit-field"><span>存储容量 *</span><select value={storageSize} onChange={(event) => setStorageSize(event.target.value)}><option value="">请选择</option>{['<500GB', '500GB-1TB', '1-2TB', '>2TB'].map((item) => <option key={item}>{item}</option>)}</select></label>
            {storageSize && <input className="dataset-edit-detail" value={storageSizeDetail} onChange={(event) => setStorageSizeDetail(event.target.value)} placeholder="请填写具体语料规模如15GB" />}
          </div>
          <label className="dataset-edit-field"><span>对外供给情况 *</span><select value={supplyStatus} onChange={(event) => setSupplyStatus(event.target.value)}><option value="">请选择</option>{['部分提供公开检索服务', '提供对外供给服务', '提供公开检索服务', '无对外供给', '依申请开放', '已公开提供'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="dataset-edit-field"><span>供给方式 *</span><select value={supplyMode} onChange={(event) => setSupplyMode(event.target.value)}><option>开源</option><option>闭源</option><option>定向</option></select></label>
          <label className="dataset-edit-field"><span>许可协议 *</span><select value={license} onChange={(event) => setLicense(event.target.value)}>{['CC0（完全开放无版权限制）', 'CC BY 4.0 保留作者署名', 'CC BY-SA 4.0 保留作者署名并要求使用者以相同许可协议分发其衍生作品', 'CC BY-NC 4.0 保留作者署名并禁止该数据用于任何商业目的', 'CC BY-NC-SA 4.0 保留作者署名，禁止该数据用于任何商业目的，并要求使用者以相同许可协议分发其衍生作品', 'CC BY-ND 4.0 保留作者署名并禁止使用者对数据进行修改、转换或创作', 'CC BY-NC-ND 4.0 保留作者署名，禁止该数据用于任何商业目的，并禁止使用者对数据进行修改、转换或创作'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="dataset-edit-field"><span>开放程度 *</span><select value={openness} onChange={(event) => setOpenness(event.target.value)}><option>公开</option><option>不公开</option></select></label>
        </div>

          </>
        )}
        {editTab === 'upload' && (
          <>
        <h2 className="dataset-edit-module-title"><b>02</b>上传数据</h2>
        <UploadModule title="上传示例数据" state={sampleUpload} onChange={setSampleUpload} notify={flashToast} corpusId={item.id} />
        <UploadModule title="上传全部数据" state={allUpload} onChange={setAllUpload} notify={flashToast} corpusId={item.id} />
        <label className="dataset-edit-field">
          <span>上传备注</span>
          <input value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="说明本次更新的数据内容（选填）" />
        </label>

          </>
        )}
        <footer className="dataset-edit-actions">
          <button className="dataset-edit-cancel" type="button" onClick={goBack}>取消</button>
          <button className="dataset-edit-save" type="button" onClick={saveEdit}>确认修改</button>
        </footer>
      </section>

      {showSaved && (
        <div className="dataset-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowSaved(false) }}>
          <section className="dataset-modal dataset-edit-success-modal" role="dialog" aria-modal="true">
            <span className="dataset-edit-success-icon"><Check size={30} /></span>
            <h2>修改成功</h2>
            <p>语料信息已更新，可在语料详情页查看修改结果</p>
            <div className="dataset-modal-actions">
              <button type="button" onClick={() => navigate(`/search/datasets/${item.id}`)}>查看详情</button>
              <button type="button" className="is-primary" onClick={() => setShowSaved(false)}>继续编辑</button>
            </div>
          </section>
        </div>
      )}

      {toast && <div className="dataset-toast"><FileText size={16} />{toast}</div>}
    </main>
  )
}
