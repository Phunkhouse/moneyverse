// Cloudflare Worker entry: runs runBackup on the cron trigger in wrangler.jsonc (ADR 0006).
// No fetch handler and no public URL: it only runs on its schedule.
import { runBackup, type BucketLike } from './backup.ts'

type Env = {
  TURSO_DATABASE_URL: string
  TURSO_READ_TOKEN: string
  BACKUP_PUBLIC_KEY: string
  BACKUPS: BucketLike
}

type ScheduledController = { scheduledTime: number }

const worker = {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    // A failure throws, so the run shows as failed in the Worker's Cron Events and logs.
    const { key, bytes } = await runBackup({
      databaseUrl: env.TURSO_DATABASE_URL,
      token: env.TURSO_READ_TOKEN,
      publicKey: env.BACKUP_PUBLIC_KEY,
      bucket: env.BACKUPS,
      fetch: (input, init) => fetch(input, init),
      now: new Date(controller.scheduledTime),
    })
    console.log(`Stored ${key} (${bytes} bytes, encrypted).`)
  },
}

export default worker
