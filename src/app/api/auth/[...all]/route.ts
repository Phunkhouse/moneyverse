import { getAuth } from '@/app/_lib/auth.ts'

export function GET(request: Request) {
  return getAuth().handler(request)
}

export function POST(request: Request) {
  return getAuth().handler(request)
}
