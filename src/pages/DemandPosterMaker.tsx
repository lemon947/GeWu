import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

type TextPoster = {
  id: string
  template: number
  title: string
  subtitle: string
}

const posterThemes = [
  'linear-gradient(135deg, #dfe9ff, #cfd9ff 55%, #dff0ff)',
  'linear-gradient(135deg, #e0f4ee, #cfeee9 55%, #e7f6ff)',
  'linear-gradient(135deg, #e8e4fb, #d4cdf7 55%, #dff0ff)',
  'linear-gradient(135deg, #fdeede, #fbdcc0 55%, #fff2e3)',
  'linear-gradient(135deg, #f3e3f8, #e6cef2 55%, #fff0f6)',
  'linear-gradient(135deg, #fbe3e3, #f7cdd4 55%, #ffefe9)',
  'linear-gradient(135deg, #d9ecfb, #bfe0fa 55%, #e7f4ff)',
  'linear-gradient(135deg, #ddf3e2, #c3ead0 55%, #eefcf1)',
  'linear-gradient(135deg, #fdf3d8, #fbe9b8 55%, #fffbf0)',
  'linear-gradient(135deg, #efd9f5, #debcec 55%, #fdeef9)',
  'linear-gradient(135deg, #f2e0e8, #ecc7d8 55%, #fff1f6)',
  'linear-gradient(135deg, #d6f0f7, #b9e3f0 55%, #eafaff)',
  'linear-gradient(135deg, #e2f0d9, #cde4bd 55%, #f4fcee)',
  'linear-gradient(135deg, #fce9d9, #f8d5ba 55%, #fff6ec)',
  'linear-gradient(135deg, #e6def8, #d0c4f2 55%, #f2ecfd)',
]

export default function DemandPosterMaker() {
  const navigate = useNavigate()
  const [posters, setPosters] = useState<TextPoster[]>([
    { id: 'poster-1', template: 0, title: '请邀请感兴趣的朋友一起共建语料库', subtitle: '简单介绍你的设想' },
  ])
  const [activeIndex, setActiveIndex] = useState(0)
  const [toast, setToast] = useState('')

  const flashToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 1800)
  }

  const updatePoster = (index: number, patch: Partial<TextPoster>) => {
    setPosters((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const addBlank = () => {
    setPosters((current) => [...current, { id: `poster-${current.length + 1}`, template: 0, title: '', subtitle: '' }])
    setActiveIndex(posters.length)
  }

  const generate = () => {
    flashToast('文字海报已生成')
    window.setTimeout(() => navigate('/demands/new/edit'), 600)
  }

  return (
    <div className="demand-create-page demand-poster-maker-page">
      <section className="demand-create-hero">
        <h1>生成需求图片</h1>
        <p>选择适合的图片制作方式，完成需求发布前的视觉内容</p>
      </section>

      <section className="demand-create-stage poster-maker-stage">
        <div className="poster-maker-layout">
          <div className="poster-maker-preview-col">
            <div className="poster-maker-stack">
              {activeIndex > 0 && (
                <button className="poster-maker-switch is-left" type="button" aria-label="上一张" onClick={() => setActiveIndex((index) => index - 1)}>
                  <ChevronLeft size={20} />
                </button>
              )}
              {activeIndex < posters.length - 1 && (
                <button className="poster-maker-switch is-right" type="button" aria-label="下一张" onClick={() => setActiveIndex((index) => index + 1)}>
                  <ChevronRight size={20} />
                </button>
              )}
              <div className="poster-maker-track" style={{ transform: `translateX(${-activeIndex * 100}%)` }}>
                {posters.map((item, index) => (
                  <div className={`poster-maker-slide${index === activeIndex ? ' is-active' : ''}`} key={item.id}>
                    <div className="poster-preview" style={{ background: posterThemes[item.template] }}>
                      <span className="poster-preview-field">格物 · 语料共建</span>
                      <textarea
                        className="poster-preview-title"
                        rows={3}
                        maxLength={40}
                        placeholder="请写一句吸引伙伴的标题"
                        value={item.title}
                        onChange={(event) => updatePoster(index, { title: event.target.value })}
                      />
                      <textarea
                        className="poster-preview-sub"
                        rows={1}
                        maxLength={60}
                        placeholder="简单介绍你的设想"
                        value={item.subtitle}
                        onChange={(event) => updatePoster(index, { subtitle: event.target.value })}
                      />
                      <div className="poster-preview-foot">
                        <span>文字需求</span>
                        <div>
                          <i />
                          <i />
                          <i />
                          <i />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="poster-maker-new" type="button" onClick={addBlank}>
              <span><Plus size={20} /></span>
              再写一张
            </button>
          </div>

          <div className="poster-maker-side">
            <h3>文字海报模板</h3>
            <div className="poster-template-grid">
              {posterThemes.map((theme, index) => (
                <button
                  className={index === posters[activeIndex].template ? 'is-active' : ''}
                  key={index}
                  style={{ background: theme }}
                  type="button"
                  aria-label={`模板 ${index + 1}`}
                  onClick={() => updatePoster(activeIndex, { template: index })}
                />
              ))}
            </div>
            <div className="poster-maker-actions">
              <button className="poster-maker-back" type="button" onClick={() => navigate('/demands/new')}>返回上一步</button>
              <button className="poster-maker-submit" type="button" onClick={generate}>生成文字海报</button>
            </div>
          </div>
        </div>
      </section>

      {toast && <div className="demand-toast">{toast}</div>}
    </div>
  )
}
