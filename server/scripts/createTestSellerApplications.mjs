import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..', '..');
const serverEnvPath = path.join(projectRoot, 'server', '.env');
const clientEnvPath = path.join(projectRoot, 'client', '.env.local');
const documentDir = path.join(projectRoot, 'server', 'test-assets', 'seller-application-documents');
const password = process.env.CHULSOO_TEST_SELLER_PASSWORD;

function readDotEnv(filePath) {
  return Object.fromEntries(
    fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
      .filter((line) => line.includes('=') && !line.trimStart().startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );
}

const serverEnv = readDotEnv(serverEnvPath);
const clientEnv = readDotEnv(clientEnvPath);
const supabaseUrl = serverEnv.SUPABASE_URL;
const secretKey = serverEnv.SUPABASE_SECRET_KEY;
const anonKey = clientEnv.VITE_SUPABASE_ANON_KEY;
const apiBaseUrl = process.env.CHULSOO_TEST_API_BASE_URL ?? 'http://localhost:8080';
if (!password || !supabaseUrl || !secretKey || !anonKey) throw new Error('테스트 계정 비밀번호 또는 Supabase 환경 설정이 없습니다.');

const applicants = [
  { index: '01', email: 'test.sellerapp01@chulsooya.dev', name: '테스트 판매자 신청 01', phone: '010-7100-0001', storeName: '테스트 신청 철물점 01', businessNumber: '900-00-00001', openedOn: '2020-01-15', district: '강남구', address: '서울특별시 강남구 테스트로 101', storePhone: '02-7100-0001', handledItems: '전동공구,안전용품,철물' },
  { index: '02', email: 'test.sellerapp02@chulsooya.dev', name: '테스트 판매자 신청 02', phone: '010-7100-0002', storeName: '테스트 신청 철물점 02', businessNumber: '900-00-00002', openedOn: '2020-02-15', district: '서초구', address: '서울특별시 서초구 테스트로 202', storePhone: '02-7100-0002', handledItems: '수전,욕실용품,배관자재' },
  { index: '03', email: 'test.sellerapp03@chulsooya.dev', name: '테스트 판매자 신청 03', phone: '010-7100-0003', storeName: '테스트 신청 철물점 03', businessNumber: '900-00-00003', openedOn: '2020-03-15', district: '송파구', address: '서울특별시 송파구 테스트로 303', storePhone: '02-7100-0003', handledItems: '목재,나사,절삭재' },
  { index: '04', email: 'test.sellerapp04@chulsooya.dev', name: '테스트 판매자 신청 04', phone: '010-7100-0004', storeName: '테스트 신청 철물점 04', businessNumber: '900-00-00004', openedOn: '2020-04-15', district: '마포구', address: '서울특별시 마포구 테스트로 404', storePhone: '02-7100-0004', handledItems: '페인트,접착제,작업장갑' },
  { index: '05', email: 'test.sellerapp05@chulsooya.dev', name: '테스트 판매자 신청 05', phone: '010-7100-0005', storeName: '테스트 신청 철물점 05', businessNumber: '900-00-00005', openedOn: '2020-05-15', district: '영등포구', address: '서울특별시 영등포구 테스트로 505', storePhone: '02-7100-0005', handledItems: '조명,전선,전기자재' },
];

async function responseJson(response, label) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${label}: ${response.status} ${JSON.stringify(body)}`);
  return body;
}

async function createAuthUser(applicant) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: applicant.email, password, email_confirm: true, user_metadata: { name: applicant.name } }),
  });
  return responseJson(response, `${applicant.email} 계정 생성`);
}

async function login(email) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await responseJson(response, `${email} 로그인`);
  return `Bearer ${body.access_token}`;
}

async function appJson(url, method, authorization, body) {
  const response = await fetch(`${apiBaseUrl}${url}`, {
    method,
    headers: { Authorization: authorization, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const parsed = await responseJson(response, url);
  return parsed.data;
}

async function uploadDocument(applicationId, authorization, kind, filePath) {
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(filePath)], { type: 'image/jpeg' }), path.basename(filePath));
  const response = await fetch(`${apiBaseUrl}/api/seller-applications/${applicationId}/${kind}`, { method: 'POST', headers: { Authorization: authorization }, body: form });
  const parsed = await responseJson(response, `${kind} 업로드`);
  return parsed.data;
}

function documentPath(index, kind) {
  return path.join(documentDir, `seller-application-${index}-${kind}.jpg`);
}

async function submitApplicant(applicant) {
  const created = await createAuthUser(applicant);
  const authorization = await login(applicant.email);
  await appJson('/api/users/me', 'PATCH', authorization, { name: applicant.name, phone: applicant.phone });
  const application = await appJson('/api/seller-applications', 'POST', authorization, {
    storeName: applicant.storeName,
    representativeName: applicant.name,
    businessRegistrationNumber: applicant.businessNumber,
    businessOpenedOn: applicant.openedOn,
    cityName: '서울특별시',
    districtName: applicant.district,
    address: applicant.address,
    phone: applicant.storePhone,
    handledItems: applicant.handledItems,
  });
  const business = await uploadDocument(application.id, authorization, 'business-license', documentPath(applicant.index, 'business-license'));
  const completed = await uploadDocument(application.id, authorization, 'bank-account-copy', documentPath(applicant.index, 'bank-account-copy'));
  if (completed.status !== 'PENDING' || !completed.certificateSubmitted || !completed.bankAccountCopySubmitted) {
    throw new Error(`${applicant.email} 신청 문서 상태가 올바르지 않습니다: ${JSON.stringify(completed)}`);
  }
  return { email: applicant.email, authUserId: created.id ?? created.user?.id ?? null, applicationId: completed.id, storeName: completed.storeName, status: completed.status, certificateSubmitted: completed.certificateSubmitted, bankAccountCopySubmitted: completed.bankAccountCopySubmitted, submittedAt: completed.submittedAt };
}

const results = [];
for (const applicant of applicants) {
  results.push(await submitApplicant(applicant));
  await new Promise((resolve) => setTimeout(resolve, 350));
}
console.log(JSON.stringify({ createdCount: results.length, results }, null, 2));
