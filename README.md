# 短链接管理后台

一个本地可一键运行的全栈短链接管理系统：React + Ant Design 前端，Node.js + Express + Prisma + MySQL 后端，Docker Compose 一键编排。

## 技术栈

- 前端：React 18 + Vite + Ant Design 5 + @ant-design/charts + axios + react-router-dom + zustand
- 后端：Node.js 20 + Express 4 + Prisma + MySQL 8 + JWT + bcryptjs + nanoid + zod
- 部署：Docker + Docker Compose（前端 nginx:alpine，后端 node:20-alpine，数据库 mysql:8.0）

## 功能概览

- 管理员账号登录（JWT 鉴权），未登录禁止访问任何管理接口
- 短链接管理：创建（自动生成 / 自定义短码、可选过期时间、可选最大点击数、可选备注）、分页搜索列表、编辑、启用/停用、删除
- 短码跳转：`GET /r/:code` 302 跳转；停用 / 过期 / 达到点击上限 → 410；不存在 → 404
- 点击统计：每次成功跳转记录时间、Referer、User-Agent、IP；详情页支持总点击数 + 近 30 天趋势
- 仪表盘：短链总数、总点击数、今日点击、活跃短链数、Top 10 排行、近 7 天趋势

## 一键启动

确保已安装 Docker Desktop（含 Docker Compose v2）。在项目根目录执行：

```bash
docker compose up -d --build
```

启动完成后浏览器访问：

- 前端管理后台：http://localhost:8080
- 短链跳转入口示例：http://localhost:8080/r/<短码>

默认管理员账号：

- 用户名：`admin`
- 密码：`admin123`

> 安全提示：生产环境请务必修改默认密码与 `JWT_SECRET`。

## 自定义端口

所有对外端口均通过环境变量配置，并提供合理默认值。可以复制 `.env.example` 为 `.env` 并修改，或直接通过环境变量传入：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `FRONTEND_PORT` | 8080 | 前端 Nginx 对外端口（用户访问入口） |
| `BACKEND_PORT` | 3000 | 后端 API 对外端口（前端会通过 Nginx 反代到容器内 3000，一般无需直接访问） |
| `DB_PORT` | 3306 | MySQL 对外映射端口（如本机已占用 3306 可改） |
| `MYSQL_ROOT_PASSWORD` | rootpass | MySQL root 密码 |
| `MYSQL_DATABASE` | shortlink | 业务数据库名 |
| `MYSQL_USER` | shortlink | 业务用户 |
| `MYSQL_PASSWORD` | shortlink123 | 业务密码 |
| `JWT_SECRET` | change-me-in-prod | JWT 签名密钥 |
| `JWT_EXPIRES_IN` | 24h | Token 过期时间 |
| `ADMIN_USERNAME` | admin | 默认管理员账号（仅在用户表为空时生效） |
| `ADMIN_PASSWORD` | admin123 | 默认管理员密码（仅在用户表为空时生效） |
| `PUBLIC_BASE_URL` | http://localhost:8080 | 短链对外基础地址 |

修改端口示例（PowerShell）：

```powershell
$env:FRONTEND_PORT=18080; $env:BACKEND_PORT=13000; $env:DB_PORT=13306
docker compose up -d --build
```

或使用 `.env` 文件：

```
FRONTEND_PORT=18080
BACKEND_PORT=13000
DB_PORT=13306
```

然后访问 `http://localhost:18080` 即可。

## 常用命令

```bash
# 查看日志
docker compose logs -f backend
docker compose logs -f frontend

# 停止并保留数据
docker compose down

# 完全清理（包含数据库数据卷）
docker compose down -v
```

## 目录结构

```
.
├── backend/              # Node.js 后端 (Express + Prisma)
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── routes/       # auth / links / stats / redirect
│   │   ├── middlewares/  # auth / error
│   │   ├── utils/code.js
│   │   ├── config.js
│   │   ├── prisma.js
│   │   ├── seed.js
│   │   └── index.js
│   └── Dockerfile
├── frontend/             # React + Vite + Ant Design
│   ├── src/
│   │   ├── pages/        # Login / Layout / Dashboard / Links / LinkDetail
│   │   ├── App.jsx
│   │   ├── http.js
│   │   ├── store.js
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## 接口约定

后端统一前缀：`/api`；短码跳转：`/r/:code`。Nginx 已在前端容器内将这两个前缀反代到后端。

| 方法 | 路径 | 描述 |
| --- | --- | --- |
| POST | `/api/auth/login` | 登录获取 JWT |
| GET | `/api/auth/me` | 获取当前登录用户 |
| GET | `/api/links` | 短链分页列表（query: page/pageSize/keyword/status） |
| POST | `/api/links` | 新建短链 |
| GET | `/api/links/:id` | 短链详情（含趋势 + 最近 50 条访问） |
| PUT | `/api/links/:id` | 编辑短链（除短码外的字段） |
| PATCH | `/api/links/:id/status` | 启用 / 停用 |
| DELETE | `/api/links/:id` | 删除短链（同时删除点击日志） |
| GET | `/api/stats/overview` | 仪表盘汇总 |
| GET | `/api/stats/top` | 点击 Top N |
| GET | `/api/stats/trend` | 全站近 N 天趋势 |
| GET | `/r/:code` | 短码 302 跳转 |
