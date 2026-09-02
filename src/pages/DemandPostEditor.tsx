import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Check, CheckCircle2, Plus, Trash2, X } from 'lucide-react'
import type { DemandPost } from './DemandSquare'
import { loadDrafts, nowStamp, saveDrafts } from '../data/demand-drafts'
import { addPublishedPost } from '../data/demand-posts'

type CropRect = { x: number; y: number; w: number; h: number }
type Ratio = '1:1' | '4:5'

type EditorImage = {
  id: string
  kind: 'text' | 'upload'
  src?: string
  title?: string
  crop: CropRect
  ratio: Ratio
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const ratioHeight = (w: number, ratio: Ratio) => (ratio === '1:1' ? w : w * 1.25)

const textImageTheme = 'linear-gradient(135deg, #4faff2 0%, #1e63f2 52%, #0b3cc9 100%)'

export default function DemandPostEditor() {
  const navigate = useNavigate()
  const addImageRef = useRef<HTMLInputElement>(null)
  const cropStageRef = useRef<HTMLDivElement>(null)

  const [images, setImages] = useState<EditorImage[]>([
    { id: 'img-text-1', kind: 'text', title: '医学影像——文本多模态语料征集', crop: { x: 0, y: 0, w: 1, h: 1 }, ratio: '4:5' },
  ])
  const [field, setField] = useState('')
  const [corpusName, setCorpusName] = useState('')
  const [tags, setTags] = useState<string[]>(['医学影像', '多模态', '语料共建', '招募中'])
  const [tagInput, setTagInput] = useState('')
  const [content, setContent] = useState('医学影像——文本多模态语料征集\n面向科研团队征集高质量医学影像与临床文本配对数据，支持授权范围与使用条件说明。')
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [email, setEmail] = useState('')
  const [toast, setToast] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [crop, setCrop] = useState<CropRect>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 })
  const [ratio, setRatio] = useState<Ratio>('4:5')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [postedId, setPostedId] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const editingImage = images.find((item) => item.id === editingId) ?? null

  const flashToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 1800)
  }

  const removeImage = (id: string) => {
    setImages((current) => current.filter((item) => item.id !== id))
  }

  const addUploadedFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImages((current) => [...current, {
      id: `img-upload-${Date.now()}`,
      kind: 'upload',
      src: URL.createObjectURL(file),
      crop: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
      ratio: '4:5',
    }])
  }

  const pushTag = () => {
    const value = tagInput.trim()
    if (!value) return
    setTags((current) => (current.includes(value) ? current : [...current, value]))
    setTagInput('')
  }

  const openCrop = (image: EditorImage) => {
    setEditingId(image.id)
    setRatio(image.ratio)
    setCrop(image.crop)
  }

  const applyCrop = () => {
    if (!editingImage) return
    setImages((current) => current.map((item) => (item.id === editingImage.id ? { ...item, crop, ratio } : item)))
    setEditingId(null)
  }

  const applyRatio = (next: Ratio) => {
    setRatio(next)
    const w = 0.6
    const h = ratioHeight(w, next)
    setCrop({ x: (1 - w) / 2, y: (1 - h) / 2, w, h })
  }

  const startCropDrag = (mode: 'move' | 'resize') => (event: React.PointerEvent) => {
    event.preventDefault()
    const stage = cropStageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const startX = event.clientX
    const startY = event.clientY
    const startCrop = { ...crop }
    const onMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / rect.width
      const dy = (moveEvent.clientY - startY) / rect.height
      if (mode === 'move') {
        setCrop({
          ...startCrop,
          x: clamp(startCrop.x + dx, 0, 1 - startCrop.w),
          y: clamp(startCrop.y + dy, 0, 1 - startCrop.h),
        })
        return
      }
      const centerX = startCrop.x + startCrop.w / 2
      const centerY = startCrop.y + startCrop.h / 2
      let w = clamp(startCrop.w + dx * 2, 0.2, 1)
      let h = ratioHeight(w, ratio)
      if (h > 1) {
        h = 1
        w = ratio === '1:1' ? 1 : 0.8
      }
      setCrop({
        x: clamp(centerX - w / 2, 0, 1 - w),
        y: clamp(centerY - h / 2, 0, 1 - h),
        w,
        h,
      })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const makePost = (): DemandPost | null => {
    if (!field.trim() || !corpusName.trim()) {
      flashToast('请填写应用领域与语料名称')
      return null
    }
    return {
      id: `demand-${Date.now()}`,
      title: corpusName.trim(),
      field: field.trim(),
      corpusName: corpusName.trim(),
      author: name.slice(0, 1) || '我',
      organization: unit.trim() || '未填写单位',
      bio: '',
      status: '招募中',
      tags,
      content: content.trim(),
      likes: 0,
      bookmarks: 0,
      comments: 0,
      template: 'blue',
      contact: { name: name.trim(), unit: unit.trim(), email: email.trim() },
    }
  }

  const saveDraft = () => {
    const post = makePost()
    if (!post) return
    saveDrafts([{ ...post, savedAt: nowStamp() }, ...loadDrafts()])
    flashToast('草稿已保存')
  }

  const publish = () => {
    const post = makePost()
    if (!post) return
    addPublishedPost(post)
    setPostedId(post.id)
    setShowSuccess(true)
  }

  return (
    <div className="demand-create-page demand-editor-page">
      <section className="demand-create-hero">
        <h1>编辑发布内容</h1>
        <p>发布前统一检查图片、标题与正文</p>
      </section>

      <section className="demand-create-stage editor-stage">
        <h2 className="editor-section-title">图片内容</h2>
        <div className="editor-image-row">
          {images.map((image) => (
            <button className="editor-image-card" type="button" key={image.id} onClick={() => openCrop(image)}>
              <button className="editor-image-delete" type="button" aria-label="删除图片" onClick={(event) => { event.stopPropagation(); removeImage(image.id) }}>
                <Trash2 size={13} />
              </button>
              <span className="editor-image-type">{image.kind === 'text' ? '文字图片' : '上传图片'}</span>
              {image.kind === 'text' ? (
                <div className="editor-text-thumb" style={{ background: textImageTheme }}>{image.title}</div>
              ) : (
                <div className="editor-img-thumb">
                  <img
                    src={image.src}
                    alt=""
                    style={{
                      width: `${100 / image.crop.w}%`,
                      height: `${100 / image.crop.h}%`,
                      left: `${(-image.crop.x / image.crop.w) * 100}%`,
                      top: `${(-image.crop.y / image.crop.h) * 100}%`,
                    }}
                  />
                </div>
              )}
            </button>
          ))}
          <button className="editor-image-add" type="button" onClick={() => addImageRef.current?.click()}>
            <Plus size={22} />
            <span>添加图片</span>
          </button>
          <input ref={addImageRef} type="file" accept="image/*" hidden onChange={addUploadedFile} />
        </div>

        <div className="editor-field-grid">
          <label className="editor-field">
            <span>应用领域</span>
            <input value={field} onChange={(event) => setField(event.target.value)} placeholder="请输入应用领域" />
          </label>
          <label className="editor-field">
            <span>语料名称</span>
            <input value={corpusName} onChange={(event) => setCorpusName(event.target.value)} placeholder="请输入语料名称" />
          </label>
        </div>

        <div className="editor-field">
          <span>标签</span>
          <div className="editor-tags-box">
            <input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); pushTag() } }}
              placeholder="输入标签，按回车添加"
            />
            {tags.length > 0 && (
              <div className="editor-tag-chips">
                {tags.map((tag) => (
                  <span key={tag}>
                    {tag}
                    <button type="button" aria-label={`删除标签 ${tag}`} onClick={() => setTags((current) => current.filter((item) => item !== tag))}><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="editor-field">
          <span>帖子内容</span>
          <div className="editor-content-box">
            <textarea value={content} maxLength={1000} onChange={(event) => setContent(event.target.value)} placeholder="描述语料范围、样例数据、服务场景或协作方式" />
            <small>{content.length} / 1000</small>
          </div>
        </div>

        <h2 className="editor-section-title editor-section-contact">联系信息</h2>
        <div className="editor-field-grid">
          <label className="editor-field">
            <span>姓名</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="请输入姓名" />
          </label>
          <label className="editor-field">
            <span>邮箱</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="请输入邮箱" />
          </label>
        </div>
        <label className="editor-field">
          <span>所在单位</span>
          <input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="请输入所在单位" />
        </label>

        <footer className="editor-bar">
          <button className="editor-bar-plain" type="button" onClick={() => setShowCancelConfirm(true)}>取消</button>
          <button className="editor-bar-plain" type="button" onClick={saveDraft}>保存草稿</button>
          <button className="editor-bar-primary" type="button" onClick={publish}>发布</button>
        </footer>
      </section>

      {editingImage && (
        <div className="demand-modal-backdrop" role="presentation" onMouseDown={() => setEditingId(null)}>
          <section className="demand-crop-modal" role="dialog" aria-modal="true" aria-labelledby="demand-crop-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="demand-modal-close" type="button" aria-label="关闭裁剪" onClick={() => setEditingId(null)}><X /></button>
            <h2 id="demand-crop-title">裁剪图片</h2>
            <div className="crop-stage" ref={cropStageRef}>
              {editingImage.kind === 'text' ? (
                <div className="crop-preview-text" style={{ background: textImageTheme }}>{editingImage.title}</div>
              ) : (
                <img src={editingImage.src} alt="" />
              )}
              <div
                className="crop-box"
                style={{
                  left: `${crop.x * 100}%`,
                  top: `${crop.y * 100}%`,
                  width: `${crop.w * 100}%`,
                  height: `${crop.h * 100}%`,
                }}
                onPointerDown={startCropDrag('move')}
              >
                <span className="crop-handle is-nw" onPointerDown={(event) => { event.stopPropagation(); startCropDrag('resize')(event) }} />
                <span className="crop-handle is-ne" onPointerDown={(event) => { event.stopPropagation(); startCropDrag('resize')(event) }} />
                <span className="crop-handle is-sw" onPointerDown={(event) => { event.stopPropagation(); startCropDrag('resize')(event) }} />
                <span className="crop-handle is-se" onPointerDown={(event) => { event.stopPropagation(); startCropDrag('resize')(event) }} />
              </div>
            </div>
            <footer className="crop-footer">
              <div className="crop-ratios">
                <button className={ratio === '1:1' ? 'is-active' : ''} type="button" onClick={() => applyRatio('1:1')}>1 : 1</button>
                <button className={ratio === '4:5' ? 'is-active' : ''} type="button" onClick={() => applyRatio('4:5')}>4 : 5</button>
              </div>
              <div className="crop-actions">
                <button className="crop-cancel" type="button" onClick={() => setEditingId(null)}>取消</button>
                <button className="crop-confirm" type="button" onClick={applyCrop}>确认裁剪</button>
              </div>
            </footer>
          </section>
        </div>
      )}

      {showCancelConfirm && (
        <div className="demand-modal-backdrop" role="presentation" onMouseDown={() => setShowCancelConfirm(false)}>
          <section className="demand-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="demand-cancel-title" onMouseDown={(event) => event.stopPropagation()}>
            <span className="demand-confirm-mark"><CheckCircle2 size={30} /></span>
            <h2 id="demand-cancel-title">确定要取消发布吗？</h2>
            <p>取消后，当前填写的内容将不会保存。<br />你可以选择继续编辑，或确认离开此页面。</p>
            <button className="demand-confirm-primary" type="button" onClick={() => navigate('/demands/new')}>确认取消</button>
            <button className="demand-confirm-link" type="button" onClick={() => setShowCancelConfirm(false)}>继续编辑</button>
          </section>
        </div>
      )}

      {showSuccess && (
        <div className="demand-modal-backdrop" role="presentation" onMouseDown={() => setShowSuccess(false)}>
          <section className="demand-success-modal" role="dialog" aria-modal="true" aria-labelledby="demand-success-title" onMouseDown={(event) => event.stopPropagation()}>
            <span className="demand-success-mark" aria-hidden="true"><Check size={30} /></span>
            <h2 id="demand-success-title">发布成功</h2>
            <p>你的语料建设需求已发布到需求广场</p>
            <button className="demand-success-primary" type="button" onClick={() => navigate(`/demands/${postedId}`)}>查看需求</button>
            <button className="demand-success-link" type="button" onClick={() => navigate('/demands/new')}>继续发布</button>
          </section>
        </div>
      )}

      {toast && <div className="demand-toast">{toast}</div>}
    </div>
  )
}
