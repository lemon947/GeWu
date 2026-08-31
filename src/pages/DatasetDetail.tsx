import { type FormEvent, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpFromLine,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileArchive,
  FileJson,
  FileText,
  Folder,
  FolderUp,
  Github,
  Info,
  MessageCircle,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Search,
  Share2,
  ShieldCheck,
  Star,
  ThumbsUp,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { useApp } from '../context/app-context'
import { corpusRecords, recordDisplayMeta } from './CorpusSearch'

type DetailTab = 'intro' | 'download' | 'comments'
type UploadMode = 'local' | 'external'
type MemberPermission = '可管理' | '可编辑' | '可使用'
type CommentSort = 'time' | 'likes'

const previewTree = [
  { name: 'metadata.json', file: 'metadata.json', path: '元数据 / metadata.json' },
  { name: 'sample.jsonl', file: 'sample.jsonl', path: '样例数据 / sample.jsonl' },
  { name: 'train.schema.json', file: 'schema.json', path: '训练规范 / train.schema.json' },
  { name: 'README.md', file: 'README.md', path: '说明文档 / README.md' },
]

const datasetVersions = [
  { version: 'v1.2.0', note: '补充字段与质量记录', files: previewTree },
  {
    version: 'v1.1.0',
    note: '补充元数据',
    files: [
      { name: 'metadata.json', file: 'metadata.json', path: '元数据 / metadata.json' },
      { name: 'train.schema.json', file: 'schema.json', path: '训练规范 / train.schema.json' },
      { name: 'quality-report.md', file: 'README.md', path: '质检报告 / quality-report.md' },
    ],
  },
  {
    version: 'v1.0.0',
    note: '首次发布',
    files: [
      { name: 'README.md', file: 'README.md', path: '说明文档 / README.md' },
      { name: 'sample.jsonl', file: 'sample.jsonl', path: '样例数据 / sample.jsonl' },
    ],
  },
]

const previewContent: Record<string, string> = {
  'metadata.json': `{
  "language": "zh-CN",
  "subject": "science",
  "license": "research-use",
  "version": "1.2.0",
  "fields": ["instruction", "context", "reasoning", "answer", "source"]
}`,
  'sample.jsonl': `{"id":"sample_0001","instruction":"分析该科学问题的关键变量","reasoning":"首先抽取研究对象、条件约束与可验证结论……","answer":"形成结构化推理链与结论。"}
{"id":"sample_0002","instruction":"给出可复现实验数据说明","reasoning":"依据数据来源、采样方式和质量控制步骤组织元数据……","answer":"输出标准化数据卡。"}`,
  'schema.json': `{
  "type": "object",
  "required": ["id", "instruction", "answer"],
  "properties": {
    "id": { "type": "string" },
    "reasoning": { "type": "string" },
    "source": { "type": "string" }
  }
}`,
  'README.md': `# 语料说明

本语料库按历史版本组织文件目录，提供公开样例、元数据、字段说明和数据质量记录。`,
}

const commentsSeed = [
  { id: 1, user: '林知远', date: '2026-08-18', likes: 24, liked: false, text: '样例数据结构很清楚，适合快速接入模型评测流程，希望后续补充更多字段说明。' },
  { id: 2, user: '医学语料联合实验室', date: '2026-08-12', likes: 18, liked: false, text: '对科研问答和推理链训练很有帮助，下载目录划分也比较明确。' },
  { id: 3, user: '陈明', date: '2026-08-02', likes: 31, liked: false, text: '建议增加数据质量报告和版本间差异说明，方便长期引用。' },
]

function detailOpennessLabel(openness: string) {
  if (openness === '开放共享') return '全部公开'
  if (openness === '不公开' || openness === '暂不开放') return '不公开'
  return '部分公开'
}

function languageForSubject(subject: string) {
  if (subject === '数学' || subject === '物理') return '中文/英文'
  if (subject === '化学' || subject === '生物') return '中文'
  return '中文/英文'
}

function formatForSubject(subject: string) {
  if (subject === '化学') return '反应SMARTS + 结构化文本'
  if (subject === '地理' || subject === '天文') return 'CSV、JSON、XML、API接口'
  return 'CSV / JSON / SQL'
}

export default function DatasetDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user, openAuth, favorites, toggleFavorite } = useApp()
  const item = corpusRecords.find((record) => record.id === id) ?? corpusRecords[0]
  const displayMeta = recordDisplayMeta(item)
  const openness = detailOpennessLabel(item.openness)
  const favorite = favorites.some((record) => record.id === item.id)
  const verifiedKey = user ? `gw-realname-${user.account}` : 'gw-realname-guest'

  const [activeTab, setActiveTab] = useState<DetailTab>('intro')
  const [selectedFile, setSelectedFile] = useState('metadata.json')
  const [selectedDownloadFile, setSelectedDownloadFile] = useState('sample.jsonl')
  const [selectedPreviewVersion, setSelectedPreviewVersion] = useState(datasetVersions[0].version)
  const [selectedDownloadVersion, setSelectedDownloadVersion] = useState(datasetVersions[0].version)
  const [expandedPreviewVersions, setExpandedPreviewVersions] = useState<string[]>([datasetVersions[0].version])
  const [expandedDownloadVersions, setExpandedDownloadVersions] = useState<string[]>([datasetVersions[0].version])
  const [previewSidebarCollapsed, setPreviewSidebarCollapsed] = useState(false)
  const [downloadSidebarCollapsed, setDownloadSidebarCollapsed] = useState(false)
  const [fullscreenBrowser, setFullscreenBrowser] = useState<DetailTab | null>(null)
  const [memberOpen, setMemberOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadMode, setUploadMode] = useState<UploadMode>('local')
  const [authorFollowed, setAuthorFollowed] = useState(false)
  const [uploadVersion, setUploadVersion] = useState('current')
  const [uploadRemark, setUploadRemark] = useState('')
  const [uploadDataSelected, setUploadDataSelected] = useState(false)
  const [externalSource, setExternalSource] = useState('')
  const [memberQuery, setMemberQuery] = useState('')
  const [memberPermission, setMemberPermission] = useState<MemberPermission>('可编辑')
  const [metadataFormat, setMetadataFormat] = useState<'JSON' | 'CSV'>('JSON')
  const [commentSort, setCommentSort] = useState<CommentSort>('time')
  const [commentDraft, setCommentDraft] = useState('')
  const [commentComposerOpen, setCommentComposerOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [verified, setVerified] = useState(() => window.localStorage.getItem(verifiedKey) === 'true')
  const [members, setMembers] = useState<Array<{ account: string; name: string; permission: MemberPermission }>>([
    { account: 'corpus_admin', name: '语料管理员', permission: '可管理' },
    { account: 'corpus_editor01', name: '建设编辑', permission: '可编辑' },
    { account: 'research_user02', name: '科研使用者', permission: '可使用' },
  ])
  const [comments, setComments] = useState(commentsSeed)
  const toastTimer = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const updatedAt = useMemo(() => {
    const date = new Date(item.publishedAt)
    date.setDate(date.getDate() + 16)
    return date.toISOString().slice(0, 10)
  }, [item.publishedAt])

  const relatedRecords = useMemo(() => {
    const sameSubject = corpusRecords.filter((record) => record.id !== item.id && record.subject === item.subject)
    const fallback = corpusRecords.filter((record) => record.id !== item.id && record.subject !== item.subject)
    return [...sameSubject, ...fallback].slice(0, 5)
  }, [item.id, item.subject])

  const sortedComments = useMemo(() => {
    const copied = [...comments]
    if (commentSort === 'likes') return copied.sort((a, b) => b.likes - a.likes)
    return copied.sort((a, b) => b.date.localeCompare(a.date))
  }, [commentSort, comments])

  const notify = (message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2600)
  }

  const ensureVerified = (next: () => void) => {
    if (!user) {
      openAuth(`/search/datasets/${item.id}`)
      notify('请先登录后继续操作')
      return
    }
    if (!verified) {
      window.localStorage.setItem(verifiedKey, 'true')
      setVerified(true)
      notify('已完成演示实名认证')
    }
    next()
  }

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      notify('已复制链接 可以转发')
    } catch {
      notify('链接已准备好，请从地址栏复制')
    }
  }

  const downloadBlob = (filename: string, content: string, type = 'application/json;charset=utf-8') => {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const downloadCorpus = () => {
    if (openness === '不公开') {
      notify('该语料库暂时未公开，若需要可联系作者')
      return
    }
    const scope = openness === '全部公开' ? '全部数据' : '作者公开的数据'
    downloadBlob(`${item.id}-${selectedDownloadFile}.json`, JSON.stringify({ corpus: item.title, scope, file: selectedDownloadFile, sample: previewContent[selectedDownloadFile] }, null, 2))
    notify(openness === '全部公开' ? '已开始下载全部数据' : '已开始下载公开数据')
  }

  const downloadVersionCorpus = () => {
    if (openness === '不公开') {
      notify('该语料库暂时未公开，若需要可联系作者')
      return
    }
    const version = datasetVersions.find((entry) => entry.version === selectedDownloadVersion) ?? datasetVersions[0]
    const scope = openness === '全部公开' ? '全部数据' : '作者公开的数据'
    downloadBlob(`${item.id}-${version.version}-all.json`, JSON.stringify({
      corpus: item.title,
      version: version.version,
      scope,
      files: version.files.map((file) => ({
        name: file.name,
        path: `${version.version} / ${file.path}`,
        sample: previewContent[file.file],
      })),
    }, null, 2))
    notify(`已开始下载 ${version.version} 全部数据`)
  }

  const exportMetadata = () => {
    if (metadataFormat === 'CSV') {
      downloadBlob(`${item.id}-metadata.csv`, `字段,内容\n语料名称,${item.title}\n学科领域,${item.subject}\n开放程度,${openness}\n发布机构,${item.organization}`, 'text/csv;charset=utf-8')
    } else {
      downloadBlob(`${item.id}-metadata.json`, JSON.stringify({ title: item.title, subject: item.subject, type: item.corpusType, openness, organization: item.organization, updatedAt }, null, 2))
    }
    notify('元数据已导出')
  }

  const addMember = () => {
    const value = memberQuery.trim()
    if (!value) return
    const name = value.includes('@') ? value.split('@')[0] : value
    setMembers((current) => [...current.filter((member) => member.account !== value), { account: value, name, permission: memberPermission }])
    setMemberQuery('')
    notify('成员已添加')
  }

  const removeMember = (account: string) => {
    if (!window.confirm('确认移除该成员吗？')) return
    setMembers((current) => current.filter((member) => member.account !== account))
    notify('成员已移除')
  }

  const submitUpload = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const hasData = uploadMode === 'local' ? uploadDataSelected : Boolean(externalSource.trim())
    if (!hasData) {
      notify('请选择要上传的数据')
      return
    }
    if (!uploadRemark.trim()) {
      notify('请填写备注')
      return
    }
    setUploadOpen(false)
    setUploadDataSelected(false)
    setExternalSource('')
    setUploadRemark('')
    notify('语料已提交，等待管理员审核')
  }

  const submitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = commentDraft.trim()
    if (!value) return
    setComments((current) => [{ id: Date.now(), user: user?.account ?? '科学语料用户', date: new Date().toISOString().slice(0, 10), likes: 0, liked: false, text: value }, ...current])
    setCommentDraft('')
    setCommentComposerOpen(false)
    notify('评论已发布')
  }

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/search')
  }

  const toggleExpandedVersion = (target: string, mode: 'preview' | 'download') => {
    const setter = mode === 'preview' ? setExpandedPreviewVersions : setExpandedDownloadVersions
    setter((current) => current.includes(target) ? current.filter((item) => item !== target) : [...current, target])
  }

  return (
    <main className="dataset-detail-page dataset-detail-v2">
      <button className="dataset-back-button" type="button" onClick={goBack}><ArrowLeft size={17} />返回</button>

      <div className="dataset-detail-layout dataset-detail-layout-v2">
        <section className="dataset-summary-card dataset-hero-card">
          <div className="dataset-summary-head">
            <div>
              <h1>{item.title}</h1>
              <div className="dataset-badges">
                <span className="is-subject">{item.subject}</span>
                <span>{item.corpusType}</span>
                <span className="is-open">{openness}</span>
                <span className={`dataset-status ${displayMeta.status === '已上传' ? 'is-uploaded' : 'is-pending'}`}>{displayMeta.status}</span>
              </div>
              <div className="dataset-author-line">
                作者：张伟；李娜；王磊
              </div>
            </div>
            <div className="dataset-admin-actions">
              <button type="button" onClick={() => ensureVerified(() => navigate(`/upload?edit=${item.id}`))}><Pencil size={15} />编辑</button>
              <button type="button" onClick={() => ensureVerified(() => setMemberOpen(true))}><Users size={15} />管理成员</button>
              <button type="button" onClick={() => ensureVerified(() => setUploadOpen(true))}><Upload size={15} />上传</button>
            </div>
          </div>

          <dl className="dataset-hero-meta-list">
            <div><dt>发布机构</dt><dd><Building2 size={16} />{item.organization} - {item.authors}</dd></div>
            <div><dt>发布时间</dt><dd><CalendarDays size={16} />{item.publishedAt}</dd></div>
            <div><dt>更新时间</dt><dd>{updatedAt}</dd></div>
            <div><dt>语料规模</dt><dd>{displayMeta.corpusSize}</dd></div>
            <div><dt>存储容量</dt><dd>{displayMeta.storageSize}</dd></div>
          </dl>

          <article className="dataset-description-block dataset-description-actions-only">
            <div className="dataset-social-actions dataset-social-actions-v2">
              <span data-tooltip="浏览量"><Eye size={18} /><b>{item.views.toLocaleString()}</b></span>
              <span data-tooltip="下载量"><Download size={18} /><b>{item.usage.toLocaleString()}</b></span>
              <button type="button" data-tooltip={favorite ? '取消收藏' : '收藏'} className={favorite ? 'is-active' : ''} onClick={() => { toggleFavorite({ id: item.id, title: item.title }); notify(favorite ? '已取消收藏' : '已收藏，可在个人主页查看') }}><Star size={18} /><b>{(item.favorites + (favorite ? 1 : 0)).toLocaleString()}</b></button>
              <button type="button" data-tooltip="转发" onClick={copyShareLink}><Share2 size={18} /></button>
            </div>
          </article>
        </section>

        <aside className="dataset-side-column dataset-side-column-v2">
          <section className="dataset-side-card">
            <div className="side-card-title"><Info size={18} /><h2>其他信息</h2></div>
            <dl>
              <div><dt>语种类别</dt><dd>{languageForSubject(item.subject)}</dd></div>
              <div><dt>语料格式</dt><dd>{formatForSubject(item.subject)}</dd></div>
              <div><dt>时间跨度</dt><dd>{item.subject === '数学' ? '2000年-至今' : '2020年-至今'}</dd></div>
            </dl>
          </section>

          <section className="dataset-side-card author-card">
            <div className="author-card-main">
              <div className="author-avatar">张</div>
              <div className="author-card-copy">
                <h2>张伟</h2>
                <p>北京大学</p>
              </div>
              <button
                className={authorFollowed ? 'is-followed' : ''}
                data-tooltip={authorFollowed ? '取消关注' : undefined}
                type="button"
                onClick={() => {
                  setAuthorFollowed((followed) => !followed)
                  notify(authorFollowed ? '已取消关注' : '已关注作者')
                }}
              >
                {authorFollowed ? '已关注' : '关注'}
              </button>
            </div>
          </section>

          <section className="dataset-side-card">
            <div className="side-card-title"><FileArchive size={18} /><h2>历史版本</h2></div>
            <ol className="version-list">
              <li><strong>v1.2.0</strong><span>{updatedAt} 更新</span></li>
              <li><strong>v1.1.0</strong><span>2026-07-28 补充元数据</span></li>
              <li><strong>v1.0.0</strong><span>{item.publishedAt} 首次发布</span></li>
            </ol>
          </section>

          <section className="dataset-side-card">
            <div className="side-card-title"><ShieldCheck size={18} /><h2>权益信息</h2></div>
            <dl>
              <div><dt>权益主体</dt><dd>{item.organization}</dd></div>
              <div><dt>授权方式</dt><dd>{openness === '全部公开' ? '开放共享许可' : openness === '部分公开' ? '依申请开放许可' : '不公开'}</dd></div>
            </dl>
          </section>

          <section className="dataset-side-card metadata-export-card">
            <div className="side-card-title"><FileJson size={18} /><h2>元数据下载</h2></div>
            <div className="metadata-export-row">
              <select value={metadataFormat} onChange={(event) => setMetadataFormat(event.target.value as 'JSON' | 'CSV')}>
                <option>JSON</option>
                <option>CSV</option>
              </select>
              <button type="button" onClick={exportMetadata}>Export</button>
              <button type="button" aria-label="复制元数据" onClick={() => { navigator.clipboard?.writeText(item.title); notify('元数据摘要已复制') }}><Copy size={17} /></button>
            </div>
          </section>
        </aside>
      </div>

      <section className="dataset-content-panel dataset-content-panel-v2">
        <div className="dataset-content-tabs" role="tablist">
          <button type="button" className={activeTab === 'intro' ? 'is-active' : ''} onClick={() => setActiveTab('intro')}><FileText size={17} />语料介绍</button>
          <button type="button" className={activeTab === 'download' ? 'is-active' : ''} onClick={() => setActiveTab('download')}><Download size={17} />语料下载</button>
          <button type="button" className={activeTab === 'comments' ? 'is-active' : ''} onClick={() => setActiveTab('comments')}><MessageCircle size={17} />评论（{comments.length}）</button>
        </div>

        {activeTab === 'intro' && (
          <div className="dataset-tab-body">
            <section className="dataset-intro-section">
              <h2>摘要</h2>
              <p>{item.summary} 平台围绕数据来源、结构化处理、质量校验和版本管理沉淀元数据，支持科研、教学和模型训练场景复用。</p>
              <div className="keyword-row">{item.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
            </section>
            <section className={`dataset-browser ${previewSidebarCollapsed ? 'is-sidebar-collapsed' : ''} ${fullscreenBrowser === 'intro' ? 'is-fullscreen' : ''}`}>
              <aside>
                <div className="dataset-browser-sidebar-head">
                  <strong>语料预览</strong>
                  <button type="button" aria-label="收起左栏目录" onClick={() => setPreviewSidebarCollapsed(true)}><PanelLeftClose size={17} /></button>
                </div>
                <div className="dataset-version-tree" aria-label="按版本浏览语料">
                  {datasetVersions.map((version) => {
                    const expanded = expandedPreviewVersions.includes(version.version)
                    return (
                      <div className="dataset-version-node" key={version.version}>
                        <button
                          className={selectedPreviewVersion === version.version ? 'is-active' : ''}
                          onClick={() => {
                            setSelectedPreviewVersion(version.version)
                            toggleExpandedVersion(version.version, 'preview')
                          }}
                          type="button"
                        >
                          <ChevronDown className={expanded ? 'is-expanded' : ''} size={15} />
                          <span>{version.version}</span>
                          <small>{version.note}</small>
                        </button>
                        {expanded && version.files.map((node) => (
                          <button
                            className={`dataset-file-node ${selectedPreviewVersion === version.version && selectedFile === node.file ? 'is-active' : ''}`}
                            key={`${version.version}-${node.file}`}
                            onClick={() => {
                              setSelectedPreviewVersion(version.version)
                              setSelectedFile(node.file)
                            }}
                            type="button"
                          >
                            <Folder size={15} />{version.version} / {node.path}
                          </button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </aside>
              <div className="preview-code-panel">
                <div className="dataset-code-toolbar">
                  <div className="dataset-code-title">
                    {previewSidebarCollapsed && <button className="dataset-sidebar-restore" type="button" aria-label="展开左栏目录" onClick={() => setPreviewSidebarCollapsed(false)}><PanelLeftOpen size={17} /></button>}
                    <span>{selectedFile}</span>
                  </div>
                  <div className="dataset-code-actions">
                    <button
                      type="button"
                      aria-label={fullscreenBrowser === 'intro' ? '缩小预览' : '放大预览'}
                      onClick={() => setFullscreenBrowser((current) => current === 'intro' ? null : 'intro')}
                    >
                      {fullscreenBrowser === 'intro' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    <button type="button" aria-label="切换下一个文件" onClick={() => {
                      const version = datasetVersions.find((entry) => entry.version === selectedPreviewVersion) ?? datasetVersions[0]
                      const index = version.files.findIndex((file) => file.file === selectedFile)
                      setSelectedFile(version.files[(index + 1) % version.files.length].file)
                    }}><ChevronRight size={20} /></button>
                  </div>
                </div>
                <pre><code>{previewContent[selectedFile]}</code></pre>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'download' && (
          <div className="dataset-tab-body">
            {openness === '不公开' ? (
              <div className="private-dataset-note">该语料库暂时未公开，若需要可联系作者。</div>
            ) : (
              <section className={`dataset-browser ${downloadSidebarCollapsed ? 'is-sidebar-collapsed' : ''} ${fullscreenBrowser === 'download' ? 'is-fullscreen' : ''}`}>
                <aside>
                  <div className="dataset-browser-sidebar-head">
                    <strong>可下载目录</strong>
                    <button type="button" aria-label="收起左栏目录" onClick={() => setDownloadSidebarCollapsed(true)}><PanelLeftClose size={17} /></button>
                  </div>
                  <button className="download-version-button" type="button" onClick={downloadVersionCorpus}>
                    <Download size={16} />下载 {selectedDownloadVersion} 全部数据
                  </button>
                  <div className="dataset-version-tree" aria-label="按版本下载语料">
                    {datasetVersions.map((version) => {
                      const expanded = expandedDownloadVersions.includes(version.version)
                      return (
                        <div className="dataset-version-node" key={version.version}>
                          <button
                            className={selectedDownloadVersion === version.version ? 'is-active' : ''}
                            onClick={() => {
                              setSelectedDownloadVersion(version.version)
                              toggleExpandedVersion(version.version, 'download')
                            }}
                            type="button"
                          >
                            <ChevronDown className={expanded ? 'is-expanded' : ''} size={15} />
                            <span>{version.version}</span>
                            <small>{version.note}</small>
                          </button>
                          {expanded && version.files.map((node) => (
                            <button
                              className={`dataset-file-node ${selectedDownloadVersion === version.version && selectedDownloadFile === node.file ? 'is-active' : ''}`}
                              key={`${version.version}-${node.file}`}
                              onClick={() => {
                                setSelectedDownloadVersion(version.version)
                                setSelectedDownloadFile(node.file)
                              }}
                              type="button"
                            >
                              <Folder size={15} />{version.version} / {node.path}
                            </button>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </aside>
                <div className="preview-code-panel">
                  <div className="dataset-code-toolbar">
                    <div className="dataset-code-title">
                      {downloadSidebarCollapsed && <button className="dataset-sidebar-restore" type="button" aria-label="展开左栏目录" onClick={() => setDownloadSidebarCollapsed(false)}><PanelLeftOpen size={17} /></button>}
                      <span>{selectedDownloadFile}</span>
                    </div>
                    <div className="dataset-code-actions">
                      <button className="dataset-code-download" type="button" onClick={downloadCorpus}><Download size={19} />下载</button>
                      <button
                        type="button"
                        aria-label={fullscreenBrowser === 'download' ? '缩小预览' : '放大预览'}
                        onClick={() => setFullscreenBrowser((current) => current === 'download' ? null : 'download')}
                      >
                        {fullscreenBrowser === 'download' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                      </button>
                      <button type="button" aria-label="切换下一个文件" onClick={() => {
                        const version = datasetVersions.find((entry) => entry.version === selectedDownloadVersion) ?? datasetVersions[0]
                        const index = version.files.findIndex((file) => file.file === selectedDownloadFile)
                        setSelectedDownloadFile(version.files[(index + 1) % version.files.length].file)
                      }}><ChevronRight size={20} /></button>
                    </div>
                  </div>
                  <pre><code>{previewContent[selectedDownloadFile]}</code></pre>
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="dataset-tab-body comments-panel">
            <div className="comments-toolbar">
              <label><ChevronDown size={15} />排序
                <select value={commentSort} onChange={(event) => setCommentSort(event.target.value as CommentSort)}>
                  <option value="time">按时间</option>
                  <option value="likes">按点赞量</option>
                </select>
              </label>
              <button type="button" onClick={() => setCommentComposerOpen((open) => !open)}><Pencil size={16} />写评论</button>
            </div>
            {commentComposerOpen && (
              <form className="comment-composer" onSubmit={submitComment}>
                <textarea maxLength={1000} required value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="请输入评论内容，最多1000字" />
                <button type="submit">发布评论</button>
              </form>
            )}
            <div className="comment-list">
              {sortedComments.map((comment) => (
                <article className="comment-card" key={comment.id}>
                  <div className="comment-avatar">{comment.user.slice(0, 1)}</div>
                  <div>
                    <header><strong>{comment.user}</strong><span>{comment.date}</span></header>
                    <p>{comment.text}</p>
                    <button
                      className={comment.liked ? 'is-active' : ''}
                      data-tooltip={comment.liked ? '取消点赞' : '点赞'}
                      type="button"
                      onClick={() => setComments((current) => current.map((item) => item.id === comment.id ? { ...item, liked: !item.liked, likes: item.liked ? Math.max(0, item.likes - 1) : item.likes + 1 } : item))}
                    >
                      <ThumbsUp size={15} />{comment.likes}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="related-datasets-section">
        <header><h2>相关语料库</h2></header>
        <div className="related-dataset-strip">
          {relatedRecords.map((record) => (
            <Link className="related-dataset-card" to={`/search/datasets/${record.id}`} key={record.id}>
              <span>{record.subject}</span>
              <strong>{record.title}</strong>
              <small>{record.organization} - {record.authors}</small>
            </Link>
          ))}
        </div>
      </section>

      {memberOpen && (
        <div className="dataset-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setMemberOpen(false) }}>
          <section className="dataset-modal member-modal member-modal-v2" role="dialog" aria-modal="true">
            <div className="dataset-modal-title"><div><Users size={21} /><h2>管理成员</h2></div><button type="button" onClick={() => setMemberOpen(false)} aria-label="关闭"><X size={18} /></button></div>
            <div className="member-add-title">添加成员</div>
            <div className="member-add-row">
              <label className="member-search-field"><Search size={18} /><input value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} placeholder="输入用户账号名" /></label>
              <select value={memberPermission} onChange={(event) => setMemberPermission(event.target.value as MemberPermission)}><option>可管理</option><option>可编辑</option><option>可使用</option></select>
              <button type="button" onClick={addMember}><UserPlus size={16} />添加成员</button>
            </div>
            <div className="member-list member-list-v2">
              {members.map((member) => (
                <div key={member.account}>
                  <span className="member-avatar">{member.name.slice(0, 1)}</span>
                  <div><strong>{member.name}</strong><small>{member.account}</small></div>
                  <select value={member.permission} onChange={(event) => setMembers((current) => current.map((item) => item.account === member.account ? { ...item, permission: event.target.value as MemberPermission } : item))}><option>可管理</option><option>可编辑</option><option>可使用</option></select>
                  <button type="button" onClick={() => removeMember(member.account)}><Trash2 size={15} />移除</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {uploadOpen && (
        <div className="dataset-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setUploadOpen(false) }}>
          <form className="dataset-modal upload-corpus-modal" onSubmit={submitUpload}>
            <div className="dataset-modal-title"><div><ArrowUpFromLine size={21} /><h2>上传语料</h2></div><button type="button" onClick={() => setUploadOpen(false)} aria-label="关闭"><X size={18} /></button></div>
            <label className="upload-license is-required"><span>语料库文件许可协议</span><select required defaultValue=""><option value="" disabled>请选择许可协议</option><option>平台科研使用许可协议</option><option>署名共享许可协议</option><option>自定义授权协议</option></select></label>
            <label className="upload-license is-required"><span>版本</span><select required value={uploadVersion} onChange={(event) => setUploadVersion(event.target.value)}><option value="current">当前最新版本</option>{datasetVersions.map((version) => <option value={version.version} key={version.version}>历史版本：{version.version}</option>)}</select></label>
            <label className="upload-license is-required"><span>备注</span><textarea required value={uploadRemark} onChange={(event) => setUploadRemark(event.target.value)} placeholder="请填写本次上传内容说明、数据来源或变更备注" /></label>
            <div className="upload-mode-tabs"><button type="button" className={uploadMode === 'local' ? 'is-active' : ''} onClick={() => { setUploadMode('local'); setExternalSource('') }}>本地上传</button><button type="button" className={uploadMode === 'external' ? 'is-active' : ''} onClick={() => { setUploadMode('external'); setUploadDataSelected(false) }}>外部导入</button></div>
            {uploadMode === 'local' ? (
              <div className="upload-drop-area"><FileArchive size={32} /><strong>{uploadDataSelected ? '已选择上传数据' : '选择需要上传的语料文件'}</strong><p>上传后将发送给管理员审核</p><div><button type="button" onClick={() => fileInputRef.current?.click()}><ArrowUpFromLine size={16} />上传文件</button><button type="button" onClick={() => folderInputRef.current?.click()}><FolderUp size={16} />上传文件夹</button></div><input ref={fileInputRef} hidden type="file" multiple onChange={(event) => setUploadDataSelected(Boolean(event.target.files?.length))} /><input ref={(node) => { folderInputRef.current = node; node?.setAttribute('webkitdirectory', '') }} hidden type="file" multiple onChange={(event) => setUploadDataSelected(Boolean(event.target.files?.length))} /></div>
            ) : (
              <label className="github-import"><Github size={24} /><span>GitHub 仓库链接</span><input value={externalSource} onChange={(event) => setExternalSource(event.target.value)} placeholder="https://github.com/organization/repository" /></label>
            )}
            <label className="upload-confirm is-required"><input required type="checkbox" /><span>我已确认上传内容符合许可协议及平台合规要求</span></label>
            <div className="dataset-modal-actions"><button type="button" onClick={() => setUploadOpen(false)}>取消</button><button type="submit" className="is-primary">提交审核</button></div>
          </form>
        </div>
      )}

      {toast && <div className="dataset-toast"><Check size={16} />{toast}</div>}
    </main>
  )
}
