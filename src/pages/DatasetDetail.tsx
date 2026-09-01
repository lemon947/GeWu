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

type DetailTab = 'intro' | 'usage' | 'download' | 'comments'
type UploadMode = 'local' | 'external'
type MemberPermission = '可管理' | '可编辑'
type CommentSort = 'time' | 'likes'
type DetailRole = 'admin' | 'editor' | 'guest'
type CommentReply = { id: number; user: string; date: string; text: string; replyingTo?: string }

const previewTree = [
  { name: 'metadata.json', file: 'metadata.json', path: '元数据 / metadata.json' },
  { name: 'sample.jsonl', file: 'sample.jsonl', path: '样例数据 / sample.jsonl' },
  { name: 'train.schema.json', file: 'schema.json', path: '训练规范 / train.schema.json' },
  { name: 'README.md', file: 'README.md', path: '说明文档 / README.md' },
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

const usageGuide = [
  {
    title: '1. 申请使用与协议签署',
    content: '用户申请使用，需要先完成实名认证，并阅读、签署用户协议。用户协议签约归档且可用 Token 充足后，您可通过 SDK，使用实名认证时获取的 APIKey，按照以下指南使用语料。',
  },
  { title: '2. Token 充值', content: '访问语料会消耗 Token。调用前，建议先确认可用 Token 是否充足；如 Token 不足，可进行充值。' },
  { title: '3. SDK 下载及安装', content: '本地调用前，需要安装 Python 环境和 corpusware SDK，并确保 Python 版本为 3.12 或更高版本。请将 corpusware_sdk-version.whl 替换为下载后的文件路径和文件名。', code: 'pip install corpusware_sdk-version.whl' },
  { title: '4. SDK 登录系统并鉴权', content: '调用 login 登录系统，并通过 YOUR_API_KEY 获取用户权益。具备相应权益后，即可加载语料件。', code: 'from corpusware_sdk import login\n\nlogin(token="YOUR_API_KEY")' },
  { title: '5. 加载语料件', content: '通过语料 ID 加载语料件。系统将根据语料 ID 校验您是否已完成该语料的协议签约。如未完成签约，加载将失败，无法继续。', code: 'cw = load_corpusware(id="语料ID")' },
  { title: '6. 获取语料件基础信息', content: '通过已加载的语料件获取语料基础信息。', code: 'print(cw.corpusware_id, cw.name, cw.abstract, cw.corpus_type)\nmetadata = cw.metadata\nmetadata_desc = cw.describe_metadata()\nschema = cw.get_schema()' },
  { title: '7. 获取语料示例数据', content: '获取该语料件的全部示例数据。获取语料数据时，系统会同步记录 Token 消耗。请确保可用 Token 充足，否则数据获取将失败。', code: 'examples = cw.get_examples()\n\nfor row in cw.iter_examples():\n    print(row)' },
  { title: '8. 获取语料数据记录', content: '根据语料件基础信息确定所需数据，并读取相应的数据记录。获取语料数据时，系统会同步记录 Token 消耗。请确保可用 Token 充足，否则数据获取将失败。', code: 'for record in cw.iter_records(limit=100):\n    print(record)\n\nrecords = cw.records(limit=100, offset=0)' },
  { title: '9. 获取语料数据引用文件', content: '从样本中自动获取引用文件路径，SDK 会根据 schema 和样本内容解析路径。获取语料数据时，系统会同步记录 Token 消耗。请确保可用 Token 充足，否则数据获取将失败。', code: 'for record in cw.iter_records(limit=100):\n    reference_path = cw.reference_path(record)\n    content = cw.get_reference_content(reference_path)' },
  { title: '10. 语料数据随机采样', content: '在探索阶段，可从语料件中随机抽取少量记录进行质量检查、字段熟悉和快速调试。正式批量读取前，建议先完成小样本验证。', code: 'samples = cw.sample_records(size=10, seed=42)\n\nfor sample in samples:\n    print(sample)' },
]

const downloadExampleCode = `from corpusware_sdk import load_corpusware, login

login(token="YOUR_API_KEY")

cw = load_corpusware(id="CHEM-CORPUS-K037")

print(cw.name)
print(cw.abstract)
print(cw.get_schema())
print(cw.describe_metadata())

example_rows = cw.get_examples()
print(example_rows)

for row in cw.iter_records(limit=5):
    print(row)
    reference_path = cw.reference_path(row)
    if reference_path:
        content = cw.get_reference_content(reference_path)
        print(f"内容大小: {len(content)} bytes")
        text = content.decode("utf-8", errors="replace")
        print(text[:1000])`

const commentsSeed = [
  { id: 1, user: '林知远', date: '2026-08-18', likes: 24, liked: false, text: '样例数据结构很清楚，适合快速接入模型评测流程，希望后续补充更多字段说明。' },
  { id: 2, user: '医学语料联合实验室', date: '2026-08-12', likes: 18, liked: false, text: '对科研问答和推理链训练很有帮助，下载目录划分也比较明确。' },
  { id: 3, user: '陈明', date: '2026-08-02', likes: 31, liked: false, text: '建议增加数据质量报告和版本间差异说明，方便长期引用。' },
]

const repliesSeed: Record<number, CommentReply[]> = {
  1: [
    { id: 101, user: '张伟', date: '2026-08-19', text: '感谢反馈，下一版会补充字段口径和质量校验说明。' },
    { id: 102, user: '李娜', date: '2026-08-20', text: '我们也在整理更适合评测任务的样例切分。' },
  ],
  2: [
    { id: 201, user: '语料管理员', date: '2026-08-13', text: '下载目录后续会按任务类型继续细分。' },
  ],
  3: [
    { id: 301, user: '王磊', date: '2026-08-03', text: '版本差异说明已经进入维护计划。' },
  ],
}

const uploadLicenseOptions = [
  'CC0（完全开放无版权限制）',
  'CC BY 4.0 保留作者署名',
  'CC BY-SA 4.0 保留作者署名并要求使用者以相同许可协议分发其衍生作品',
  'CC BY-NC 4.0 保留作者署名并禁止该数据用于任何商业目的',
  'CC BY-NC-SA 4.0 保留作者署名，禁止该数据用于任何商业目的，并要求使用者以相同许可协议分发其衍生作品',
  'CC BY-ND 4.0 保留作者署名并禁止使用者对数据进行修改、转换或创作',
  'CC BY-NC-ND 4.0 保留作者署名，禁止该数据用于任何商业目的，并禁止使用者对数据进行修改、转换或创作',
]

const maxUploadBytes = 2 * 1024 * 1024 * 1024
const maxUploadSizeLabel = '2GB'

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

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${size} B`
}

export default function DatasetDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user, openAuth, favorites, toggleFavorite } = useApp()
  const item = corpusRecords.find((record) => record.id === id) ?? corpusRecords[0]
  const displayMeta = recordDisplayMeta(item)
  const detailRole: DetailRole = item.id === 'math-01' ? 'admin' : item.id === 'physics-01' ? 'editor' : 'guest'
  const openness = detailOpennessLabel(item.openness)
  const favorite = favorites.some((record) => record.id === item.id)
  const verifiedKey = user ? `gw-realname-${user.account}` : 'gw-realname-guest'

  const [activeTab, setActiveTab] = useState<DetailTab>('intro')
  const [selectedFile, setSelectedFile] = useState('metadata.json')
  const [previewSidebarCollapsed, setPreviewSidebarCollapsed] = useState(false)
  const [fullscreenBrowser, setFullscreenBrowser] = useState<'intro' | 'download' | null>(null)
  const [memberOpen, setMemberOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [joinRequestOpen, setJoinRequestOpen] = useState(false)
  const [uploadMode, setUploadMode] = useState<UploadMode>('local')
  const [authorFollowed, setAuthorFollowed] = useState(false)
  const [uploadLicense, setUploadLicense] = useState('')
  const [uploadRemark, setUploadRemark] = useState('')
  const [uploadFiles, setUploadFiles] = useState<Array<{ id: string; name: string; size: number }>>([])
  const [uploadSizeError, setUploadSizeError] = useState('')
  const [externalSource, setExternalSource] = useState('')
  const [memberQuery, setMemberQuery] = useState('')
  const [memberPermission, setMemberPermission] = useState<MemberPermission>('可编辑')
  const [metadataFormat, setMetadataFormat] = useState<'JSON' | 'CSV'>('JSON')
  const [commentSort, setCommentSort] = useState<CommentSort>('time')
  const [commentDraft, setCommentDraft] = useState('')
  const [commentComposerOpen, setCommentComposerOpen] = useState(false)
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<number | null>(null)
  const [replyTargetUser, setReplyTargetUser] = useState('')
  const [replyTargetText, setReplyTargetText] = useState('')
  const [replyDraft, setReplyDraft] = useState('')
  const [commentReplies, setCommentReplies] = useState(repliesSeed)
  const [joinPermission, setJoinPermission] = useState<MemberPermission>('可编辑')
  const [joinRemark, setJoinRemark] = useState('')
  const [toast, setToast] = useState('')
  const [verified, setVerified] = useState(() => window.localStorage.getItem(verifiedKey) === 'true')
  const [members, setMembers] = useState<Array<{ account: string; name: string; permission: MemberPermission }>>([
    { account: 'corpus_admin', name: '语料管理员', permission: '可管理' },
    { account: 'corpus_editor01', name: '建设编辑', permission: '可编辑' },
    { account: 'research_user02', name: '科研使用者', permission: '可编辑' },
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

  const downloadSampleFile = (file = selectedFile) => {
    if (openness === '不公开') {
      notify('该语料库暂时未公开，若需要可联系作者')
      return
    }
    const scope = openness === '全部公开' ? '全部数据' : '作者公开的数据'
    downloadBlob(`${item.id}-${file}.json`, JSON.stringify({ corpus: item.title, scope, file, sample: previewContent[file] }, null, 2))
    notify('已开始下载当前样例数据')
  }

  const downloadAllSamples = () => {
    if (openness === '不公开') {
      notify('该语料库暂时未公开，若需要可联系作者')
      return
    }
    const scope = openness === '全部公开' ? '全部数据' : '作者公开的数据'
    downloadBlob(`${item.id}-latest-examples.json`, JSON.stringify({
      corpus: item.title,
      version: 'Version X',
      updatedAt,
      scope,
      files: previewTree.map((file) => ({
        name: file.name,
        path: file.path,
        sample: previewContent[file.file],
      })),
    }, null, 2))
    notify('已开始下载全部样例数据')
  }

  const copyDownloadCode = async () => {
    try {
      await navigator.clipboard.writeText(downloadExampleCode)
      notify('示例代码已复制')
    } catch {
      notify('复制失败，请手动选择代码')
    }
  }

  const exportMetadata = () => {
    const metadata = {
      语料集名称: item.title,
      URL: window.location.href,
      学科领域: item.subject,
      语料类型: item.corpusType,
      开放程度: openness,
      上传状态: displayMeta.status,
      作者: ['张伟', '李娜', '王磊'].join('、'),
      发布机构: `${item.organization} - ${item.authors}`,
      发布时间: item.publishedAt,
      更新时间: updatedAt,
      语料规模: displayMeta.corpusSize,
      存储容量: displayMeta.storageSize,
      其他: {
        浏览量: item.views,
        下载量: item.usage,
        收藏: item.favorites + (favorite ? 1 : 0),
      },
    }

    if (metadataFormat === 'CSV') {
      const escapeCsv = (value: unknown) => `"${String(typeof value === 'object' ? JSON.stringify(value) : value).replace(/"/g, '""')}"`
      const csv = Object.entries(metadata).map(([field, value]) => `${escapeCsv(field)},${escapeCsv(value)}`).join('\n')
      downloadBlob(`${item.id}-metadata.csv`, `字段,内容\n${csv}`, 'text/csv;charset=utf-8')
    } else {
      downloadBlob(`${item.id}-metadata.json`, JSON.stringify(metadata, null, 2))
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

  const handleUploadFiles = (files: FileList | null) => {
    if (!files?.length) return
    const timestamp = Date.now()
    const nextFiles = Array.from(files).map((file, index) => ({
      id: `${timestamp}-${index}-${file.name}-${file.size}`,
      name: file.webkitRelativePath || file.name,
      size: file.size,
    }))
    const currentSize = uploadFiles.reduce((sum, file) => sum + file.size, 0)
    const nextSize = nextFiles.reduce((sum, file) => sum + file.size, 0)
    if (currentSize + nextSize > maxUploadBytes) {
      setUploadSizeError(`单次上传数据大小不超过 ${maxUploadSizeLabel}，请压缩或分批上传`)
      return
    }
    setUploadSizeError('')
    setUploadFiles((current) => [...current, ...nextFiles])
  }

  const submitUpload = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!uploadLicense) {
      notify('请选择授权方式')
      return
    }
    const hasData = uploadMode === 'local' ? uploadFiles.length > 0 : Boolean(externalSource.trim())
    if (!hasData) {
      notify('请选择要上传的数据')
      return
    }
    if (!uploadRemark.trim()) {
      notify('请填写备注')
      return
    }
    setUploadOpen(false)
    setUploadLicense('')
    setUploadFiles([])
    setUploadSizeError('')
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

  const openReplyPanel = (commentId: number, targetUser: string, targetText: string) => {
    setActiveReplyCommentId(commentId)
    setReplyTargetUser(targetUser)
    setReplyTargetText(targetText)
  }

  const submitReply = (commentId: number) => {
    const value = replyDraft.trim()
    if (!value) return
    setCommentReplies((current) => ({
      ...current,
      [commentId]: [
        ...(current[commentId] ?? []),
        { id: Date.now(), user: user?.account ?? '科学语料用户', date: new Date().toISOString().slice(0, 10), text: value, replyingTo: replyTargetUser },
      ],
    }))
    setReplyDraft('')
    setReplyTargetUser('')
    setReplyTargetText('')
    notify('回复已发布')
  }

  const submitJoinRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setJoinRequestOpen(false)
    setJoinRemark('')
    setJoinPermission('可编辑')
    notify('申请发送至管理员消息中心 等待审核')
  }

  const goEditUpload = () => {
    ensureVerified(() => navigate(`/upload?edit=${item.id}`, { state: { mode: 'edit', corpus: item } }))
  }

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/search')
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
              {(detailRole === 'admin' || detailRole === 'editor') && (
                <button type="button" onClick={goEditUpload}><Pencil size={15} />编辑</button>
              )}
              {detailRole === 'admin' && (
                <button type="button" onClick={() => ensureVerified(() => setMemberOpen(true))}><Users size={15} />管理成员</button>
              )}
              {detailRole === 'guest' && (
                <>
                  <button type="button" onClick={() => ensureVerified(() => setUploadOpen(true))}><Upload size={15} />上传</button>
                  <button type="button" onClick={() => ensureVerified(() => setJoinRequestOpen(true))}><UserPlus size={15} />申请加入语料库</button>
                </>
              )}
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
            <div className="side-card-title"><ShieldCheck size={18} /><h2>权益信息</h2></div>
            <dl>
              <div><dt>权益主体</dt><dd>{item.organization}</dd></div>
              <div><dt>授权方式</dt><dd>CC BY 4.0</dd></div>
            </dl>
          </section>

          <section className="dataset-side-card metadata-export-card">
            <div className="side-card-title"><FileJson size={18} /><h2>元数据下载</h2></div>
            <div className="metadata-export-row">
              <select value={metadataFormat} onChange={(event) => setMetadataFormat(event.target.value as 'JSON' | 'CSV')}>
                <option>JSON</option>
                <option>CSV</option>
              </select>
              <button type="button" onClick={exportMetadata}>导出</button>
            </div>
          </section>
        </aside>
      </div>

      <section className="dataset-content-panel dataset-content-panel-v2">
        <div className="dataset-content-tabs" role="tablist">
          <button type="button" className={activeTab === 'intro' ? 'is-active' : ''} onClick={() => setActiveTab('intro')}><FileText size={17} />语料介绍</button>
          <button type="button" className={activeTab === 'usage' ? 'is-active' : ''} onClick={() => setActiveTab('usage')}><Info size={17} />使用说明</button>
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
                  <div>
                    <strong>语料预览</strong>
                    <small>Version X · {updatedAt} 更新</small>
                  </div>
                  <button type="button" aria-label="收起左栏目录" onClick={() => setPreviewSidebarCollapsed(true)}><PanelLeftClose size={17} /></button>
                </div>
                <button className="download-version-button" type="button" onClick={downloadAllSamples}>
                  <FileArchive size={16} />下载全部样例数据
                </button>
                <div className="dataset-version-tree dataset-latest-tree" aria-label="浏览最新样例数据">
                  {previewTree.map((node) => (
                    <button
                      className={`dataset-file-node ${selectedFile === node.file ? 'is-active' : ''}`}
                      key={node.file}
                      onClick={() => setSelectedFile(node.file)}
                      type="button"
                    >
                      <Folder size={15} />{node.path}
                    </button>
                  ))}
                </div>
              </aside>
              <div className="preview-code-panel">
                <div className="dataset-code-toolbar">
                  <div className="dataset-code-title">
                    {previewSidebarCollapsed && <button className="dataset-sidebar-restore" type="button" aria-label="展开左栏目录" onClick={() => setPreviewSidebarCollapsed(false)}><PanelLeftOpen size={17} /></button>}
                    <span>{selectedFile}</span>
                  </div>
                  <div className="dataset-code-actions">
                    <button className="dataset-code-download" type="button" onClick={() => downloadSampleFile()}><Download size={19} />下载</button>
                    <button
                      type="button"
                      aria-label={fullscreenBrowser === 'intro' ? '缩小预览' : '放大预览'}
                      onClick={() => setFullscreenBrowser((current) => current === 'intro' ? null : 'intro')}
                    >
                      {fullscreenBrowser === 'intro' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    <button type="button" aria-label="切换下一个文件" onClick={() => {
                      const index = previewTree.findIndex((file) => file.file === selectedFile)
                      setSelectedFile(previewTree[(index + 1) % previewTree.length].file)
                    }}><ChevronRight size={20} /></button>
                  </div>
                </div>
                <pre><code>{previewContent[selectedFile]}</code></pre>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="dataset-tab-body">
            <section className="usage-guide-layout">
              <nav className="usage-guide-toc" aria-label="使用说明目录">
                {usageGuide.map((section, index) => (
                  <a href={`#usage-guide-${index + 1}`} key={section.title}>{section.title}</a>
                ))}
              </nav>
              <div className="usage-guide-panel">
                {usageGuide.map((section, index) => (
                  <article id={`usage-guide-${index + 1}`} key={section.title}>
                    <h2>{section.title}</h2>
                    <p>{section.content}</p>
                    {section.code && <pre><code>{section.code}</code></pre>}
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'download' && (
          <div className="dataset-tab-body">
            {openness === '不公开' ? (
              <div className="private-dataset-note">该语料库暂时未公开，若需要可联系作者。</div>
            ) : (
              <section className={`download-code-section ${fullscreenBrowser === 'download' ? 'is-fullscreen' : ''}`}>
                <div className="preview-code-panel">
                  <div className="dataset-code-toolbar">
                    <div className="dataset-code-title">
                      <span>download_examples.py</span>
                    </div>
                    <div className="dataset-code-actions">
                      <button className="dataset-code-download" type="button" onClick={copyDownloadCode}><Copy size={18} />复制代码</button>
                      <button
                        type="button"
                        aria-label={fullscreenBrowser === 'download' ? '缩小预览' : '放大预览'}
                        onClick={() => setFullscreenBrowser((current) => current === 'download' ? null : 'download')}
                      >
                        {fullscreenBrowser === 'download' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                      </button>
                    </div>
                  </div>
                  <pre><code>{downloadExampleCode}</code></pre>
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
                <article
                  className={`comment-card ${activeReplyCommentId === comment.id ? 'is-open' : ''}`}
                  key={comment.id}
                  onClick={() => openReplyPanel(comment.id, comment.user, comment.text)}
                >
                  <div className="comment-avatar">{comment.user.slice(0, 1)}</div>
                  <div>
                    <header><strong>{comment.user}</strong><span>{comment.date}</span></header>
                    <p>{comment.text}</p>
                    <div className="comment-card-actions">
                      <button
                        className={comment.liked ? 'is-active' : ''}
                        data-tooltip={comment.liked ? '取消点赞' : '点赞'}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setComments((current) => current.map((item) => item.id === comment.id ? { ...item, liked: !item.liked, likes: item.liked ? Math.max(0, item.likes - 1) : item.likes + 1 } : item))
                        }}
                      >
                        <ThumbsUp size={15} />{comment.likes}
                      </button>
                      <button
                        className="comment-reply-count-button"
                        type="button"
                        aria-label={`查看并回复 ${commentReplies[comment.id]?.length ?? 0} 条回复`}
                        onClick={(event) => {
                          event.stopPropagation()
                          openReplyPanel(comment.id, comment.user, comment.text)
                        }}
                      >
                        <MessageCircle size={15} />{commentReplies[comment.id]?.length ?? 0}
                      </button>
                    </div>
                    {activeReplyCommentId === comment.id && (
                      <div className="comment-reply-panel" onClick={(event) => event.stopPropagation()}>
                        <div className="comment-reply-list">
                          {(commentReplies[comment.id] ?? []).map((reply) => (
                            <button
                              className="comment-reply-item"
                              key={reply.id}
                              type="button"
                              onClick={() => openReplyPanel(comment.id, reply.user, reply.text)}
                            >
                              <span>{reply.user.slice(0, 1)}</span>
                              <div>
                                <strong>{reply.user}</strong>
                                {reply.replyingTo && <em>回复 @{reply.replyingTo}</em>}
                                <p>{reply.text}</p>
                                <small>{reply.date}</small>
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="comment-reply-target">
                          <strong>回复 @{replyTargetUser || comment.user}</strong>
                          <p>{replyTargetText || comment.text}</p>
                        </div>
                        <textarea
                          maxLength={1000}
                          value={replyDraft}
                          onChange={(event) => setReplyDraft(event.target.value)}
                          placeholder=""
                        />
                        <div className="comment-reply-actions">
                          <small>{replyDraft.length}/1000</small>
                          <button type="button" onClick={() => { setActiveReplyCommentId(null); setReplyTargetUser(''); setReplyTargetText(''); setReplyDraft('') }}>取消</button>
                          <button type="button" className="is-primary" onClick={() => submitReply(comment.id)}>发送</button>
                        </div>
                      </div>
                    )}
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
              <select value={memberPermission} onChange={(event) => setMemberPermission(event.target.value as MemberPermission)}><option>可管理</option><option>可编辑</option></select>
              <button type="button" onClick={addMember}><UserPlus size={16} />添加成员</button>
            </div>
            <div className="member-list member-list-v2">
              {members.map((member) => (
                <div key={member.account}>
                  <span className="member-avatar">{member.name.slice(0, 1)}</span>
                  <div><strong>{member.name}</strong><small>{member.account}</small></div>
                  <select value={member.permission} onChange={(event) => setMembers((current) => current.map((item) => item.account === member.account ? { ...item, permission: event.target.value as MemberPermission } : item))}><option>可管理</option><option>可编辑</option></select>
                  <button type="button" onClick={() => removeMember(member.account)}><Trash2 size={15} />移除</button>
                </div>
              ))}
            </div>
            <div className="dataset-modal-actions member-confirm-actions">
              <button type="button" className="is-primary" onClick={() => { setMemberOpen(false); notify('成员设置已确认') }}>确认</button>
            </div>
          </section>
        </div>
      )}

      {joinRequestOpen && (
        <div className="dataset-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setJoinRequestOpen(false) }}>
          <form className="dataset-modal join-request-modal" onSubmit={submitJoinRequest}>
            <button className="join-request-close" type="button" onClick={() => setJoinRequestOpen(false)} aria-label="关闭"><X size={20} /></button>
            <div className="join-request-illustration"><ShieldCheck size={54} /></div>
            <h2>申请加入语料库</h2>
            <p>当前账号未加入语料库，你可以向管理员申请权限</p>
            <div className="join-request-form">
              <label>
                <span>申请权限</span>
                <select value={joinPermission} onChange={(event) => setJoinPermission(event.target.value as MemberPermission)}>
                  <option>可管理</option>
                  <option>可编辑</option>
                </select>
              </label>
              <textarea maxLength={1000} value={joinRemark} onChange={(event) => setJoinRemark(event.target.value)} placeholder="添加备注（选填）" />
              <button type="submit">提交申请</button>
            </div>
          </form>
        </div>
      )}

      {uploadOpen && (
        <div className="dataset-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setUploadOpen(false) }}>
          <form className="dataset-modal upload-corpus-modal" onSubmit={submitUpload}>
            <div className="dataset-modal-title"><div><ArrowUpFromLine size={21} /><h2>上传语料</h2></div><button type="button" onClick={() => setUploadOpen(false)} aria-label="关闭"><X size={18} /></button></div>
            <label className="upload-license is-required"><span>授权方式</span><select required value={uploadLicense} onChange={(event) => setUploadLicense(event.target.value)}><option value="" disabled>请选择授权方式</option>{uploadLicenseOptions.map((option) => <option value={option} key={option}>{option}</option>)}</select></label>
            <label className="upload-license is-required"><span>备注</span><textarea required value={uploadRemark} onChange={(event) => setUploadRemark(event.target.value)} placeholder="请填写本次上传内容说明、数据来源或变更备注" /></label>
            <section className="upload-data-section is-required">
              <span>上传数据</span>
              <div className="upload-mode-tabs"><button type="button" className={uploadMode === 'local' ? 'is-active' : ''} onClick={() => { setUploadMode('local'); setExternalSource('') }}>本地上传</button><button type="button" className={uploadMode === 'external' ? 'is-active' : ''} onClick={() => { setUploadMode('external'); setUploadFiles([]) }}>外部导入</button></div>
              {uploadMode === 'local' ? (
                <>
                  {uploadSizeError && <p className="upload-size-error">{uploadSizeError}</p>}
                  <div className="upload-drop-area"><FileArchive size={32} /><strong>{uploadFiles.length ? `已选择 ${uploadFiles.length} 个文件` : '选择需要上传的语料文件'}</strong><p>单次上传数据大小不超过 {maxUploadSizeLabel}，上传后将发送给管理员审核</p><div><button type="button" onClick={() => fileInputRef.current?.click()}><ArrowUpFromLine size={16} />上传文件</button><button type="button" onClick={() => folderInputRef.current?.click()}><FolderUp size={16} />上传文件夹</button></div><input ref={fileInputRef} hidden type="file" multiple onChange={(event) => { handleUploadFiles(event.target.files); event.currentTarget.value = '' }} /><input ref={(node) => { folderInputRef.current = node; node?.setAttribute('webkitdirectory', '') }} hidden type="file" multiple onChange={(event) => { handleUploadFiles(event.target.files); event.currentTarget.value = '' }} /></div>
                  {uploadFiles.length > 0 && (
                    <div className="upload-file-list">
                      {uploadFiles.map((file) => (
                        <div className="upload-file-card" key={file.id}>
                          <FileText size={18} />
                          <div><strong>{file.name}</strong><small>{formatFileSize(file.size)}</small></div>
                          <button type="button" onClick={() => setUploadFiles((current) => current.filter((itemFile) => itemFile.id !== file.id))} aria-label={`删除 ${file.name}`}><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <label className="github-import">
                  <Github size={28} />
                  <span>GitHub 仓库链接</span>
                  <input value={externalSource} onChange={(event) => setExternalSource(event.target.value)} placeholder="https://github.com/organization/repository" />
                </label>
              )}
            </section>
            <label className="upload-confirm is-required"><input required type="checkbox" /><span>我已确认上传内容符合许可协议及平台合规要求</span></label>
            <div className="dataset-modal-actions"><button type="button" onClick={() => setUploadOpen(false)}>取消</button><button type="submit" className="is-primary">提交审核</button></div>
          </form>
        </div>
      )}

      {toast && <div className="dataset-toast"><Check size={16} />{toast}</div>}
    </main>
  )
}
