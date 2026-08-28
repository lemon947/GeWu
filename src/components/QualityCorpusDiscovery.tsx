import { useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, Download, Eye, Star } from 'lucide-react'
import { Link } from 'react-router'

type SortKey = 'latest' | 'views' | 'usage'

type CorpusItem = {
  id: string
  title: string
  organization: string
  domain: string
  type: string
  openness: string
  summary: string
  publishedAt: string
  views: number
  favorites: number
  downloads: number
}

const tabDefinitions: Array<{ key: SortKey; label: string; description: string }> = [
  { key: 'latest', label: '最新数据', description: '按语料审核通过并正式发布的时间排列' },
  { key: 'views', label: '最多浏览', description: '按近30日有效浏览次数排序，同一用户12小时内重复访问计1次' },
  { key: 'usage', label: '最高使用', description: '按平台记录的有效下载次数排序' },
]

const corpusItems: CorpusItem[] = [
  {
    id: 'ds-01', title: '聚合物太阳能电池知识语料', organization: '北京大学图书馆', domain: '化学', type: '知识语料', openness: '开放共享',
    summary: '汇集聚合物太阳能电池材料、器件性能及关键光电指标，服务材料筛选与机理分析。',
    publishedAt: '2026-06-26', views: 467, favorites: 68, downloads: 10,
  },
  {
    id: 'ds-02', title: '钠离子电池正极材料知识语料', organization: '北京大学图书馆', domain: '化学', type: '知识语料', openness: '开放共享',
    summary: '结构化整理钠离子层状正极材料合成参数与电化学性能指标。',
    publishedAt: '2026-06-26', views: 206, favorites: 35, downloads: 2,
  },
  {
    id: 'ds-03', title: '超级电容器知识语料', organization: '北京大学图书馆', domain: '化学', type: '知识语料', openness: '开放共享',
    summary: '覆盖电极材料、制备工艺、改性方法及电化学测试参数等科研数据。',
    publishedAt: '2026-06-26', views: 204, favorites: 41, downloads: 5,
  },
  {
    id: 'ds-04', title: '环境化学通识问答语料', organization: '北京大学图书馆', domain: '化学', type: '知识语料', openness: '开放共享',
    summary: '围绕大气、水体、土壤及污染控制构建规范、简明的环境化学问答。',
    publishedAt: '2026-06-26', views: 220, favorites: 53, downloads: 15,
  },
  {
    id: 'ds-05', title: '环境化学长思维链语料', organization: '北京大学图书馆', domain: '化学', type: '后训练语料', openness: '暂不开放',
    summary: '面向污染物行为分析、环境过程解释与风险判断构建专业推理过程。',
    publishedAt: '2026-06-26', views: 125, favorites: 22, downloads: 0,
  },
  {
    id: 'ds-06', title: '电池组装工艺知识语料', organization: '北京大学图书馆', domain: '化学', type: '知识语料', openness: '开放共享',
    summary: '整理测试体系、电极负载量、隔膜类型与电解液用量等组装工艺数据。',
    publishedAt: '2026-06-26', views: 59, favorites: 14, downloads: 0,
  },
  {
    id: 'ds-07', title: '海工装备物理气相沉积防护涂层专题语料', organization: '北京大学材料科学与工程学院', domain: '物理', type: '知识语料', openness: '依申请开放',
    summary: '提取物理气相沉积防护涂层工艺、成分、结构与性能关键参数，支持多维标注。',
    publishedAt: '2026-07-14', views: 63, favorites: 18, downloads: 0,
  },
  {
    id: 'ds-08', title: '中国临床执业医师资格考试知识语料', organization: '北京大学医学部', domain: '生物', type: '知识语料', openness: '定向开放',
    summary: '覆盖临床、中医、口腔和公共卫生领域的高质量医学考试题目与答案。',
    publishedAt: '2026-07-14', views: 247, favorites: 61, downloads: 3,
  },
  {
    id: 'ds-09', title: '中文医学知识问答语料', organization: '北京大学医学部', domain: '生物', type: '后训练语料', openness: '定向开放',
    summary: '基于中文医学论文构建问题、上下文与长答案组成的结构化问答对。',
    publishedAt: '2026-07-14', views: 497, favorites: 84, downloads: 1,
  },
  {
    id: 'ds-10', title: '代谢小分子化合物语料', organization: '北京大学生命科学学院', domain: '生物', type: '知识语料', openness: '定向开放',
    summary: '整合小分子结构、理化属性、质谱裂解特征及来源元数据。',
    publishedAt: '2026-06-26', views: 150, favorites: 37, downloads: 904,
  },
  {
    id: 'ds-13', title: '中国典型城市高分辨率三通道影像语料', organization: '北京大学地球与空间科学学院', domain: '地理', type: '基础语料', openness: '开放共享',
    summary: '提供典型城市核心城区亚米级影像块，支持高分辨率重建与视觉训练。',
    publishedAt: '2026-05-18', views: 312, favorites: 58, downloads: 45,
  },
  {
    id: 'ds-14', title: '中国灾情历史数据语料', organization: '北京大学地球与空间科学学院', domain: '地理', type: '基础语料', openness: '开放共享',
    summary: '融合近20年历史灾害事件资料，形成标准化灾害数值文本对。',
    publishedAt: '2026-04-30', views: 188, favorites: 46, downloads: 22,
  },
  {
    id: 'ds-15', title: '光伏用地遥感影像元数据语料', organization: '北京大学地球与空间科学学院', domain: '地理', type: '特征语料', openness: '定向开放',
    summary: '面向遥感影像理解与光伏目标识别整理多源影像及空间语义信息。',
    publishedAt: '2026-05-11', views: 96, favorites: 21, downloads: 8,
  },
  {
    id: 'ds-16', title: '物理化学论文多模态解构图语料', organization: '北京大学图书馆', domain: '化学', type: '特征语料', openness: '开放共享',
    summary: '对科研图片及其上下文进行结构化提取，实现规范的图文绑定。',
    publishedAt: '2026-03-22', views: 402, favorites: 73, downloads: 67,
  },
]

function sortCorpus(items: CorpusItem[], sortKey: SortKey) {
  const copied = [...items]
  if (sortKey === 'views') return copied.sort((a, b) => b.views - a.views)
  if (sortKey === 'usage') return copied.sort((a, b) => b.downloads - a.downloads)
  return copied.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export default function QualityCorpusDiscovery() {
  const [activeTab, setActiveTab] = useState<SortKey>('latest')
  const visibleCorpus = useMemo(() => sortCorpus(corpusItems, activeTab).slice(0, 6), [activeTab])

  return (
    <section className="quality-discovery-section" aria-labelledby="quality-discovery-title">
      <div className="quality-discovery-inner">
        <header className="quality-discovery-heading">
          <h2 id="quality-discovery-title">发现优质语料</h2>
        </header>

        <div className="discovery-toolbar">
          <div className="discovery-tabs" role="tablist" aria-label="优质语料排序方式">
            {tabDefinitions.map((tab) => (
              <button
                className={activeTab === tab.key ? 'is-active' : ''}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls="quality-corpus-panel"
                id={`quality-tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                key={tab.key}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Link className="discovery-more-link" to={`/search/results?sort=${activeTab}`}>
            查看更多 <ArrowRight size={15} />
          </Link>
        </div>

        <div
          className="quality-corpus-grid"
          id="quality-corpus-panel"
          role="tabpanel"
          aria-labelledby={`quality-tab-${activeTab}`}
        >
          {visibleCorpus.map((item) => (
            <Link className="quality-corpus-card" to={`/search/datasets/${item.id}`} key={item.id}>
              <div className="quality-card-visual" aria-hidden="true">
                <span className="card-status-overlay is-partial">部分公开</span>
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

              <div className="quality-card-meta-row">
                <div className="quality-card-tags">
                  <span className="domain-tag">{item.domain}</span>
                </div>
                <time dateTime={item.publishedAt}><CalendarDays size={13} />{item.publishedAt}</time>
              </div>

              <h3>{item.title}</h3>
              <p>{item.summary}</p>

              <footer>
                <span className="card-org-mark" aria-hidden="true">北</span>
                <strong className="card-organization-name">{item.organization}</strong>
                <span><Download size={15} />{item.downloads.toLocaleString()}</span>
                <span><Eye size={15} />{item.views.toLocaleString()}</span>
                <span><Star size={15} />{item.favorites.toLocaleString()}</span>
              </footer>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
