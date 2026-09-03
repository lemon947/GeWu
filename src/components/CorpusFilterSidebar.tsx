import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, RotateCcw, Search, X } from 'lucide-react'

export type CorpusFilterState = {
  subjects: string[]
  subSubjects: string[]
  corpusTypes: string[]
  institutions: string[]
  corpusSizes: string[]
  storageSizes: string[]
  openness: string[]
}

export type ExternalFilterTag = {
  id: string
  label: string
  onRemove: () => void
}

type Option = { label: string; count: number; custom?: boolean }
type InstitutionNode = { label: string; count: number; children?: Option[]; custom?: boolean }
type InstitutionGroup = { label: string; count: number; children: InstitutionNode[] }

const subjectOptions: Option[] = [
  { label: '数学', count: 168 }, { label: '物理', count: 152 }, { label: '化学', count: 196 },
  { label: '天文', count: 87 }, { label: '地理', count: 124 }, { label: '生物', count: 173 },
]

const subjectChildren: Record<string, Option[]> = {
  化学: [
    { label: '碳材料', count: 34 }, { label: 'f族元素', count: 21 }, { label: '生物医药', count: 42 },
    { label: '能源材料', count: 39 }, { label: '催化', count: 37 }, { label: '教育教学', count: 23 },
  ],
  地理: [{ label: '地球世界模型', count: 48 }, { label: '地表环境与城市', count: 51 }, { label: '教育教学', count: 25 }],
  生物: [{ label: '生命', count: 112 }, { label: '医学', count: 61 }],
}

const corpusTypeOptions: Option[] = [
  { label: '预训练', count: 286 }, { label: '后训练', count: 214 }, { label: 'RAG', count: 137 }, { label: '微调', count: 165 },
]
const corpusSizeOptions: Option[] = [
  { label: '1千以下', count: 82 }, { label: '1千-1万', count: 146 }, { label: '1万-10万', count: 238 },
  { label: '10万-100万', count: 251 }, { label: '100万以上', count: 183 },
]
const storageOptions: Option[] = [
  { label: '<500GB', count: 342 }, { label: '500GB-1TB', count: 247 }, { label: '1-2TB', count: 184 }, { label: '>2TB', count: 127 },
]
const opennessOptions: Option[] = [
  { label: '公开', count: 843 }, { label: '不公开', count: 57 },
]

const pkuDepartments: Option[] = [
  { label: '数学科学学院', count: 58 }, { label: '物理学院', count: 56 }, { label: '化学与分子工程学院', count: 54 },
  { label: '天文学院-科维理天文与天体物理研究所', count: 42 }, { label: '环境科学与工程学院', count: 38 },
  { label: '城市与环境学院', count: 36 }, { label: '地球与空间科学学院', count: 34 }, { label: '遥感与地理信息系统研究所', count: 31 },
  { label: '北京未来基因诊断高精尖创新中心', count: 29 }, { label: '生命科学学院', count: 47 }, { label: '药学院', count: 33 },
  { label: '健康医疗大数据国家研究院', count: 26 }, { label: '护理学院', count: 18 },
  { label: '其他', count: 8, custom: true },
]

const institutionGroups: InstitutionGroup[] = [
  {
    label: '高校', count: 742, children: [
      { label: '北京大学', count: 426, children: pkuDepartments },
      { label: '清华大学', count: 68 }, { label: '复旦大学', count: 54 }, { label: '上海交通大学', count: 51 },
      { label: '南京大学', count: 49 }, { label: '武汉大学', count: 47 }, { label: '厦门大学', count: 39 },
      { label: '其他', count: 8, custom: true },
    ],
  },
  { label: '个人', count: 37, children: [] },
]

function nodeKnownValues(node: InstitutionNode) {
  if (node.custom) return []
  return node.children?.filter((item) => !item.custom).map((item) => item.label) ?? [node.label]
}

function groupKnownValues(group: InstitutionGroup) {
  return group.children.flatMap(nodeKnownValues)
}

function initialInstitutionGroup(initialPublisher: string) {
  return institutionGroups.find((group) => group.label === initialPublisher || group.children.some((node) => node.label === initialPublisher || node.children?.some((child) => child.label === initialPublisher)))?.label ?? ''
}

const emptyFilters = (initialSubject = '', initialPublisher = ''): CorpusFilterState => ({
  subjects: initialSubject ? [initialSubject] : [],
  subSubjects: subjectChildren[initialSubject]?.map((item) => item.label) ?? [],
  corpusTypes: [],
  institutions: initialPublisher === '北京大学' ? pkuDepartments.filter((item) => !item.custom).map((item) => item.label) : initialPublisher ? [initialPublisher] : [],
  corpusSizes: [],
  storageSizes: [],
  openness: [],
})

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

function OptionRow({ option, checked, nested = false, onChange }: { option: Option; checked: boolean; nested?: boolean; onChange: () => void }) {
  return (
    <label className={`facet-option${nested ? ' is-nested' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="facet-checkbox" aria-hidden="true" />
      <span className="facet-option-label">{option.label}</span>
      <small>{option.count}</small>
    </label>
  )
}

function InstitutionTreeRow({ label, count, checked, level, expanded = false, expandable = false, onChange, onExpand }: {
  label: string; count: number; checked: boolean; level: 1 | 2 | 3; expanded?: boolean; expandable?: boolean; onChange: () => void; onExpand?: () => void
}) {
  return (
    <div className={`institution-tree-row level-${level}`}>
      <label>
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="facet-checkbox" aria-hidden="true" />
        <span>{label}</span>
        <small>{count}</small>
      </label>
      {expandable && <button type="button" onClick={onExpand} aria-label={`${expanded ? '收起' : '展开'}${label}`}>{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>}
    </div>
  )
}

function ExpandButton({ visible, total, onExpand, onCollapse }: { visible: number; total: number; onExpand: () => void; onCollapse: () => void }) {
  if (total <= 5) return null
  if (visible < total) return <button type="button" className="facet-expand" onClick={onExpand}>展开更多<ChevronDown size={14} /></button>
  return <button type="button" className="facet-expand" onClick={onCollapse}>收起<ChevronUp size={14} /></button>
}

function FacetTitle({
  title,
  expanded,
  onToggle,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="facet-title">
      <h3>{title}</h3>
      <div className="facet-title-actions">
        <button type="button" className="facet-title-toggle" onClick={onToggle} aria-expanded={expanded} aria-label={`${expanded ? '收起' : '展开'}${title}`}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>
    </div>
  )
}

export default function CorpusFilterSidebar({
  initialSubject = '',
  initialPublisher = '',
  externalTags,
  onChange,
  onResetExternal,
  onInitialFilterCleared,
}: {
  initialSubject?: string
  initialPublisher?: string
  externalTags: ExternalFilterTag[]
  onChange: (filters: CorpusFilterState) => void
  onResetExternal: () => void
  onInitialFilterCleared?: (type: 'subject' | 'publisher') => void
}) {
  const [filters, setFilters] = useState(() => emptyFilters(initialSubject, initialPublisher))
  const [subjectVisible, setSubjectVisible] = useState(6)
  const [subjectExpanded, setSubjectExpanded] = useState(true)
  const [institutionQuery, setInstitutionQuery] = useState('')
  const [institutionExpanded, setInstitutionExpanded] = useState(true)
  const [openInstitutionGroups, setOpenInstitutionGroups] = useState<string[]>(() => {
    const group = initialInstitutionGroup(initialPublisher)
    return group ? [group] : ['高校']
  })
  const [institutionVisible, setInstitutionVisible] = useState<Record<string, number>>({ 高校: 5 })
  const [openInstitutionNodes, setOpenInstitutionNodes] = useState<string[]>(() => {
    if (initialPublisher === '北京大学' || pkuDepartments.some((item) => item.label === initialPublisher)) return ['高校/北京大学']
    return []
  })
  const [institutionNodeVisible, setInstitutionNodeVisible] = useState<Record<string, number>>({ '高校/北京大学': 5 })
  const [customInstitutionEnabled, setCustomInstitutionEnabled] = useState<string[]>([])
  const [customInstitutionValues, setCustomInstitutionValues] = useState<Record<string, string>>({})

  useEffect(() => onChange(filters), [filters, onChange])

  const update = <K extends keyof CorpusFilterState>(key: K, values: CorpusFilterState[K]) => {
    setFilters((current) => ({ ...current, [key]: values }))
  }

  const toggleSubject = (subject: string) => {
    const selected = filters.subjects.includes(subject)
    if (selected && subject === initialSubject) onInitialFilterCleared?.('subject')
    const children = subjectChildren[subject]?.map((item) => item.label) ?? []
    setFilters((current) => ({
      ...current,
      subjects: selected ? current.subjects.filter((item) => item !== subject) : [...current.subjects, subject],
      subSubjects: selected ? current.subSubjects.filter((item) => !children.includes(item)) : Array.from(new Set([...current.subSubjects, ...children])),
    }))
  }

  const toggleSubSubject = (parent: string, child: string) => {
    const nextChildren = toggleValue(filters.subSubjects, child)
    const parentChildren = subjectChildren[parent].map((item) => item.label)
    const hasAny = nextChildren.some((item) => parentChildren.includes(item))
    setFilters((current) => ({
      ...current,
      subjects: hasAny ? Array.from(new Set([...current.subjects, parent])) : current.subjects.filter((item) => item !== parent),
      subSubjects: nextChildren,
    }))
  }

  const toggleInstitutionGroup = (group: InstitutionGroup) => {
    const knownValues = groupKnownValues(group)
    if (knownValues.length === 0) {
      if (filters.institutions.includes(group.label) && group.label === initialPublisher) onInitialFilterCleared?.('publisher')
      update('institutions', toggleValue(filters.institutions, group.label))
      return
    }
    const allSelected = knownValues.length > 0 && knownValues.every((value) => filters.institutions.includes(value))
    setFilters((current) => ({
      ...current,
      institutions: allSelected ? current.institutions.filter((item) => !knownValues.includes(item)) : Array.from(new Set([...current.institutions, ...knownValues])),
    }))
    setOpenInstitutionGroups((current) => allSelected ? current.filter((item) => item !== group.label) : Array.from(new Set([...current, group.label])))
  }

  const toggleInstitutionNode = (group: InstitutionGroup, node: InstitutionNode) => {
    const nodeKey = `${group.label}/${node.label}`
    if (node.custom) {
      const enabled = customInstitutionEnabled.includes(nodeKey)
      const currentValue = customInstitutionValues[nodeKey]?.trim()
      setCustomInstitutionEnabled((current) => enabled ? current.filter((item) => item !== nodeKey) : [...current, nodeKey])
      if (enabled && currentValue) update('institutions', filters.institutions.filter((item) => item !== currentValue))
      return
    }
    const values = nodeKnownValues(node)
    const allSelected = values.every((value) => filters.institutions.includes(value))
    if (allSelected && node.label === initialPublisher) onInitialFilterCleared?.('publisher')
    update('institutions', allSelected ? filters.institutions.filter((item) => !values.includes(item)) : Array.from(new Set([...filters.institutions, ...values])))
    if (node.children?.length) {
      setOpenInstitutionNodes((current) => allSelected ? current.filter((item) => item !== nodeKey) : Array.from(new Set([...current, nodeKey])))
    }
  }

  const toggleInstitutionLeaf = (group: InstitutionGroup, node: InstitutionNode, leaf: Option) => {
    const value = leaf.label
    const customKey = `${group.label}/${node.label}/${leaf.label}`
    if (leaf.custom) {
      const enabled = customInstitutionEnabled.includes(customKey)
      const currentValue = customInstitutionValues[customKey]?.trim()
      setCustomInstitutionEnabled((current) => enabled ? current.filter((item) => item !== customKey) : [...current, customKey])
      if (enabled && currentValue) update('institutions', filters.institutions.filter((item) => item !== currentValue))
      return
    }
    if (filters.institutions.includes(value) && value === initialPublisher) onInitialFilterCleared?.('publisher')
    const next = toggleValue(filters.institutions, value)
    const nodeValues = nodeKnownValues(node)
    const groupValues = groupKnownValues(group)
    const nodeKey = `${group.label}/${node.label}`
    if (!next.some((item) => nodeValues.includes(item))) setOpenInstitutionNodes((current) => current.filter((item) => item !== nodeKey))
    if (!next.some((item) => groupValues.includes(item))) setOpenInstitutionGroups((current) => current.filter((item) => item !== group.label))
    update('institutions', next)
  }

  const updateCustomInstitution = (nodeKey: string, value: string) => {
    const previous = customInstitutionValues[nodeKey]?.trim()
    setCustomInstitutionValues((current) => ({ ...current, [nodeKey]: value }))
    setFilters((current) => {
      const withoutPrevious = previous ? current.institutions.filter((item) => item !== previous) : current.institutions
      return { ...current, institutions: value.trim() ? Array.from(new Set([...withoutPrevious, value.trim()])) : withoutPrevious }
    })
  }

  const internalTags = useMemo(() => [
    ...filters.subjects.map((value) => ({ group: 'subjects' as const, value, label: `学科领域：${value}` })),
    ...filters.subSubjects.map((value) => ({ group: 'subSubjects' as const, value, label: `细分学科：${value}` })),
    ...filters.corpusTypes.map((value) => ({ group: 'corpusTypes' as const, value, label: `语料类型：${value}` })),
    ...filters.institutions.map((value) => ({ group: 'institutions' as const, value, label: `发布机构：${value}` })),
    ...filters.corpusSizes.map((value) => ({ group: 'corpusSizes' as const, value, label: `语料规模：${value}` })),
    ...filters.storageSizes.map((value) => ({ group: 'storageSizes' as const, value, label: `存储容量：${value}` })),
    ...filters.openness.map((value) => ({ group: 'openness' as const, value, label: `开放程度：${value}` })),
  ], [filters])

  const resetAll = () => {
    setFilters(emptyFilters())
    setSubjectVisible(6)
    setSubjectExpanded(true)
    setInstitutionQuery('')
    setInstitutionExpanded(true)
    setOpenInstitutionGroups(['高校'])
    setInstitutionVisible({ 高校: 5 })
    setOpenInstitutionNodes([])
    setInstitutionNodeVisible({ '高校/北京大学': 5 })
    setCustomInstitutionEnabled([])
    setCustomInstitutionValues({})
    onResetExternal()
  }

  const totalApplied = externalTags.length + internalTags.length

  const removeInternalTag = (group: keyof CorpusFilterState, value: string) => {
    if (group === 'subjects' && value === initialSubject) onInitialFilterCleared?.('subject')
    if (group === 'institutions' && (value === initialPublisher || initialPublisher === '北京大学' && pkuDepartments.some((item) => item.label === value))) {
      onInitialFilterCleared?.('publisher')
    }
    if (group === 'subjects') {
      const children = subjectChildren[value]?.map((item) => item.label) ?? []
      setFilters((current) => ({
        ...current,
        subjects: current.subjects.filter((item) => item !== value),
        subSubjects: current.subSubjects.filter((item) => !children.includes(item)),
      }))
      return
    }
    if (group === 'subSubjects') {
      const parent = Object.entries(subjectChildren).find(([, children]) => children.some((child) => child.label === value))?.[0]
      setFilters((current) => {
        const nextSubSubjects = current.subSubjects.filter((item) => item !== value)
        if (!parent) return { ...current, subSubjects: nextSubSubjects }
        const parentChildren = subjectChildren[parent].map((item) => item.label)
        const hasAny = nextSubSubjects.some((item) => parentChildren.includes(item))
        return {
          ...current,
          subSubjects: nextSubSubjects,
          subjects: hasAny ? current.subjects : current.subjects.filter((item) => item !== parent),
        }
      })
      return
    }
    update(group, filters[group].filter((item) => item !== value))
    if (group === 'institutions') {
      const customEntry = Object.entries(customInstitutionValues).find(([, customValue]) => customValue.trim() === value)
      if (customEntry) {
        const [customKey] = customEntry
        setCustomInstitutionEnabled((current) => current.filter((item) => item !== customKey))
        setCustomInstitutionValues((current) => ({ ...current, [customKey]: '' }))
      }
    }
  }

  return (
    <aside className="corpus-filter-sidebar" aria-label="语料筛选条件">
      <section className="applied-filter-panel">
        <div className="facet-panel-heading"><h2>已应用筛选区</h2><button type="button" onClick={resetAll}><RotateCcw size={13} />重置</button></div>
        <div className="applied-filter-tags">
          {totalApplied === 0 && <p>暂未应用筛选条件</p>}
          {externalTags.map((tag) => <button type="button" key={tag.id} onClick={tag.onRemove}>{tag.label}<X size={12} /></button>)}
          {internalTags.map((tag) => (
            <button type="button" key={`${tag.group}-${tag.value}`} onClick={() => removeInternalTag(tag.group, tag.value)}>
              {tag.label}<X size={12} />
            </button>
          ))}
        </div>
      </section>

      <section className="facet-section">
        <FacetTitle title="学科领域" expanded={subjectExpanded} onToggle={() => setSubjectExpanded((value) => !value)} />
        {subjectExpanded && <>
          {subjectOptions.slice(0, subjectVisible).map((option) => (
            <div key={option.label}>
              <OptionRow option={option} checked={filters.subjects.includes(option.label)} onChange={() => toggleSubject(option.label)} />
              {filters.subjects.includes(option.label) && subjectChildren[option.label] && (
                <div className="nested-facet-list">
                  {subjectChildren[option.label].map((child) => <OptionRow key={child.label} option={child} nested checked={filters.subSubjects.includes(child.label)} onChange={() => toggleSubSubject(option.label, child.label)} />)}
                </div>
              )}
            </div>
          ))}
        </>}
      </section>

      <SimpleFacet title="语料类型" options={corpusTypeOptions} selected={filters.corpusTypes} onToggle={(value) => update('corpusTypes', toggleValue(filters.corpusTypes, value))} />
      <SimpleFacet title="开放程度" options={opennessOptions} selected={filters.openness} onToggle={(value) => update('openness', toggleValue(filters.openness, value))} />

      <section className="facet-section institution-facet">
        <FacetTitle title="发布机构" expanded={institutionExpanded} onToggle={() => setInstitutionExpanded((value) => !value)} />
        {institutionExpanded && <>
          <label className="institution-search"><Search size={14} /><input value={institutionQuery} onChange={(event) => setInstitutionQuery(event.target.value)} placeholder="搜索发布机构" /></label>
          {institutionGroups.map((group) => {
          const query = institutionQuery.trim()
          const groupLabelMatches = Boolean(query && group.label.includes(query))
          const matchingNodes = !query || groupLabelMatches ? group.children : group.children.filter((node) => node.label.includes(query) || node.children?.some((child) => child.label.includes(query)))
          if (query && !groupLabelMatches && matchingNodes.length === 0) return null
          const knownValues = groupKnownValues(group)
          const allSelected = knownValues.length > 0 ? knownValues.every((value) => filters.institutions.includes(value)) : filters.institutions.includes(group.label)
          const isOpen = group.children.length > 0 && (query ? matchingNodes.length > 0 : openInstitutionGroups.includes(group.label))
          const visible = query ? matchingNodes.length : institutionVisible[group.label] ?? 5
          return (
            <div className="institution-group" key={group.label}>
              <InstitutionTreeRow
                label={group.label} count={group.count} level={1} checked={allSelected} expandable={group.children.length > 0} expanded={isOpen}
                onChange={() => toggleInstitutionGroup(group)}
                onExpand={() => setOpenInstitutionGroups((current) => current.includes(group.label) ? current.filter((item) => item !== group.label) : [...current, group.label])}
              />
              {isOpen && (
                <div className="institution-tree-children level-two-list">
                  {(query ? matchingNodes : matchingNodes.slice(0, visible)).map((node) => {
                    const nodeKey = `${group.label}/${node.label}`
                    const nodeValues = nodeKnownValues(node)
                    const nodeSelected = node.custom ? customInstitutionEnabled.includes(nodeKey) : nodeValues.length > 0 && nodeValues.every((value) => filters.institutions.includes(value))
                    const matchingChildren = !query || groupLabelMatches || node.label.includes(query) ? node.children ?? [] : node.children?.filter((child) => child.label.includes(query)) ?? []
                    const nodeOpen = Boolean(node.children?.length) && (query ? matchingChildren.length > 0 : openInstitutionNodes.includes(nodeKey))
                    const nodeVisible = query ? matchingChildren.length : institutionNodeVisible[nodeKey] ?? 5
                    return (
                      <div className="institution-node" key={nodeKey}>
                        <InstitutionTreeRow
                          label={node.label} count={node.count} level={2} checked={nodeSelected}
                          expandable={Boolean(node.children?.length)} expanded={nodeOpen}
                          onChange={() => toggleInstitutionNode(group, node)}
                          onExpand={() => setOpenInstitutionNodes((current) => current.includes(nodeKey) ? current.filter((item) => item !== nodeKey) : [...current, nodeKey])}
                        />
                        {node.custom && nodeSelected && (
                          <input
                            className="custom-institution-input"
                            value={customInstitutionValues[nodeKey] ?? ''}
                            onChange={(event) => updateCustomInstitution(nodeKey, event.target.value)}
                            placeholder={`请输入其他${group.label}名称`}
                            autoFocus
                          />
                        )}
                        {nodeOpen && node.children && (
                          <div className="institution-tree-children level-three-list">
                            {(query ? matchingChildren : matchingChildren.slice(0, nodeVisible)).map((leaf) => {
                              const leafKey = `${nodeKey}/${leaf.label}`
                              const leafSelected = leaf.custom ? customInstitutionEnabled.includes(leafKey) : filters.institutions.includes(leaf.label)
                              return (
                                <div className="institution-leaf" key={leafKey}>
                                  <InstitutionTreeRow
                                    label={leaf.label} count={leaf.count} level={3}
                                    checked={leafSelected} onChange={() => toggleInstitutionLeaf(group, node, leaf)}
                                  />
                                  {leaf.custom && leafSelected && (
                                    <input
                                      className="custom-institution-input"
                                      value={customInstitutionValues[leafKey] ?? ''}
                                      onChange={(event) => updateCustomInstitution(leafKey, event.target.value)}
                                      placeholder="请输入其他院系名称"
                                      autoFocus
                                    />
                                  )}
                                </div>
                              )
                            })}
                            {!query && <ExpandButton visible={nodeVisible} total={node.children.length} onExpand={() => setInstitutionNodeVisible((current) => ({ ...current, [nodeKey]: Math.min(nodeVisible + 5, node.children!.length) }))} onCollapse={() => setInstitutionNodeVisible((current) => ({ ...current, [nodeKey]: 5 }))} />}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {!query && <ExpandButton visible={visible} total={group.children.length} onExpand={() => setInstitutionVisible((current) => ({ ...current, [group.label]: Math.min(visible + 5, group.children.length) }))} onCollapse={() => setInstitutionVisible((current) => ({ ...current, [group.label]: 5 }))} />}
                </div>
              )}
            </div>
          )
        })}
        </>}
      </section>

      <SimpleFacet title="语料规模" options={corpusSizeOptions} selected={filters.corpusSizes} onToggle={(value) => update('corpusSizes', toggleValue(filters.corpusSizes, value))} />
      <SimpleFacet title="存储容量" options={storageOptions} selected={filters.storageSizes} onToggle={(value) => update('storageSizes', toggleValue(filters.storageSizes, value))} />
    </aside>
  )
}

function SimpleFacet({ title, options, selected, onToggle }: { title: string; options: Option[]; selected: string[]; onToggle: (value: string) => void }) {
  const [visible, setVisible] = useState(5)
  const [expanded, setExpanded] = useState(true)
  return (
    <section className="facet-section">
      <FacetTitle title={title} expanded={expanded} onToggle={() => setExpanded((value) => !value)} />
      {expanded && <>
        {options.slice(0, visible).map((option) => <OptionRow key={option.label} option={option} checked={selected.includes(option.label)} onChange={() => onToggle(option.label)} />)}
        <ExpandButton visible={visible} total={options.length} onExpand={() => setVisible((value) => Math.min(value + 5, options.length))} onCollapse={() => setVisible(5)} />
      </>}
    </section>
  )
}
