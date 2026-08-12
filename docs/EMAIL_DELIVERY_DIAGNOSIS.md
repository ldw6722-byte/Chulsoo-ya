# Supabase Email 인증 메일 미도착 진단

## 확인된 상태

| 점검 항목 | 결과 | 판단 |
| :--- | :--- | :--- |
| Email provider | 활성 | 앱의 가입 요청은 Supabase Auth가 수신한다. |
| 이메일 자동 확인 | 비활성 | 가입 후 confirmation link가 필요하다. |
| 계정 로그인 시도 | 미확인 이메일 오류 반환 | 계정 생성 후 이메일 확인 전 단계로 판단된다. |
| 기본 SMTP | 사용 중 | 현재 설정에서는 프로젝트 팀 구성원이 아닌 주소로 메일을 보내지 않을 수 있다. |

## 원인

Supabase 기본 SMTP는 데모·테스트 전용이며, 기본적으로 프로젝트 조직 팀에 속한 사전 승인 이메일 주소에만 발송한다. 또한 project-wide 이메일 발송은 시간당 2통으로 제한된다. 수신 주소가 조직 팀 계정이 아니거나, 최근 가입·재발송 시도로 제한을 넘겼다면 확인 메일이 오지 않는다. [1] [2]

## 해결 순서

| 우선순위 | 작업 | 필요한 정보/조작 |
| :---: | :--- | :--- |
| 1 | 테스트 주소 확인 | Supabase Dashboard → Organization settings → Team에 가입 테스트 이메일이 팀 멤버로 있는지 확인한다. |
| 2 | Auth 로그 확인 | Dashboard → Logs → Auth logs에서 `Email address not authorized`, `rate limit` 또는 SMTP 오류를 찾는다. |
| 3 | 대기 후 재발송 | 기본 SMTP 사용 시 최근 이메일 시도 후 최대 1시간 내 2통 제한을 고려한다. |
| 4 | Custom SMTP 설정 | 실제 서비스 또는 비팀 테스트 주소에는 Authentication → SMTP settings에서 SMTP host·port·user·password·sender를 등록한다. |

## 권장 처리

철수야는 일반 소비자·판매자 이메일을 받아야 하는 플랫폼이므로 기본 SMTP를 운영용으로 사용하지 않는다. 다음 단계에서 사용자가 SMTP 공급자 계정을 선택하고 SMTP 정보를 제공하면 Supabase Dashboard의 **Authentication → SMTP settings**에 Custom SMTP를 설정한다. 그 뒤 현재 로그인 화면의 **인증 메일 다시 보내기** 버튼으로 새 implicit-flow 인증 링크를 발송해 검증한다.

## References

[1]: https://supabase.com/docs/guides/auth/auth-smtp "Supabase Docs — Send emails with custom SMTP"
[2]: https://supabase.com/docs/guides/auth/rate-limits "Supabase Docs — Auth rate limits"
[3]: https://supabase.com/docs/guides/troubleshooting/not-receiving-auth-emails-from-the-supabase-project-OFSNzw "Supabase Docs — Not receiving Auth emails"
