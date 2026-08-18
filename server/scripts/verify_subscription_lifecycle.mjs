import { readFileSync } from 'node:fs'

const base = 'http://127.0.0.1:8080/api'
const env = readFileSync('C:/Users/user/Desktop/chulsoo-ya/Chulsoo-ya/server/.env', 'utf8')
const values = Object.fromEntries(env.split(/\r?\n/).filter(line => line.includes('=') && !line.trim().startsWith('#')).map(line => { const index = line.indexOf('='); return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')] }))
const supabaseUrl = values.SUPABASE_URL
const supabaseKey = values.SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseKey) throw new Error('Supabase public auth configuration is unavailable')
async function login(email) { const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'ChulsooTest!2026' }) }); const body = await response.json(); if (!response.ok) throw new Error(`로그인 실패 ${email}: ${JSON.stringify(body)}`); return body.access_token }
async function call(token, method, path, body) { const response = await fetch(base + path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); const payload = await response.json(); if (!response.ok) throw new Error(`${method} ${path} 실패: ${JSON.stringify(payload)}`); return payload.data }
const admin = await login('test.admin01@chulsooya.dev')
const seller = await login('test.seller01@chulsooya.dev')
let products = await call(admin, 'GET', '/admin/subscriptions/products')
let product = products.find(item => item.name === '개발 검증 골드 1개월')
if (!product) product = await call(admin, 'POST', '/admin/subscriptions/products', { name: '개발 검증 골드 1개월', tier: 'GOLD', price: 0, durationMonths: 1, description: '구독 자동 승인과 30일 만료 검증용 상품', active: true, displayOrder: 999 })
const purchased = await call(seller, 'POST', '/seller/subscription/purchase', { productId: product.id })
if (purchased.tier !== 'GOLD' || !purchased.subscriptionExpiresAt || !purchased.history.some(item => item.eventType === 'PURCHASED')) throw new Error('자동 승인 구독 상태 검증 실패')
const memberships = await call(admin, 'GET', '/admin/subscriptions/memberships')
const membership = memberships.find(item => item.storeId === purchased.storeId)
if (!membership || membership.tier !== 'GOLD') throw new Error('관리자 판매자 등급 조회 검증 실패')
const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
const premium = await call(admin, 'POST', `/admin/subscriptions/stores/${purchased.storeId}/membership`, { tier: 'PREMIUM', expiresAt, reason: '개발 검증 무료 체험 승급' })
if (premium.tier !== 'PREMIUM') throw new Error('관리자 프리미엄 승급 검증 실패')
const silver = await call(admin, 'POST', `/admin/subscriptions/stores/${purchased.storeId}/membership`, { tier: 'SILVER', expiresAt: null, reason: '개발 검증 원복' })
if (silver.tier !== 'SILVER' || silver.subscriptionExpiresAt) throw new Error('관리자 실버 원복 검증 실패')
const history = await call(admin, 'GET', `/admin/subscriptions/stores/${purchased.storeId}/history`)
if (!history.some(item => item.eventType === 'PURCHASED') || history.filter(item => item.eventType === 'ADMIN_CHANGED').length < 2) throw new Error('구독 히스토리 검증 실패')
console.log(JSON.stringify({ result: 'PASS', productId: product.id, storeId: purchased.storeId, historyCount: history.length, currentTier: silver.tier }, null, 2))
