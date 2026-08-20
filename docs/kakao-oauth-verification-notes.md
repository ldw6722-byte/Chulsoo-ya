# 카카오 OAuth 설정 확인 기록

- 확인 일시: 2026-08-19
- 앱 ID: 1550257 (`철수야`)
- 실제 카카오 로그인 시 `KOE205 / invalid_scope` 오류가 발생했다.
- 카카오 공식 오류 문서상 KOE205는 앱에 설정하지 않은 동의항목을 OAuth `scope`로 요청한 경우 발생한다.
- 카카오 로그인 동의항목 화면에서 `profile_nickname`, `profile_image`는 모두 `사용 안 함`이며, `account_email`은 개인 개발자 앱 상태라 `권한 없음`이다.
- Supabase Kakao 공식 문서는 기본 연동에 `profile_nickname`, `profile_image`, `account_email` 동의항목을 안내한다.
- 철수야 서버의 `AuthUserService.requireEmail()`은 이메일이 비어 있으면 인증 제공자 정보를 거부한다. 따라서 Supabase Kakao Provider의 `Allow users without an email`을 켜는 방식은 현재 서버 계약과 맞지 않는다.
- 다음 보정: `profile_nickname`, `profile_image` 동의항목을 설정하고, 개인 개발자 비즈 앱 전환으로 `account_email` 설정 권한을 확보한 뒤 이메일 동의항목을 활성화한다. Supabase의 이메일 미제공 사용자 허용은 OFF로 유지한다.

- 개인 개발자 비즈 앱 전환은 완료돼 동의항목 화면 상단에 `비즈 앱` 상태가 표시된다.
- 그러나 재점검 시 `account_email`은 여전히 `사용 안 함`이며, 필수 동의로 저장되지 않았다. 실제 OAuth 요청은 여전히 `account_email profile_image profile_nickname` scope를 보내므로 KOE205가 재현된다.
- 다음 사용자 작업은 `account_email` 행의 설정을 열어 `필수 동의`로 저장하는 것이다.

- 2026-08-19 재검증에서 카카오 OAuth는 KOE205 없이 동의 화면까지 정상 도달했다. 요청 scope는 `account_email profile_image profile_nickname`이며, `account_email`은 필수 동의·수집 상태다.
- 카카오 동의 화면에는 선택 광고 동의를 포함하는 `전체 선택하기` 사용자 동작이 남아 있다. 이는 선택 개인정보 동의를 변경하는 외부 작업이므로 자동 실행하지 않는다.
- 동의 완료 콜백이 끝나기 전 보호 경로를 직접 열면 Supabase 세션이 존재하지 않아 로컬 개발 신원 가드의 `계정을 선택해 주세요` 화면이 표시된다.
- 공통 가드에는 Supabase 인증 사용자 fallback과 인증 초기화 로딩을 추가했고, `AuthProvider.refresh()`는 세션 적용을 await하도록 보정했다. 실제 콜백 완료 후의 세션 지속성은 사용자가 동의 흐름을 완료한 뒤 재확인한다.
