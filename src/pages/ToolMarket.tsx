import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import toolMarketData from '../data/tool-market.json'

type Subject = '数学' | '物理' | '化学' | '天文' | '地理' | '生物'

type ToolRecord = {
  id: string
  subject: Subject
  name: string
  description: string
  sourceSheet: string
  sourceRow: number
}

const tools = toolMarketData as ToolRecord[]
const subjects: Array<'全部工具' | Subject> = ['全部工具', '数学', '物理', '化学', '天文', '地理', '生物']
const suggestedKeywords = ['实验', '训练', '抽取', '图像', '对齐', '标注']
const PAGE_SIZE = 12

function visiblePageNumbers(current: number, total: number) {
  const start = Math.max(1, Math.min(current - 2, total - 4))
  const end = Math.min(total, start + 4)
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightKeyword(text: string, keyword: string) {
  const searchTerm = keyword.trim()
  if (!searchTerm) return text

  const normalizedSearchTerm = searchTerm.toLocaleLowerCase('zh-CN')
  const parts = text.split(new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi'))

  return parts.map((part, index) => {
    if (part.toLocaleLowerCase('zh-CN') !== normalizedSearchTerm) return part
    return (
      <mark className="tool-search-highlight" key={`${part}-${index}`}>
        {part}
      </mark>
    )
  })
}

export default function ToolMarket() {
  const [subject, setSubject] = useState<(typeof subjects)[number]>('全部工具')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)

  const normalizedKeyword = keyword.trim().toLocaleLowerCase('zh-CN')

  const keywordMatchedTools = useMemo(() => {
    return tools.filter((tool) => {
      const keywordMatched = !normalizedKeyword || [tool.name, tool.description, tool.subject]
        .some((value) => value.toLocaleLowerCase('zh-CN').includes(normalizedKeyword))
      return keywordMatched
    })
  }, [normalizedKeyword])

  const subjectCounts = useMemo(() => {
    const counts = new Map<string, number>([['全部工具', keywordMatchedTools.length]])
    subjects.slice(1).forEach((item) => {
      counts.set(item, keywordMatchedTools.filter((tool) => tool.subject === item).length)
    })
    return counts
  }, [keywordMatchedTools])

  const filteredTools = useMemo(() => {
    return keywordMatchedTools.filter((tool) => subject === '全部工具' || tool.subject === subject)
  }, [keywordMatchedTools, subject])

  const pageCount = Math.max(1, Math.ceil(filteredTools.length / PAGE_SIZE))
  const pageTools = filteredTools.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const chooseSubject = (nextSubject: (typeof subjects)[number]) => {
    setSubject(nextSubject)
    setPage(1)
  }

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setKeyword(keywordInput.trim())
    setPage(1)
  }

  const clearSearch = () => {
    setKeywordInput('')
    setKeyword('')
    setPage(1)
  }

  const searchSuggestedKeyword = (nextKeyword: string) => {
    setKeywordInput(nextKeyword)
    setKeyword(nextKeyword)
    setPage(1)
  }

  const goToPage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), pageCount))
    document.querySelector('.tool-market-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="tool-market-page">
      <section className="tool-market-hero">
        <div className="tool-market-hero-inner">
          <h1>工具链市场</h1>
          <p>汇聚六大学科语料加工工具，服务科学语料采集、解析、清洗、标注、对齐与质量评估</p>

          <form className="tool-market-search" onSubmit={submitSearch} role="search">
            <Search aria-hidden="true" />
            <input
              aria-label="搜索工具链"
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="搜索工具链"
              type="search"
              value={keywordInput}
            />
            {keywordInput && (
              <button className="tool-market-search-clear" type="button" onClick={clearSearch} aria-label="清空搜索">
                <X aria-hidden="true" />
              </button>
            )}
            <button className="tool-market-search-submit" type="submit">搜索</button>
          </form>

          <div className="tool-search-suggestions" aria-label="建议检索词">
            {suggestedKeywords.map((item) => (
              <button
                className={keyword === item ? 'is-active' : ''}
                key={item}
                onClick={() => searchSuggestedKeyword(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="tool-market-content">
        <aside className="tool-subject-sidebar" aria-label="按学科领域筛选">
          <h2>按学科领域</h2>
          <div className="tool-subject-list">
            {subjects.map((item) => (
              <button
                className={subject === item ? 'is-active' : ''}
                key={item}
                onClick={() => chooseSubject(item)}
                type="button"
              >
                <span>{item}</span>
                <small>{subjectCounts.get(item) ?? 0}</small>
              </button>
            ))}
          </div>
        </aside>

        <div className="tool-results-panel">
          <header className="tool-results-header">
            <div>
              <h2>{subject}</h2>
              <p>共收录 <strong>{filteredTools.length}</strong> 条工具链</p>
            </div>
          </header>

          {pageTools.length > 0 ? (
            <div className="tool-card-grid">
              {pageTools.map((tool) => (
                <article
                  className="tool-market-card"
                  key={tool.id}
                  tabIndex={0}
                >
                  <div className="tool-card-heading">
                    <span className="tool-subject-tag">{tool.subject}</span>
                    <h3>{highlightKeyword(tool.name, keyword)}</h3>
                  </div>
                  <div className="tool-card-description">
                    <strong>处理场景</strong>
                    <p>{highlightKeyword(tool.description, keyword)}</p>
                  </div>

                  <div className="tool-card-hover-detail" role="tooltip">
                    <strong>{highlightKeyword(tool.name, keyword)}</strong>
                    <p>{highlightKeyword(tool.description, keyword)}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="tool-market-empty">
              <Search aria-hidden="true" />
              <h3>暂未找到符合条件的工具链</h3>
              <p>请尝试更换关键词</p>
              <button type="button" onClick={clearSearch}>清空搜索</button>
            </div>
          )}

          {filteredTools.length > PAGE_SIZE && (
            <nav className="tool-market-pagination" aria-label="工具链分页">
              <button disabled={page === 1} onClick={() => goToPage(page - 1)} type="button">上一页</button>
              {visiblePageNumbers(page, pageCount).map((pageNumber) => (
                <button
                  aria-current={page === pageNumber ? 'page' : undefined}
                  className={page === pageNumber ? 'is-active' : ''}
                  key={pageNumber}
                  onClick={() => goToPage(pageNumber)}
                  type="button"
                >
                  {pageNumber}
                </button>
              ))}
              <button disabled={page === pageCount} onClick={() => goToPage(page + 1)} type="button">下一页</button>
            </nav>
          )}
        </div>
      </section>

    </div>
  )
}
