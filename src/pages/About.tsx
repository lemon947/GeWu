import { useState } from 'react'
import { ArrowRight, Building2, GraduationCap, Microscope, Network, Sparkles, UserRound } from 'lucide-react'
import { Link } from 'react-router'
import LogoMark from '../components/LogoMark'
import { ecosystemGroups, type EcosystemKey } from '../data/ecosystem'

const philosophyNodes = [
  { key: 'open', title: '开放协同', text: '汇聚高校、科研机构、企业和个人建设力量，形成多方参与、优势互补的语料建设机制', keywords: '多方参与 · 共建共享' },
  { key: 'subject', title: '学科组织', text: '依托六大基础学科体系和专业人才队伍，保障科学语料的专业性、系统性与知识深度', keywords: '六大学科 · 共同参与' },
  { key: 'governance', title: '规范治理', text: '对语料来源、加工过程、权益信息、开放范围和版本变化进行规范记录与管理', keywords: '可治理 · 可追溯 · 可复用' },
  { key: 'iteration', title: '持续迭代', text: '推动数据、工具、人才和模型协同演化，通过建设与使用反馈不断提升语料质量', keywords: '协同演化 · 持续更新' },
]

const ecosystemIcons: Record<EcosystemKey, typeof GraduationCap> = {
  高校: GraduationCap,
  科研机构: Microscope,
  企业: Building2,
  个人: UserRound,
}

export default function About() {
  const [activeGroup, setActiveGroup] = useState<EcosystemKey>('高校')
  const active = ecosystemGroups[activeGroup]

  return (
    <div className="about-platform-page">
      <section className="about-introduction-section">
        <div className="about-platform-container">
          <header className="about-platform-heading"><h1>关于我们</h1></header>
          <div className="about-brand-row"><LogoMark size={72} /><div><strong>格物 · 科学语料库</strong><span>科学语料共建共享平台</span></div></div>
          <div className="about-introduction-grid">
            <article>
              <p><strong>格物 · 科学语料库</strong>——面向科学智能发展的高质量科学语料共建共享平台。聚焦数学、物理、化学、天文、地理、生物六大基础学科，持续汇聚高校、科研机构、企业和个人建设的科学语料资源。</p>
              <p>平台按照“1+6+N”开放协同机制推进，依托完整的学科体系和多方建设力量，以“可治理、可追溯、可复用、可迭代”为建设理念，贯通多源多模态语料汇聚、专业加工、质量评估、开放共享与持续迭代，推动人类专家、智能模型和语料加工工具协同参与科学语料建设。</p>
            </article>
            <aside className="about-relation-card">
              <div className="relation-flow"><span><UserRound size={18} />语料贡献者</span><ArrowRight size={18} /><strong><LogoMark size={34} />格物 · 科学语料库</strong><ArrowRight size={18} /><span><Sparkles size={18} />科研、教学与模型应用</span></div>
              <div className="relation-audience"><b>服务对象</b><p>高校、科研机构、科技企业、教师、科研人员、学生及模型研发人员</p></div>
            </aside>
          </div>
        </div>
      </section>

      <section className="about-strategic-section">
        <div className="about-platform-container">
          <header className="about-section-title"><div><h2>战略背景</h2><p>面向科学智能发展需求，建设开放协同、规范可信的科学语料基础设施</p></div></header>
          <div className="strategic-card-grid">
            <article className="strategy-national-card">
              <div className="strategy-card-label"><Sparkles size={28} /><h3>国家战略定位</h3></div>
              <p>AI for Science（AI4S）是一种全新的科研范式，也是我国实现科技自立自强、建设科技强国的必经之路。习近平总书记强调要“以人工智能引领科研范式变革”“体系化布局建设重大科技基础设施，建设智能化科研平台系统”，《国务院关于深入实施“人工智能+”行动的意见》明确要求加快科学大模型建设应用、打造开放共享的高质量科学数据集。</p>
              <p>高质量科学数据不仅是人工智能理解科学知识、开展复杂推理的重要基础，也是科学大模型建设和科研智能化发展的关键支撑。面向国家人工智能与科技创新战略需求，格物 · 科学语料库着力建设开放协同、规范可信的科学语料基础设施，推动基础学科数据资源转化为可服务科研创新、教育教学和模型发展的高质量科学语料。</p>
            </article>
            <article className="strategy-challenge-card">
              <div className="strategy-card-label"><Network size={28} /><h3>当前困境与挑战</h3></div>
              <p>当前，我国基础学科语料资源分散于高校、科研院所和行业机构，统一的汇交治理机制与数据标准尚不完善，“数据孤岛”问题突出。数学公式、实验图谱、生物分子结构等复杂科学数据具有显著的专业性和多模态特征，深度解析、语义对齐和质量评价难度较高。</p>
              <div className="challenge-tags"><span>资源分散</span><span>标准不一</span><span>多模态对齐困难</span><span>专业语料不足</span></div>
              <p>高质量专业语料、领域推理过程和长思维链数据仍存在结构性缺口，语料来源、权益边界、加工过程和更新版本也需要更加规范的记录与管理。格物 · 科学语料库将通过多方语料汇聚、专业加工、规范治理与开放协同，推动解决科学数据分散、标准不一、多模态对齐困难和高质量专业语料不足等问题。</p>
            </article>
          </div>
        </div>
      </section>

      <section className="about-philosophy-section">
        <div className="about-platform-container">
          <header className="about-dark-heading"><h2>建设理念</h2><p>以开放协同汇聚建设力量，以学科体系保障专业质量，以规范治理建立可信基础，以持续迭代释放语料价值</p></header>
          <div className="philosophy-orbit-stage">
            <div className="philosophy-grid" aria-hidden="true" />
            <div className="philosophy-ring ring-one" aria-hidden="true" />
            <div className="philosophy-ring ring-two" aria-hidden="true" />
            <div className="philosophy-orbit-copy" aria-hidden="true">{['汇聚', '治理', '共享', '反馈'].map((item) => <span key={item}>{item}</span>)}</div>
            <div className="philosophy-core"><LogoMark size={62} /><strong>格物 · 科学语料库</strong><span>科学语料共建共享平台</span><small>连接学科资源、专业人才、加工工具与智能模型</small></div>
            {philosophyNodes.map((node, index) => <article key={node.key} className={`philosophy-node node-${node.key}`}><i>0{index + 1}</i><h3>{node.title}</h3><p>{node.text}</p><span>{node.keywords}</span></article>)}
          </div>
        </div>
      </section>

      <section className="about-ecosystem-section">
        <div className="about-platform-container">
          <header className="about-section-title is-centered"><div><h2>共建生态</h2><p>连接高校、科研机构、企业和个人贡献者，汇聚学科资源、科研数据、技术工具与专业知识，共同建设持续演化的科学语料生态</p></div></header>
          <div className="ecosystem-network-stage">
            <div className="ecosystem-stars" aria-hidden="true" />
            <div className="ecosystem-ring ring-a" aria-hidden="true" /><div className="ecosystem-ring ring-b" aria-hidden="true" /><div className="ecosystem-ring ring-c" aria-hidden="true" />
            <div className="ecosystem-ring-copy" aria-hidden="true">{['汇聚', '治理', '共享', '使用', '反馈', '迭代'].map((item) => <span key={item}>{item}</span>)}</div>
            <div className="ecosystem-core"><LogoMark size={66} /><strong>格物 · 科学语料库</strong><span>科学语料共建共享枢纽</span></div>
            {(Object.keys(ecosystemGroups) as EcosystemKey[]).map((key) => { const group = ecosystemGroups[key]; const Icon = ecosystemIcons[key]; return <button type="button" key={key} className={`ecosystem-group-node group-${key === '高校' ? 'university' : key === '科研机构' ? 'research' : key === '企业' ? 'enterprise' : 'individual'}${activeGroup === key ? ' is-active' : ''}`} onMouseEnter={() => setActiveGroup(key)} onFocus={() => setActiveGroup(key)} onClick={() => setActiveGroup(key)}><Icon size={22} /><strong>{key}</strong><small>{group.summary}</small></button> })}
            <div className="ecosystem-member-panel">
              <div><span>{activeGroup}</span><strong>{active.summary}</strong></div>
              <div className={`ecosystem-member-list is-${activeGroup === '高校' ? 'university' : 'standard'}`}>
                {active.members.map((member) => activeGroup === '个人'
                  ? <span key={member.name}><i>{member.name.slice(0, 1)}</i>{member.name}</span>
                  : <Link className={member.name === '北京大学' ? 'is-lead' : ''} key={member.name} to={`/search/results?publisher=${encodeURIComponent(member.name)}`}>
                    {member.logo ? <img src={member.logo} alt="" /> : <i>{member.name.slice(0, 2)}</i>}
                    <b>{member.name}</b>
                  </Link>)}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
