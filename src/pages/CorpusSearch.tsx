import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Minus,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import CorpusFilterSidebar, { type CorpusFilterState, type ExternalFilterTag } from '../components/CorpusFilterSidebar'

type SearchMode = 'simple' | 'advanced'
type SearchField = 'title' | 'keyword' | 'subject' | 'organization' | 'author'
type LogicOperator = 'and' | 'or' | 'not'
type SortKey = 'published_desc' | 'published_asc' | 'views_desc' | 'favorites_desc' | 'usage_desc'
type ResultStatusTab = 'all' | 'uploaded' | 'pending'

type SearchCondition = {
  id: number
  logic: LogicOperator
  field: SearchField
  value: string
}

type AppliedSearch = {
  mode: SearchMode
  simpleField: SearchField
  simpleKeyword: string
  conditions: SearchCondition[]
  startDate: string
  endDate: string
}

export type CorpusRecord = {
  id: string
  title: string
  organization: string
  subject: string
  corpusType: string
  openness: string
  summary: string
  publishedAt: string
  views: number
  favorites: number
  usage: number
  authors: string
  keywords: string[]
}

const fieldOptions: Array<{ value: SearchField; label: string }> = [
  { value: 'title', label: '语料标题' },
  { value: 'keyword', label: '关键词' },
  { value: 'subject', label: '学科' },
  { value: 'organization', label: '发布机构' },
  { value: 'author', label: '作者姓名' },
]

function placeholderForField(field: SearchField) {
  return `请输入${fieldOptions.find((option) => option.value === field)?.label ?? '检索内容'}`
}

const searchableSubjects = ['数学', '物理', '化学', '天文', '地理', '生物']
const searchableInstitutions = [
  '天文学院-科维理天文与天体物理研究所', '北京未来基因诊断高精尖创新中心', '健康医疗大数据国家研究院',
  '遥感与地理信息系统研究所', '化学与分子工程学院', '环境科学与工程学院', '地球与空间科学学院',
  '北京科学智能研究院', '城市与环境学院', '数学科学学院', '生命科学学院', '物理学院', '药学院', '护理学院',
  '北京大学', '清华大学', '复旦大学', '上海交通大学', '南京大学', '武汉大学', '厦门大学', '深势科技', '个人',
]

function findMappedValue(query: string, options: string[]) {
  const normalized = query.trim()
  if (!normalized) return ''
  return options.find((option) => normalized === option) ?? options.find((option) => normalized.includes(option) || option.includes(normalized)) ?? ''
}

function mappedFiltersFromSearch(search: AppliedSearch) {
  const searchableConditions = search.mode === 'simple'
    ? [{ field: search.simpleField, value: search.simpleKeyword, logic: 'and' as LogicOperator }]
    : search.conditions.filter((condition) => condition.logic !== 'not')
  const subjectCondition = searchableConditions.find((condition) => condition.field === 'subject')
  const publisherCondition = searchableConditions.find((condition) => condition.field === 'organization')
  return {
    subject: findMappedValue(subjectCondition?.value ?? '', searchableSubjects),
    publisher: findMappedValue(publisherCondition?.value ?? '', searchableInstitutions),
  }
}

const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: 'published_desc', label: '发布时间：由近到远' },
  { value: 'published_asc', label: '发布时间：由远到近' },
  { value: 'views_desc', label: '浏览量（从高到低）' },
  { value: 'favorites_desc', label: '收藏量（从高到低）' },
  { value: 'usage_desc', label: '使用量（从高到低）' },
]

export const corpusRecords: CorpusRecord[] = [
  { id: 'math-01', title: '基础数学定理证明长思维链语料', organization: '北京大学', subject: '数学', corpusType: '长思维链语料', openness: '开放共享', summary: '围绕代数、几何与分析中的典型命题，结构化呈现问题理解、方法选择、推导过程与结论验证。', publishedAt: '2026-08-06', views: 3680, favorites: 426, usage: 918, authors: '北京大学数学科学学院', keywords: ['定理证明', '长思维链', '代数', '几何'] },
  { id: 'physics-01', title: '量子力学问题求解与推理过程语料', organization: '北京大学', subject: '物理', corpusType: '后训练语料', openness: '依申请开放', summary: '覆盖量子态、算符、微扰理论等核心主题，保留规范化的计算步骤和物理解释。', publishedAt: '2026-08-02', views: 3124, favorites: 385, usage: 762, authors: '北京大学物理学院', keywords: ['量子力学', '推理过程', '问题求解'] },
  { id: 'chem-01', title: '有机合成路线设计长思维链语料', organization: '北京大学', subject: '化学', corpusType: '长思维链语料', openness: '依申请开放', summary: '面向目标分子逆合成分析，组织反应选择、条件判断、路线比较和可行性校验等专业推理信息。', publishedAt: '2026-07-30', views: 2956, favorites: 342, usage: 683, authors: '北京大学化学与分子工程学院', keywords: ['有机合成', '逆合成', '路线设计'] },
  { id: 'astro-01', title: '天体测量与天体力学多模态语料', organization: '南京大学', subject: '天文', corpusType: '多模态语料', openness: '开放共享', summary: '融合天体观测图像、测量表格、轨道参数和研究文本，支持跨模态天文知识建模。', publishedAt: '2026-07-28', views: 2260, favorites: 281, usage: 504, authors: '南京大学天文与空间科学学院', keywords: ['天体测量', '天体力学', '观测图像'] },
  { id: 'geo-01', title: '中国典型城市高分辨率遥感影像语料', organization: '武汉大学', subject: '地理', corpusType: '多模态语料', openness: '开放共享', summary: '汇聚典型城市多源遥感影像及地物标注，服务场景理解、变化检测与空间推理。', publishedAt: '2026-07-24', views: 4186, favorites: 506, usage: 1245, authors: '武汉大学测绘遥感信息工程国家重点实验室', keywords: ['遥感影像', '城市地理', '变化检测'] },
  { id: 'bio-01', title: '生物分子三维结构深度对齐语料', organization: '北京科学智能研究院', subject: '生物', corpusType: '多模态语料', openness: '定向开放', summary: '对齐蛋白质与小分子三维结构、功能描述和实验信息，支持科学多模态模型训练。', publishedAt: '2026-07-21', views: 3478, favorites: 438, usage: 876, authors: '科学智能生命研究团队', keywords: ['生物分子', '三维结构', '深度对齐'] },
  { id: 'math-02', title: '概率论与数理统计问题求解语料', organization: '清华大学', subject: '数学', corpusType: '后训练语料', openness: '开放共享', summary: '覆盖随机变量、参数估计、假设检验等知识点，提供分层难度的问题与规范解答。', publishedAt: '2026-07-18', views: 2540, favorites: 316, usage: 634, authors: '清华大学数学科学系', keywords: ['概率论', '数理统计', '习题'] },
  { id: 'physics-02', title: '凝聚态物理实验动态图谱语料', organization: '复旦大学', subject: '物理', corpusType: '多模态语料', openness: '依申请开放', summary: '整合实验图像、谱图、参数记录和分析文本，支持凝聚态物理实验过程理解。', publishedAt: '2026-07-15', views: 2086, favorites: 267, usage: 392, authors: '复旦大学物理学系', keywords: ['凝聚态物理', '实验图谱', '谱图'] },
  { id: 'chem-02', title: '聚合物太阳能电池知识语料', organization: '北京大学', subject: '化学', corpusType: '知识语料', openness: '开放共享', summary: '汇集材料结构、器件性能与关键光电指标，服务材料筛选、机理分析及科研问答。', publishedAt: '2026-07-12', views: 1832, favorites: 198, usage: 425, authors: '北京大学图书馆、材料研究团队', keywords: ['聚合物', '太阳能电池', '材料'] },
  { id: 'astro-02', title: '星系光谱识别与分类语料', organization: '厦门大学', subject: '天文', corpusType: '预训练语料', openness: '开放共享', summary: '汇集星系光谱曲线、类别标注和关键谱线说明，支持天文基础模型的识别与分类任务。', publishedAt: '2026-07-08', views: 1688, favorites: 202, usage: 418, authors: '厦门大学天文学系', keywords: ['星系光谱', '光谱识别', '分类'] },
  { id: 'geo-02', title: '地质环境影响分析长思维链语料', organization: '南京大学', subject: '地理', corpusType: '长思维链语料', openness: '定向开放', summary: '围绕地质条件、工程活动与环境影响，记录证据提取、因果判断和风险评估过程。', publishedAt: '2026-07-05', views: 1562, favorites: 184, usage: 307, authors: '南京大学地球科学与工程学院', keywords: ['地质环境', '影响分析', '风险评估'] },
  { id: 'bio-02', title: '代谢小分子化合物结构语料', organization: '北京大学', subject: '生物', corpusType: '知识语料', openness: '定向开放', summary: '整合小分子结构、理化属性、质谱裂解特征和来源元数据，服务代谢组学研究。', publishedAt: '2026-07-01', views: 2794, favorites: 347, usage: 1068, authors: '北京大学生命科学学院', keywords: ['代谢组学', '小分子', '质谱'] },
  { id: 'math-03', title: '计算数学算法与数值实验语料', organization: '上海交通大学', subject: '数学', corpusType: '工具增强语料', openness: '开放共享', summary: '关联算法原理、代码实现、数值实验和误差分析，支持模型理解计算方法的完整过程。', publishedAt: '2026-06-28', views: 1940, favorites: 228, usage: 579, authors: '上海交通大学数学科学学院', keywords: ['计算数学', '数值实验', '算法'] },
  { id: 'physics-03', title: '粒子物理与原子核物理文献语料', organization: '北京大学', subject: '物理', corpusType: '预训练语料', openness: '依申请开放', summary: '对领域文献、公式和实验结果进行规范解析，形成面向基础模型训练的高质量文本语料。', publishedAt: '2026-06-24', views: 1446, favorites: 172, usage: 284, authors: '北京大学物理学院', keywords: ['粒子物理', '原子核物理', '文献'] },
  { id: 'chem-03', title: '物理化学论文图文深度对齐语料', organization: '厦门大学', subject: '化学', corpusType: '多模态语料', openness: '开放共享', summary: '对科研图表、公式及其上下文进行结构化解析，实现规范的图文绑定和语义对齐。', publishedAt: '2026-06-20', views: 2178, favorites: 264, usage: 516, authors: '厦门大学化学化工学院', keywords: ['物理化学', '科研图表', '图文对齐'] },
  { id: 'astro-03', title: '天体起源演化推演语料', organization: '北京大学', subject: '天文', corpusType: '长思维链语料', openness: '依申请开放', summary: '围绕恒星、星系和宇宙演化问题，组织观测证据、理论模型与推演结论。', publishedAt: '2026-06-16', views: 2386, favorites: 308, usage: 462, authors: '北京大学科维理天文与天体物理研究所', keywords: ['天体起源', '演化', '推演'] },
  { id: 'geo-03', title: '极端天气与气象灾害事件语料', organization: '复旦大学', subject: '地理', corpusType: '知识语料', openness: '开放共享', summary: '汇聚台风、暴雨和高温等事件资料，关联时空范围、影响指标及应对信息。', publishedAt: '2026-06-11', views: 1996, favorites: 246, usage: 544, authors: '复旦大学大气与海洋科学系', keywords: ['极端天气', '气象灾害', '时空数据'] },
  { id: 'bio-03', title: '基因调控网络知识图谱语料', organization: '清华大学', subject: '生物', corpusType: '检索增强语料', openness: '定向开放', summary: '构建基因、蛋白质、表型和调控关系的可溯源知识单元，服务生物医学检索增强生成。', publishedAt: '2026-06-06', views: 2655, favorites: 339, usage: 734, authors: '清华大学生命科学学院', keywords: ['基因调控', '知识图谱', '检索增强'] },
  { id: 'math-04', title: '数学公式识别与语义解析语料', organization: '深势科技', subject: '数学', corpusType: '多模态语料', openness: '开放共享', summary: '对齐公式图像、数学排版表达和语义说明，支持科学文献公式识别及数学语言理解。', publishedAt: '2026-05-30', views: 3522, favorites: 441, usage: 1156, authors: '深势科技科学语料团队', keywords: ['数学公式', '文字识别', '语义解析'] },
  { id: 'physics-04', title: '光学实验视频与操作过程语料', organization: '上海交通大学', subject: '物理', corpusType: '多模态语料', openness: '依申请开放', summary: '对光学实验视频、仪器状态、操作步骤和测量结果进行时间同步标注。', publishedAt: '2026-05-24', views: 1384, favorites: 158, usage: 296, authors: '上海交通大学物理与天文学院', keywords: ['光学实验', '教学视频', '操作过程'] },
  { id: 'chem-04', title: '环境化学专业问答与推理语料', organization: '武汉大学', subject: '化学', corpusType: '后训练语料', openness: '开放共享', summary: '围绕污染物行为、环境过程与风险判断构建专业问题、依据和规范化解答。', publishedAt: '2026-05-18', views: 1745, favorites: 213, usage: 473, authors: '武汉大学资源与环境科学学院', keywords: ['环境化学', '专业问答', '风险判断'] },
  { id: 'astro-04', title: '射电天文观测数据与说明语料', organization: '清华大学', subject: '天文', corpusType: '预训练语料', openness: '定向开放', summary: '整合射电观测数据、设备参数、质量标记和研究说明，支持天文观测数据理解。', publishedAt: '2026-05-12', views: 1298, favorites: 149, usage: 268, authors: '清华大学天文系', keywords: ['射电天文', '观测数据', '设备参数'] },
  { id: 'geo-04', title: '城市空间结构与功能区识别语料', organization: '北京大学', subject: '地理', corpusType: '多模态语料', openness: '开放共享', summary: '融合地图、遥感影像、兴趣点和城市规划文本，支持城市功能区识别与空间分析。', publishedAt: '2026-05-06', views: 2418, favorites: 305, usage: 691, authors: '北京大学城市与环境学院', keywords: ['城市空间', '功能区', '空间分析'] },
  { id: 'bio-04', title: '生物机理分析与实验验证语料', organization: '个人贡献者', subject: '生物', corpusType: '长思维链语料', openness: '依申请开放', summary: '围绕典型生物学问题组织机制假设、证据分析、实验设计和结果验证过程。', publishedAt: '2026-04-28', views: 1168, favorites: 136, usage: 224, authors: '平台认证科研贡献者', keywords: ['生物机理', '实验设计', '结果验证'] },
]

const initialConditions = (): SearchCondition[] => [
  { id: 1, logic: 'and', field: 'title', value: '' },
  { id: 2, logic: 'and', field: 'keyword', value: '' },
]

const emptyAppliedSearch = (): AppliedSearch => ({
  mode: 'simple',
  simpleField: 'title',
  simpleKeyword: '',
  conditions: [],
  startDate: '',
  endDate: '',
})

function appliedSearchFromParams(params: URLSearchParams): AppliedSearch {
  const searchMode = params.get('search')
  if (searchMode === 'simple' && params.get('q')) {
    const field = params.get('field') as SearchField
    return {
      ...emptyAppliedSearch(),
      mode: 'simple',
      simpleField: fieldOptions.some((option) => option.value === field) ? field : 'title',
      simpleKeyword: params.get('q') ?? '',
    }
  }
  if (searchMode === 'advanced') {
    let parsedConditions: SearchCondition[] = []
    try {
      const parsed = JSON.parse(params.get('conditions') ?? '[]')
      if (Array.isArray(parsed)) parsedConditions = parsed
    } catch {
      parsedConditions = []
    }
    return {
      mode: 'advanced', simpleField: 'title', simpleKeyword: '',
      conditions: parsedConditions,
      startDate: params.get('startDate') ?? '',
      endDate: params.get('endDate') ?? '',
    }
  }
  return emptyAppliedSearch()
}

const emptyFacetFilters: CorpusFilterState = {
  subjects: [], subSubjects: [], corpusTypes: [], institutions: [], corpusSizes: [], storageSizes: [], openness: [],
}

const corpusSizeBuckets = ['1千以下', '1千-1万', '1万-10万', '10万-100万', '100万以上']
const storageBuckets = ['<500GB', '500GB-1TB', '1-2TB', '>2TB']

export function recordDisplayMeta(item: CorpusRecord) {
  const index = Math.max(0, corpusRecords.findIndex((record) => record.id === item.id))
  return {
    status: (index % 4 === 0 ? '待上传' : '已上传') as '已上传' | '待上传',
    corpusSize: corpusSizeBuckets[index % corpusSizeBuckets.length],
    storageSize: storageBuckets[index % storageBuckets.length],
    opennessLabel: item.openness === '不公开' ? '不公开' : '公开',
  }
}

function loadSearchHistory() {
  if (typeof window === 'undefined') return [] as string[]
  try {
    const stored = JSON.parse(window.localStorage.getItem('gw-corpus-search-history') ?? '[]')
    return Array.isArray(stored) ? stored.filter((item): item is string => typeof item === 'string').slice(0, 10) : []
  } catch {
    return [] as string[]
  }
}

function SearchHistoryPanel({
  history,
  onPick,
  onDelete,
  onClear,
}: {
  history: string[]
  onPick: (keyword: string) => void
  onDelete: (keyword: string) => void
  onClear: () => void
}) {
  if (history.length === 0) return null
  return (
    <div className="search-history-panel">
      <div className="search-history-heading">
        <strong>最近检索</strong>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={onClear}>清空</button>
      </div>
      <ul>
        {history.map((keyword) => (
          <li key={keyword}>
            <button type="button" className="history-keyword" onMouseDown={(event) => event.preventDefault()} onClick={() => onPick(keyword)}>
              {keyword}
            </button>
            <button
              type="button"
              className="history-remove"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onDelete(keyword)}
              aria-label={`删除历史检索词${keyword}`}
            >
              <X size={13} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function valueForField(item: CorpusRecord, field: SearchField) {
  if (field === 'title') return item.title
  if (field === 'keyword') return `${item.keywords.join(' ')} ${item.summary} ${item.corpusType}`
  if (field === 'subject') return item.subject
  if (field === 'organization') return item.organization
  return item.authors
}

function matchesField(item: CorpusRecord, field: SearchField, query: string) {
  return valueForField(item, field).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
}

function sortRecords(items: CorpusRecord[], sortKey: SortKey) {
  const copied = [...items]
  if (sortKey === 'published_asc') return copied.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))
  if (sortKey === 'views_desc') return copied.sort((a, b) => b.views - a.views)
  if (sortKey === 'favorites_desc') return copied.sort((a, b) => b.favorites - a.favorites)
  if (sortKey === 'usage_desc') return copied.sort((a, b) => b.usage - a.usage)
  return copied.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

function initialSort(sort: string | null): SortKey {
  if (sort === 'views') return 'views_desc'
  if (sort === 'usage') return 'usage_desc'
  if (sortOptions.some((option) => option.value === sort)) return sort as SortKey
  return 'published_desc'
}

export default function CorpusSearch({ pageType = 'search' }: { pageType?: 'search' | 'results' }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const isResultsPage = pageType === 'results'
  const resultsRef = useRef<HTMLElement>(null)
  const nextConditionId = useRef(3)
  const [mode, setMode] = useState<SearchMode>('simple')
  const [simpleField, setSimpleField] = useState<SearchField>('title')
  const [simpleKeyword, setSimpleKeyword] = useState('')
  const [conditions, setConditions] = useState<SearchCondition[]>(initialConditions)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch>(() => appliedSearchFromParams(searchParams))
  const [publisherFilter, setPublisherFilter] = useState(searchParams.get('publisher') ?? '')
  const [subjectFilter, setSubjectFilter] = useState(searchParams.get('domain') ?? '')
  const [sortKey, setSortKey] = useState<SortKey>(() => initialSort(searchParams.get('sort')))
  const [currentPage, setCurrentPage] = useState(1)
  const [facetFilters, setFacetFilters] = useState<CorpusFilterState>(emptyFacetFilters)
  const [resultStatusTab, setResultStatusTab] = useState<ResultStatusTab>('all')
  const [resultSearchField, setResultSearchField] = useState<SearchField>(() => {
    const field = searchParams.get('field') as SearchField
    return fieldOptions.some((option) => option.value === field) ? field : 'title'
  })
  const [resultSearchKeyword, setResultSearchKeyword] = useState(searchParams.get('q') ?? '')
  const [searchHistory, setSearchHistory] = useState<string[]>(loadSearchHistory)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false)
  const [filterResetVersion, setFilterResetVersion] = useState(0)

  const saveSearchHistory = useCallback((keyword: string) => {
    const normalized = keyword.trim()
    if (!normalized) return
    setSearchHistory((current) => {
      const next = [normalized, ...current.filter((item) => item !== normalized)].slice(0, 10)
      window.localStorage.setItem('gw-corpus-search-history', JSON.stringify(next))
      return next
    })
  }, [])

  useEffect(() => {
    if (isResultsPage && appliedSearch.mode === 'simple' && appliedSearch.simpleKeyword) saveSearchHistory(appliedSearch.simpleKeyword)
  }, [appliedSearch.mode, appliedSearch.simpleKeyword, isResultsPage, saveSearchHistory])

  const handleFacetChange = useCallback((filters: CorpusFilterState) => {
    setFacetFilters(filters)
    setCurrentPage(1)
  }, [])

  const syncSearchParams = (nextValues: Record<string, string | undefined>) => {
    const nextParams = new URLSearchParams(searchParams)
    Object.entries(nextValues).forEach(([key, value]) => {
      if (value) nextParams.set(key, value)
      else nextParams.delete(key)
    })
    setSearchParams(nextParams, { replace: true })
  }

  const handleSimpleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextApplied: AppliedSearch = { mode: 'simple', simpleField, simpleKeyword: simpleKeyword.trim(), conditions: [], startDate: '', endDate: '' }
    const mapped = mappedFiltersFromSearch(nextApplied)
    const nextParams = new URLSearchParams()
    nextParams.set('search', 'simple')
    nextParams.set('field', simpleField)
    if (simpleKeyword.trim()) nextParams.set('q', simpleKeyword.trim())
    if (mapped.subject) nextParams.set('domain', mapped.subject)
    if (mapped.publisher) nextParams.set('publisher', mapped.publisher)
    setAppliedSearch(nextApplied)
    setSubjectFilter(mapped.subject)
    setPublisherFilter(mapped.publisher)
    setFacetFilters(emptyFacetFilters)
    setFilterResetVersion((value) => value + 1)
    navigate({ pathname: '/search/results', search: `?${nextParams.toString()}` })
  }

  const handleAdvancedSearch = () => {
    const activeConditions = conditions.map((condition) => ({ ...condition, value: condition.value.trim() })).filter((condition) => condition.value)
    const nextApplied: AppliedSearch = { mode: 'advanced', simpleField: 'title', simpleKeyword: '', conditions: activeConditions, startDate, endDate }
    const mapped = mappedFiltersFromSearch(nextApplied)
    const nextParams = new URLSearchParams()
    nextParams.set('search', 'advanced')
    if (activeConditions.length) nextParams.set('conditions', JSON.stringify(activeConditions))
    if (startDate) nextParams.set('startDate', startDate)
    if (endDate) nextParams.set('endDate', endDate)
    if (mapped.subject) nextParams.set('domain', mapped.subject)
    if (mapped.publisher) nextParams.set('publisher', mapped.publisher)
    setAppliedSearch(nextApplied)
    setSubjectFilter(mapped.subject)
    setPublisherFilter(mapped.publisher)
    setFacetFilters(emptyFacetFilters)
    setFilterResetVersion((value) => value + 1)
    navigate({ pathname: '/search/results', search: `?${nextParams.toString()}` })
  }

  const resetAdvancedSearch = () => {
    setConditions(initialConditions())
    setStartDate('')
    setEndDate('')
    setAppliedSearch(emptyAppliedSearch())
    setCurrentPage(1)
    syncSearchParams({ search: undefined, q: undefined, field: undefined })
  }

  const addCondition = () => {
    if (conditions.length >= 10) return
    setConditions((current) => [...current, { id: nextConditionId.current++, logic: 'and', field: 'title', value: '' }])
  }

  const removeCondition = (id: number) => {
    if (conditions.length <= 2) return
    setConditions((current) => current.filter((condition) => condition.id !== id))
  }

  const updateCondition = <Key extends keyof SearchCondition>(id: number, key: Key, value: SearchCondition[Key]) => {
    setConditions((current) => current.map((condition) => condition.id === id ? { ...condition, [key]: value } : condition))
  }

  const applyResultSimpleSearch = (keyword: string) => {
    const normalized = keyword.trim()
    const nextApplied: AppliedSearch = { mode: 'simple', simpleField: resultSearchField, simpleKeyword: normalized, conditions: [], startDate: '', endDate: '' }
    const mapped = mappedFiltersFromSearch(nextApplied)
    setAppliedSearch(nextApplied)
    setSubjectFilter(mapped.subject)
    setPublisherFilter(mapped.publisher)
    setFacetFilters(emptyFacetFilters)
    setFilterResetVersion((value) => value + 1)
    setResultSearchKeyword(normalized)
    setCurrentPage(1)
    saveSearchHistory(normalized)
    syncSearchParams({
      search: 'simple', field: resultSearchField, q: normalized || undefined,
      domain: mapped.subject || undefined, publisher: mapped.publisher || undefined,
      conditions: undefined, startDate: undefined, endDate: undefined,
    })
    setHistoryOpen(false)
  }

  const handleResultSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    applyResultSimpleSearch(resultSearchKeyword)
  }

  const openAdvancedSearch = () => {
    if (appliedSearch.mode === 'advanced' && appliedSearch.conditions.length) {
      setConditions(appliedSearch.conditions.length >= 2 ? appliedSearch.conditions : [...appliedSearch.conditions, { id: nextConditionId.current++, logic: 'and', field: 'title', value: '' }])
      setStartDate(appliedSearch.startDate)
      setEndDate(appliedSearch.endDate)
    }
    setAdvancedModalOpen(true)
  }

  const applyResultAdvancedSearch = () => {
    const activeConditions = conditions.map((condition) => ({ ...condition, value: condition.value.trim() })).filter((condition) => condition.value)
    const nextApplied: AppliedSearch = { mode: 'advanced', simpleField: 'title', simpleKeyword: '', conditions: activeConditions, startDate, endDate }
    const mapped = mappedFiltersFromSearch(nextApplied)
    setAppliedSearch(nextApplied)
    setSubjectFilter(mapped.subject)
    setPublisherFilter(mapped.publisher)
    setFacetFilters(emptyFacetFilters)
    setFilterResetVersion((value) => value + 1)
    setCurrentPage(1)
    syncSearchParams({
      search: 'advanced', field: undefined, q: undefined,
      domain: mapped.subject || undefined, publisher: mapped.publisher || undefined,
      conditions: activeConditions.length ? JSON.stringify(activeConditions) : undefined,
      startDate: startDate || undefined, endDate: endDate || undefined,
    })
    setAdvancedModalOpen(false)
  }

  const resetResultAdvancedSearch = () => {
    setConditions(initialConditions())
    setStartDate('')
    setEndDate('')
  }

  const deleteHistoryItem = (keyword: string) => {
    setSearchHistory((current) => {
      const next = current.filter((item) => item !== keyword)
      window.localStorage.setItem('gw-corpus-search-history', JSON.stringify(next))
      return next
    })
  }

  const clearSearchHistory = () => {
    setSearchHistory([])
    window.localStorage.removeItem('gw-corpus-search-history')
    setHistoryOpen(false)
  }

  const applySimpleHistoryKeyword = (keyword: string) => {
    setSimpleKeyword(keyword)
    setHistoryOpen(false)
  }

  const filteredRecords = useMemo(() => {
    const matched = corpusRecords.filter((item, index) => {
      if (facetFilters.subjects.length && !facetFilters.subjects.includes(item.subject)) return false
      if (facetFilters.institutions.length && !facetFilters.institutions.some((value) => `${item.organization} ${item.authors}`.includes(value))) return false
      if (facetFilters.corpusSizes.length && !facetFilters.corpusSizes.includes(corpusSizeBuckets[index % corpusSizeBuckets.length])) return false
      if (facetFilters.storageSizes.length && !facetFilters.storageSizes.includes(storageBuckets[index % storageBuckets.length])) return false
      if (facetFilters.corpusTypes.length && !facetFilters.corpusTypes.some((value) => {
        if (value === 'RAG') return item.corpusType.includes('检索增强')
        return item.corpusType.includes(value)
      })) return false
      if (facetFilters.openness.length && !facetFilters.openness.some((value) => {
        if (value === '公开') return item.openness !== '不公开'
        return item.openness === '不公开'
      })) return false

      if (appliedSearch.mode === 'simple' && appliedSearch.simpleKeyword) {
        return matchesField(item, appliedSearch.simpleField, appliedSearch.simpleKeyword)
      }

      if (appliedSearch.mode === 'advanced') {
        if (appliedSearch.startDate && item.publishedAt < appliedSearch.startDate) return false
        if (appliedSearch.endDate && item.publishedAt > appliedSearch.endDate) return false

        const activeConditions = appliedSearch.conditions.filter((condition) => condition.value)
        const andConditions = activeConditions.filter((condition) => condition.logic === 'and')
        const orConditions = activeConditions.filter((condition) => condition.logic === 'or')
        const notConditions = activeConditions.filter((condition) => condition.logic === 'not')

        if (!andConditions.every((condition) => matchesField(item, condition.field, condition.value))) return false
        if (orConditions.length > 0 && !orConditions.some((condition) => matchesField(item, condition.field, condition.value))) return false
        if (notConditions.some((condition) => matchesField(item, condition.field, condition.value))) return false
      }

      return true
    })

    return sortRecords(matched, sortKey)
  }, [appliedSearch, facetFilters, sortKey])

  const statusFilteredRecords = useMemo(() => {
    if (!isResultsPage || resultStatusTab === 'all') return filteredRecords
    const expected = resultStatusTab === 'uploaded' ? '已上传' : '待上传'
    return filteredRecords.filter((item) => recordDisplayMeta(item).status === expected)
  }, [filteredRecords, isResultsPage, resultStatusTab])

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(statusFilteredRecords.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const visibleRecords = statusFilteredRecords.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)
  const paginationStart = Math.max(1, safeCurrentPage - 5)
  const paginationEnd = Math.min(totalPages, safeCurrentPage + 5)
  const pageNumbers = Array.from({ length: paginationEnd - paginationStart + 1 }, (_, index) => paginationStart + index)

  const changePage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 20)
  }

  const externalFilterTags = useMemo<ExternalFilterTag[]>(() => {
    const tags: ExternalFilterTag[] = []
    if (appliedSearch.mode === 'simple' && appliedSearch.simpleKeyword) {
      const fieldLabel = fieldOptions.find((option) => option.value === appliedSearch.simpleField)?.label ?? '检索内容'
      tags.push({ id: 'simple-query', label: `${fieldLabel}：${appliedSearch.simpleKeyword}`, onRemove: () => setAppliedSearch(emptyAppliedSearch()) })
    }
    if (appliedSearch.mode === 'advanced') {
      appliedSearch.conditions.forEach((condition) => {
        if (!condition.value) return
        const fieldLabel = fieldOptions.find((option) => option.value === condition.field)?.label ?? '检索内容'
        tags.push({
          id: `condition-${condition.id}`,
          label: `${fieldLabel}：${condition.value}`,
          onRemove: () => setAppliedSearch((current) => ({ ...current, conditions: current.conditions.filter((item) => item.id !== condition.id) })),
        })
      })
      if (appliedSearch.startDate) tags.push({ id: 'start-date', label: `起始日期：${appliedSearch.startDate}`, onRemove: () => setAppliedSearch((current) => ({ ...current, startDate: '' })) })
      if (appliedSearch.endDate) tags.push({ id: 'end-date', label: `结束日期：${appliedSearch.endDate}`, onRemove: () => setAppliedSearch((current) => ({ ...current, endDate: '' })) })
    }
    return tags
  }, [appliedSearch])

  const resetAllResultFilters = () => {
    setAppliedSearch(emptyAppliedSearch())
    setPublisherFilter('')
    setSubjectFilter('')
    setCurrentPage(1)
    setFacetFilters(emptyFacetFilters)
    setFilterResetVersion((value) => value + 1)
    syncSearchParams({ publisher: undefined, domain: undefined, q: undefined, field: undefined, search: undefined })
  }

  const clearMappedSearchFilter = (type: 'subject' | 'publisher') => {
    const mappedField: SearchField = type === 'subject' ? 'subject' : 'organization'
    const mappedParam = type === 'subject' ? 'domain' : 'publisher'
    if (appliedSearch.mode === 'simple' && appliedSearch.simpleField === mappedField) {
      setAppliedSearch(emptyAppliedSearch())
      setResultSearchKeyword('')
      syncSearchParams({
        [mappedParam]: undefined, q: undefined, field: undefined, search: undefined,
      })
    } else if (appliedSearch.mode === 'advanced') {
      const nextConditions = appliedSearch.conditions.filter((condition) => condition.field !== mappedField)
      setAppliedSearch((current) => ({ ...current, conditions: nextConditions }))
      syncSearchParams({
        [mappedParam]: undefined,
        conditions: nextConditions.length ? JSON.stringify(nextConditions) : undefined,
        search: nextConditions.length || appliedSearch.startDate || appliedSearch.endDate ? 'advanced' : undefined,
      })
    } else {
      syncSearchParams({ [mappedParam]: undefined })
    }
    setCurrentPage(1)
  }

  return (
    <main className="search-page">
      <header className={`search-page-heading${isResultsPage ? ' is-results' : ''}`}>
        {isResultsPage && <Link className="back-to-search" to="/search"><ChevronLeft size={15} />返回语料检索</Link>}
        <h1>{isResultsPage ? '检索结果' : '语料检索'}</h1>
      </header>

      {!isResultsPage && <>
      <section className="search-console" aria-label="语料全局检索">
        <div className="search-mode-tabs" role="tablist" aria-label="检索方式">
          <button type="button" role="tab" aria-selected={mode === 'simple'} className={mode === 'simple' ? 'is-active' : ''} onClick={() => setMode('simple')}>
            <Search size={18} />数据检索
          </button>
          <button type="button" role="tab" aria-selected={mode === 'advanced'} className={mode === 'advanced' ? 'is-active' : ''} onClick={() => setMode('advanced')}>
            <SlidersHorizontal size={18} />高级检索
          </button>
        </div>

        {mode === 'simple' ? (
          <form className="simple-search-form" action="/search/results" method="get" onSubmit={handleSimpleSearch}>
            <input type="hidden" name="search" value="simple" />
            <label>
              <select name="field" value={simpleField} onChange={(event) => setSimpleField(event.target.value as SearchField)} aria-label="选择检索字段">
                {fieldOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="simple-query-field">
              <input
                name="q"
                value={simpleKeyword}
                onChange={(event) => setSimpleKeyword(event.target.value)}
                onFocus={() => searchHistory.length > 0 && setHistoryOpen(true)}
                onBlur={() => window.setTimeout(() => setHistoryOpen(false), 160)}
                placeholder={placeholderForField(simpleField)}
              />
              {historyOpen && searchHistory.length > 0 && (
                <SearchHistoryPanel history={searchHistory} onPick={applySimpleHistoryKeyword} onDelete={deleteHistoryItem} onClear={clearSearchHistory} />
              )}
            </label>
            <button className="primary-search-button" type="submit"><Search size={18} />检索</button>
          </form>
        ) : (
          <div className="advanced-search-panel" role="tabpanel">
            <div className="advanced-condition-heading">
              <div>
                <strong>组合检索条件</strong>
                <span>至少保留2项，最多可设置10项条件</span>
              </div>
              <span className="condition-count">{conditions.length} / 10</span>
            </div>

            <div className="advanced-condition-list">
              {conditions.map((condition, index) => (
                <div className="advanced-condition-row" key={condition.id}>
                  <span className="condition-index">{String(index + 1).padStart(2, '0')}</span>
                  <select value={condition.logic} onChange={(event) => updateCondition(condition.id, 'logic', event.target.value as LogicOperator)} aria-label={`第${index + 1}项逻辑关系`}>
                    <option value="and">AND</option>
                    <option value="or">OR</option>
                    <option value="not">NOT</option>
                  </select>
                  <select value={condition.field} onChange={(event) => updateCondition(condition.id, 'field', event.target.value as SearchField)} aria-label={`第${index + 1}项检索字段`}>
                    {fieldOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                  </select>
                  <input value={condition.value} onChange={(event) => updateCondition(condition.id, 'value', event.target.value)} placeholder={`请输入${fieldOptions.find((option) => option.value === condition.field)?.label ?? '检索内容'}`} />
                  <div className="condition-actions">
                    <button type="button" onClick={addCondition} disabled={conditions.length >= 10} aria-label="添加检索条件" title="添加条件"><Plus size={17} /></button>
                    <button type="button" onClick={() => removeCondition(condition.id)} disabled={index < 2} aria-label="删除检索条件" title={index < 2 ? '前两项条件不可删除' : '删除条件'}><Minus size={17} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="advanced-footer-row">
              <fieldset className="date-range-fieldset">
                <legend><CalendarDays size={16} />发布时间范围</legend>
                <label><span>起始日期</span><input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} /></label>
                <i>至</i>
                <label><span>结束日期</span><input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} /></label>
              </fieldset>
              <div className="advanced-search-actions">
                <button className="reset-search-button" type="button" onClick={resetAdvancedSearch}><RotateCcw size={17} />重置条件</button>
                <button className="primary-search-button" type="button" onClick={handleAdvancedSearch}><Search size={17} />检索</button>
              </div>
            </div>
          </div>
        )}
      </section>

      </>}

      <section className="catalog-results-section" id="corpus-results" ref={resultsRef} aria-labelledby="catalog-results-title">
        {!isResultsPage && (
        <div className="catalog-results-heading">
          <div>
            <h2 id="catalog-results-title">全部语料</h2>
            <p>共900个语料库</p>
          </div>
          <label className="catalog-sort-control">
            <span>排序方式</span>
            <select value={sortKey} onChange={(event) => { setSortKey(event.target.value as SortKey); setCurrentPage(1); syncSearchParams({ sort: event.target.value }) }}>
              {sortOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
        )}

        <div className={`catalog-results-layout${isResultsPage ? '' : ' is-standalone'}`}>
          {isResultsPage && (
          <CorpusFilterSidebar
            key={`${filterResetVersion}-${subjectFilter}-${publisherFilter}`}
            initialSubject={subjectFilter}
            initialPublisher={publisherFilter}
            externalTags={externalFilterTags}
            onChange={handleFacetChange}
            onResetExternal={resetAllResultFilters}
            onInitialFilterCleared={clearMappedSearchFilter}
          />
          )}
          <div className="catalog-results-main">

        {isResultsPage && <>
          <form className="result-global-search" onSubmit={handleResultSearch}>
            <select value={resultSearchField} onChange={(event) => setResultSearchField(event.target.value as SearchField)} aria-label="检索字段">
              {fieldOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
            <div className="result-search-input-wrap">
              <input
                value={resultSearchKeyword}
                onChange={(event) => setResultSearchKeyword(event.target.value)}
                onFocus={() => searchHistory.length > 0 && setHistoryOpen(true)}
                onBlur={() => window.setTimeout(() => setHistoryOpen(false), 160)}
                placeholder={placeholderForField(resultSearchField)}
              />
              {historyOpen && searchHistory.length > 0 && (
                <SearchHistoryPanel history={searchHistory} onPick={applyResultSimpleSearch} onDelete={deleteHistoryItem} onClear={clearSearchHistory} />
              )}
            </div>
            <button type="submit" className="result-search-submit">检索</button>
            <button type="button" className="result-advanced-trigger" onClick={openAdvancedSearch}><SlidersHorizontal size={16} />高级检索</button>
          </form>

          <div className="result-list-toolbar">
            <div className="result-count-and-tabs">
              <strong><b>{statusFilteredRecords.length}</b> 个结果</strong>
              <div className="result-status-tabs" role="tablist" aria-label="上传状态">
                <button type="button" className={resultStatusTab === 'all' ? 'is-active' : ''} onClick={() => { setResultStatusTab('all'); setCurrentPage(1) }}>全部</button>
                <button type="button" className={resultStatusTab === 'uploaded' ? 'is-active' : ''} onClick={() => { setResultStatusTab('uploaded'); setCurrentPage(1) }}>已上传</button>
                <button type="button" className={resultStatusTab === 'pending' ? 'is-active' : ''} onClick={() => { setResultStatusTab('pending'); setCurrentPage(1) }}>待上传</button>
              </div>
            </div>
            <label className="catalog-sort-control">
              <span>排序方式</span>
              <select value={sortKey} onChange={(event) => { setSortKey(event.target.value as SortKey); setCurrentPage(1); syncSearchParams({ sort: event.target.value }) }}>
                {sortOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
        </>}

        {visibleRecords.length > 0 ? (
          <div className="catalog-card-grid">
            {visibleRecords.map((item) => {
              const displayMeta = recordDisplayMeta(item)
              const cardTarget = `/search/datasets/${item.id}`
              return (
              <Link className="catalog-corpus-card" to={cardTarget} target="_blank" rel="noreferrer" key={item.id}>
                <div className="quality-card-visual catalog-card-visual" aria-hidden="true">
                  <span className="card-status-overlay is-partial">公开</span>
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
                  <div className="catalog-card-tags">
                    <span className="catalog-subject-tag">{item.subject}</span>
                  </div>
                  <time dateTime={item.publishedAt}><CalendarDays size={13} />{item.publishedAt}</time>
                </div>
                <h3>{item.title}</h3>
                <div className="catalog-card-metadata">
                  <span><Building2 size={14} />{item.organization} - {item.authors}</span>
                </div>
                <p>{item.summary}</p>
                {isResultsPage && (
                  <div className="catalog-card-volume">
                    <span><small>语料规模</small><strong>{displayMeta.corpusSize}</strong></span>
                    <span><small>存储容量</small><strong>{displayMeta.storageSize}</strong></span>
                  </div>
                )}
                <footer>
                  <span className="card-org-mark" aria-hidden="true">北</span>
                  <strong className="card-organization-name">{item.organization} - {item.authors}</strong>
                  <span><Download size={14} />{item.usage.toLocaleString()}</span>
                  <span><Eye size={14} />{item.views.toLocaleString()}</span>
                  <span><Star size={14} />{item.favorites.toLocaleString()}</span>
                </footer>
              </Link>
              )
            })}
          </div>
        ) : (
          <div className="catalog-empty-state">
            <Search size={28} />
            <strong>暂未找到匹配语料</strong>
            <p>请调整检索词、逻辑关系或发布时间范围后重新检索。</p>
          </div>
        )}

        <div className="catalog-pagination" aria-label="语料列表分页">
          <button type="button" onClick={() => changePage(safeCurrentPage - 1)} disabled={safeCurrentPage === 1}><ChevronLeft size={16} />上一页</button>
          <div>
            {pageNumbers.map((page) => (
              <button type="button" className={safeCurrentPage === page ? 'is-active' : ''} aria-current={safeCurrentPage === page ? 'page' : undefined} onClick={() => changePage(page)} key={page}>{page}</button>
            ))}
          </div>
          <button type="button" onClick={() => changePage(safeCurrentPage + 1)} disabled={safeCurrentPage === totalPages}>下一页<ChevronRight size={16} /></button>
        </div>
          </div>
        </div>
      </section>

      {isResultsPage && advancedModalOpen && (
        <div className="result-advanced-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAdvancedModalOpen(false) }}>
          <section className="result-advanced-dialog" role="dialog" aria-modal="true" aria-labelledby="result-advanced-title">
            <div className="result-advanced-heading">
              <div><h2 id="result-advanced-title">高级检索</h2><p>组合多个条件，精确定位语料库</p></div>
              <button type="button" onClick={() => setAdvancedModalOpen(false)} aria-label="关闭高级检索"><X size={19} /></button>
            </div>
            <div className="advanced-condition-heading">
              <div><strong>组合检索条件</strong><span>至少保留2项，最多可设置10项条件</span></div>
              <span className="condition-count">{conditions.length} / 10</span>
            </div>
            <div className="advanced-condition-list result-modal-condition-list">
              {conditions.map((condition, index) => (
                <div className="advanced-condition-row" key={condition.id}>
                  <span className="condition-index">{String(index + 1).padStart(2, '0')}</span>
                  <select value={condition.logic} onChange={(event) => updateCondition(condition.id, 'logic', event.target.value as LogicOperator)} aria-label={`第${index + 1}项逻辑关系`}>
                    <option value="and">AND</option><option value="or">OR</option><option value="not">NOT</option>
                  </select>
                  <select value={condition.field === 'keyword' ? 'title' : condition.field} onChange={(event) => updateCondition(condition.id, 'field', event.target.value as SearchField)} aria-label={`第${index + 1}项检索字段`}>
                    {fieldOptions.filter((option) => option.value !== 'keyword').map((option) => <option value={option.value} key={option.value}>{option.value === 'title' ? '标题' : option.label}</option>)}
                  </select>
                  <input value={condition.value} onChange={(event) => updateCondition(condition.id, 'value', event.target.value)} placeholder="请输入检索内容" />
                  <div className="condition-actions">
                    <button type="button" onClick={addCondition} disabled={conditions.length >= 10} aria-label="添加检索条件"><Plus size={17} /></button>
                    <button type="button" onClick={() => removeCondition(condition.id)} disabled={index < 2} aria-label="删除检索条件"><Minus size={17} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="advanced-footer-row result-modal-footer">
              <fieldset className="date-range-fieldset">
                <legend><CalendarDays size={16} />发布时间范围</legend>
                <label><span>起始日期</span><input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} /></label>
                <i>至</i>
                <label><span>结束日期</span><input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} /></label>
              </fieldset>
              <div className="advanced-search-actions">
                <button type="button" className="reset-search-button" onClick={resetResultAdvancedSearch}><RotateCcw size={17} />重置条件</button>
                <button type="button" className="primary-search-button" onClick={applyResultAdvancedSearch}><Search size={17} />检索</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
