#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..', '..');
const clientEnvPath = path.join(projectRoot, 'client', '.env.local');

function readDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs.readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line.includes('=') && !line.trimStart().startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
}

function normalized(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function normalizedItems(items) {
  return [...new Set((items ?? []).map(normalized).filter(Boolean))].sort((left, right) => left.localeCompare(right, 'ko'));
}

function sameItems(left, right) {
  return JSON.stringify(normalizedItems(left)) === JSON.stringify(normalizedItems(right));
}

function issue(severity, code, application, message) {
  return {
    severity,
    code,
    applicationId: application.id,
    applicantEmail: application.applicantEmail,
    storeName: application.storeName,
    message,
  };
}

export function auditApprovedSellerStores({ applications, users, stores }) {
  const approvedApplications = applications.filter((application) => application.status === 'APPROVED');
  const issues = [];

  for (const application of approvedApplications) {
    const user = users.find((candidate) => candidate.id === application.applicantUserId);
    const ownedStores = stores.filter((store) => normalized(store.ownerEmail).toLowerCase() === normalized(application.applicantEmail).toLowerCase());

    if (!user) {
      issues.push(issue('ERROR', 'APPLICANT_USER_NOT_FOUND', application, '승인 신청의 회원 레코드를 찾을 수 없습니다.'));
    } else if (user.role !== 'SELLER') {
      issues.push(issue('WARNING', 'APPROVED_APPLICATION_USER_NOT_SELLER', application, `회원 역할이 ${user.role}입니다. 판매자 해지 승인 이력인지 확인하세요.`));
    }

    if (ownedStores.length === 0) {
      issues.push(issue('ERROR', 'APPROVED_APPLICATION_STORE_MISSING', application, '승인된 신청에 연결된 등록 판매점이 없습니다.'));
      continue;
    }
    if (ownedStores.length > 1) {
      issues.push(issue('ERROR', 'APPROVED_APPLICATION_STORE_DUPLICATED', application, `신청자 이메일에 연결된 판매점이 ${ownedStores.length}개입니다.`));
      continue;
    }

    const store = ownedStores[0];
    const fields = [
      ['STORE_NAME_MISMATCH', '판매점명', application.storeName, store.name],
      ['CITY_MISMATCH', '시·도', application.cityName, store.cityName],
      ['DISTRICT_MISMATCH', '구·군', application.districtName, store.districtName],
      ['ADDRESS_MISMATCH', '사업장 주소', application.address, store.address],
      ['PHONE_MISMATCH', '사업장 연락처', application.phone, store.phone],
    ];
    for (const [code, label, applicationValue, storeValue] of fields) {
      if (normalized(applicationValue) !== normalized(storeValue)) {
        issues.push(issue('ERROR', code, application, `${label}가 신청서(${normalized(applicationValue)})와 판매점(${normalized(storeValue)})에서 다릅니다.`));
      }
    }
    if (!sameItems(application.handledItems, store.handledItems)) {
      issues.push(issue('ERROR', 'HANDLED_ITEMS_MISMATCH', application, '취급 품목이 신청서와 판매점에서 다릅니다.'));
    }
    if (user?.role === 'SELLER' && !store.verified) {
      issues.push(issue('ERROR', 'APPROVED_STORE_NOT_VERIFIED', application, '판매자 역할은 활성인데 판매점이 승인 상태가 아닙니다.'));
    }
    if (user?.role === 'SELLER' && !store.receivingOrders) {
      issues.push(issue('WARNING', 'SELLER_STORE_NOT_RECEIVING_ORDERS', application, '판매자 역할은 활성이나 주문 수신이 꺼져 있습니다. 운영 설정을 확인하세요.'));
    }
  }

  const errors = issues.filter((entry) => entry.severity === 'ERROR');
  const warnings = issues.filter((entry) => entry.severity === 'WARNING');
  return {
    generatedAt: new Date().toISOString(),
    approvedApplicationCount: approvedApplications.length,
    checkedStoreCount: stores.length,
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    errorCount: errors.length,
    warningCount: warnings.length,
    issues,
  };
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${response.status} ${url}: ${JSON.stringify(body)}`);
  return body.data;
}

async function getAdminAuthorization({ supabaseUrl, supabaseAnonKey, email, password }) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.access_token) throw new Error(`${response.status} 관리자 인증에 실패했습니다.`);
  return `Bearer ${body.access_token}`;
}

export async function fetchAuditData(config) {
  const authorization = await getAdminAuthorization(config);
  const headers = { Authorization: authorization };
  const [applications, users, stores] = await Promise.all([
    requestJson(`${config.apiBaseUrl}/api/admin/seller-applications`, { headers }),
    requestJson(`${config.apiBaseUrl}/api/admin/users`, { headers }),
    requestJson(`${config.apiBaseUrl}/api/admin/stores`, { headers }),
  ]);
  return { applications, users, stores };
}

function printReport(report) {
  console.log(`판매점 승인 데이터 정합성 점검: ${report.status}`);
  console.log(`승인 신청 ${report.approvedApplicationCount}건 · 등록 판매점 ${report.checkedStoreCount}건 · 오류 ${report.errorCount}건 · 경고 ${report.warningCount}건`);
  for (const entry of report.issues) {
    console.log(`[${entry.severity}] ${entry.code} | 신청 #${entry.applicationId} | ${entry.storeName} | ${entry.message}`);
  }
}

async function main() {
  const env = { ...readDotEnv(clientEnvPath), ...process.env };
  const config = {
    apiBaseUrl: env.CHULSOO_AUDIT_API_BASE_URL ?? 'http://localhost:8080',
    supabaseUrl: env.VITE_SUPABASE_URL,
    supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY,
    email: env.CHULSOO_AUDIT_ADMIN_EMAIL,
    password: env.CHULSOO_AUDIT_ADMIN_PASSWORD,
  };
  const missing = Object.entries(config).filter(([key, value]) => ['supabaseUrl', 'supabaseAnonKey', 'email', 'password'].includes(key) && !value).map(([key]) => key);
  if (missing.length) throw new Error(`필수 환경 변수가 없습니다: ${missing.join(', ')}`);

  const report = auditApprovedSellerStores(await fetchAuditData(config));
  if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else printReport(report);
  process.exitCode = report.errorCount > 0 ? 2 : 0;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    console.error(`점검 실행 실패: ${error.message}`);
    process.exitCode = 1;
  });
}
