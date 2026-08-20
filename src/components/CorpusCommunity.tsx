import { useEffect, useMemo, useState } from 'react'
import { Building2, Factory, FlaskConical, GraduationCap, MapPinned, UsersRound } from 'lucide-react'
import { ecosystemGroups } from '../data/ecosystem'

type Position = [number, number]

type ProvinceGeometry = {
  type: 'Polygon' | 'MultiPolygon'
  coordinates: Position[][] | Position[][][]
}

type ProvinceFeature = {
  type: 'Feature'
  properties: {
    adcode?: number
    name?: string
  }
  geometry: ProvinceGeometry
}

type ProvinceCollection = {
  type: 'FeatureCollection'
  features: ProvinceFeature[]
}

type CategoryKey = 'university' | 'enterprise' | 'institute' | 'individual'

type CommunityMetric = {
  corpusSets: number
  corpusRows: number
  corpusScale: number
}

type CategoryDefinition = {
  key: CategoryKey
  title: string
  shortTitle: string
  icon: typeof GraduationCap
  national: CommunityMetric
}

type ActorCard = {
  key: CategoryKey
  title: string
  icon: typeof GraduationCap
  features: string[]
}

const MAP_WIDTH = 760
const MAP_HEIGHT = 520
const MAP_PADDING = 22

const categoryDefinitions: CategoryDefinition[] = [
  {
    key: 'university',
    title: '高校',
    shortTitle: '高校',
    icon: GraduationCap,
    national: { corpusSets: 428, corpusRows: 46.8, corpusScale: 18.6 },
  },
  {
    key: 'enterprise',
    title: '企业',
    shortTitle: '企业',
    icon: Building2,
    national: { corpusSets: 186, corpusRows: 21.4, corpusScale: 8.9 },
  },
  {
    key: 'institute',
    title: '新型研发机构',
    shortTitle: '研发机构',
    icon: FlaskConical,
    national: { corpusSets: 152, corpusRows: 14.7, corpusScale: 7.1 },
  },
  {
    key: 'individual',
    title: '个人',
    shortTitle: '个人',
    icon: UsersRound,
    national: { corpusSets: 134, corpusRows: 9.1, corpusScale: 3.4 },
  },
]

const referenceRegions = new Set(['香港特别行政区', '澳门特别行政区', '台湾省'])

const regionWeights: Record<string, number> = {
  北京市: 0.148,
  广东省: 0.121,
  上海市: 0.103,
  江苏省: 0.092,
  浙江省: 0.081,
  湖北省: 0.061,
  山东省: 0.057,
  四川省: 0.052,
  福建省: 0.047,
  陕西省: 0.044,
}

const highlightedRegions = ['北京市', '广东省', '上海市', '江苏省', '浙江省', '湖北省', '山东省', '四川省']

const categoryWeights: Record<CategoryKey, number> = {
  university: 1,
  enterprise: 0.92,
  institute: 0.78,
  individual: 0.7,
}

const communityActorCards: ActorCard[] = [
  {
    key: 'university',
    title: '高校',
    icon: GraduationCap,
    features: ['学科体系', '专家校验', '教学科研资源'],
  },
  {
    key: 'enterprise',
    title: '企业',
    icon: Factory,
    features: ['工具能力', '应用场景', '工程反馈'],
  },
  {
    key: 'institute',
    title: '新型研发机构',
    icon: FlaskConical,
    features: ['前沿项目', '实验数据', '协同攻关'],
  },
  {
    key: 'individual',
    title: '个人',
    icon: UsersRound,
    features: ['知识补充', '语料标注', '社区反馈'],
  },
]

const communityPartners = Object.entries(ecosystemGroups).flatMap(([group, value]) => (
  value.members.map((member) => ({ ...member, group }))
))

const partnerRows = [
  communityPartners.slice(0, Math.ceil(communityPartners.length / 2)),
  communityPartners.slice(Math.ceil(communityPartners.length / 2)),
]

function visitCoordinates(geometry: ProvinceGeometry, callback: (position: Position) => void) {
  const polygons = geometry.type === 'Polygon'
    ? [geometry.coordinates as Position[][]]
    : geometry.coordinates as Position[][][]

  polygons.forEach((polygon) => {
    polygon.forEach((ring) => ring.forEach(callback))
  })
}

function buildProjection(features: ProvinceFeature[]) {
  let minLongitude = Number.POSITIVE_INFINITY
  let maxLongitude = Number.NEGATIVE_INFINITY
  let minLatitude = Number.POSITIVE_INFINITY
  let maxLatitude = Number.NEGATIVE_INFINITY

  features.forEach((feature) => {
    visitCoordinates(feature.geometry, ([longitude, latitude]) => {
      minLongitude = Math.min(minLongitude, longitude)
      maxLongitude = Math.max(maxLongitude, longitude)
      minLatitude = Math.min(minLatitude, latitude)
      maxLatitude = Math.max(maxLatitude, latitude)
    })
  })

  const longitudeSpan = maxLongitude - minLongitude
  const latitudeSpan = maxLatitude - minLatitude
  const scale = Math.min(
    (MAP_WIDTH - MAP_PADDING * 2) / longitudeSpan,
    (MAP_HEIGHT - MAP_PADDING * 2) / latitudeSpan,
  )
  const contentWidth = longitudeSpan * scale
  const contentHeight = latitudeSpan * scale
  const xOffset = (MAP_WIDTH - contentWidth) / 2
  const yOffset = (MAP_HEIGHT - contentHeight) / 2

  return ([longitude, latitude]: Position): Position => [
    xOffset + (longitude - minLongitude) * scale,
    yOffset + (maxLatitude - latitude) * scale,
  ]
}

function geometryToPath(geometry: ProvinceGeometry, project: (position: Position) => Position) {
  const polygons = geometry.type === 'Polygon'
    ? [geometry.coordinates as Position[][]]
    : geometry.coordinates as Position[][][]

  return polygons
    .flatMap((polygon) => polygon.map((ring) => {
      if (!ring.length) return ''
      return ring.map((position, index) => {
        const [x, y] = project(position)
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
      }).join(' ') + ' Z'
    }))
    .join(' ')
}

function getGeometryCenter(geometry: ProvinceGeometry): Position {
  let minLongitude = Number.POSITIVE_INFINITY
  let maxLongitude = Number.NEGATIVE_INFINITY
  let minLatitude = Number.POSITIVE_INFINITY
  let maxLatitude = Number.NEGATIVE_INFINITY

  visitCoordinates(geometry, ([longitude, latitude]) => {
    minLongitude = Math.min(minLongitude, longitude)
    maxLongitude = Math.max(maxLongitude, longitude)
    minLatitude = Math.min(minLatitude, latitude)
    maxLatitude = Math.max(maxLatitude, latitude)
  })

  return [
    (minLongitude + maxLongitude) / 2,
    (minLatitude + maxLatitude) / 2,
  ]
}

function stableHash(value: string) {
  return Array.from(value).reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 7)
}

function getProvinceMetric(province: string, definition: CategoryDefinition): CommunityMetric {
  const baseWeight = regionWeights[province] ?? (0.018 + (stableHash(province) % 31) / 1000)
  const weight = Math.min(baseWeight * categoryWeights[definition.key], 0.16)

  return {
    corpusSets: Math.max(1, Math.round(definition.national.corpusSets * weight)),
    corpusRows: Math.max(0.1, definition.national.corpusRows * weight),
    corpusScale: Math.max(0.01, definition.national.corpusScale * weight),
  }
}

function formatMetric(metric: CommunityMetric) {
  return {
    corpusSets: `${metric.corpusSets}个`,
    corpusRows: `${metric.corpusRows.toFixed(metric.corpusRows >= 10 ? 1 : 2)}亿条`,
    corpusScale: `${metric.corpusScale.toFixed(metric.corpusScale >= 10 ? 1 : 2)}PB`,
  }
}

export default function CorpusCommunity() {
  const [geoData, setGeoData] = useState<ProvinceCollection | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [activeProvince, setActiveProvince] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch(`${import.meta.env.BASE_URL}data/china-provinces.geojson`)
      .then((response) => {
        if (!response.ok) throw new Error('地图数据加载失败')
        return response.json() as Promise<ProvinceCollection>
      })
      .then((data) => {
        if (!cancelled) setGeoData(data)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const mapFeatures = useMemo(() => {
    const namedFeatures = geoData?.features.filter((feature) => feature.properties.name) ?? []
    if (!namedFeatures.length) return []
    const project = buildProjection(namedFeatures)
    return namedFeatures.map((feature) => ({
      feature,
      path: geometryToPath(feature.geometry, project),
      center: project(getGeometryCenter(feature.geometry)),
    }))
  }, [geoData])

  const regionMarkers = useMemo(() => mapFeatures
    .filter(({ feature }) => highlightedRegions.includes(feature.properties.name ?? ''))
    .map(({ feature, center }) => {
      const name = feature.properties.name ?? ''
      const weight = regionWeights[name] ?? 0.04
      return {
        name,
        center,
        radius: 5 + weight * 44,
      }
    }), [mapFeatures])

  const visibleMetrics = useMemo(() => categoryDefinitions.map((definition) => ({
    ...definition,
    metric: activeProvince ? getProvinceMetric(activeProvince, definition) : definition.national,
  })), [activeProvince])

  const actorFeatures = useMemo(() => new Map(communityActorCards.map((card) => [card.key, card.features])), [])

  return (
    <section className="corpus-community-section" aria-labelledby="community-title">
      <div className="community-section-inner">
        <header className="community-section-heading">
          <h2 id="community-title">数据社区 · 共建共享</h2>
        </header>

        <div className="community-layout">
          <section
            className="community-map-panel"
            aria-label="全国科学语料建设分布地图"
            onMouseLeave={() => setActiveProvince(null)}
          >
            <div className="community-panel-bar">
              <div>
                <MapPinned size={18} />
                <span>全国建设分布</span>
              </div>
            </div>

            <div className="china-map-wrap">
              {loadError && <div className="map-load-state">地图数据暂未加载，请刷新页面重试</div>}
              {!geoData && !loadError && <div className="map-load-state">正在加载全国地图…</div>}
              {!!mapFeatures.length && (
                <svg
                  className="china-community-map"
                  viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                  role="img"
                  aria-label="中国省级区域地图"
                >
                  <defs>
                    <filter id="province-active-glow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  {mapFeatures.map(({ feature, path }) => {
                    const name = feature.properties.name ?? ''
                    const isReference = referenceRegions.has(name)
                    const isActive = activeProvince === name
                    return (
                      <path
                        key={`${feature.properties.adcode ?? name}-${name}`}
                        className={`province-shape${isActive ? ' is-active' : ''}${isReference ? ' is-reference' : ''}`}
                        d={path}
                        fillRule="evenodd"
                        vectorEffect="non-scaling-stroke"
                        tabIndex={isReference ? -1 : 0}
                        role={isReference ? undefined : 'button'}
                        aria-label={isReference ? `${name}边界` : `查看${name}语料数据`}
                        onMouseEnter={() => !isReference && setActiveProvince(name)}
                        onClick={() => !isReference && setActiveProvince(name)}
                        onFocus={() => !isReference && setActiveProvince(name)}
                        onBlur={() => setActiveProvince(null)}
                        onKeyDown={(event) => {
                          if (!isReference && (event.key === 'Enter' || event.key === ' ')) {
                            event.preventDefault()
                            setActiveProvince(name)
                          }
                        }}
                      />
                    )
                  })}
                  {regionMarkers.map(({ name, center: [x, y], radius }) => {
                    const isActive = activeProvince === name
                    return (
                      <g
                        className={`province-marker${isActive ? ' is-active' : ''}`}
                        key={name}
                        role="button"
                        tabIndex={0}
                        aria-label={`查看${name}重点建设数据`}
                        onMouseEnter={() => setActiveProvince(name)}
                        onFocus={() => setActiveProvince(name)}
                        onClick={() => setActiveProvince(name)}
                        onBlur={() => setActiveProvince(null)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setActiveProvince(name)
                          }
                        }}
                      >
                        <title>{name}</title>
                        <circle className="marker-pulse" cx={x} cy={y} r={radius + 4} />
                        <circle className="marker-core" cx={x} cy={y} r={radius} />
                      </g>
                    )
                  })}
                </svg>
              )}
            </div>

            <div className="community-map-legend" aria-hidden="true">
              <span><i className="legend-normal" />省级区域</span>
              <span><i className="legend-active" />当前区域</span>
            </div>
          </section>

          <aside className="community-summary-panel" aria-live="polite">
            <div className="community-summary-heading">
              <div>
                <span>{activeProvince ? '省级数据' : '全国数据'}</span>
                <h3>{activeProvince ? `${activeProvince}汇总` : '全国汇总'}</h3>
              </div>
            </div>

            <div className="community-card-grid">
              {visibleMetrics.map(({ key, title, icon: Icon, metric }) => {
                const formatted = formatMetric(metric)
                const features = actorFeatures.get(key) ?? []
                return (
                  <article className={`community-data-card category-${key}`} key={key}>
                    <header>
                      <div className="community-data-title-row">
                        <span className="community-category-icon"><Icon size={19} /></span>
                        <h4>{title}</h4>
                      </div>
                      <div className="community-data-features" aria-label={`${title}建设特点`}>
                        {features.map((feature) => <span key={feature}>{feature}</span>)}
                      </div>
                    </header>
                    <dl>
                      <div><dt>语料集</dt><dd>{formatted.corpusSets}</dd></div>
                      <div><dt>语料条数</dt><dd>{formatted.corpusRows}</dd></div>
                      <div><dt>语料规模</dt><dd>{formatted.corpusScale}</dd></div>
                    </dl>
                  </article>
                )
              })}
            </div>
          </aside>
        </div>

        <section className="community-partners-section" aria-labelledby="community-partners-title">
          <header className="community-subsection-heading">
            <h3 id="community-partners-title">共建伙伴</h3>
          </header>
          <div className="partner-marquee-stack" aria-label="语料共建方列表">
            {partnerRows.map((row, index) => (
              <div className={`partner-marquee-row ${index === 1 ? 'is-reverse' : ''}`} key={index}>
                <div className="partner-marquee-track">
                  {[...row, ...row].map((partner, partnerIndex) => (
                    <div className="partner-logo-card" key={`${partner.name}-${partnerIndex}`} aria-hidden={partnerIndex >= row.length}>
                      {partner.logo ? <img src={partner.logo} alt="" /> : <i>{partner.name.slice(0, 2)}</i>}
                      <div>
                        <strong>{partner.name}</strong>
                        <span>{partner.group}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </section>
  )
}
