import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  ArrowDown,
  Bell,
  Building2,
  CalendarDays,
  Camera,
  Download,
  Eye,
  Heart,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Star,
  UserRound,
  X,
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useApp } from '../context/app-context'
import { corpusRecords, type CorpusRecord } from './CorpusSearch'
import { DemandPoster, initialDemandPosts, type DemandPost } from './DemandSquare'
import { auditWorkStatusOptions, loadAuditItems, removeAuditItemByCorpus, type AuditWorkItem, type AuditWorkStatus } from '../data/audit-work'

type MainTab = 'corpora' | 'demands' | 'submit' | 'audit' | 'privacy'
type CorpusTab = 'managed' | 'joined' | 'favorite'
type DemandTab = 'published' | 'favorited' | 'commented' | 'following' | 'followers'
type NoticeTab = 'audit' | 'comment'
type ModalType = 'avatar' | 'basic' | null
type PrivacyKey = '我管理的语料库' | '我加入的语料库' | '我收藏的语料库' | '已发布的需求' | '已收藏的需求' | '已评论的需求' | '我的关注' | '我的粉丝'
type PrivacyValue = '公开' | '仅关注我的人可见' | '仅自己可见'

type UserProfile = {
  username: string
  institution: string
  contact: string
  researchField: string
  position: string
  bio: string
  avatar: string
}

type CommunityUser = { id: string; name: string; role: string; mutual?: boolean; following: boolean }
type Notice = {
  id: number
  role: 'admin' | 'uploader' | 'member' | 'creator' | 'platform'
  kind: 'pending' | 'approved' | 'rejected' | 'returned' | 'failed' | 'published' | 'modified' | 'withdrawn'
  corpusId: string
  corpusName: string
  userName: string
  time: string
  reason?: string
  permission?: '可管理' | '可上传'
  createdAt?: string
}
type CommentNotice = { id: number; user: string; text: string; time: string; kind: 'corpus' | 'demand'; targetId: string }

const emptyProfile = (username = ''): UserProfile => ({
  username,
  institution: '',
  contact: '',
  researchField: '',
  position: '',
  bio: '',
  avatar: '',
})

function loadProfile(account: string, username: string) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(`gw-profile-${account}`) ?? '{}')
    return { ...emptyProfile(username), ...stored, username: stored.username || username } as UserProfile
  } catch {
    return emptyProfile(username)
  }
}

function corpusByIds(ids: string[]) {
  return ids.map((id) => corpusRecords.find((item) => item.id === id)).filter((item): item is CorpusRecord => Boolean(item))
}

const managedIds = ['math-01', 'physics-01', 'chem-01']
const joinedIds = ['geo-04', 'bio-02', 'astro-02', 'math-03', 'physics-02', 'chem-04', 'astro-04', 'geo-03', 'physics-04', 'geo-01', 'math-02', 'bio-01']
const favoriteDefaultIds = ['chem-01', 'physics-02', 'geo-01', 'bio-02', 'math-02', 'astro-01', 'geo-04', 'physics-03']

const communityUsers: CommunityUser[] = [
  { id: 'user-lin', name: '林知远', role: '材料语料发起人 · 北京大学化学与分子工程学院', following: true },
  { id: 'user-lab', name: '医学语料联合实验室', role: '生物医学语料团队 · 健康医疗大数据国家研究院', mutual: true, following: true },
  { id: 'user-chen', name: '陈明', role: '形式化数学研究者 · 北京大学数学科学学院', mutual: true, following: true },
  { id: 'user-wang', name: '王磊', role: '地理时空数据研究者 · 南京大学', following: false },
  { id: 'user-li', name: '李思远', role: '医学影像方向 · 中南大学湘雅医院', following: false },
  { id: 'user-zhang', name: '张伟', role: '语料平台科研用户 · 北京大学', mutual: true, following: true },
  { id: 'user-xu', name: '许青', role: '天文观测数据研究者 · 厦门大学', following: false },
  { id: 'user-he', name: '何静', role: '材料计算方向 · 北京石墨烯研究院', following: false },
]

const notices: Notice[] = [
  { id: 1, role: 'admin', kind: 'pending', corpusId: 'math-01', corpusName: '基础数学定理证明长思维链语料', userName: '李思远', time: '2026-09-05 14:22', permission: '可上传' },
  { id: 2, role: 'admin', kind: 'pending', corpusId: 'physics-01', corpusName: '量子力学问题求解与推理过程语料', userName: '建设编辑', time: '2026-09-06 09:10' },
  { id: 3, role: 'uploader', kind: 'approved', corpusId: 'math-02', corpusName: '概率论与数理统计问题求解语料', userName: '王磊', time: '2026-09-04 16:40' },
  { id: 4, role: 'uploader', kind: 'rejected', corpusId: 'chem-04', corpusName: '环境化学专业问答与推理语料', userName: '何静', time: '2026-09-03 11:05', reason: '数据样例不足，请补充字段口径说明' },
  { id: 5, role: 'member', kind: 'approved', corpusId: 'geo-04', corpusName: '城市空间结构与功能区识别语料', userName: '许青', time: '2026-09-02 10:18', permission: '可上传' },
  { id: 6, role: 'member', kind: 'rejected', corpusId: 'bio-02', corpusName: '代谢小分子化合物结构语料', userName: '张伟', time: '2026-09-01 15:47', reason: '单位与实名信息不符', permission: '可管理' },
  { id: 7, role: 'creator', kind: 'returned', corpusId: 'astro-04', corpusName: '射电天文观测数据与说明语料', userName: '许青', time: '2026-08-30 09:32', createdAt: '2026-08-28 10:00', reason: '请补充样例数据来源说明' },
  { id: 8, role: 'creator', kind: 'rejected', corpusId: 'bio-01', corpusName: '跨物种细胞调控图谱语料', userName: '张伟', time: '2026-08-29 13:22', createdAt: '2026-08-27 11:30', reason: '授权材料暂不完整' },
  { id: 9, role: 'creator', kind: 'failed', corpusId: 'chem-02', corpusName: 'CarbonMat 碳材料横向关联语料库', userName: '林知远', time: '2026-08-28 18:16', createdAt: '2026-08-26 09:40' },
  { id: 10, role: 'creator', kind: 'published', corpusId: 'geo-01', corpusName: '中国典型城市高分辨率遥感影像语料', userName: '王磊', time: '2026-08-27 10:05', createdAt: '2026-08-24 14:00' },
  { id: 11, role: 'platform', kind: 'pending', corpusId: 'geo-01', corpusName: '中国典型城市高分辨率遥感影像语料', userName: '王磊', time: '2026-09-06 17:20' },
  { id: 12, role: 'platform', kind: 'modified', corpusId: 'math-03', corpusName: '数学公式识别与语义解析语料', userName: '陈明', time: '2026-09-05 09:24' },
  { id: 13, role: 'platform', kind: 'withdrawn', corpusId: 'physics-03', corpusName: '高能物理实验事例结构化语料', userName: '李思远', time: '2026-09-04 12:18' },
  { id: 14, role: 'platform', kind: 'failed', corpusId: 'astro-01', corpusName: '天体测量与天体力学多模态语料', userName: '许青', time: '2026-09-03 18:50' },
]

const commentNotices: CommentNotice[] = [
  { id: 1, user: '医学语料联合实验室', text: '建议增加数据质量报告和版本间差异说明，方便长期引用。', time: '2026-09-05', kind: 'corpus', targetId: 'math-01' },
  { id: 2, user: '林知远', text: '样例数据结构很清楚，期待后续补充更多字段说明。', time: '2026-09-03', kind: 'corpus', targetId: 'physics-01' },
  { id: 3, user: '陈明', text: '已经按建议提交了联合申请，感谢答疑！', time: '2026-09-02', kind: 'demand', targetId: 'demand-math-001' },
  { id: 4, user: '李思远', text: '请问可以扩展语音方言类的共建需求吗？', time: '2026-08-30', kind: 'demand', targetId: 'demand-geo-001' },
]

type SubmitStatus = '草稿' | '审核中' | '待修改' | '已通过' | '未通过' | '发布异常' | '已发布' | '已撤回' | '已上传'
type SubmitRecord = {
  id: number
  corpusName: string
  type: '新建语料库' | '上传语料'
  submittedAt: string
  status: SubmitStatus
  corpusId: string
  reason?: string
  opinion?: string
}

const submitStatusOptions: SubmitStatus[] = ['草稿', '审核中', '待修改', '已通过', '未通过', '发布异常', '已发布', '已撤回']

const submitRecords: SubmitRecord[] = [
  { id: 1, corpusName: '数学教育教学语料库', type: '新建语料库', submittedAt: '2026-09-07 10:25', status: '审核中', corpusId: 'math-01' },
  { id: 2, corpusName: '天然产物结构语料库', type: '新建语料库', submittedAt: '2026-09-06 15:40', status: '待修改', corpusId: 'chem-02', opinion: '请补充字段口径说明，并完善数据来源描述；示例数据需覆盖主要字段。' },
  { id: 3, corpusName: '天文观测语料库', type: '新建语料库', submittedAt: '2026-09-05 09:32', status: '已通过', corpusId: 'astro-04' },
  { id: 4, corpusName: '环境化学语料库', type: '新建语料库', submittedAt: '2026-09-03 11:05', status: '未通过', corpusId: 'chem-04', reason: '数据样例不足，请补充字段口径说明后重新提交' },
  { id: 5, corpusName: '极端天气事件语料库', type: '新建语料库', submittedAt: '2026-09-02 17:20', status: '发布异常', corpusId: 'geo-03', reason: '系统发布服务超时，自动发布失败，请稍后重试' },
  { id: 6, corpusName: '生物机理分析语料库', type: '新建语料库', submittedAt: '2026-08-31 14:10', status: '已发布', corpusId: 'bio-04' },
  { id: 7, corpusName: '量子力学问题语料库', type: '新建语料库', submittedAt: '2026-08-29 10:12', status: '已撤回', corpusId: 'physics-01' },
  { id: 8, corpusName: '数学概率论语料库', type: '新建语料库', submittedAt: '2026-08-28 09:00', status: '草稿', corpusId: 'math-02' },
  { id: 9, corpusName: '光学实验视频语料库', type: '上传语料', submittedAt: '2026-09-06 16:20', status: '审核中', corpusId: 'physics-04' },
  { id: 10, corpusName: '星系光谱语料库', type: '上传语料', submittedAt: '2026-08-30 11:47', status: '已通过', corpusId: 'astro-02' },
  { id: 11, corpusName: '代谢小分子语料库', type: '上传语料', submittedAt: '2026-08-27 15:03', status: '未通过', corpusId: 'bio-02', reason: '文件清单与备案数据不一致，请核对后重新提交' },
  { id: 12, corpusName: '地质环境影响语料库', type: '上传语料', submittedAt: '2026-08-25 10:30', status: '已上传', corpusId: 'geo-02' },
]


const privacyOptions: PrivacyValue[] = ['公开', '仅关注我的人可见', '仅自己可见']
const privacyKeys: PrivacyKey[] = ['我管理的语料库', '我加入的语料库', '我收藏的语料库', '已发布的需求', '已收藏的需求', '已评论的需求', '我的关注', '我的粉丝']

const demandPageSize = 6

function Pager({ total, pageSize, current, onChange, span = 5 }: { total: number; pageSize: number; current: number; onChange: (page: number) => void; span?: number }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const pages: number[] = []
  const start = Math.max(1, Math.min(current - span, pageCount - span * 2))
  const end = Math.min(pageCount, start + span * 2)
  for (let page = start; page <= end; page++) pages.push(page)
  return (
    <div className="profile-pager">
      <button type="button" disabled={current === 1} onClick={() => onChange(current - 1)}>上一页</button>
      {pages.map((page) => <button type="button" className={page === current ? 'is-active' : ''} key={page} onClick={() => onChange(page)}>{page}</button>)}
      <button type="button" disabled={current === pageCount} onClick={() => onChange(current + 1)}>下一页</button>
    </div>
  )
}

function noticeView(notice: Notice) {
  if (notice.role === 'admin' && notice.kind === 'pending') {
    const title = notice.permission ? '您有一条加入语料库的申请待审核' : '您有一条上传语料的申请待审核'
    const body = notice.permission
      ? `“${notice.userName}”向您管理的“${notice.corpusName}”提交了${notice.permission}权限的加入语料库申请，请查看申请内容并进行审核。`
      : `“${notice.userName}”向您管理的“${notice.corpusName}”提交了语料上传申请，请查看上传内容并进行审核。`
    return { title, body, action: '查看申请', to: `/search/datasets/${notice.corpusId}/audit` }
  }
  if (notice.role === 'uploader' && notice.kind === 'approved') {
    return { title: '您的语料上传审核已通过', body: `您向“${notice.corpusName}”提交的语料上传申请已通过审核，相关语料已成功加入该语料库`, action: '查看语料', to: `/search/datasets/${notice.corpusId}` }
  }
  if (notice.role === 'uploader' && notice.kind === 'rejected') {
    return { title: '您的语料上传申请未通过', body: `您向“${notice.corpusName}”提交的语料上传申请未通过审核，请根据审核意见修改后重新提交。审核意见：${notice.reason}；`, action: '查看申请', to: `/search/datasets/${notice.corpusId}` }
  }
  if (notice.role === 'member' && notice.kind === 'approved') {
    return { title: `您的加入${notice.corpusName}（${notice.permission}）审核已通过`, body: `您向“${notice.corpusName}”提交的加入申请已通过审核`, action: '查看语料', to: `/search/datasets/${notice.corpusId}` }
  }
  if (notice.role === 'member' && notice.kind === 'rejected') {
    return { title: `您的加入${notice.corpusName}（${notice.permission}）未通过审核`, body: `您向“${notice.corpusName}”提交的加入申请未通过审核；审核意见：${notice.reason}；`, action: '查看语料', to: `/search/datasets/${notice.corpusId}` }
  }
  if (notice.role === 'creator') {
    if (notice.kind === 'returned') return { title: `您申请创建的${notice.corpusName}待修改`, body: `您于${notice.createdAt}创建的“${notice.corpusName}”提交内容需要补充或修改材料，请根据审核意见调整后重新提交。审核意见：${notice.reason}`, action: '查看意见', to: '/profile?tab=submissions' }
    if (notice.kind === 'rejected') return { title: `您申请创建的${notice.corpusName}未通过审核`, body: `您于${notice.createdAt}创建的“${notice.corpusName}”申请未通过，请查看审核意见。审核意见：${notice.reason}`, action: '查看原因', to: '/profile?tab=submissions' }
    if (notice.kind === 'failed') return { title: `您申请创建的${notice.corpusName}发布异常`, body: `您于${notice.createdAt}创建的“${notice.corpusName}”已通过审核，但发布未完成，请查看处理进度。`, action: '查看进度', to: '/profile?tab=submissions' }
    return { title: `您创建的${notice.corpusName}已正式发布`, body: `您于${notice.createdAt}创建的“${notice.corpusName}”已通过审核并发布成功，可在个人主页和语料详情页查看。`, action: '查看语料', to: `/search/datasets/${notice.corpusId}` }
  }
  if (notice.role === 'platform') {
    if (notice.kind === 'modified') return { title: '语料申请已修改并重新提交', body: `用户“${notice.userName}”已根据审核意见修改“${notice.corpusName}”的申请，请重新审核。`, action: '前往审核', to: '/profile?tab=audit' }
    if (notice.kind === 'withdrawn') return { title: '语料申请已撤回', body: `用户“${notice.userName}”已撤回“${notice.corpusName}”的申请，该申请无需继续审核。`, action: '查看记录', to: '/profile?tab=audit' }
    if (notice.kind === 'failed') return { title: '语料发布异常', body: `“${notice.corpusName}”的申请已通过审核，但发布未完成，请查看原因并处理。`, action: '查看异常', to: '/profile?tab=audit' }
  }
  return { title: '您有一条语料申请待审核', body: `“${notice.userName}”提交了“${notice.corpusName}”的创建申请，请查看申请内容并进行审核。`, action: '查看申请', to: '/profile?tab=audit' }
}

export default function Profile() {
  const { user, openAuth, favorites } = useApp()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    }
    setSearchParams(next, { replace: true })
  }
  const tabParam = searchParams.get('tab')
  const activeTab: MainTab = tabParam === 'demands' || tabParam === 'submit' || tabParam === 'audit' || tabParam === 'privacy' ? tabParam : 'corpora'
  const setActiveTab = (tab: MainTab) => updateParams({ tab: tab === 'corpora' ? null : tab })
  const [corpusTab, setCorpusTab] = useState<CorpusTab>('managed')
  const [demandTab, setDemandTab] = useState<DemandTab>('published')
  const [noticeTab, setNoticeTab] = useState<NoticeTab>('audit')
  const [modal, setModal] = useState<ModalType>(null)
  const [noticeItem, setNoticeItem] = useState<Notice | null>(null)
  const [profile, setProfile] = useState<UserProfile>(() => user ? loadProfile(user.account, user.name) : emptyProfile())
  const [draft, setDraft] = useState<UserProfile>(profile)
  const [avatarDraft, setAvatarDraft] = useState('')
  const [avatarUploaded, setAvatarUploaded] = useState(false)
  const [avatarCrop, setAvatarCrop] = useState({ x: 0.5, y: 0.5, size: 0.6 })
  const cropStageRef = useRef<HTMLDivElement>(null)
  const [corpusPage, setCorpusPage] = useState(1)
  const [demandPage, setDemandPage] = useState(1)
  const [userFollowed, setUserFollowed] = useState<Record<string, boolean>>(() => Object.fromEntries(communityUsers.map((u) => [u.id, u.following])))
  const [privacy, setPrivacy] = useState<Record<PrivacyKey, PrivacyValue>>(() => Object.fromEntries(privacyKeys.map((key) => [key, '公开' as PrivacyValue])) as Record<PrivacyKey, PrivacyValue>)
  const submitStatusParam = searchParams.get('sstatus')
  const submitStatus: '全部' | SubmitStatus = (['草稿', '审核中', '待修改', '已通过', '未通过', '发布异常', '已发布', '已撤回'] as SubmitStatus[]).includes(submitStatusParam as SubmitStatus) ? submitStatusParam as SubmitStatus : '全部'
  const setSubmitStatus = (status: '全部' | SubmitStatus) => {
    updateParams({ sstatus: status === '全部' ? null : status })
    setSubmitPage(1)
  }
  const [submitKeyword, setSubmitKeyword] = useState('')
  const [submitPage, setSubmitPage] = useState(1)
  const [submitPerPage, setSubmitPerPage] = useState(10)
  const [submitTypeFilter, setSubmitTypeFilter] = useState<'全部' | '新建语料库' | '上传语料'>('全部')
  const [submitSortDir, setSubmitSortDir] = useState<'desc' | 'asc'>('desc')
  const [submitRecordsState, setSubmitRecordsState] = useState<SubmitRecord[]>(submitRecords)
  const [reasonModal, setReasonModal] = useState<{ title: string; reason: string } | null>(null)
  const [submitConfirm, setSubmitConfirm] = useState<{ title: string; message: string; confirmLabel: string; recordId: number; action: 'delete' | 'withdraw'; corpusName: string } | null>(null)
  const auditStatusParam = searchParams.get('astatus')
  const auditStatus: '全部' | AuditWorkStatus = (auditWorkStatusOptions as AuditWorkStatus[]).includes(auditStatusParam as AuditWorkStatus) ? auditStatusParam as AuditWorkStatus : '全部'
  const setAuditStatus = (status: '全部' | AuditWorkStatus) => updateParams({ astatus: status === '全部' ? null : status })
  const [auditKeyword, setAuditKeyword] = useState('')
  const [auditItems, setAuditItems] = useState<AuditWorkItem[]>(loadAuditItems)
  const [auditSortField, setAuditSortField] = useState<'submittedAt' | 'auditAt'>('submittedAt')
  const [auditSortDir, setAuditSortDir] = useState<'desc' | 'asc'>('desc')
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (activeTab === 'audit') setAuditItems(loadAuditItems())
  }, [activeTab])

  useEffect(() => {
    if (!user) {
      setProfile(emptyProfile())
      return
    }
    const nextProfile = loadProfile(user.account, user.name)
    setProfile(nextProfile)
    setDraft(nextProfile)
  }, [user])

  const favoriteIds = useMemo(() => [...new Set([...favorites.map((item) => item.id), ...favoriteDefaultIds])], [favorites])

  const managedCorpora = corpusByIds(managedIds)
  const joinedCorpora = corpusByIds(joinedIds)
  const favoriteCorpora = corpusByIds(favoriteIds)

  const corpusList = corpusTab === 'managed' ? managedCorpora : corpusTab === 'joined' ? joinedCorpora : favoriteCorpora
  const visibleCorpora = corpusList.slice((corpusPage - 1) * 6, corpusPage * 6)

  const demandMap: Record<'published' | 'favorited' | 'commented', DemandPost[]> = {
    published: initialDemandPosts.slice(0, 7),
    favorited: [...initialDemandPosts].reverse().slice(0, 7),
    commented: initialDemandPosts.slice(2, 9),
  }
  const visibleDemands = demandTab === 'published' || demandTab === 'favorited' || demandTab === 'commented'
    ? demandMap[demandTab].slice((demandPage - 1) * demandPageSize, demandPage * demandPageSize)
    : []
  const filteredUsers = demandTab === 'following' ? communityUsers.filter((item) => userFollowed[item.id]) : communityUsers
  const visibleUsers = filteredUsers.slice((demandPage - 1) * demandPageSize, demandPage * demandPageSize)
  const totalCollected = 356 + initialDemandPosts.reduce((sum, item) => sum + item.bookmarks, 0)

  const persistProfile = (nextProfile: UserProfile) => {
    if (!user) return
    window.localStorage.setItem(`gw-profile-${user.account}`, JSON.stringify(nextProfile))
    setProfile(nextProfile)
    setDraft(nextProfile)
  }

  const openModal = (type: Exclude<ModalType, null>) => {
    if (type === 'avatar') {
      setAvatarDraft(profile.avatar)
      setAvatarUploaded(false)
      setAvatarCrop({ x: 0.5, y: 0.5, size: 0.6 })
    }
    else setDraft(profile)
    setModal(type)
  }

  const uploadAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarDraft(typeof reader.result === 'string' ? reader.result : '')
      setAvatarUploaded(true)
      setAvatarCrop({ x: 0.5, y: 0.5, size: 0.6 })
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const startCropDrag = (mode: 'move' | 'resize') => (event: React.PointerEvent) => {
    event.preventDefault()
    const stage = cropStageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const startX = event.clientX
    const startY = event.clientY
    const startCrop = { ...avatarCrop }
    const onMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / rect.width
      const dy = (moveEvent.clientY - startY) / rect.height
      if (mode === 'move') {
        setAvatarCrop({
          ...startCrop,
          x: Math.min(Math.max(startCrop.x + dx, startCrop.size / 2), 1 - startCrop.size / 2),
          y: Math.min(Math.max(startCrop.y + dy, startCrop.size / 2), 1 - startCrop.size / 2),
        })
        return
      }
      const size = Math.min(Math.max(startCrop.size + dx * 2, 0.3), 0.95)
      setAvatarCrop({
        size,
        x: Math.min(Math.max(startCrop.x, size / 2), 1 - size / 2),
        y: Math.min(Math.max(startCrop.y, size / 2), 1 - size / 2),
      })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const buildCroppedAvatar = (source: string) => new Promise<string>((resolve) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 320
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d')
      if (!context) {
        resolve(source)
        return
      }
      const sourceSize = Math.min(image.naturalWidth, image.naturalHeight) * avatarCrop.size
      const maxX = Math.max(0, image.naturalWidth - sourceSize)
      const maxY = Math.max(0, image.naturalHeight - sourceSize)
      const sourceX = Math.min(maxX, Math.max(0, avatarCrop.x * image.naturalWidth - sourceSize / 2))
      const sourceY = Math.min(maxY, Math.max(0, avatarCrop.y * image.naturalHeight - sourceSize / 2))
      context.save()
      context.beginPath()
      context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      context.clip()
      context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size)
      context.restore()
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = () => resolve(source)
    image.src = source
  })

  const confirmAvatar = async () => {
    const nextAvatar = avatarUploaded && avatarDraft ? await buildCroppedAvatar(avatarDraft) : avatarDraft
    persistProfile({ ...profile, avatar: nextAvatar })
    setModal(null)
  }

  const runSubmitConfirm = () => {
    if (!submitConfirm) return
    if (submitConfirm.action === 'delete') {
      setSubmitRecordsState((current) => current.filter((item) => item.id !== submitConfirm.recordId))
    } else {
      setSubmitRecordsState((current) => current.map((item) => item.id === submitConfirm.recordId ? { ...item, status: '已撤回' as SubmitStatus } : item))
      removeAuditItemByCorpus(submitConfirm.corpusName)
    }
    setSubmitConfirm(null)
  }

  const toggleAuditSort = (field: 'submittedAt' | 'auditAt') => {
    if (auditSortField === field) {
      setAuditSortDir((dir) => (dir === 'desc' ? 'asc' : 'desc'))
    } else {
      setAuditSortField(field)
      setAuditSortDir('desc')
    }
  }

  const submitBasic = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.username.trim() || !draft.institution.trim() || !draft.contact.trim()) return
    const next = { ...profile }
    for (const key of ['username', 'institution', 'contact', 'researchField', 'position', 'bio'] as const) {
      next[key] = draft[key]
    }
    persistProfile(next)
    setModal(null)
  }

  if (!user) {
    return (
      <main className="profile-page profile-guest-page">
        <section className="profile-guest-card">
          <div className="profile-guest-icon"><UserRound size={35} /></div>
          <h1>个人主页</h1>
          <p>登录后可管理个人资料，以及已认领、已上传和已收藏的语料库</p>
          <button type="button" onClick={() => openAuth('/profile')}>登录平台</button>
        </section>
      </main>
    )
  }

  return (
    <main className="profile-page">
      <div className="profile-layout">
        <aside className="profile-side">
          <section className="profile-user-card-top">
            <button className="profile-avatar-button" type="button" onClick={() => openModal('avatar')} aria-label="编辑头像">
              {profile.avatar ? <img src={profile.avatar} alt="" /> : <span>{profile.username.slice(0, 1)}</span>}
              <i><Camera size={13} /></i>
            </button>
            <h1>{profile.username || '未设置用户名'}</h1>
            <p><Building2 size={14} />{profile.institution || '暂未填写机构'}</p>
            {profile.contact && <p className="profile-contact"><UserRound size={14} />{profile.contact}</p>}
            {(profile.researchField || profile.position) && (
              <p className="profile-contact">{[profile.researchField, profile.position].filter(Boolean).join(' · ')}</p>
            )}
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-stats">
              <span><b>{communityUsers.filter((item) => userFollowed[item.id]).length}</b>关注</span>
              <span><b>128</b>粉丝</span>
              <span><b>{totalCollected.toLocaleString()}</b>被收藏</span>
            </div>
            <button className="profile-edit-basic" type="button" onClick={() => openModal('basic')}><Pencil size={15} />编辑基本信息</button>
          </section>

          <section className="profile-messages">
            <header><Bell size={17} /><h2>消息</h2></header>
            <nav className="profile-notice-tabs">
              <button type="button" className={noticeTab === 'audit' ? 'is-active' : ''} onClick={() => setNoticeTab('audit')}><ShieldCheck size={14} />系统通知</button>
              <button type="button" className={noticeTab === 'comment' ? 'is-active' : ''} onClick={() => setNoticeTab('comment')}><MessageCircle size={14} />评论</button>
            </nav>
            {noticeTab === 'audit' ? (
              <div className="profile-notice-list">
                {notices.map((notice) => (
                  <button type="button" className="profile-notice-item" key={notice.id} onClick={() => setNoticeItem(notice)}>
                    <strong>系统通知</strong>
                    <p>{notice.role === 'admin' && notice.kind === 'pending' ? `您有一条${notice.permission ? '加入语料库' : '上传语料'}的申请待审核` : noticeView(notice).title}</p>
                    <small>{notice.time}</small>
                  </button>
                ))}
              </div>
            ) : (
              <div className="profile-notice-list">
                {commentNotices.map((item) => (
                  <button type="button" className="profile-comment-item" key={item.id} onClick={() => navigate(item.kind === 'corpus' ? `/search/datasets/${item.targetId}?tab=comments` : `/demands/${item.targetId}`)}>
                    <span className="profile-comment-avatar">{item.user.slice(0, 1)}</span>
                    <div>
                      <strong>{item.user}</strong>
                      <p>{item.text}</p>
                      <small>{item.time}</small>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </aside>

        <section className="profile-main">
          <nav className="profile-main-tabs">
            <button type="button" className={activeTab === 'corpora' ? 'is-active' : ''} onClick={() => { setActiveTab('corpora'); setCorpusPage(1) }}>我的语料库</button>
            <button type="button" className={activeTab === 'demands' ? 'is-active' : ''} onClick={() => { setActiveTab('demands'); setDemandPage(1) }}>需求动态</button>
            <button type="button" className={activeTab === 'submit' ? 'is-active' : ''} onClick={() => { setActiveTab('submit'); setSubmitPage(1) }}>我的汇交</button>
            <button type="button" className={activeTab === 'audit' ? 'is-active' : ''} onClick={() => setActiveTab('audit')}>审核工作台</button>
            <button type="button" className={activeTab === 'privacy' ? 'is-active' : ''} onClick={() => setActiveTab('privacy')}>隐私设置</button>
          </nav>

          {activeTab === 'corpora' && (
            <>
              <header className="profile-section-header">
                <h2>我的语料库</h2>
                <div className="profile-sub-tabs">
                  {([['managed', '我管理的'], ['joined', '我加入的'], ['favorite', '我收藏的']] as Array<[CorpusTab, string]>).map(([key, label]) => (
                    <button type="button" className={corpusTab === key ? 'is-active' : ''} key={key} onClick={() => { setCorpusTab(key); setCorpusPage(1) }}>{label}</button>
                  ))}
                </div>
              </header>
              <div className="profile-corpus-grid">
                {visibleCorpora.map((item) => (
                  <Link className="catalog-corpus-card" to={`/search/datasets/${item.id}`} target="_blank" rel="noreferrer" key={item.id}>
                    <div className="quality-card-visual catalog-card-visual" aria-hidden="true">
                      <span className={`card-status-overlay ${item.openness === '不公开' ? 'is-private' : 'is-partial'}`}>{item.openness === '不公开' ? '不公开' : '公开'}</span>
                      <span className="visual-line visual-line-one" />
                      <span className="visual-line visual-line-two" />
                      <span className="visual-node node-one" />
                      <span className="visual-node node-two" />
                      <span className="visual-node node-three" />
                      <span className="visual-node node-four" />
                      <span className="visual-bar bar-one" />
                      <span className="visual-bar bar-two" />
                      <span className="visual-bar bar-three" />
                      <span className="visual-bar bar-four" />
                    </div>
                    <div className="catalog-card-meta-row">
                      <div className="catalog-card-tags"><span className="catalog-subject-tag">{item.subject}</span></div>
                      <time dateTime={item.publishedAt}><CalendarDays size={13} />{item.publishedAt}</time>
                    </div>
                    <h3>{item.title}</h3>
                    <div className="catalog-card-metadata"><span><Building2 size={14} />{item.organization} - {item.authors}</span></div>
                    <p>{item.summary}</p>
                    <footer>
                      <span className="card-org-mark" aria-hidden="true">{item.organization.slice(0, 1)}</span>
                      <strong className="card-organization-name">{item.organization} - {item.authors}</strong>
                      <span><Download size={14} />{item.usage.toLocaleString()}</span>
                      <span><Eye size={14} />{item.views.toLocaleString()}</span>
                      <span><Star size={14} />{item.favorites.toLocaleString()}</span>
                    </footer>
                  </Link>
                ))}
              </div>
              <Pager total={corpusList.length} pageSize={6} current={corpusPage} onChange={setCorpusPage} />
            </>
          )}

          {activeTab === 'demands' && (
            <>
              <header className="profile-section-header">
                <h2>需求动态</h2>
                <div className="profile-sub-tabs">
                  {([['published', '已发布'], ['favorited', '已收藏'], ['commented', '已评论'], ['following', '关注'], ['followers', '粉丝']] as Array<[DemandTab, string]>).map(([key, label]) => (
                    <button type="button" className={demandTab === key ? 'is-active' : ''} key={key} onClick={() => { setDemandTab(key); setDemandPage(1) }}>{label}</button>
                  ))}
                </div>
              </header>
              {(demandTab === 'published' || demandTab === 'favorited' || demandTab === 'commented') && (
                <>
                  <div className="profile-demand-grid">
                    {visibleDemands.map((post) => (
                      <Link className="demand-post-card" to={`/demands/${post.id}`} key={post.id}>
                        <div className="demand-card-main" aria-label={`查看${post.title}详情`}>
                          <DemandPoster demand={post} />
                          <div className="demand-post-body">
                            <h2>{post.corpusName}</h2>
                            <footer>
                              <span className="demand-avatar small"><span>{post.author.slice(0, 1)}</span></span>
                              <small>{post.organization}</small>
                            </footer>
                          </div>
                        </div>
                        <div className="demand-post-actions" aria-hidden="true">
                          <span><Heart size={17} />{post.likes}</span>
                          <span><Star size={17} />{post.bookmarks}</span>
                          <span><MessageCircle size={17} />{post.comments}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Pager total={demandMap[demandTab as 'published'].length} pageSize={demandPageSize} current={demandPage} onChange={setDemandPage} />
                </>
              )}
              {(demandTab === 'following' || demandTab === 'followers') && (
                <>
                  <div className="profile-user-grid">
                    {visibleUsers.map((item) => {
                      const followed = userFollowed[item.id]
                      const label = demandTab === 'followers'
                        ? (item.mutual ? '互相关注' : '关注')
                        : (item.mutual ? '互相关注' : '已关注')
                      return (
                        <article className="profile-user-card" key={item.id}>
                          <span className="profile-user-avatar">{item.name.slice(0, 1)}</span>
                          <div><strong>{item.name}</strong><small>{item.role}</small></div>
                          <button
                            type="button"
                            className={followed ? 'is-followed is-hoverable' : ''}
                            data-tooltip={label !== '关注' ? '取消关注' : undefined}
                            onClick={() => setUserFollowed((current) => ({ ...current, [item.id]: !current[item.id] }))}
                          >
                            {label}
                          </button>
                        </article>
                      )
                    })}
                  </div>
                  <Pager total={filteredUsers.length} pageSize={demandPageSize} current={demandPage} onChange={setDemandPage} />
                </>
              )}
            </>
          )}

          {activeTab === 'submit' && (() => {
            const filtered = submitRecordsState
              .filter((record) =>
                (submitStatus === '全部' || record.status === submitStatus) &&
                (submitTypeFilter === '全部' || record.type === submitTypeFilter) &&
                (!submitKeyword.trim() || record.corpusName.includes(submitKeyword.trim()))
              )
              .slice()
              .sort((a, b) => submitSortDir === 'desc' ? b.submittedAt.localeCompare(a.submittedAt) : a.submittedAt.localeCompare(b.submittedAt))
            const pageCount = Math.max(1, Math.ceil(filtered.length / submitPerPage))
            const safePage = Math.min(submitPage, pageCount)
            const visibleRecords = filtered.slice((safePage - 1) * submitPerPage, safePage * submitPerPage)
            const withdraw = (record: SubmitRecord) => setSubmitConfirm({ title: '撤回申请', message: `确定撤回「${record.corpusName}」的申请吗？撤回后需要重新提交审核。`, confirmLabel: '确认撤回', recordId: record.id, action: 'withdraw', corpusName: record.corpusName })
            return (
              <>
                <div className="submit-toolbar">
                  <div className="submit-tabs">
                    <button type="button" className={submitStatus === '全部' ? 'is-active' : ''} onClick={() => setSubmitStatus('全部')}>全部<span>{submitRecordsState.length}</span></button>
                    {submitStatusOptions.map((status) => (
                      <button type="button" className={submitStatus === status ? 'is-active' : ''} key={status} onClick={() => setSubmitStatus(status)}>
                        {status}<span>{submitRecordsState.filter((record) => record.status === status).length}</span>
                      </button>
                    ))}
                  </div>
                  <Link className="submit-create" to="/upload"><Plus size={15} />新建汇交</Link>
                </div>
                <div className="submit-search-row submit-search-right">
                  <label className="submit-search"><Search size={16} /><input value={submitKeyword} onChange={(event) => { setSubmitKeyword(event.target.value); setSubmitPage(1) }} placeholder="搜索语料库名称" /></label>
                </div>
                <div className="submit-table-wrap">
                  <table className="submit-table">
                    <thead>
                      <tr>
                        <th>语料库名称</th>
                        <th>
                          <label className="submit-th-filter">汇交类型
                            <select value={submitTypeFilter} onChange={(event) => { setSubmitTypeFilter(event.target.value as '全部' | '新建语料库' | '上传语料'); setSubmitPage(1) }}>
                              <option>全部</option>
                              <option>新建语料库</option>
                              <option>上传语料</option>
                            </select>
                          </label>
                        </th>
                        <th>
                          <button type="button" className="submit-th-sort is-active" onClick={() => setSubmitSortDir((dir) => dir === 'desc' ? 'asc' : 'desc')}>
                            提交时间 <ArrowDown size={13} className={submitSortDir === 'asc' ? 'is-flipped' : ''} />
                          </button>
                        </th>
                        <th>状态</th><th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRecords.map((record) => (
                        <tr key={record.id}>
                          <td>{record.corpusName}</td>
                          <td>{record.type}</td>
                          <td>{record.submittedAt}</td>
                          <td><span className={`submit-status is-${record.status}`}>{record.status}</span></td>
                          <td>
                            <div className="submit-actions">
                              {record.type === '新建语料库' && (
                                record.status === '草稿' ? (
                                  <>
                                    <button type="button" onClick={() => navigate('/upload')}>继续编辑</button>
                                    <button type="button" className="is-danger" onClick={() => setSubmitConfirm({ title: '删除草稿', message: `确定删除「${record.corpusName}」的草稿吗？删除后不可恢复。`, confirmLabel: '确认删除', recordId: record.id, action: 'delete', corpusName: record.corpusName })}>删除草稿</button>
                                  </>
                                ) : record.status === '审核中' ? (
                                  <>
                                    <button type="button" onClick={() => navigate(`/search/datasets/${record.corpusId}`)}>预览内容</button>
                                    <button type="button" onClick={() => withdraw(record)}>撤回申请</button>
                                  </>
                                ) : record.status === '待修改' ? (
                                  <>
                                    <button type="button" onClick={() => setReasonModal({ title: '修改意见', reason: record.opinion ?? '' })}>查看意见</button>
                                    <button type="button" onClick={() => navigate('/upload')}>修改提交</button>
                                    <button type="button" onClick={() => withdraw(record)}>撤回申请</button>
                                  </>
                                ) : record.status === '已通过' ? (
                                  <button type="button" onClick={() => navigate(`/search/datasets/${record.corpusId}`)}>预览内容</button>
                                ) : record.status === '未通过' ? (
                                  <>
                                    <button type="button" onClick={() => setReasonModal({ title: '审核结果', reason: record.reason ?? '' })}>查看原因</button>
                                    <button type="button" onClick={() => navigate(`/search/datasets/${record.corpusId}`)}>预览内容</button>
                                  </>
                                ) : record.status === '发布异常' ? (
                                  <button type="button" onClick={() => setReasonModal({ title: '发布异常原因', reason: record.reason ?? '' })}>查看原因</button>
                                ) : record.status === '已发布' ? (
                                  <button type="button" onClick={() => navigate(`/search/datasets/${record.corpusId}`)}>查看语料库</button>
                                ) : (
                                  <>
                                    <button type="button" onClick={() => navigate(`/search/datasets/${record.corpusId}`)}>预览内容</button>
                                    <button type="button" onClick={() => navigate('/upload')}>编辑并重新提交</button>
                                  </>
                                )
                              )}
                              {record.type === '上传语料' && (
                                record.status === '审核中' ? (
                                  <button type="button" onClick={() => withdraw(record)}>撤回申请</button>
                                ) : record.status === '未通过' ? (
                                  <button type="button" onClick={() => setReasonModal({ title: '审核结果', reason: record.reason ?? '' })}>查看原因</button>
                                ) : record.status === '已上传' ? (
                                  <button type="button" onClick={() => navigate(`/search/datasets/${record.corpusId}`)}>查看语料库</button>
                                ) : (
                                  <span className="submit-no-action">—</span>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {visibleRecords.length === 0 && <tr><td colSpan={5}><div className="submit-empty">暂无汇交记录</div></td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className="submit-pager">
                  <span>共 {filtered.length} 条任务</span>
                  <Pager total={filtered.length} pageSize={submitPerPage} current={safePage} span={3} onChange={setSubmitPage} />
                  <label className="submit-per-page">每页
                    <select value={submitPerPage} onChange={(event) => { setSubmitPerPage(Number(event.target.value)); setSubmitPage(1) }}>
                      <option value={10}>10 条/页</option>
                      <option value={20}>20 条/页</option>
                      <option value={50}>50 条/页</option>
                    </select>
                  </label>
                </div>
              </>
            )
          })()}

          {activeTab === 'audit' && (() => {
            const sortKey = (value: string) => value === '—' ? '' : value
            const filtered = auditItems.filter((item) =>
              (auditStatus === '全部' || item.status === auditStatus) &&
              (!auditKeyword.trim() || item.corpusName.includes(auditKeyword.trim()) || item.submitter.includes(auditKeyword.trim()))
            ).slice().sort((a, b) => {
              const left = sortKey(a[auditSortField])
              const right = sortKey(b[auditSortField])
              return auditSortDir === 'desc' ? right.localeCompare(left) : left.localeCompare(right)
            })
            return (
              <>
                <header className="audit-work-head">
                  <h2>审核工作台</h2>
                  <span className="audit-work-role">平台管理员</span>
                </header>
                <div className="submit-toolbar">
                  <div className="submit-tabs">
                    <button type="button" className={auditStatus === '全部' ? 'is-active' : ''} onClick={() => setAuditStatus('全部')}>全部<span>{auditItems.length}</span></button>
                    {auditWorkStatusOptions.map((status) => (
                      <button type="button" className={auditStatus === status ? 'is-active' : ''} key={status} onClick={() => setAuditStatus(status)}>
                        {status}<span>{auditItems.filter((item) => item.status === status).length}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="submit-search-row">
                  <label className="submit-search"><Search size={16} /><input value={auditKeyword} onChange={(event) => setAuditKeyword(event.target.value)} placeholder="搜索语料库名称、提交人" /></label>
                </div>
                <div className="submit-table-wrap">
                  <table className="submit-table">
                    <thead>
                      <tr>
                        <th>语料库名称</th><th>提交人</th>
                        <th><button type="button" className={`submit-th-sort${auditSortField === 'submittedAt' ? ' is-active' : ''}`} onClick={() => toggleAuditSort('submittedAt')}>提交时间 <ArrowDown size={13} className={auditSortField === 'submittedAt' && auditSortDir === 'asc' ? 'is-flipped' : auditSortField === 'submittedAt' ? '' : 'is-muted'} /></button></th>
                        <th><button type="button" className={`submit-th-sort${auditSortField === 'auditAt' ? ' is-active' : ''}`} onClick={() => toggleAuditSort('auditAt')}>审核时间 <ArrowDown size={13} className={auditSortField === 'auditAt' && auditSortDir === 'asc' ? 'is-flipped' : auditSortField === 'auditAt' ? '' : 'is-muted'} /></button></th>
                        <th>状态</th><th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => (
                        <tr key={item.id}>
                          <td>{item.corpusName}</td>
                          <td>{item.submitter}</td>
                          <td>{item.submittedAt}</td>
                          <td>{item.auditAt}</td>
                          <td><span className={`submit-status is-${item.status}`}>{item.status}</span></td>
                          <td>
                            <div className="submit-actions">
                              {item.status === '待审核' && <button type="button" onClick={() => navigate(`/profile/audit/${item.id}`)}>开始审核</button>}
                              {item.status === '审核中' && <button type="button" onClick={() => navigate(`/profile/audit/${item.id}`)}>继续审核</button>}
                              {item.status === '待重新审核' && <button type="button" onClick={() => navigate(`/profile/audit/${item.id}`)}>重新审核</button>}
                              {item.status === '已通过' && <button type="button" onClick={() => navigate(`/search/datasets/${item.corpusId}`)}>预览内容</button>}
                              {item.status === '已拒绝' && (
                                <>
                                  <button type="button" onClick={() => navigate(`/search/datasets/${item.corpusId}`)}>预览内容</button>
                                  <button type="button" onClick={() => setReasonModal({ title: '审核结果', reason: item.reason ?? '' })}>查看理由</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && <tr><td colSpan={6}><div className="submit-empty">暂无审核任务</div></td></tr>}
                    </tbody>
                  </table>
                </div>
              </>
            )
          })()}

          {activeTab === 'privacy' && (
            <div className="profile-privacy">
              <p className="profile-privacy-intro">设置个人主页对外展示内容的可见范围</p>
              {privacyKeys.map((key) => (
                <label className="profile-privacy-row" key={key}>
                  <span>{key}</span>
                  <select value={privacy[key]} onChange={(event) => setPrivacy((current) => ({ ...current, [key]: event.target.value as PrivacyValue }))}>
                    {privacyOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
              ))}
            </div>
          )}
        </section>
      </div>

      {modal === 'avatar' && (
        <div className="dataset-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null) }}>
          <section className="dataset-modal profile-avatar-modal" role="dialog" aria-modal="true">
            <div className="dataset-modal-title"><div><Camera size={21} /><h2>{avatarUploaded ? '裁剪图片' : '编辑头像'}</h2></div><button type="button" onClick={() => setModal(null)} aria-label="关闭"><X size={18} /></button></div>
            {avatarUploaded && avatarDraft ? (
              <div className="avatar-crop-stage" ref={cropStageRef}>
                <img src={avatarDraft} alt="" />
                <div
                  className="avatar-crop-ring"
                  style={{ left: `${(avatarCrop.x - avatarCrop.size / 2) * 100}%`, top: `${(avatarCrop.y - avatarCrop.size / 2) * 100}%`, width: `${avatarCrop.size * 100}%`, height: `${avatarCrop.size * 100}%` }}
                  onPointerDown={startCropDrag('move')}
                >
                  <span className="avatar-crop-handle" onPointerDown={(event) => { event.stopPropagation(); startCropDrag('resize')(event) }} />
                </div>
              </div>
            ) : (
              <div className="profile-avatar-preview">{avatarDraft ? <img src={avatarDraft} alt="" /> : <span>{profile.username.slice(0, 1)}</span>}</div>
            )}
            <div className="profile-avatar-actions">
              <button type="button" onClick={() => avatarInputRef.current?.click()}><Camera size={15} />上传头像</button>
              <button type="button" onClick={() => setModal(null)}>取消</button>
              <button type="button" className="is-primary" onClick={confirmAvatar}>确认</button>
            </div>
            <input ref={avatarInputRef} hidden type="file" accept="image/*" onChange={uploadAvatar} />
          </section>
        </div>
      )}

      {modal === 'basic' && (
        <div className="dataset-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null) }}>
          <form className="dataset-modal profile-edit-modal" onSubmit={submitBasic}>
            <div className="dataset-modal-title"><div><Pencil size={21} /><h2>编辑基本信息</h2></div><button type="button" onClick={() => setModal(null)} aria-label="关闭"><X size={18} /></button></div>
            <p>更新个人主页对外展示的名称与机构信息</p>
            <div className="profile-form-grid">
              <label><span>用户名 <b>*</b></span><input required value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} placeholder="请输入用户名" /></label>
              <label><span>所在单位 <b>*</b></span><input required value={draft.institution} onChange={(event) => setDraft({ ...draft, institution: event.target.value })} placeholder="请输入所在机构" /></label>
              <label className="is-wide"><span>联系方式（手机号/邮箱）<b>*</b></span><input required value={draft.contact} onChange={(event) => setDraft({ ...draft, contact: event.target.value })} placeholder="请输入手机号或邮箱" /></label>
              <label><span>研究领域</span><input value={draft.researchField} onChange={(event) => setDraft({ ...draft, researchField: event.target.value })} placeholder="如：计算数学" /></label>
              <label><span>职务</span><input value={draft.position} onChange={(event) => setDraft({ ...draft, position: event.target.value })} placeholder="如：教师、科研人员" /></label>
              <label className="is-wide"><span>个人简介</span><textarea rows={4} value={draft.bio} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} placeholder="简要介绍您的研究方向或语料建设经历" /></label>
            </div>
            <div className="dataset-modal-actions"><button type="button" onClick={() => setModal(null)}>取消</button><button type="submit" className="is-primary">确认</button></div>
          </form>
        </div>
      )}

      {submitConfirm && (
        <div className="dataset-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSubmitConfirm(null) }}>
          <section className="dataset-modal profile-notice-modal" role="dialog" aria-modal="true">
            <div className="dataset-modal-title"><div><ShieldCheck size={21} /><h2>{submitConfirm.title}</h2></div><button type="button" onClick={() => setSubmitConfirm(null)} aria-label="关闭"><X size={18} /></button></div>
            <p className="profile-notice-body">{submitConfirm.message}</p>
            <div className="dataset-modal-actions">
              <button type="button" onClick={() => setSubmitConfirm(null)}>取消</button>
              <button type="button" className="is-primary" onClick={runSubmitConfirm}>{submitConfirm.confirmLabel}</button>
            </div>
          </section>
        </div>
      )}

      {reasonModal && (
        <div className="dataset-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setReasonModal(null) }}>
          <section className="dataset-modal profile-notice-modal" role="dialog" aria-modal="true">
            <div className="dataset-modal-title"><div><ShieldCheck size={21} /><h2>{reasonModal.title}</h2></div><button type="button" onClick={() => setReasonModal(null)} aria-label="关闭"><X size={18} /></button></div>
            <p className="profile-notice-body">{reasonModal.reason}</p>
            <div className="dataset-modal-actions"><button type="button" className="is-primary" onClick={() => setReasonModal(null)}>知道了</button></div>
          </section>
        </div>
      )}

      {noticeItem && (
        <div className="dataset-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setNoticeItem(null) }}>
          <section className="dataset-modal profile-notice-modal" role="dialog" aria-modal="true">
            <div className="dataset-modal-title"><div><ShieldCheck size={21} /><h2>审核通知</h2></div><button type="button" onClick={() => setNoticeItem(null)} aria-label="关闭"><X size={18} /></button></div>
            {(() => {
              const view = noticeView(noticeItem)
              return (
                <>
                  <h3 className="profile-notice-title">{view.title}</h3>
                  <p className="profile-notice-body">{view.body}</p>
                  <div className="dataset-modal-actions">
                    <button type="button" onClick={() => { setNoticeItem(null); navigate(view.to) }}>{view.action}</button>
                    <button type="button" className="is-primary" onClick={() => setNoticeItem(null)}>知道了</button>
                  </div>
                </>
              )
            })()}
          </section>
        </div>
      )}
    </main>
  )
}
