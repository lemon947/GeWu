import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  ChevronLeft,
  ChevronRight,
  Contact,
  Copy,
  Heart,
  MessageCircle,
  Share2,
  Star,
  X,
} from 'lucide-react'
import { DemandPoster, initialDemandPosts } from './DemandSquare'
import { loadPublishedPosts } from '../data/demand-posts'
import { useApp } from '../context/app-context'

const comments = [
  {
    id: 'comment-wang',
    avatar: '张',
    name: '张明宇',
    text: '语料质量很高，对我们医院影像科的多模态诊断模型训练帮助很大，期待后续合作！',
    time: '2 天前',
    likes: 12,
  },
  {
    id: 'comment-lin',
    avatar: '林',
    name: '林知远',
    text: '感谢认可，后续会持续更新更多数据。',
    time: '2 天前',
    likes: 3,
    reply: true,
  },
  {
    id: 'comment-li',
    avatar: '李',
    name: '李思远',
    text: '请问是否提供报告结构化字段？如 PET-CT 或超声影像？',
    time: '1 天前',
    likes: 5,
  },
]

function toggleSet(setter: Dispatch<SetStateAction<Set<string>>>, id: string) {
  setter((current) => {
    const next = new Set(current)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    return next
  })
}

export default function DemandDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const demand = useMemo(() => {
    const allPosts = [...loadPublishedPosts(), ...initialDemandPosts]
    return allPosts.find((item) => item.id === id) ?? allPosts[0]
  }, [id])
  const { user } = useApp()
  const [showContact, setShowContact] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set())
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())
  const [replyTo, setReplyTo] = useState<{ name: string; text: string } | null>(null)
  const [replyText, setReplyText] = useState('')
  const [composerFocused, setComposerFocused] = useState(false)
  const [toast, setToast] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const liked = likedPosts.has(demand.id)
  const bookmarked = bookmarkedPosts.has(demand.id)
  const composing = composerFocused || replyTo !== null

  const flashToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 1800)
  }

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/demands')
  }

  const startReply = (comment: { name: string; text: string }) => {
    setReplyTo(comment)
  }

  const cancelCompose = () => {
    setReplyTo(null)
    setReplyText('')
    setComposerFocused(false)
  }

  const sendReply = () => {
    if (!replyText.trim()) return
    const isReply = replyTo !== null
    setReplyTo(null)
    setReplyText('')
    setComposerFocused(false)
    flashToast(isReply ? '回复已发送' : '评论已发布')
  }

  const handleComposeBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget
    if (next instanceof Node && event.currentTarget.contains(next)) return
    // 点击输入区外部：回复态整体取消，普通态仅收起面板，已输入内容保留
    if (replyTo) {
      setReplyTo(null)
      setReplyText('')
    }
    setComposerFocused(false)
  }

  useEffect(() => {
    if (replyTo) inputRef.current?.focus()
  }, [replyTo])

  return (
    <div className="demand-detail-page">
      <button className="demand-detail-back" type="button" onClick={goBack}>
        <ChevronLeft size={20} />
        返回
      </button>

      <section className="demand-detail-page-shell">
        <div className="demand-detail-main-poster">
          <div className="demand-detail-brand">
            <img src="/images/logo-final.png" alt="" />
            <span>格物 · 科学语料共建共享平台</span>
          </div>
          <span className="demand-detail-page-count">1/4</span>
          <button className="demand-detail-slide-control is-left" type="button" aria-label="上一张">
            <ChevronLeft size={22} />
          </button>
          <DemandPoster demand={{ ...demand, image: undefined }} />
          <button className="demand-detail-slide-control is-right" type="button" aria-label="下一张">
            <ChevronRight size={22} />
          </button>
          <div className="demand-detail-poster-foot">
            <div className="demand-carousel-dots" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
        </div>

        <aside className="demand-detail-info-panel">
          <header className="demand-detail-author-row">
            <div className="demand-avatar user"><span>{demand.author.slice(0, 1)}</span></div>
            <div className="demand-author-copy">
              <h1>{demand.contact.name}</h1>
              <p>{demand.bio}</p>
            </div>
            <div className="demand-author-actions">
              <button className={isFollowing ? 'is-followed' : ''} type="button" onClick={() => setIsFollowing((value) => !value)}>
                {isFollowing ? '已关注' : '关注'}
              </button>
              <button type="button" onClick={() => setShowContact(true)}>
                <Contact size={17} />
                联系方式
              </button>
              <button className="demand-author-share" type="button" aria-label="转发帖子" onClick={() => { navigator.clipboard?.writeText(window.location.href); flashToast('已复制链接 可以转发') }}>
                <Share2 size={18} />
              </button>
            </div>
          </header>

          <div className="demand-detail-content-card">
            <p className="demand-detail-meta">应用领域：{demand.field}</p>
            <h2>{demand.corpusName}</h2>
            <div className="demand-detail-tags">{demand.tags.map((tag) => <small key={tag}>{tag}</small>)}</div>
            <p>{demand.content}</p>
          </div>

          <section className="demand-comments compact">
            <h3>评论（{demand.comments + 1}）</h3>
            {comments.map((comment) => {
              const commentLiked = likedComments.has(comment.id)
              return (
                <article className={comment.reply ? 'is-reply' : ''} key={comment.id}>
                  <div className="demand-avatar small"><span>{comment.avatar}</span></div>
                  <div>
                    <p onClick={() => startReply(comment)} onMouseDown={(event) => event.preventDefault()}>
                      <strong>{comment.name}</strong>
                      {comment.reply && <em>作者</em>}
                      {comment.text}
                    </p>
                    <footer>
                      <span>{comment.time}</span>
                      <button className={commentLiked ? 'is-active' : ''} type="button" onClick={() => toggleSet(setLikedComments, comment.id)}>
                        <Heart size={14} />
                        {comment.likes + (commentLiked ? 1 : 0)}
                      </button>
                      <button type="button" onClick={() => startReply(comment)} onMouseDown={(event) => event.preventDefault()}>回复</button>
                    </footer>
                  </div>
                </article>
              )
            })}
          </section>

          <footer className={`demand-detail-bottom-bar${composing ? ' is-composing' : ''}`}>
            {replyTo && (
              <div className="demand-reply-quote">
                <p>回复 {replyTo.name}</p>
                <span>{replyTo.text}</span>
              </div>
            )}
            <div className={`demand-compose${composing ? ' is-expanded' : ''}`} onBlur={handleComposeBlur}>
              <span className="demand-avatar small"><span>{user?.name.slice(0, 1) ?? '我'}</span></span>
              <textarea
                ref={inputRef}
                rows={composing ? 3 : 1}
                value={replyText}
                maxLength={1000}
                onChange={(event) => setReplyText(event.target.value)}
                onFocus={() => setComposerFocused(true)}
                placeholder={replyTo ? '' : '说点什么...'}
              />
              {composing && (
                <div className="demand-compose-actions">
                  <div className="demand-reply-actions">
                    <button type="button" onClick={cancelCompose}>取消</button>
                    <button type="button" onClick={sendReply}>发送</button>
                  </div>
                </div>
              )}
            </div>
            {!composing && (
              <div className="demand-detail-social-actions">
                <button className={liked ? 'is-active' : ''} type="button" onClick={() => toggleSet(setLikedPosts, demand.id)} aria-label="点赞">
                  <Heart size={19} />
                  {demand.likes + (liked ? 1 : 0)}
                </button>
                <button className={bookmarked ? 'is-active' : ''} type="button" onClick={() => toggleSet(setBookmarkedPosts, demand.id)} aria-label="收藏">
                  <Star size={19} />
                  {demand.bookmarks + (bookmarked ? 1 : 0)}
                </button>
                <button type="button" aria-label="评论" onClick={() => { setComposerFocused(true); inputRef.current?.focus() }}>
                  <MessageCircle size={19} />
                  {demand.comments + 1}
                </button>
              </div>
            )}
          </footer>

          {showContact && (
            <div className="demand-contact-popover">
              <strong>联系方式</strong>
              <button className="demand-contact-close" type="button" aria-label="关闭联系方式" onClick={() => setShowContact(false)}><X size={15} /></button>
              <p>联系人：{demand.contact.name}</p>
              <p>单位：{demand.contact.unit}</p>
              <p>邮箱：{demand.contact.email}</p>
              <button type="button" onClick={() => { navigator.clipboard?.writeText(`${demand.contact.name} ${demand.contact.email}`); flashToast('联系方式已复制') }}>
                <Copy size={15} />
                复制联系方式
              </button>
            </div>
          )}
        </aside>
      </section>

      {toast && <div className="demand-toast">{toast}</div>}
    </div>
  )
}
