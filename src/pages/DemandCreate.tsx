import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Check, ClipboardList, FileText, Image as ImageIcon, Trash2, X } from 'lucide-react'
import { DemandPoster } from './DemandSquare'
import { loadDrafts, removeDraft, type DemandDraft } from '../data/demand-drafts'

export default function DemandCreate() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [drafts, setDrafts] = useState<DemandDraft[]>(loadDrafts)
  const [showDrafts, setShowDrafts] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DemandDraft | null>(null)

  const confirmDelete = () => {
    if (!deleteTarget) return
    removeDraft(deleteTarget.id)
    refreshDrafts()
    setDeleteTarget(null)
  }

  const refreshDrafts = () => setDrafts(loadDrafts())

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return
    // 图片已选定，确认后进入帖子整体修改页（占位路由）
    navigate('/demands/new/edit')
  }

  return (
    <div className="demand-create-page">
      <section className="demand-create-hero">
        <h1>生成需求图片</h1>
        <p>选择适合的图片制作方式，完成需求发布前的视觉内容</p>
      </section>

      <section className="demand-create-stage">
        <header className="demand-create-stage-head">
          <button className="demand-create-drafts-btn" type="button" onClick={() => setShowDrafts(true)}>
            <ClipboardList size={16} />
            草稿箱({drafts.length})
          </button>
        </header>
        <div className="demand-create-upload-zone">
          <span className="demand-create-image-slot"><ImageIcon size={42} /></span>
          <p>上传图片，或生成文字图片</p>
          <div className="demand-create-actions">
            <button className="demand-create-upload" type="button" onClick={() => fileRef.current?.click()}>上传图片</button>
            <button className="demand-create-generate" type="button" onClick={() => navigate('/demands/new/poster')}>
              <FileText size={16} />
              生成文字图片
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
        </div>
        <footer className="demand-create-tips">
          <article>
            <h3>推荐比例</h3>
            <p>纵版 4:5，更适合需求广场展示</p>
          </article>
          <article>
            <h3>图片尺寸</h3>
            <p>建议不低于 1080 × 1350 px</p>
          </article>
          <article>
            <h3>内容规范</h3>
            <p>请勿上传无关、水印或侵权图片</p>
          </article>
        </footer>
      </section>

      {showDrafts && (
        <div className="demand-modal-backdrop" role="presentation" onMouseDown={() => setShowDrafts(false)}>
          <section className="demand-draft-modal demand-create-draft-modal" role="dialog" aria-modal="true" aria-labelledby="demand-create-drafts-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="demand-modal-close" type="button" aria-label="关闭草稿箱" onClick={() => setShowDrafts(false)}><X /></button>
            <h2 id="demand-create-drafts-title">草稿箱</h2>
            {drafts.length ? drafts.map((draft) => (
              <article key={draft.id}>
                <DemandPoster demand={draft} compact />
                <div className="demand-create-draft-copy">
                  <h3>{draft.corpusName}</h3>
                  <p>保存于 {draft.savedAt}</p>
                </div>
                <div className="demand-create-draft-actions">
                  <button type="button" onClick={() => navigate('/demands/new/edit')}>继续编辑</button>
                  <button type="button" onClick={() => setDeleteTarget(draft)}><Trash2 size={15} />删除</button>
                </div>
              </article>
            )) : <p className="demand-create-draft-empty">暂无草稿</p>}
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="demand-modal-backdrop" role="presentation" onMouseDown={() => setDeleteTarget(null)}>
          <section className="demand-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="demand-confirm-title" onMouseDown={(event) => event.stopPropagation()}>
            <span className="demand-confirm-mark"><Check size={30} /></span>
            <h2 id="demand-confirm-title">确定要删除草稿吗？</h2>
            <p>删除后，草稿内容将不会保存。</p>
            <button className="demand-confirm-primary" type="button" onClick={confirmDelete}>确认删除</button>
          </section>
        </div>
      )}
    </div>
  )
}
