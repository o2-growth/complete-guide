# Oxy SDK

```ts
import { OxyClient } from "@/sdk";

const oxy = new OxyClient({ apiKey: process.env.OXY_API_KEY! });
const tasks = await oxy.tasks.list({ limit: 20 });
```

Endpoints:
- `oxy.tasks.list({ limit, offset })`
- `oxy.tasks.create({ title, description, project_id })`
- `oxy.projects.list()`
- `oxy.anomalies.list()`
- `oxy.ping()`
