import {
  Bookmark,
  CloudUpload,
  Compass,
  Database,
  Edit3,
  Heart,
  HeartHandshake,
  MessageCircle,
  Search,
  UploadCloud,
  UsersRound,
  Wrench,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { useApp } from '../context/app-context'
import CorpusCommunity from '../components/CorpusCommunity'
import SubjectShowcase from '../components/SubjectShowcase'
import QualityCorpusDiscovery from '../components/QualityCorpusDiscovery'

const metrics = [
  { value: '92亿条', label: '语料条数' },
  { value: '900个', label: '语料库' },
  { value: '38PB', label: '语料规模' },
  { value: '400万', label: '服务用户' },
]

const evolutionItems = [
  { key: 'data', mark: '数', title: '数据', detail: '高质量科学语料' },
  { key: 'tools', mark: '器', title: '工具', detail: '智能化生产工具链' },
  { key: 'talent', mark: '人', title: '人才', detail: '多学科专业力量' },
  { key: 'model', mark: '智', title: '模型', detail: '智能模型' },
]

type PlatformCapabilityKey = 'search' | 'discovery' | 'tools' | 'upload' | 'demand'

const platformCapabilities: Array<{
  key: PlatformCapabilityKey
  title: string
  description: string
  icon: typeof Database
}> = [
  {
    key: 'search',
    title: '语料检索',
    description: '精准发现科学语料',
    icon: Database,
  },
  {
    key: 'discovery',
    title: '语料发现',
    description: '最新优质成果内容',
    icon: Compass,
  },
  {
    key: 'upload',
    title: '语料上传',
    description: '开放汇交·持续共建',
    icon: CloudUpload,
  },
  {
    key: 'demand',
    title: '需求广场',
    description: '需求-语料相匹配',
    icon: HeartHandshake,
  },
  {
    key: 'tools',
    title: '工具市场',
    description: '专业加工工具',
    icon: Wrench,
  },
]

const demandCards = [
  {
    title: '分子-工艺-性能构效关系预测与逆向设计',
    meta: '化学化工 · 基地材料',
    tags: ['科学数据', '知识语料'],
    summary: '需要分子的组成、理化性质与合成工艺数据，包含 CAS 号、分子结构、SMILES、InChI 及工艺参数。',
    likes: 24,
    comments: 8,
    bookmarks: 5,
  },
  {
    title: '组合数学、数论的形式化知识',
    meta: '基地数学 · 数学物理',
    tags: ['数学定理证明', '知识语料'],
    summary: '包含问题自然语言描述、Lean 形式化描述、Lean header 与证明 COT 等。',
    likes: 18,
    comments: 6,
    bookmarks: 4,
  },
  {
    title: 'CMIP6 全球气候模型数据',
    meta: '地球 · 科学数据库',
    tags: ['CMIP6', 'NetCDF'],
    summary: '全量气候模型输出数据，覆盖大气、海洋与陆地变量，遵循 CF 元数据规范。',
    likes: 36,
    comments: 12,
    bookmarks: 9,
  },
]

function CapabilityMotion({ type }: { type: PlatformCapabilityKey }) {
  if (type === 'search') {
    return (
      <div className="capability-motion motion-search" aria-hidden="true">
        <Database size={76} />
        <span className="database-node node-one" />
        <span className="database-node node-two" />
        <span className="database-node node-three" />
        <span className="scan-line" />
      </div>
    )
  }

  if (type === 'upload') {
    return (
      <div className="capability-motion motion-upload" aria-hidden="true">
        <CloudUpload size={78} />
        <span className="upload-block block-one" />
        <span className="upload-block block-two" />
        <span className="upload-arrow" />
      </div>
    )
  }

  if (type === 'demand') {
    return (
      <div className="capability-motion motion-demand" aria-hidden="true">
        <HeartHandshake size={80} />
        <span className="orbit-path" />
        <span className="orbit-dot" />
      </div>
    )
  }

  const Icon = platformCapabilities.find((item) => item.key === type)?.icon ?? Compass
  return (
    <div className={`capability-motion motion-${type}`} aria-hidden="true">
      <Icon size={80} />
      <span className="pulse-ring ring-one" />
      <span className="pulse-ring ring-two" />
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { user, openAuth } = useApp()

  const handleUpload = () => {
    if (user) navigate('/upload')
    else {
      navigate('/upload')
      openAuth()
    }
  }

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-stars" aria-hidden="true" />
        <div className="cosmic-arc cosmic-arc-one" aria-hidden="true" />
        <div className="cosmic-arc cosmic-arc-two" aria-hidden="true" />
        <div className="hero-grid hero-grid-redesign">
          <div className="hero-copy">
            <h1><span>高质量科学语料</span><br /><em>共建共享平台</em></h1>
            <p>汇聚高校、企业、新型研发机构与个人建设成果，连接语料贡献者与使用者，服务科研创新、教育教学与模型训练</p>
            <div className="hero-actions">
              <button className="primary-action hero-button" type="button" onClick={handleUpload}>
                <UploadCloud size={18} />语料上传
              </button>
              <Link className="secondary-action" to="/search/results"><Search size={18} />浏览语料</Link>
            </div>
            <div className="hero-metrics">
              {metrics.map((item) => (
                <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>
              ))}
            </div>
            <small className="update-note">数据截至2026年7月10日，每月10日更新</small>
          </div>

          <section className="hero-evolution-panel" aria-labelledby="evolution-title">
            <div className="hero-evolution-heading">
              <h2 id="evolution-title">“数据-工具-人才-模型”共进化</h2>
            </div>

            <div className="compact-evolution" aria-label="数据、工具、人才、模型共进化循环">
              <div className="compact-track track-outer" aria-hidden="true" />
              <div className="compact-track track-inner" aria-hidden="true" />
              <div className="orbiting-nodes">
                {evolutionItems.map((item) => (
                  <div key={item.key} className={`compact-node compact-${item.key}`}>
                    <span className="compact-node-content">
                      <span className="node-disc">{item.mark}</span>
                      <span className="node-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="compact-center"><span>科学语料</span><strong>共进化</strong></div>
            </div>

            <div className="evolution-statements">
              <div><b>语料服务模型</b><span>支撑训练、评测与知识增强</span></div>
              <div><b>模型反哺语料</b><span>辅助生成、标注与质量治理</span></div>
              <div><b>模型服务人才</b><span>赋能科研创新与教育教学</span></div>
            </div>
          </section>
        </div>
      </section>

      <section className="demand-plaza-section" aria-labelledby="demand-plaza-title">
        <div className="demand-plaza-inner">
          <div className="demand-plaza-copy">
            <span>需求广场</span>
            <h2 id="demand-plaza-title">让每一个语料需求<br />被看见、被响应</h2>
            <p>发布语料库建设需求，通过回复、点赞与评论，让好想法汇聚成可落地的共建项目。</p>
            <div className="demand-plaza-actions" aria-label="需求广场协作流程">
              <div><Edit3 size={24} /><strong>发布需求</strong></div>
              <i aria-hidden="true" />
              <div><UsersRound size={24} /><strong>寻找伙伴</strong></div>
              <i aria-hidden="true" />
              <div><HeartHandshake size={24} /><strong>协作共建</strong></div>
            </div>
          </div>

          <div className="demand-card-stage" aria-label="需求广场示例需求">
            <span className="demand-orbit orbit-one" />
            <span className="demand-orbit orbit-two" />
            <span className="demand-orbit-dot dot-one" />
            <span className="demand-orbit-dot dot-two" />
            <span className="demand-orbit-dot dot-three" />
            {demandCards.map((item, index) => (
              <article className={`demand-preview-card card-${index + 1}`} key={item.title}>
                <div className="demand-avatar" aria-hidden="true"><span /></div>
                <div className="demand-preview-content">
                  <h3>{item.title}</h3>
                  <p className="demand-preview-meta">{item.meta}</p>
                  <div className="demand-preview-tags">
                    {item.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <p>{item.summary}</p>
                  <footer>
                    <span><Heart size={16} />{item.likes}</span>
                    <span><MessageCircle size={16} />{item.comments}</span>
                    <span><Bookmark size={16} />{item.bookmarks}</span>
                  </footer>
                </div>
              </article>
            ))}
            <Link className="demand-plaza-link" to="/search">
              进入需求广场 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="platform-capabilities-section">
        <div className="platform-capabilities-container">
          <header className="platform-capabilities-heading">
            <h2>连接科学语料的每一步</h2>
          </header>

          <div className="platform-flow-card-row" aria-label="平台能力列表">
            {platformCapabilities.map((capability) => (
              <article className={`platform-flow-card card-${capability.key}`} key={capability.key}>
                <CapabilityMotion type={capability.key} />
                <h3>{capability.title}</h3>
                <p>{capability.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SubjectShowcase />
      <CorpusCommunity />
      <QualityCorpusDiscovery />
    </div>
  )
}
