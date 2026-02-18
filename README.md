# 易千工作台前端

## 1. 概览

### 1.1 技术栈

- （代码质量）TypeScript / ESLint / Prettier
- （框架）Next.js / React
- （UI）TailwindCSS / Semi UI / Shadcn
- （工具）ahooks / classnames / dayjs
- Axios：网络请求
- Visactor：数据可视化
- WangEditor：富文本编辑器
- ExcelJS：工时报表导出
- QRCode：登录二维码生成

### 1.2 项目结构

```txt
├─.cursor       使用 Cursor 开发时用到的 Rules 和 Skills
├─api           API 接口（Server Action）
│  ├─qnxg       与工作台本身相关的接口
│  └─weihuda    与湖大微生活相关的接口
├─app           路由
├─components
│  ├─ui         Shadcn 的组件
│  └─XRichText  富文本编辑器组件
├─config        配置文件
├─lib           工具类文件
├─public        静态资源
└─utils         工具类文件
```
