# ui-polish

主题接管插件:注入 UI-token 默认层(CSS variables)+ 支持 `$ST_HOME/data/frontend/<name>/` 持久化定制(html/css/js),启动自动生效。

## 契约

### 1. UI-token(命名空间 --ui-)

| token | 默认 | 含义 |
|---|---|---|
| --ui-bg | #f5f5f5 | 页面背景 |
| --ui-surface | #ffffff | 面板/弹窗/浮层背景 |
| --ui-border | #e0e0e0 | 细边框 |
| --ui-border-strong | #ccc | 按钮描边 |
| --ui-text | #444444 | 主文本 |
| --ui-text-muted | #888888 | 次要文本/图标 |
| --ui-accent | #333333 | 强调色 |
| --ui-accent-soft | #f0f0f0 | 强调弱底 |
| --ui-accent-ring | rgba(51,51,51,0.15) | 焦点外环 |
| --ui-on-accent | #ffffff | 强调色上文字 |
| --ui-danger | #d9534f | 危险 |
| --ui-danger-soft | #fef3f2 | 危险弱底 |
| --ui-warning | #e6a23c | 警告 |
| --ui-success | #52c41a | 成功 |
| --ui-success-soft | #f6ffed | 成功弱底 |
| --ui-overlay | rgba(0, 0, 0, 0.28) | 遮罩 |
| --ui-radius-s | 4px | 小圆角 |
| --ui-radius-m | 6px | 大圆角 |
| --ui-shadow-m | 0 4px 16px rgba(0, 0, 0, 0.12) | 浮层阴影 |

### 2. 消费方迁移指南(插件前端)

- 样式里所有主题相关颜色/圆角替换为 `var(--ui-<token>, <原值>)`;**原值必须保留为回退参数**(ui-polish 缺席时外观不变)。
- 例:`background:#fff` → `background:var(--ui-surface,#fff)`;`color:#333` → `color:var(--ui-accent,#333)`。
- 不 import ui-polish(各插件独立 bundle);只写 var 字符串。
- 插件自身结构/布局类 CSS 与尺寸不属于 token,保持硬编码。

### 3. 定制目录与文件语义($ST_HOME/data/frontend/<name>/)

- `<name>` 仅 `[A-Za-z0-9_-]`;每目录 = 一套完整定制(html/css/js 三个无扩展名文件,均可缺省)。
- 激活:ui-polish 配置 `active: '<name>'`;缺省回退 `default/` 目录;再无 → 仅默认 token 层。
- `css`:后注入,天然覆盖默认 token 与默认美化(写 `:root{ --ui-accent:#f00 }` 即换强调色)。
- `html`:注入 body 末尾 `#ui-polish-host` 容器,**叠加式**;要掩埋宿主基础 UI 时在 css 中写 `[data-slot]{ display:none }`。
- `js`:注入 body 末尾 script,执行体已包 try/catch(错误仅 console.error)。副作用不可回滚 —— 视为增强层。

### 4. 注入顺序(浏览器端,启动即自动)

1. `style#ui-polish-tokens`(:root token 默认)
2. `style#ui-polish-default`(默认主题美化)
3. `style#ui-polish-css`(用户 css,覆盖 1/2)
4. `div#ui-polish-host`(用户 html)
5. `script#ui-polish-js`(用户 js)

优先级:**用户 css > ui-polish 默认(token+美化)> 消费方回退**。全部节点以 id 幂等(重复挂载先清旧)。

### 5. 后端 API

`GET /api/ui-polish/current` → `{ ok, name, html, css, js }`(name 为激活目录名或 null;字段缺省为 null)。
