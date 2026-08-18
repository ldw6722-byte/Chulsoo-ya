import test from 'node:test';
import assert from 'node:assert/strict';
import { auditApprovedSellerStores } from './auditSellerStoreConsistency.mjs';

const application = {
  id: 1,
  status: 'APPROVED',
  applicantUserId: 10,
  applicantEmail: 'seller@example.com',
  storeName: '철수 철물점',
  cityName: '서울특별시',
  districtName: '강남구',
  address: '서울특별시 강남구 테헤란로 1',
  phone: '010-1234-5678',
  handledItems: ['철물', '공구'],
};

const user = { id: 10, role: 'SELLER' };
const store = {
  ownerEmail: 'seller@example.com',
  name: '철수 철물점',
  cityName: '서울특별시',
  districtName: '강남구',
  address: '서울특별시 강남구 테헤란로 1',
  phone: '010-1234-5678',
  handledItems: ['공구', '철물'],
  verified: true,
  receivingOrders: true,
};

test('승인 신청과 판매점 정보가 모두 일치하면 통과한다', () => {
  const report = auditApprovedSellerStores({ applications: [application], users: [user], stores: [store] });
  assert.equal(report.status, 'PASS');
  assert.equal(report.errorCount, 0);
  assert.equal(report.warningCount, 0);
});

test('판매점 명칭과 취급 품목 불일치를 오류로 보고한다', () => {
  const report = auditApprovedSellerStores({
    applications: [application],
    users: [user],
    stores: [{ ...store, name: '다른 철물점', handledItems: ['전동공구'] }],
  });
  assert.equal(report.status, 'FAIL');
  assert.deepEqual(report.issues.map((entry) => entry.code), ['STORE_NAME_MISMATCH', 'HANDLED_ITEMS_MISMATCH']);
});

test('승인 신청에 등록 판매점이 없으면 오류로 보고한다', () => {
  const report = auditApprovedSellerStores({ applications: [application], users: [user], stores: [] });
  assert.equal(report.status, 'FAIL');
  assert.equal(report.issues[0].code, 'APPROVED_APPLICATION_STORE_MISSING');
});
