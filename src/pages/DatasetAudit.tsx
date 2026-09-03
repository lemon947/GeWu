import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft, FileClock, Search, ShieldCheck, X } from 'lucide-react'
import { corpusRecords } from './CorpusSearch'

type AuditTask = {
  id: string
  type: string
  content: string
  applicant: string
  appliedAt: string
  status?: '已通过' | '已拒绝'
  approver?: string
  approvedAt?: string
  remark?: string
}

type OperationLog = {
  operator: string
  time: string
  actionType: string
  content: string
}

const pendingTasks: AuditTask[] = [
  { id: 'REQ-20260830-01', type: '加入申请', content: '上传权限', applicant: '李思远', appliedAt: '2026-08-30 14:22' },
  { id: 'REQ-20260831-01', type: '数据上传', content: '数据URL', applicant: '建设编辑', appliedAt: '2026-08-31 09:10', remark: '数据集大小 1.2GB，共 12 个样例文件' },
]

const operationLogs: OperationLog[] = [
  { operator: 'Siora', time: '2026-08-12 11:27:27', actionType: '成员管理', content: '调整 1 名成员权限' },
  { operator: 'Siora', time: '2026-08-12 11:27:22', actionType: '成员管理', content: '调整 1 名成员权限' },
  { operator: 'Siora', time: '2026-08-12 11:27:10', actionType: '成员管理', content: '新增 1 名成员' },
  { operator: '微信用户d4md0', time: '2026-04-10 11:47:44', actionType: '成员管理', content: '新增 1 名成员' },
  { operator: '微信用户d4md0', time: '2026-04-10 11:47:43', actionType: '成员管理', content: '移除 1 名成员' },
  { operator: '微信用户d4md0', time: '2026-04-10 11:47:43', actionType: '编辑语料', content: '编辑语料：修改语料摘要、关键词' },
  { operator: '微信用户d4md0', time: '2026-04-10 11:47:43', actionType: '编辑语料', content: '编辑语料：修改语料摘要、关键词' },
]

function nowStamp() {
  const pad = (value: number) => String(value).padStart(2, '0')
  const date = new Date()
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function DatasetAudit() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const item = corpusRecords.find((record) => record.id === id) ?? corpusRecords[0]

  const [activeTab, setActiveTab] = useState<'审批任务' | '操作记录'>('审批任务')
  const [subTab, setSubTab] = useState<'待审批' | '已办结'>('待审批')
  const [pending, setPending] = useState<AuditTask[]>(pendingTasks)
  const [finished, setFinished] = useState<AuditTask[]>([])
  const [rejectTarget, setRejectTarget] = useState<AuditTask | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [toast, setToast] = useState('')

  // 待审批筛选
  const [filterId, setFilterId] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterAppliedFrom, setFilterAppliedFrom] = useState('')
  const [filterAppliedTo, setFilterAppliedTo] = useState('')
  // 已办结筛选
  const [filterStatus, setFilterStatus] = useState('')
  const [filterApprover, setFilterApprover] = useState('')
  const [filterApprovedFrom, setFilterApprovedFrom] = useState('')
  const [filterApprovedTo, setFilterApprovedTo] = useState('')
  // 操作记录筛选
  const [filterOperator, setFilterOperator] = useState('')
  const [filterOpType, setFilterOpType] = useState('')

  const flashToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate(`/search/datasets/${item.id}`)
  }

  const pendingFilteredCount = Number(Boolean(filterId)) + Number(Boolean(filterType)) + Number(Boolean(filterAppliedFrom)) + Number(Boolean(filterAppliedTo))
  const finishedFilterdCount = Number(Boolean(filterId)) + Number(Boolean(filterType)) + Number(Boolean(filterStatus)) + Number(Boolean(filterApprover)) + Number(Boolean(filterAppliedFrom)) + Number(Boolean(filterAppliedTo)) + Number(Boolean(filterApprovedFrom)) + Number(Boolean(filterApprovedTo))
  const logFilterCount = Number(Boolean(filterOperator)) + Number(Boolean(filterOpType))

  const visiblePending = useMemo(() => pending.filter((task) =>
    (!filterId || task.id.includes(filterId)) &&
    (!filterType || task.type === filterType) &&
    (!filterAppliedFrom || task.appliedAt.slice(0, 10) >= filterAppliedFrom) &&
    (!filterAppliedTo || task.appliedAt.slice(0, 10) <= filterAppliedTo)
  ), [pending, filterId, filterType, filterAppliedFrom, filterAppliedTo])

  const visibleFinished = useMemo(() => finished.filter((task) =>
    (!filterId || task.id.includes(filterId)) &&
    (!filterType || task.type === filterType) &&
    (!filterStatus || task.status === filterStatus) &&
    (!filterApprover || (task.approver ?? '').includes(filterApprover.trim())) &&
    (!filterAppliedFrom || task.appliedAt.slice(0, 10) >= filterAppliedFrom) &&
    (!filterAppliedTo || task.appliedAt.slice(0, 10) <= filterAppliedTo) &&
    (!filterApprovedFrom || (task.approvedAt ?? '').slice(0, 10) >= filterApprovedFrom) &&
    (!filterApprovedTo || (task.approvedAt ?? '').slice(0, 10) <= filterApprovedTo)
  ), [finished, filterId, filterType, filterStatus, filterApprover, filterAppliedFrom, filterAppliedTo, filterApprovedFrom, filterApprovedTo])

  const visibleLogs = useMemo(() => operationLogs.filter((log) =>
    (!filterOperator || log.operator.includes(filterOperator)) &&
    (!filterOpType || log.actionType === filterOpType)
  ), [filterOperator, filterOpType])

  const taskTypeOptions = ['加入申请', '数据上传']
  const logTypeOptions = ['成员管理', '编辑语料']

  const decide = (task: AuditTask, status: '已通过' | '已拒绝', reason = '') => {
    setPending((current) => current.filter((item) => item.id !== task.id))
    setFinished((current) => [
      {
        ...task,
        status,
        approver: '语料管理员',
        approvedAt: nowStamp(),
        remark: status === '已拒绝' ? reason : '',
      },
      ...current,
    ])
    setRejectTarget(null)
    setRejectReason('')
    flashToast(status === '已通过' ? '审批已通过' : '已拒绝该申请')
  }

  const resetPendingFilters = () => {
    setFilterId('')
    setFilterType('')
    setFilterAppliedFrom('')
    setFilterAppliedTo('')
  }

  const resetFinishedFilters = () => {
    setFilterId('')
    setFilterType('')
    setFilterStatus('')
    setFilterApprover('')
    setFilterAppliedFrom('')
    setFilterAppliedTo('')
    setFilterApprovedFrom('')
    setFilterApprovedTo('')
  }

  const fieldClass = 'audit-filter-row-label'
  const selectClass = 'audit-filter-select'
  const inputClass = 'audit-filter-input'

  return (
    <main className="dataset-audit-page">
      <button className="dataset-back-button" type="button" onClick={goBack}><ArrowLeft size={17} />返回</button>

      <section className="dataset-audit-shell">
        <header className="dataset-audit-head">
          <h1>数据审批</h1>
          <p>语料库：{item.title}</p>
        </header>

        <nav className="audit-tabs" aria-label="审批页分类">
          {(['审批任务', '操作记录'] as const).map((tab) => (
            <button className={activeTab === tab ? 'is-active' : ''} key={tab} type="button" onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </nav>

        {activeTab === '审批任务' && (
          <>
            <div className="audit-subtab-row">
              <div className="audit-subtabs">
                {(['待审批', '已办结'] as const).map((tab) => (
                  <button className={subTab === tab ? 'is-active' : ''} key={tab} type="button" onClick={() => setSubTab(tab)}>{tab}</button>
                ))}
              </div>
            </div>

            {subTab === '待审批' && (
              <div className="audit-filter-row">
                <label className={fieldClass}>ID<input className={inputClass} value={filterId} onChange={(event) => setFilterId(event.target.value)} placeholder="请输入ID" /></label>
                <label className={fieldClass}>类型<select className={selectClass} value={filterType} onChange={(event) => setFilterType(event.target.value)}><option value="">请选择</option>{taskTypeOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label className={fieldClass}>申请时间<span className="audit-date-range"><input type="date" value={filterAppliedFrom} onChange={(event) => setFilterAppliedFrom(event.target.value)} /><i>→</i><input type="date" value={filterAppliedTo} onChange={(event) => setFilterAppliedTo(event.target.value)} /></span></label>
                <button className="audit-reset" type="button" disabled={pendingFilteredCount === 0} onClick={resetPendingFilters}>重置</button>
              </div>
            )}

            {subTab === '已办结' && (
              <div className="audit-filter-row">
                <label className={fieldClass}>ID<input className={inputClass} value={filterId} onChange={(event) => setFilterId(event.target.value)} placeholder="请输入ID" /></label>
                <label className={fieldClass}>类型<select className={selectClass} value={filterType} onChange={(event) => setFilterType(event.target.value)}><option value="">请选择</option>{taskTypeOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label className={fieldClass}>状态<select className={selectClass} value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}><option value="">请选择</option><option>已通过</option><option>已拒绝</option></select></label>
                <label className={fieldClass}>审批人<input className={inputClass} value={filterApprover} onChange={(event) => setFilterApprover(event.target.value)} placeholder="搜索审批人" /></label>
                <label className={fieldClass}>申请时间<span className="audit-date-range"><input type="date" value={filterAppliedFrom} onChange={(event) => setFilterAppliedFrom(event.target.value)} /><i>→</i><input type="date" value={filterAppliedTo} onChange={(event) => setFilterAppliedTo(event.target.value)} /></span></label>
                <label className={fieldClass}>审批时间<span className="audit-date-range"><input type="date" value={filterApprovedFrom} onChange={(event) => setFilterApprovedFrom(event.target.value)} /><i>→</i><input type="date" value={filterApprovedTo} onChange={(event) => setFilterApprovedTo(event.target.value)} /></span></label>
                <button className="audit-reset" type="button" disabled={finishedFilterdCount === 0} onClick={resetFinishedFilters}>重置</button>
              </div>
            )}

            <div className="audit-table-wrap">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>ID</th><th>类型</th><th>申请内容</th>{subTab === '待审批' ? <><th>备注</th></> : <></>}<th>申请人</th><th>申请时间</th>
                    {subTab === '已办结' && <><th>状态</th><th>审批人</th><th>审批时间</th><th>审批备注</th></>}
                    {subTab === '待审批' && <th>操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {subTab === '待审批' ? visiblePending.map((task) => (
                    <tr key={task.id}>
                      <td>{task.id}</td><td>{task.type}</td><td>{task.content}</td><td>{task.remark || '—'}</td><td>{task.applicant}</td><td>{task.appliedAt}</td>
                      <td><span className="audit-row-actions"><button type="button" onClick={() => decide(task, '已通过')}>通过</button><button type="button" className="is-reject" onClick={() => { setRejectTarget(task); setRejectReason('') }}>拒绝</button></span></td>
                    </tr>
                  )) : visibleFinished.map((task) => (
                    <tr key={task.id}>
                      <td>{task.id}</td><td>{task.type}</td><td>{task.content}</td><td>{task.applicant}</td><td>{task.appliedAt}</td>
                      <td><span className={`audit-status is-${task.status === '已通过' ? 'pass' : 'reject'}`}>{task.status}</span></td>
                      <td>{task.approver}</td><td>{task.approvedAt}</td><td>{task.remark || '—'}</td>
                    </tr>
                  ))}
                  {(subTab === '待审批' ? visiblePending : visibleFinished).length === 0 && (
                    <tr><td colSpan={subTab === '已办结' ? 9 : 7}><div className="audit-empty"><FileClock size={46} /><p>暂无数据</p></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <footer className="audit-pagination">
              <span>共 {subTab === '待审批' ? visiblePending.length : visibleFinished.length} 条数据</span>
              <div><button type="button" aria-label="上一页">‹</button><b>1</b><button type="button" aria-label="下一页">›</button></div>
              <select aria-label="每页条数" defaultValue="10"><option>10 条/页</option><option>20 条/页</option><option>50 条/页</option></select>
            </footer>
          </>
        )}

        {activeTab === '操作记录' && (
          <>
            <div className="audit-filter-row">
              <label className={fieldClass}>操作人<input className={inputClass} value={filterOperator} onChange={(event) => setFilterOperator(event.target.value)} placeholder="搜索操作人" /></label>
              <label className={fieldClass}>操作时间<span className="audit-date-range"><input type="date" /><i>→</i><input type="date" /></span></label>
              <label className={fieldClass}>操作类型<select className={selectClass} value={filterOpType} onChange={(event) => setFilterOpType(event.target.value)}><option value="">请选择</option>{logTypeOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <button className="audit-reset" type="button" disabled={logFilterCount === 0} onClick={() => { setFilterOperator(''); setFilterOpType('') }}>重置</button>
              <button className="audit-export" type="button" onClick={() => flashToast('操作日志已导出')}>导出日志</button>
            </div>

            <div className="audit-table-wrap">
              <table className="audit-table">
                <thead>
                  <tr><th>操作人</th><th>操作时间</th><th>操作类型</th><th>操作内容</th></tr>
                </thead>
                <tbody>
                  {visibleLogs.map((log, index) => (
                    <tr key={index}>
                      <td>{log.operator}</td><td>{log.time}</td><td>{log.actionType}</td><td>{log.content}</td>
                    </tr>
                  ))}
                  {visibleLogs.length === 0 && <tr><td colSpan={4}><div className="audit-empty"><FileClock size={46} /><p>暂无数据</p></div></td></tr>}
                </tbody>
              </table>
            </div>

            <footer className="audit-pagination">
              <span>共 {visibleLogs.length} 条数据</span>
              <div><button type="button" aria-label="上一页">‹</button><b>1</b><button type="button" aria-label="下一页">›</button></div>
              <select aria-label="每页条数" defaultValue="10"><option>10 条/页</option><option>20 条/页</option><option>50 条/页</option></select>
            </footer>
          </>
        )}
      </section>

      {rejectTarget && (
        <div className="dataset-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setRejectTarget(null) }}>
          <section className="dataset-modal audit-reject-modal" role="dialog" aria-modal="true">
            <div className="dataset-modal-title"><div><ShieldCheck size={21} /><h2>拒绝申请</h2></div><button type="button" onClick={() => setRejectTarget(null)} aria-label="关闭"><X size={18} /></button></div>
            <p>申请：{rejectTarget.id} · {rejectTarget.type} · {rejectTarget.content}</p>
            <textarea
              rows={4}
              maxLength={300}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="请填写拒绝理由，将展示给申请人"
            />
            <div className="dataset-modal-actions">
              <button type="button" onClick={() => setRejectTarget(null)}>取消</button>
              <button type="button" className="is-primary" onClick={() => { if (!rejectReason.trim()) { flashToast('请填写拒绝理由'); return } decide(rejectTarget, '已拒绝', rejectReason.trim()) }}>确认拒绝</button>
            </div>
          </section>
        </div>
      )}

      {toast && <div className="dataset-toast"><Search size={16} />{toast}</div>}
    </main>
  )
}
