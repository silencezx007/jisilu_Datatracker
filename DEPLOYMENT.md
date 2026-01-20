# LOF Hunter 部署指南

## 问题说明

如果您在部署后遇到 **Cloudflare DNS Error 1016** 或类似的数据库连接错误，这是因为项目需要正确配置数据库连接。

## 环境变量配置

本项目需要以下环境变量才能正常运行：

### 必需的环境变量

```bash
# 数据库连接（必需）
DATABASE_URL=mysql://username:password@host:port/database?ssl={"rejectUnauthorized":true}

# JWT 密钥（必需）
JWT_SECRET=your-secret-key-here

# OAuth 配置（如果使用 Manus OAuth）
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=your-app-id

# 所有者信息
OWNER_OPEN_ID=your-open-id
OWNER_NAME=your-name

# Manus 内置 API（可选，用于通知功能）
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

## 数据库选项

### 选项 1：使用 Supabase（推荐用于个人部署）

1. 访问 [Supabase](https://supabase.com/) 并创建一个新项目
2. 在项目设置中找到数据库连接字符串
3. 将连接字符串设置为 `DATABASE_URL` 环境变量

示例：
```bash
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

4. 运行数据库迁移：
```bash
pnpm db:push
```

### 选项 2：使用 TiDB Cloud

1. 访问 [TiDB Cloud](https://tidbcloud.com/) 并创建一个新集群
2. 获取连接字符串
3. 将连接字符串设置为 `DATABASE_URL` 环境变量

示例：
```bash
DATABASE_URL=mysql://username:password@gateway.tidbcloud.com:4000/database?ssl={"rejectUnauthorized":true}
```

### 选项 3：使用 PlanetScale

1. 访问 [PlanetScale](https://planetscale.com/) 并创建一个新数据库
2. 获取连接字符串
3. 将连接字符串设置为 `DATABASE_URL` 环境变量

## 部署到不同平台

### Vercel

1. 在 Vercel 项目设置中添加环境变量
2. 进入 Settings → Environment Variables
3. 添加上述所有必需的环境变量
4. 重新部署项目

### Netlify

1. 在 Netlify 项目设置中添加环境变量
2. 进入 Site settings → Environment variables
3. 添加上述所有必需的环境变量
4. 重新部署项目

### Railway

1. 在 Railway 项目设置中添加环境变量
2. 进入 Variables 标签
3. 添加上述所有必需的环境变量
4. Railway 会自动重新部署

## OAuth 配置说明

如果您不使用 Manus OAuth，需要：

1. 移除 OAuth 相关的环境变量
2. 修改 `server/_core/context.ts` 中的认证逻辑
3. 或者集成其他 OAuth 提供商（如 Google、GitHub）

## 数据库表结构

首次部署后，需要运行以下命令创建数据库表：

```bash
pnpm db:push
```

这将创建以下表：
- `users` - 用户表
- `lof_records` - LOF 基金记录表
- `monitor_configs` - 监控配置表
- `push_histories` - 推送历史表

## 常见问题

### Q: 为什么会出现 DNS Error 1016？
A: 这通常是因为 `DATABASE_URL` 环境变量未设置或设置错误。请确保在部署平台的环境变量中正确配置了数据库连接字符串。

### Q: 如何测试数据库连接？
A: 可以在本地运行以下命令测试：
```bash
pnpm db:push
```
如果成功，说明数据库连接正常。

### Q: 是否需要配置所有环境变量？
A: 必需的环境变量只有 `DATABASE_URL` 和 `JWT_SECRET`。其他变量根据您使用的功能决定是否需要。

## 技术支持

如果遇到问题，请检查：
1. 环境变量是否正确配置
2. 数据库连接字符串是否有效
3. 数据库表是否已创建
4. 部署平台的日志输出

## Manus 平台部署

如果您在 Manus 平台上部署，所有环境变量会自动配置，无需手动设置。只需点击"Publish"按钮即可。
