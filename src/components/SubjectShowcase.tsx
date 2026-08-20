import { useEffect, useMemo, useState } from 'react'
import {
  Atom,
  Building2,
  CalendarDays,
  Calculator,
  Database,
  Dna,
  Earth,
  FlaskConical,
  HardDrive,
  Layers3,
  Sparkles,
  Telescope,
} from 'lucide-react'

const mathFeatureSlides = [
  {
    title: '数学教材与论文原始语料',
    caption: '原始语料底座',
    detail: '覆盖数学全领域教材、专著与论文，完成 OCR 优化和章节、公式、定理、证明等结构化解析。',
    organization: '北京大学数学科学学院',
    openness: '开放共享',
    publishedAt: '2026-07-19',
    tags: ['数学', '基础语料', 'OCR 优化'],
  },
  {
    title: 'Matlas 定理与陈述语料',
    caption: '定理检索与知识导航',
    detail: '抽取大规模数学陈述，连接定义、定理、证明与知识依赖，支撑跨领域语义关联。',
    organization: '北京大学数学科学学院',
    openness: '开放共享',
    publishedAt: '2026-07-19',
    tags: ['数学', '知识语料', '定理搜索'],
  },
  {
    title: '形式化数学语料',
    caption: '机器可验证的证明资源',
    detail: '建立自然语言陈述、数学公式与 Lean 等形式语言之间的对应关系，服务证明复用与自动验证。',
    organization: '北京大学数学科学学院',
    openness: '依申请开放',
    publishedAt: '2026-07-19',
    tags: ['数学', '形式化语料', 'Lean 对齐'],
  },
  {
    title: 'Agentic 推理轨迹语料',
    caption: '面向模型推理训练',
    detail: '沉淀智能体在研究级数学问题中的候选步骤、搜索分支、成功路径和失败轨迹。',
    organization: '北京大学数学科学学院',
    openness: '定向开放',
    publishedAt: '2026-07-19',
    tags: ['数学', '后训练语料', '推理轨迹'],
  },
]

const subjectFeatureSlides: Record<string, typeof mathFeatureSlides> = {
  数学: mathFeatureSlides,
  物理: [
    {
      title: 'Principia物理建模与计算数据库',
      caption: '理论计算语料',
      detail: '物理领域首个论文推理类语料库，包含长上下文理解、物理推理、复杂问题求解等高质量数据。',
      organization: '北京大学物理学院',
      openness: '开放共享',
      publishedAt: '2026-08-06',
      tags: ['物理', '建模计算', '推理语料'],
    },
    {
      title: 'PVolution 实验+模拟语料库',
      caption: '实验模拟语料',
      detail: '构建首次系统覆盖介观、纳米、原子及亚原子等多尺度，蕴含物理基本规律的超大规模结构化物理语料库。',
      organization: '北京大学物理学院',
      openness: '依申请开放',
      publishedAt: '2026-08-06',
      tags: ['物理', '实验模拟', '多尺度'],
    },
  ],
  化学: [
    {
      title: 'CarbonMat 碳材料横向关联语料库',
      caption: '多模态证据链',
      detail: '面向碳材料研究的横向证据链组织，将文献中的工艺、结构、表征、性能与机理解释关联成可推理的多模态知识单元。',
      organization: '北京大学化学与分子工程学院',
      openness: '开放共享',
      publishedAt: '2026-07-14',
      tags: ['化学', '碳材料', '证据链'],
    },
    {
      title: 'NMR 高质量实验数据库',
      caption: '谱学实验数据',
      detail: '目前世界最大的高质量实验数据库，“主动出击”的新谱学工具突破真实场景结构解析瓶颈。',
      organization: '北京大学化学与分子工程学院',
      openness: '依申请开放',
      publishedAt: '2026-07-14',
      tags: ['化学', 'NMR', '实验数据库'],
    },
    {
      title: '中国自主晶体结构数据库',
      caption: 'AI结构预测',
      detail: '以人工智能结构预测为特征的数据库，集查询与预测一体，支撑晶体结构检索、生成与验证。',
      organization: '北京大学化学与分子工程学院',
      openness: '开放共享',
      publishedAt: '2026-07-14',
      tags: ['化学', '晶体结构', 'AI预测'],
    },
    {
      title: '原子级催化剂计算模型数据库',
      caption: '催化计算模型',
      detail: '可检索、可训练、可追溯的原子结构与计算属性数据底座，支撑材料大模型预训练、结构表征学习和高通量催化剂筛选。',
      organization: '北京大学化学与分子工程学院',
      openness: '依申请开放',
      publishedAt: '2026-07-14',
      tags: ['化学', '催化剂', '计算属性'],
    },
    {
      title: '金属离子电池材料数据库',
      caption: '电池材料语料',
      detail: '结构化连接材料结构与电化学性能，支撑AI驱动的电池材料筛选与性能预测模型训练。',
      organization: '北京大学化学与分子工程学院',
      openness: '开放共享',
      publishedAt: '2026-07-14',
      tags: ['化学', '电池材料', '性能预测'],
    },
    {
      title: '放射性药物体内评价数据库',
      caption: '药物评价数据',
      detail: '为放射性药物和新型配体的体内药效、安全性评价提供数据支撑。',
      organization: '北京大学化学与分子工程学院',
      openness: '定向开放',
      publishedAt: '2026-07-14',
      tags: ['化学', '放射性药物', '体内评价'],
    },
  ],
  天文: [
    {
      title: '多源多模态观测与宇宙学模拟数据',
      caption: '观测与模拟',
      detail: '包含多波段图像、光谱、时序、星表等类型，构成面向星系物理、宇宙学、时域天文学等基础科学研究的数据资源。',
      organization: '北京大学天文学系',
      openness: '开放共享',
      publishedAt: '2026-07-14',
      tags: ['天文', '多模态观测', '数值模拟'],
    },
    {
      title: '斯隆数字巡天（SDSS Legacy）成像数据',
      caption: '巡天成像语料',
      detail: 'SDSS 是国际上近 30 年里影响力最大的天文巡天项目，可广泛用于研究宇宙学、星系物理、银河系及恒星物理等。',
      organization: '北京大学天文学系',
      openness: '开放共享',
      publishedAt: '2026-07-14',
      tags: ['天文', 'SDSS', '巡天成像'],
    },
    {
      title: 'ZTF源表和光变数据',
      caption: '时域天文语料',
      detail: '包含差分测光、历史检测和图像切片，是暂现源实时分类的重要训练语料。',
      organization: '北京大学天文学系',
      openness: '开放共享',
      publishedAt: '2026-07-14',
      tags: ['天文', 'ZTF', '光变数据'],
    },
    {
      title: 'ALMA分子与原子谱线数据立方',
      caption: '谱线数据立方',
      detail: '提供空间-速度三维信息，可研究气体动力学、化学和质量分布。',
      organization: '北京大学天文学系',
      openness: '依申请开放',
      publishedAt: '2026-07-14',
      tags: ['天文', 'ALMA', '谱线数据'],
    },
    {
      title: 'Kratos代码测试、标准问题与基准算例库',
      caption: '数值方法基准',
      detail: '沉淀可复现测试和典型算例，适合训练AI理解物理方程、数值方法和结果验证。',
      organization: '北京大学天文学系',
      openness: '开放共享',
      publishedAt: '2026-07-14',
      tags: ['天文', 'Kratos', '基准算例'],
    },
  ],
  地理: [
    {
      title: '全球无缝数据立方体',
      caption: 'PB级观测数据',
      detail: '以全球 30 米无缝数据立方体（SDC）地表反射率数据集（2000–2024）为代表，可提供PB级观测数据。',
      organization: '北京大学地球与空间科学学院',
      openness: '开放共享',
      publishedAt: '2026-07-14',
      tags: ['地理', '数据立方体', '遥感'],
    },
    {
      title: '地球与行星领域多天体数据语料库',
      caption: '跨天体语料',
      detail: '包含地球、金星、火星、水星、月球的遥感、地质、化学、物理多学科信息，以及跨天体对比与推理能力。',
      organization: '北京大学地球与空间科学学院',
      openness: '依申请开放',
      publishedAt: '2026-07-14',
      tags: ['地理', '行星科学', '跨天体'],
    },
    {
      title: '全球公开 M>5 地震事件波形数据',
      caption: '地震波形语料',
      detail: '标注P、S及面波到时，服务震相识别、地震事件检测和地球内部结构研究。',
      organization: '北京大学地球与空间科学学院',
      openness: '开放共享',
      publishedAt: '2026-07-14',
      tags: ['地理', '地震波形', '震相标注'],
    },
    {
      title: 'InSight火震波形数据库',
      caption: '火星震学语料',
      detail: '将地球地震研究方法拓展到火星，与地震数据形成跨天体对照。',
      organization: '北京大学地球与空间科学学院',
      openness: '开放共享',
      publishedAt: '2026-07-14',
      tags: ['地理', 'InSight', '火震波形'],
    },
    {
      title: '全球高分光学遥感语料',
      caption: '空间表征语料',
      detail: '代表全球地表观测与多尺度空间表征，可服务地物识别、变化检测、城市环境分析和地理基础模型训练。',
      organization: '北京大学地球与空间科学学院',
      openness: '开放共享',
      publishedAt: '2026-07-14',
      tags: ['地理', '高分遥感', '基础模型'],
    },
    {
      title: '真实城市环境中的空间智能评测基准数据',
      caption: '空间智能评测',
      detail: '评测模型在真实城市中的空间定位、方向关系、路线理解和推理能力。',
      organization: '北京大学地球与空间科学学院',
      openness: '开放共享',
      publishedAt: '2026-07-14',
      tags: ['地理', '城市环境', '空间推理'],
    },
  ],
  生物: [
    {
      title: '跨物种细胞调控图谱',
      caption: '细胞调控图谱',
      detail: '跨物种、多模态，内容最全。基于自主研发数据解析管线，实现从数据下载-质控-清洗-治理全链条自动化。',
      organization: '北京大学生命科学学院',
      openness: '定向开放',
      publishedAt: '2026-07-14',
      tags: ['生物', '跨物种', '多模态'],
    },
    {
      title: '作物多模态育种',
      caption: '作物育种语料',
      detail: '跨越245年、总量达2835余万篇全球生物专业中英文文献，覆盖10+主粮和经济作物。',
      organization: '北京大学生命科学学院',
      openness: '开放共享',
      publishedAt: '2026-07-14',
      tags: ['生物', '作物育种', '文献语料'],
    },
    {
      title: '中国人群肿瘤基因组',
      caption: '肿瘤基因组',
      detail: '覆盖15种常见肿瘤（每种500例），全部使用国产测序平台自测，实现全自主产权所有。',
      organization: '北京大学生命科学学院',
      openness: '定向开放',
      publishedAt: '2026-07-14',
      tags: ['生物', '肿瘤基因组', '国产测序'],
    },
    {
      title: '植物天然药物综合语料库',
      caption: '天然药物语料',
      detail: '构建全世界最大规模植物天然药物综合语料库，赋能生物合成途径解析与绿色生物制造。',
      organization: '北京大学生命科学学院',
      openness: '开放共享',
      publishedAt: '2026-07-14',
      tags: ['生物', '天然药物', '生物制造'],
    },
    {
      title: 'AI大数据驱动的创新药物筛选系统',
      caption: '创新药物筛选',
      detail: '亿级知识图谱数据库与药物研发大模型，16家高校企业应用，推动候选药物15+。',
      organization: '北京大学生命科学学院',
      openness: '依申请开放',
      publishedAt: '2026-07-14',
      tags: ['生物', '药物筛选', '知识图谱'],
    },
    {
      title: '临床科研大数据特征提取与安全计算系统',
      caption: '临床科研数据',
      detail: '在试点临床机构部署与示范应用，集成TB级临床科研数据集。',
      organization: '北京大学生命科学学院',
      openness: '定向开放',
      publishedAt: '2026-07-14',
      tags: ['生物', '临床科研', '安全计算'],
    },
  ],
}

const subjectData = [
  {
    name: '数学',
    icon: Calculator,
    accent: 'blue',
    lead: '围绕数学知识、定理证明、形式化验证与智能推理，建设可检索、可验证、可训练的数学语料基础设施。',
    scale: { sets: '175个', size: '0.158PB', items: '1.10亿条' },
    corpora: [
      '数学教材与论文原始语料',
      'Matlas 定理与陈述语料',
      '形式化数学语料',
      'Agentic 推理轨迹语料',
    ],
    services: ['AI4Math：数学研究赋能', 'Math4AI：反哺人工智能', '教育与应用', '跨学科应用（AI4S战略）'],
  },
  {
    name: '物理',
    icon: Atom,
    accent: 'violet',
    lead: '以重大物理问题为牵引，贯通文献、公式、实验数据、计算程序与科研工作流，支撑 AI for Physics。',
    scale: { sets: '147个', size: '0.285PB', items: '0.53亿条' },
    corpora: [
      'Principia 理论计算语料',
      'Pvolution 实验模拟语料',
      'PRBench 论文复现语料',
      '科研智能体轨迹语料',
    ],
    services: ['AI辅助科研', '科研自动化平台', '教育与人才培养', 'AI评测与基准', '跨学科应用'],
  },
  {
    name: '化学',
    icon: FlaskConical,
    accent: 'rose',
    lead: '面向分子、反应、材料与实验过程，建设连接结构、性质、谱图和实验记录的化学语料资源。',
    scale: { sets: '169个', size: '5.69PB', items: '1.68亿条' },
    corpora: ['分子与材料结构语料', '化学反应与机理语料', '实验谱图与表征数据语料', '催化与能源材料语料'],
    services: ['科研研究与模型训练', '教学与人才培养', '科学模拟与实验验证支持', '产业研发与创新'],
  },
  {
    name: '天文',
    icon: Telescope,
    accent: 'amber',
    lead: '整合多波段观测、星表、巡天图像与天体物理模拟，服务天文智能发现。',
    scale: { sets: '132个', size: '27.52PB', items: '37.77亿条' },
    corpora: ['多波段巡天观测语料', '星表与天体分类语料', '光变曲线与时序观测语料', '天体物理模拟语料'],
    services: ['大模型训练与智能问答', '天文数据分析与AI辅助研究', '科学模拟与实验验证支持', '课堂与研究性教学', '平台化服务于科研写作'],
  },
  {
    name: '地理',
    icon: Earth,
    accent: 'teal',
    lead: '围绕空间数据、遥感影像、地理文本与城市运行信息，建设面向空间智能的语料体系。',
    scale: { sets: '149个', size: '2.57PB', items: '6.11亿条' },
    corpora: ['遥感影像与地表覆盖语料', '地图、POI 与路网语料', '城市空间与区域发展语料', '灾害与环境监测语料'],
    services: ['科学大模型训练', '灾害预测与应急响应', '气候变化与碳中和研究', '资源环境管理与生态保护', '人类活动监测与可持续发展'],
  },
  {
    name: '生物',
    icon: Dna,
    accent: 'cyan',
    lead: '连接生物分子、组学数据、实验记录与生态观测，支撑生命科学智能分析。',
    scale: { sets: '128个', size: '1.78PB', items: '44.83亿条' },
    corpora: ['基因组与分子结构语料', '组学实验与表型数据语料', '生物医学文献与机制知识语料', '物种识别与生态观测语料'],
    services: ['AI辅助科研', '科研自动化平台', '教育与人才培养', 'AI评测与基准', '跨学科应用（AI4S战略）'],
  },
]

export default function SubjectShowcase() {
  const [activeSubject, setActiveSubject] = useState(subjectData[0].name)
  const [activeFeature, setActiveFeature] = useState(0)
  const subject = useMemo(
    () => subjectData.find((item) => item.name === activeSubject) ?? subjectData[0],
    [activeSubject],
  )
  const featureSlides = subjectFeatureSlides[subject.name] ?? mathFeatureSlides
  const Icon = subject.icon

  useEffect(() => {
    setActiveFeature(0)
    const timer = window.setInterval(() => {
      setActiveFeature((current) => (current + 1) % featureSlides.length)
    }, 3600)

    return () => window.clearInterval(timer)
  }, [featureSlides])

  return (
    <section className="subject-showcase-section" aria-labelledby="subject-showcase-title">
      <div className="subject-showcase-inner">
        <header className="subject-showcase-heading">
          <h2 id="subject-showcase-title">六大学科领域建设特色</h2>
        </header>

        <div className="subject-tabs" aria-label="学科切换">
          {subjectData.map((item) => {
            const TabIcon = item.icon
            return (
              <button
                className={`subject-tab subject-accent-${item.accent}${item.name === subject.name ? ' is-active' : ''}`}
                type="button"
                onClick={() => setActiveSubject(item.name)}
                aria-pressed={item.name === subject.name}
                key={item.name}
              >
                <TabIcon size={18} />
                <span>{item.name}</span>
              </button>
            )
          })}
        </div>

        <div className={`subject-feature-panel subject-accent-${subject.accent}`}>
          <div className="subject-feature-visual" aria-label={`${subject.name}领域配图`}>
            <div className="subject-corpus-carousel">
              {featureSlides.map((feature, index) => (
                <article className={index === activeFeature ? 'is-active' : ''} key={feature.title}>
                  <div className="subject-carousel-art" aria-hidden="true">
                    <span className="subject-art-line line-one" />
                    <span className="subject-art-line line-two" />
                    <span className="subject-art-node node-one" />
                    <span className="subject-art-node node-two" />
                    <span className="subject-art-node node-three" />
                    <span className="subject-art-node node-four" />
                    <span className="subject-art-bar bar-one" />
                    <span className="subject-art-bar bar-two" />
                    <span className="subject-art-bar bar-three" />
                  </div>
                  <div className="subject-carousel-tags">
                    {feature.tags.map((tag) => <small key={tag}>{tag}</small>)}
                    <small className="openness-tag">{feature.openness}</small>
                  </div>
                  <h4>{feature.title}</h4>
                  <div className="subject-carousel-org"><Building2 size={16} /><span>{feature.organization}</span></div>
                  <p>{feature.detail}</p>
                  <footer><CalendarDays size={15} />{feature.publishedAt}</footer>
                </article>
              ))}
            </div>
            <div className="subject-image-dots" aria-label={`${subject.name}特色语料轮播进度`}>
              {featureSlides.map((feature, index) => (
                <button
                  className={index === activeFeature ? 'is-active' : ''}
                  type="button"
                  onClick={() => setActiveFeature(index)}
                  aria-label={`查看${feature.title}`}
                  key={feature.title}
                />
              ))}
              </div>
          </div>

          <div className="subject-feature-copy">
            <div className="subject-feature-title">
              <span><Icon size={24} /></span>
              <div>
                <h3>{subject.name}</h3>
                <p>{subject.lead}</p>
              </div>
            </div>

            <div className="subject-info-card-grid">
              <article className="subject-info-card">
                <div>
                  <Layers3 size={18} />
                  <h4>建设规模</h4>
                </div>
                <dl className="subject-scale-list">
                  <div><dt><Database size={16} />语料集</dt><dd>{subject.scale.sets}</dd></div>
                  <div><dt><HardDrive size={16} />语料规模</dt><dd>{subject.scale.size}</dd></div>
                  <div><dt><Layers3 size={16} />语料条数</dt><dd>{subject.scale.items}</dd></div>
                </dl>
              </article>

              <article className="subject-info-card subject-service-card">
                <div>
                  <Sparkles size={18} />
                  <h4>服务场景</h4>
                </div>
                <ul>
                  {subject.services.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
