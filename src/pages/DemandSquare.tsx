import { useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Contact,
  Copy,
  Edit3,
  Heart,
  ImagePlus,
  MessageCircle,
  Search,
  Send,
  Trash2,
  Upload,
  Star,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router'

export type DemandStatus = '招募中' | '共建中' | '已完成'
type DemandTab = '综合排序' | '招募中' | '共建中' | '已完成'
type SearchTab = '全部' | '用户'

export type DemandPost = {
  id: string
  title: string
  field: string
  corpusName: string
  author: string
  organization: string
  bio: string
  status: DemandStatus
  tags: string[]
  content: string
  likes: number
  bookmarks: number
  comments: number
  template: 'blue' | 'mint' | 'violet'
  image?: 'finance' | 'industry'
  contact: {
    name: string
    unit: string
    email: string
  }
}

type CommunityUser = {
  id: string
  name: string
  role: string
  organization: string
  following: number
  fans: number
  collections: number
  mutual?: boolean
}

export const initialDemandPosts: DemandPost[] = [
  {
    id: 'demand-chem-001',
    title: '有没有伙伴一起建设一个医学影像语料',
    field: '格物 · 语料共建',
    corpusName: '多模态医学影像—报告配对语料',
    author: '北',
    organization: '北京大学医学部',
    bio: '关注医学影像、临床报告结构化与多模态语料建设。',
    status: '招募中',
    tags: ['文字需求', '医学影像', '多模态'],
    content: '希望寻找医学影像与临床报告配对数据伙伴，共同沉淀可用于模型训练、报告生成和辅助诊断评测的语料。',
    likes: 236,
    bookmarks: 84,
    comments: 31,
    template: 'blue',
    contact: { name: '北京大学医学部', unit: '北京大学医学部', email: 'medical-corpus@pku.edu.cn' },
  },
  {
    id: 'demand-math-001',
    title: '中国上市公司公告事件语料',
    field: '格物 · 语料共建',
    corpusName: '上市公司公告事件语料',
    author: '复',
    organization: '复旦大学',
    bio: '研究金融文本、事件抽取与行业知识图谱。',
    status: '共建中',
    tags: ['文字需求', '金融文本'],
    content: '围绕上市公司公告中的并购、处罚、业绩预告等事件，构建可检索、可抽取、可追踪的结构化语料。',
    likes: 184,
    bookmarks: 57,
    comments: 26,
    template: 'violet',
    image: 'finance',
    contact: { name: '复旦大学金融文本团队', unit: '复旦大学', email: 'finance-corpus@fudan.edu.cn' },
  },
  {
    id: 'demand-geo-001',
    title: '寻找方言伙伴共建语音与转写语料',
    field: '格物 · 语料共建',
    corpusName: '长三角方言语音与转写语料',
    author: '南',
    organization: '南京大学',
    bio: '关注语音语言学、方言保护与语音模型训练。',
    status: '招募中',
    tags: ['文字需求', '语音转写'],
    content: '面向长三角方言采集、音频切分、文本转写与说话人信息标注，邀请高校和地方团队共同参与。',
    likes: 161,
    bookmarks: 42,
    comments: 18,
    template: 'mint',
    contact: { name: '南京大学语言语音团队', unit: '南京大学', email: 'dialect@nju.edu.cn' },
  },
  {
    id: 'demand-bio-001',
    title: '工业设备故障知识图谱语料',
    field: '格物 · 语料共建',
    corpusName: '工业设备故障知识图谱语料',
    author: '交',
    organization: '上海交通大学',
    bio: '建设工业设备运维、故障识别与知识推理语料。',
    status: '共建中',
    tags: ['图像语料', '故障识别'],
    content: '汇聚设备图像、检修记录、传感器波形和故障原因文本，建设面向工业场景的知识图谱与多模态训练语料。',
    likes: 149,
    bookmarks: 39,
    comments: 21,
    template: 'blue',
    image: 'industry',
    contact: { name: '上海交通大学工业智能团队', unit: '上海交通大学', email: 'industry-ai@sjtu.edu.cn' },
  },
  {
    id: 'demand-bio-002',
    title: '征集珍稀植物四季生长图像语料',
    field: '格物 · 语料共建',
    corpusName: '珍稀植物多季相图像语料',
    author: '中',
    organization: '中国科学院',
    bio: '关注生物多样性监测、植物识别与生态语料共建。',
    status: '已完成',
    tags: ['文字需求', '植物图像'],
    content: '面向珍稀植物四季生长过程，征集连续观测图像、物候记录和环境信息，用于植物识别与生态变化分析。',
    likes: 132,
    bookmarks: 35,
    comments: 16,
    template: 'mint',
    contact: { name: '中国科学院生态团队', unit: '中国科学院', email: 'plant-corpus@cas.cn' },
  },
]

const communityUsers: CommunityUser[] = [
  { id: 'user-lin', name: '林知远', role: '材料语料发起人', organization: '北京大学化学与分子工程学院', following: 38, fans: 426, collections: 1208 },
  { id: 'user-lab', name: '医学语料联合实验室', role: '生物医学语料团队', organization: '北京大学健康医疗大数据国家研究院', following: 16, fans: 892, collections: 2341 },
  { id: 'user-chen', name: '陈明', role: '形式化数学研究者', organization: '北京大学数学科学学院', following: 72, fans: 311, collections: 760, mutual: true },
]

const demandTabs: DemandTab[] = ['综合排序', '招募中', '共建中', '已完成']
const posterTemplates: Array<DemandPost['template']> = ['blue', 'mint', 'violet']

function matchesDemand(demand: DemandPost, keyword: string) {
  const normalized = keyword.trim().toLocaleLowerCase('zh-CN')
  if (!normalized) return true
  return [demand.title, demand.field, demand.corpusName, demand.content, demand.author, ...demand.tags]
    .some((value) => value.toLocaleLowerCase('zh-CN').includes(normalized))
}

export function DemandPoster({ demand, compact = false }: { demand: DemandPost; compact?: boolean }) {
  return (
    <div className={`demand-poster demand-poster-${demand.template}${demand.image ? ` demand-poster-image demand-poster-image-${demand.image}` : ''}${compact ? ' is-compact' : ''}`}>
      <span className="poster-status">{demand.status}</span>
      <span className="poster-orbit orbit-a" />
      <span className="poster-orbit orbit-b" />
      <span className="poster-dot dot-a" />
      <span className="poster-dot dot-b" />
      <strong>{demand.title}</strong>
      <p>{demand.field}</p>
      <div>
        <span>{demand.tags[0] ?? '文字需求'}</span>
        <i aria-hidden="true" />
        <i aria-hidden="true" />
        <i aria-hidden="true" />
        <i aria-hidden="true" />
      </div>
    </div>
  )
}

export default function DemandSquare() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState(initialDemandPosts)
  const [activeTab, setActiveTab] = useState<DemandTab>('综合排序')
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [isSearchPage, setIsSearchPage] = useState(false)
  const [searchTab, setSearchTab] = useState<SearchTab>('全部')
  const [selectedPost, setSelectedPost] = useState<DemandPost | null>(null)
  const [showPublish, setShowPublish] = useState(false)
  const [successPost, setSuccessPost] = useState<DemandPost | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set())
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set(['user-chen']))
  const [showContact, setShowContact] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [toast, setToast] = useState('')
  const [drafts, setDrafts] = useState<DemandPost[]>([])
  const [showDrafts, setShowDrafts] = useState(false)
  const [template, setTemplate] = useState<DemandPost['template']>('blue')
  const [form, setForm] = useState({
    title: '',
    field: '',
    corpusName: '',
    content: '',
    tags: '',
    name: '',
    unit: '',
    email: '',
  })

  const visiblePosts = useMemo(() => {
    const filteredByStatus = activeTab === '综合排序'
      ? [...posts].sort((a, b) => (b.likes + b.bookmarks) - (a.likes + a.bookmarks))
      : posts.filter((post) => post.status === activeTab)
    return filteredByStatus.filter((post) => matchesDemand(post, keyword))
  }, [activeTab, keyword, posts])

  const matchedUsers = useMemo(() => {
    const normalized = keyword.trim().toLocaleLowerCase('zh-CN')
    if (!normalized) return communityUsers
    return communityUsers.filter((user) => [user.name, user.role, user.organization]
      .some((value) => value.toLocaleLowerCase('zh-CN').includes(normalized)))
  }, [keyword])

  const previewPost: DemandPost = {
    id: 'preview',
    title: form.title || '填写需求标题，生成文字需求卡片',
    field: form.field || '应用领域 · 语料方向',
    corpusName: form.corpusName || '语料名称',
    author: form.name || '发布者',
    organization: form.unit || '所在单位',
    bio: '',
    status: '招募中',
    tags: form.tags.split(/[，,\s]+/).filter(Boolean).slice(0, 3),
    content: form.content || '在这里补充需求背景、语料范围、样例数据、期望协作方式等信息。',
    likes: 0,
    bookmarks: 0,
    comments: 0,
    template,
    contact: { name: form.name, unit: form.unit, email: form.email },
  }

  const flashToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 1800)
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setKeyword(searchInput.trim())
    setSearchTab('全部')
    setIsSearchPage(Boolean(searchInput.trim()))
  }

  const toggleId = (setter: Dispatch<SetStateAction<Set<string>>>, id: string) => {
    setter((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const makePostFromForm = (): DemandPost | null => {
    if (!form.title.trim() || !form.field.trim() || !form.corpusName.trim() || !form.content.trim() || !form.name.trim() || !form.unit.trim() || !form.email.trim()) {
      flashToast('请补全必填信息')
      return null
    }
    return {
      ...previewPost,
      id: `demand-${Date.now()}`,
      title: form.title.trim(),
      field: form.field.trim(),
      corpusName: form.corpusName.trim(),
      content: form.content.trim(),
      author: form.name.trim(),
      organization: form.unit.trim(),
      tags: form.tags.split(/[，,\s]+/).filter(Boolean),
      contact: { name: form.name.trim(), unit: form.unit.trim(), email: form.email.trim() },
    }
  }

  const saveDraft = () => {
    const draft = {
      ...previewPost,
      id: `draft-${Date.now()}`,
      title: form.title.trim() || '未命名需求草稿',
    }
    setDrafts((current) => [draft, ...current])
    flashToast('草稿已保存')
  }

  const publishPost = () => {
    const nextPost = makePostFromForm()
    if (!nextPost) return
    setPosts((current) => [nextPost, ...current])
    setSuccessPost(nextPost)
    setShowPublish(false)
    setForm({ title: '', field: '', corpusName: '', content: '', tags: '', name: '', unit: '', email: '' })
  }

  const continueDraft = (draft: DemandPost) => {
    setForm({
      title: draft.title,
      field: draft.field,
      corpusName: draft.corpusName,
      content: draft.content,
      tags: draft.tags.join('，'),
      name: draft.author,
      unit: draft.organization,
      email: draft.contact.email,
    })
    setTemplate(draft.template)
    setShowDrafts(false)
    setShowPublish(true)
  }

  return (
    <div className="demand-square-page">
      <section className="demand-square-hero">
        <div className="demand-square-hero-copy">
          <span>语料需求 · 共建协作</span>
          <h1>让每一个语料需求 <b>被看见、被响应</b></h1>
          <p>发布语料建设需求，寻找同行伙伴，让数据资源与真实科研问题高效连接。</p>
        </div>
      </section>

      <section className={`demand-board-section${isSearchPage ? ' is-search-results' : ''}`}>
        <div className="demand-board-toolbar">
          <form className="demand-search" role="search" onSubmit={submitSearch}>
            <div className="demand-search-field">
              <Search size={18} />
              <input
                aria-label="搜索需求"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="多模态医疗语料"
                value={searchInput}
              />
              {searchInput && <button type="button" aria-label="清空搜索" onClick={() => { setSearchInput(''); setKeyword(''); setSearchTab('全部'); setIsSearchPage(false) }}><X size={17} /></button>}
            </div>
            <button type="submit"><Search size={16} />搜索</button>
          </form>
          <div className="demand-status-tabs">
            {demandTabs.map((tab) => (
              <button className={activeTab === tab ? 'is-active' : ''} key={tab} onClick={() => setActiveTab(tab)} type="button">
                {tab}
              </button>
            ))}
          </div>
        </div>

        {isSearchPage && keyword && (
          <div className="demand-search-tabs" aria-label="搜索结果类型">
            {(['全部', '用户'] as SearchTab[]).map((tab) => (
              <button className={searchTab === tab ? 'is-active' : ''} key={tab} onClick={() => setSearchTab(tab)} type="button">
                {tab}
              </button>
            ))}
          </div>
        )}

        {searchTab === '全部' ? (
          <>
            <header className="demand-board-heading">
              <div>
                <h2>{isSearchPage ? '相关需求' : '热门建设需求'}</h2>
                <p>{isSearchPage ? `与“${keyword}”相关的共建线索` : '按互动热度展示社区最受关注的需求'}</p>
              </div>
              <div>
                <span>共 {visiblePosts.length} 条</span>
                <button className="demand-primary-action" type="button" onClick={() => setShowPublish(true)}>
                  + 发布需求
                </button>
              </div>
            </header>
            <div className="demand-card-grid">
            {visiblePosts.map((post) => (
              <article className="demand-post-card" key={post.id}>
                <button className="demand-card-main" type="button" onClick={() => navigate(`/demands/${post.id}`)} aria-label={`查看${post.title}详情`}>
                  <DemandPoster demand={post} />
                  <div className="demand-post-body">
                    <h2>{post.corpusName}</h2>
                    <footer>
                      <span className="demand-avatar small"><span>{post.author.slice(0, 1)}</span></span>
                      <small>{post.organization}</small>
                    </footer>
                  </div>
                </button>
                <div className="demand-post-actions">
                  <button className={likedIds.has(post.id) ? 'is-active' : ''} type="button" onClick={() => toggleId(setLikedIds, post.id)}>
                    <Heart size={17} />{post.likes + (likedIds.has(post.id) ? 1 : 0)}
                  </button>
                  <button className={bookmarkedIds.has(post.id) ? 'is-active' : ''} type="button" onClick={() => toggleId(setBookmarkedIds, post.id)}>
                    <Star size={17} />{post.bookmarks + (bookmarkedIds.has(post.id) ? 1 : 0)}
                  </button>
                  <button type="button" onClick={() => navigate(`/demands/${post.id}`)}>
                    <MessageCircle size={17} />{post.comments}
                  </button>
                </div>
              </article>
            ))}
            </div>
          </>
        ) : (
          <div className="demand-user-results">
            {matchedUsers.map((user) => {
              const followed = followedUsers.has(user.id)
              return (
                <article className="demand-user-card" key={user.id}>
                  <button className="demand-user-avatar-button" type="button" onClick={() => navigate('/profile')} aria-label={`进入${user.name}个人主页`}>
                    <span className="demand-avatar user"><span>{user.name.slice(0, 1)}</span></span>
                  </button>
                  <div>
                    <h3>{user.name}</h3>
                    <p>{user.role} · {user.organization}</p>
                    <small>关注 {user.following}　粉丝 {user.fans}　被收藏 {user.collections.toLocaleString('en-US')}</small>
                  </div>
                  <button className={followed ? 'is-followed' : ''} type="button" onClick={() => toggleId(setFollowedUsers, user.id)}>
                    {user.mutual ? '互相关注' : followed ? '已关注' : '关注'}
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {selectedPost && (
        <div className="demand-modal-backdrop" role="presentation" onMouseDown={() => { setSelectedPost(null); setShowContact(false) }}>
          <section className="demand-detail-modal demand-detail-v2" role="dialog" aria-modal="true" aria-labelledby="demand-detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="demand-modal-close" type="button" aria-label="关闭详情" onClick={() => { setSelectedPost(null); setShowContact(false) }}><X /></button>
            <div className="demand-detail-layout">
              <div className="demand-detail-left">
                <div className="demand-detail-poster-wrap">
                  <div className="demand-detail-brand">
                    <img src="/images/logo-final.png" alt="" />
                    <span>格物 · 科学语料共建共享平台</span>
                  </div>
                  <span className="demand-detail-page-count">1/4</span>
                  <button className="demand-detail-slide-control is-left" type="button" aria-label="上一张"><ChevronLeft size={22} /></button>
                  <DemandPoster demand={{ ...selectedPost, image: undefined }} />
                  <button className="demand-detail-slide-control is-right" type="button" aria-label="下一张"><ChevronRight size={22} /></button>
                  <div className="demand-detail-poster-foot">
                    <span><ImagePlus size={19} />文字生成</span>
                    <div><i /><i /><i /><i /></div>
                    <b />
                  </div>
                </div>
                <div className="demand-detail-switcher">
                  <button type="button"><ImagePlus size={17} />切换</button>
                  <button type="button"><Upload size={17} />上传图片</button>
                </div>
              </div>
              <div className="demand-detail-right">
                <aside className="demand-detail-author">
                  <div className="demand-avatar user"><span>{selectedPost.author.slice(0, 1)}</span></div>
                  <div>
                    <h3>{selectedPost.contact.name}</h3>
                    <p>{selectedPost.bio}</p>
                  </div>
                  <button type="button" onClick={() => toggleId(setFollowedUsers, selectedPost.contact.name)}>
                    {followedUsers.has(selectedPost.contact.name) ? '已关注' : '关注'}
                  </button>
                  <button type="button" onClick={() => setShowContact(true)}><Contact size={17} />联系方式</button>
                  <button type="button" aria-label="转发帖子" onClick={() => { navigator.clipboard?.writeText(window.location.href); flashToast('已复制链接 可以转发') }}><Send size={17} /></button>
                </aside>
                <div className="demand-detail-content">
                  <p className="demand-detail-meta">应用领域：{selectedPost.field}</p>
                  <h2 id="demand-detail-title">{selectedPost.corpusName}</h2>
                  <div>{selectedPost.tags.map((tag) => <small key={tag}>{tag}</small>)}</div>
                  <p>{selectedPost.content}</p>
                  <div className="demand-comments">
                    <h3>评论（{selectedPost.comments + 1}）</h3>
                    {[
                      { id: 'comment-wang', avatar: '张', name: '张明宇', text: '语料质量很高，对我们医院影像科的多模态诊断模型训练帮助很大，期待后续合作！', time: '2 天前', likes: 12 },
                      { id: 'comment-lin', avatar: '林', name: '林知远', text: '感谢认可，后续会持续更新更多数据。', time: '2 天前', likes: 3, reply: true },
                      { id: 'comment-li', avatar: '李', name: '李思远', text: '请问是否提供报告结构化字段？如 PET-CT 或超声影像？', time: '1 天前', likes: 5 },
                    ].map((comment) => {
                      const liked = likedCommentIds.has(comment.id)
                      return (
                        <article className={comment.reply ? 'is-reply' : ''} key={comment.id}>
                          <div className="demand-avatar small"><span>{comment.avatar}</span></div>
                          <div>
                            <p><strong>{comment.name}</strong>{comment.reply && <em>作者</em>} {comment.text}</p>
                            <footer>
                              <span>{comment.time}</span>
                              <button className={liked ? 'is-active' : ''} type="button" onClick={() => toggleId(setLikedCommentIds, comment.id)}><Heart size={14} />{comment.likes + (liked ? 1 : 0)}</button>
                              <button type="button">回复</button>
                            </footer>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                  <label className="demand-reply-bar">
                    <input value={commentText} maxLength={1000} onChange={(event) => setCommentText(event.target.value)} placeholder="说点什么..." />
                    <button className={likedIds.has(selectedPost.id) ? 'is-active' : ''} type="button" onClick={() => toggleId(setLikedIds, selectedPost.id)}><Heart size={17} />{selectedPost.likes + (likedIds.has(selectedPost.id) ? 1 : 0)}</button>
                    <button className={bookmarkedIds.has(selectedPost.id) ? 'is-active' : ''} type="button" onClick={() => toggleId(setBookmarkedIds, selectedPost.id)}><Star size={17} />{selectedPost.bookmarks + (bookmarkedIds.has(selectedPost.id) ? 1 : 0)}</button>
                    <button type="button" onClick={() => { setCommentText(''); flashToast('评论已发布') }}><MessageCircle size={17} />{selectedPost.comments + 1}</button>
                    <button type="button" aria-label="转发帖子" onClick={() => { navigator.clipboard?.writeText(window.location.href); flashToast('已复制链接 可以转发') }}><Send size={17} /></button>
                  </label>
                </div>
              </div>
            </div>
            {showContact && (
              <div className="demand-contact-popover">
                <strong>联系方式</strong>
                <button className="demand-contact-close" type="button" aria-label="关闭联系方式" onClick={() => setShowContact(false)}><X size={15} /></button>
                <p>联系人：{selectedPost.contact.name}</p>
                <p>单位：{selectedPost.contact.unit}</p>
                <p>邮箱：{selectedPost.contact.email}</p>
                <button type="button" onClick={() => { navigator.clipboard?.writeText(`${selectedPost.contact.name} ${selectedPost.contact.email}`); flashToast('联系方式已复制') }}><Copy size={15} />复制联系方式</button>
              </div>
            )}
          </section>
        </div>
      )}

      {showPublish && (
        <div className="demand-modal-backdrop" role="presentation" onMouseDown={() => setShowPublish(false)}>
          <section className="demand-publish-modal" role="dialog" aria-modal="true" aria-labelledby="demand-publish-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="demand-modal-close" type="button" aria-label="关闭发布需求" onClick={() => setShowPublish(false)}><X /></button>
            <header>
              <div><Edit3 size={25} /><h2 id="demand-publish-title">发布需求</h2></div>
              <button type="button" onClick={() => setShowDrafts(true)}>草稿箱 {drafts.length}</button>
            </header>
            <div className="demand-publish-layout">
              <div className="demand-poster-builder">
                <DemandPoster demand={previewPost} />
                <div className="poster-template-switcher">
                  {posterTemplates.map((item) => (
                    <button className={template === item ? 'is-active' : ''} key={item} onClick={() => setTemplate(item)} type="button">模板 {item}</button>
                  ))}
                </div>
                <button type="button" className="poster-upload"><ImagePlus size={18} />上传图片</button>
                <p>推荐 1:1 图片比例，建议不低于 1080 x 1350 px。请勿上传无关、水印或侵权图片。</p>
              </div>
              <form className="demand-publish-form" onSubmit={(event) => { event.preventDefault(); publishPost() }}>
                <label>应用领域*<input value={form.field} onChange={(event) => updateForm('field', event.target.value)} placeholder="如 化学化工 · 基地材料" /></label>
                <label>语料名称*<input value={form.corpusName} onChange={(event) => updateForm('corpusName', event.target.value)} placeholder="请输入语料名称" /></label>
                <label>需求标题*<input value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="请输入需求标题" /></label>
                <label>帖子内容*<textarea value={form.content} onChange={(event) => updateForm('content', event.target.value)} placeholder="描述语料范围、样例数据、服务场景或协作方式" /></label>
                <label>标签<input value={form.tags} onChange={(event) => updateForm('tags', event.target.value)} placeholder="用逗号分隔，如 科学数据，知识语料" /></label>
                <div className="demand-contact-fields">
                  <label>真实姓名*<input value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></label>
                  <label>所在单位*<input value={form.unit} onChange={(event) => updateForm('unit', event.target.value)} /></label>
                  <label>电子邮箱*<input value={form.email} onChange={(event) => updateForm('email', event.target.value)} /></label>
                </div>
                <div className="demand-publish-actions">
                  <button type="button" onClick={saveDraft}>保存草稿</button>
                  <button type="button" onClick={() => setShowPublish(false)}>取消</button>
                  <button type="submit">发布</button>
                </div>
              </form>
            </div>
          </section>
        </div>
      )}

      {showDrafts && (
        <div className="demand-modal-backdrop" role="presentation" onMouseDown={() => setShowDrafts(false)}>
          <section className="demand-draft-modal" role="dialog" aria-modal="true" aria-labelledby="demand-drafts-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="demand-modal-close" type="button" aria-label="关闭草稿箱" onClick={() => setShowDrafts(false)}><X /></button>
            <h2 id="demand-drafts-title">草稿箱</h2>
            {drafts.length ? drafts.map((draft) => (
              <article key={draft.id}>
                <DemandPoster demand={draft} compact />
                <div>
                  <h3>{draft.title}</h3>
                  <p>{draft.content}</p>
                  <button type="button" onClick={() => continueDraft(draft)}>继续编辑</button>
                  <button type="button" onClick={() => setDrafts((current) => current.filter((item) => item.id !== draft.id))}><Trash2 size={16} />删除</button>
                </div>
              </article>
            )) : <p>暂无草稿</p>}
          </section>
        </div>
      )}

      {successPost && (
        <div className="demand-modal-backdrop" role="presentation" onMouseDown={() => setSuccessPost(null)}>
          <section className="demand-success-modal" role="dialog" aria-modal="true" aria-labelledby="demand-success-title" onMouseDown={(event) => event.stopPropagation()}>
            <CheckCircle2 size={56} />
            <h2 id="demand-success-title">发布成功</h2>
            <p>需求已进入广场，可继续完善信息或邀请伙伴参与共建。</p>
            <div>
              <button type="button" onClick={() => { navigate(`/demands/${successPost.id}`); setSuccessPost(null) }}>查看发布</button>
              <button type="button" onClick={() => { setSuccessPost(null); setShowPublish(true) }}>继续发布</button>
            </div>
          </section>
        </div>
      )}

      {toast && <div className="demand-toast">{toast}</div>}
    </div>
  )
}
