# EatEat

一对人用的私人厨房。本仓库是 pnpm monorepo。

| 应用 | 路径 | 技术 |
| --- | --- | --- |
| 接口 | `apps/api` | NestJS、Prisma、PostgreSQL |
| 页面 | `apps/web` | Vue 3、Vite、TypeScript、Vue Router、Pinia |

## 本地启动

需要 Node.js 22.18+ 或 24.12+、pnpm 11、Docker。

```bash
cp apps/api/.env.example apps/api/.env
pnpm install
pnpm db:up
pnpm db:migrate
pnpm dev
```

- 页面：http://localhost:5173
- 接口：http://localhost:3000/api/health/live
- 数据库就绪：http://localhost:3000/api/health/ready

开发时页面把 `/api` 代理到 `localhost:3000`。数据库连接写在 `apps/api/.env`，Prisma CLI 从 `apps/api/prisma.config.ts` 读取。

业务模型按功能加进 `apps/api/prisma/schema.prisma`，再用 `pnpm db:migrate` 生成迁移。
