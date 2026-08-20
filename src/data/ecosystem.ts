export type EcosystemKey = '高校' | '科研机构' | '企业' | '个人'

export type EcosystemMember = {
  name: string
  logo?: string
}

const logo = (name: string) => `${import.meta.env.BASE_URL}images/partners/${name}`

export const ecosystemGroups: Record<EcosystemKey, { summary: string; members: EcosystemMember[] }> = {
  高校: {
    summary: '提供学科体系、专业人才与高质量学科语料',
    members: [
      { name: '北京大学', logo: logo('pku.svg') },
      { name: '清华大学', logo: logo('tsinghua.webp') },
      { name: '厦门大学', logo: logo('xiamen.jpg') },
      { name: '南京大学', logo: logo('nanjing.webp') },
      { name: '武汉大学', logo: logo('wuhan.webp') },
      { name: '复旦大学', logo: logo('fudan.png') },
      { name: '上海交通大学', logo: logo('sjtu.jpg') },
    ],
  },
  科研机构: {
    summary: '汇聚科研数据、实验资源与前沿科学成果',
    members: [
      { name: '鹏城实验室', logo: logo('pengcheng.jpeg') },
    ],
  },
  企业: {
    summary: '提供技术工具、数据资源与应用场景',
    members: [
      { name: '华为', logo: logo('huawei.jpeg') },
      { name: '万方数据', logo: logo('wanfang.jpeg') },
      { name: '京能集团', logo: logo('jingneng.jpg') },
      { name: '百度', logo: logo('baidu.jpeg') },
      { name: '字节跳动', logo: logo('bytedance.jpeg') },
      { name: '中国联通', logo: logo('unicom.jpeg') },
      { name: '蚂蚁集团', logo: logo('ant.jpg') },
    ],
  },
  个人: {
    summary: '贡献专业语料、领域知识与实际使用反馈',
    members: ['教师', '科研人员', '学生', '专业技术人员', '公众贡献者'].map((name) => ({ name })),
  },
}
