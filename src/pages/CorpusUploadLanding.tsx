import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FolderOpen,
  Rocket,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react'
import { useApp } from '../context/app-context'

const flowSteps = [
  { title: '01 语料准备', description: '整理语料文件及权益说明，确保格式正确、内容完整' },
  { title: '02 提交申请', description: '在线填写语料基本信息，确保提交内容完整、准确，并根据要求上传示例数据、公开数据' },
  { title: '03 审核与反馈', description: '平台管理员对提交的申请进行审核，请及时反馈需要补充或调整的内容' },
  { title: '04 成功入库', description: '语料入库成功后将完成质量与结构复核，确认开放范围与存储信息无误，等待发布上架' },
  { title: '05 发布成功', description: '完成语料发布，让建设成果被发现、使用和持续完善' },
]

const flowIcons = [FolderOpen, Upload, ClipboardCheck, ShieldCheck, Rocket]

const complianceItems = [
  {
    title: '内容与权属',
    text: '提交人应如实填写作者、联系方式、所在单位、发布机构和语料基本信息，保证提交信息与实际语料内容一致，并确认对所提交语料拥有合法权利或已经取得必要授权。涉及合作单位、第三方数据库、出版物、图片、音视频、代码等内容时，应确保汇交、加工、存储和共享行为符合相应授权范围，不得提交来源不明或侵犯他人合法权益的内容。',
  },
  {
    title: '安全与合规',
    text: '不得上传、处理或传播涉及国家秘密、工作秘密以及法律法规禁止公开的内容。涉及个人信息、医疗健康、人类遗传资源、敏感地理位置、未公开科研成果或其他受限制数据时，应提前完成必要的脱敏、匿名化、授权或伦理审查，并根据实际情况设置合适的开放范围。',
  },
  {
    title: '文件质量与开放使用',
    text: '提交的语料应真实、完整并能够正常读取，文件结构和命名应保持清晰，语料介绍应与实际内容一致。建议同时提供 README、数据来源等辅助材料。提交人应根据语料权属和共享条件选择许可协议及公开或不公开的开放程度。所有开放程度均需提供不含敏感信息的示例数据。',
  },
  {
    title: '审核与持续维护',
    text: '平台管理员可以对申请信息、文件完整性、权属说明、安全要求和开放范围进行审核，并要求提交人补充或修改材料。语料库管理员可以对上传的语料进行审核，并要求提交人补充或修改材料。审核通过后的语料可以继续补充和更新，基本信息变更、文件替换等调整应重新进入审核流程。发现语料存在权属争议、安全风险或严重质量问题时，平台可以暂停展示、限制访问或启动下架处理。',
  },
]

export default function CorpusUploadLanding() {
  const navigate = useNavigate()
  const { user, openAuth } = useApp()
  const [agreementOpen, setAgreementOpen] = useState(false)

  const startSubmit = () => {
    if (user) {
      navigate('/upload/form')
      return
    }
    openAuth('/upload/form')
  }

  return (
    <main className="upload-landing-page">
      <section className="upload-landing-hero">
        <h1>汇聚高质量科学语料<br /><span>共建共享科学语料资源</span></h1>
        <p>汇交您的科学语料，凝聚共建力量，共同推动科学智能发展</p>
        <div className="upload-landing-actions">
          <button className="upload-landing-start" type="button" onClick={startSubmit}><Upload size={17} />开始汇交</button>
          <button className="upload-landing-agreement" type="button" onClick={() => setAgreementOpen(true)}>服务协议<ArrowRight size={16} /></button>
        </div>
      </section>

      <section className="upload-landing-flow">
        <h2>语料汇交流程</h2>
        <ol>
          {flowSteps.map((step, index) => {
            const Icon = flowIcons[index]
            return (
              <li key={step.title}>
                <div className="upload-flow-visual">
                  <span className="upload-flow-index">{String(index + 1).padStart(2, '0')}</span>
                  <i><Icon size={30} /></i>
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                {index < flowSteps.length - 1 && <em className="upload-flow-arrow" aria-hidden="true">❯❯❯</em>}
              </li>
            )
          })}
        </ol>
      </section>

      <section className="upload-landing-compliance">
        <h2>汇交规范与责任说明</h2>
        <div className="upload-compliance-list">
          {complianceItems.map((item, index) => (
            <article key={item.title}>
              <span className="upload-compliance-index">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <p className="upload-landing-note"><strong>重要提示：</strong>提交数据即表示您已阅读并同意以上所有条款</p>

      {agreementOpen && (
        <div className="dataset-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setAgreementOpen(false) }}>
          <section className="dataset-modal upload-agreement-modal" role="dialog" aria-modal="true">
            <div className="dataset-modal-title"><div><ShieldCheck size={21} /><h2>服务协议</h2></div><button type="button" onClick={() => setAgreementOpen(false)} aria-label="关闭"><X size={18} /></button></div>
            <p>服务协议正在拟定中，正式发布后将在本弹窗中完整展示，敬请期待。</p>
            <div className="dataset-modal-actions">
              <button type="button" className="is-primary" onClick={() => setAgreementOpen(false)}><CheckCircle2 size={15} />我知道了</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
