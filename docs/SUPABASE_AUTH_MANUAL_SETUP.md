# 철수야 Supabase Auth 수동 설정 안내

## 먼저 알아둘 점

철수야 앱의 로그인 화면 코드는 이미 Supabase OAuth 방식으로 연결되어 있습니다. 이번 작업은 **Supabase Dashboard와 Google Cloud·Kakao Developers 콘솔에서 공급자를 활성화하는 운영 설정**입니다. `Client Secret`, SMTP 비밀번호, Supabase service role key는 어떤 경우에도 Git·프론트엔드 `.env`·채팅에 넣지 않습니다.

> 현재 개발 주소는 `http://localhost:5173`이며, 앱 콜백 주소는 `http://localhost:5173/auth/callback`입니다.

| 설정 영역 | 이동 경로 | 입력하거나 확인할 값 |
| :--- | :--- | :--- |
| URL 허용 목록 | Supabase Dashboard → **Authentication → URL Configuration** | Site URL, Redirect URLs |
| Email | Supabase Dashboard → **Authentication → Providers → Email** | 활성화, 이메일 확인, SMTP |
| Google | Google Cloud → Google Auth Platform / Supabase → Providers → Google | Web OAuth Client ID·Secret |
| Kakao | Kakao Developers / Supabase → Providers → Kakao | REST API Key·Kakao Login Client Secret |

---

## 1. Supabase URL Configuration

Supabase Dashboard에서 철수야 프로젝트를 선택한 뒤 **Authentication → URL Configuration**으로 이동합니다.

| 항목 | 개발 값 | 운영 배포 후 변경할 값 |
| :--- | :--- | :--- |
| Site URL | `http://localhost:5173` | 실제 서비스 HTTPS 주소. 예: `https://example.com` |
| Redirect URLs | `http://localhost:5173/auth/callback` | `https://<운영도메인>/auth/callback` |

`redirectTo`로 지정한 주소는 Redirect URLs 허용 목록과 정확히 일치해야 합니다. Site URL은 확인 메일과 비밀번호 재설정의 기본 복귀 주소입니다. 운영에서는 와일드카드보다 정확한 콜백 주소를 사용합니다. [1]

---

## 2. Email 회원가입·로그인

Supabase Dashboard → **Authentication → Providers → Email**에서 다음을 확인합니다.

| 항목 | 권장 값 | 이유 |
| :--- | :--- | :--- |
| Enable Email provider | ON | 이메일 가입·로그인을 허용합니다. |
| Confirm email | ON | 확인 전 로그인과 악성 가입을 차단합니다. |
| 개발 확인 메일 복귀 주소 | 위의 `/auth/callback` 허용 목록 | 가입 확인 후 철수야로 복귀합니다. |
| SMTP | 실제 서비스 전 Custom SMTP | 기본 SMTP는 일반 사용자 운영에 적합하지 않습니다. |

현재 기본 SMTP에서는 조직 팀 외 주소로 발송되지 않거나 발송 수가 제한될 수 있습니다. 실제 이메일 수신을 확인하려면 **Authentication → SMTP Settings**에서 SMTP 공급자의 Host, Port, Username, Password, Sender name, Sender email을 직접 입력합니다. SMTP 비밀번호는 Supabase 콘솔에만 저장합니다.

확인 이메일 템플릿을 수정한 경우 링크에는 `{{ .SiteURL }}` 대신 `{{ .RedirectTo }}`를 사용합니다. 철수야 앱이 `emailRedirectTo`를 사용하기 때문입니다. [1]

---

## 3. Google 로그인

### 3-1. Google Cloud 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트를 선택하거나 만듭니다.
2. **Google Auth Platform**에서 Branding, Audience, Data Access를 설정합니다.
3. Data Access에는 `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`을 사용합니다.
4. **Clients → Create client → Web application**을 선택합니다.
5. 아래 값을 등록합니다.

| Google OAuth Client 항목 | 입력 값 |
| :--- | :--- |
| Authorized JavaScript origins | `http://localhost:5173` |
| Authorized redirect URIs | `https://gvsnsnjfvtogvlyvmlkt.supabase.co/auth/v1/callback` |

Google의 redirect URI에는 **철수야 앱의 `/auth/callback`이 아니라 Supabase callback URL**을 넣어야 합니다. 이후 생성되는 Client ID와 Client Secret을 복사합니다. [2]

### 3-2. Supabase Google Provider 설정

Supabase Dashboard → **Authentication → Providers → Google**으로 이동합니다.

1. Google Enabled를 ON으로 전환합니다.
2. Google Client ID와 Google Client Secret을 입력합니다.
3. Save를 누릅니다.
4. 철수야의 로그인 화면에서 Google 로그인을 눌러 계정 선택 → 콜백 → 메인 복귀를 확인합니다.

Google 동의 화면에 `gvsnsnjfvtogvlyvmlkt.supabase.co`가 보여 낯설다면 정상일 수 있습니다. 이는 OAuth 공급자와 앱 사이에서 Supabase Auth가 중계하기 때문입니다. 운영 전에는 Google Branding 설정과 자체 도메인 연결을 권장합니다. [2]

---

## 4. Kakao 로그인

### 4-1. Kakao Developers 설정

1. [Kakao Developers](https://developers.kakao.com/)에서 앱을 만들거나 기존 앱을 선택합니다.
2. **App Settings → App → Platform Key**에서 REST API Key를 확인합니다. 이 값이 Supabase의 Kakao Client ID입니다.
3. 같은 화면에서 Kakao Login Client Secret을 활성화하고 값을 확인합니다.
4. **Product Settings → Kakao Login → General**에서 Kakao Login 사용을 ON으로 전환합니다.
5. **Kakao Login Redirect URI**에 아래 주소를 등록합니다.

```text
https://gvsnsnjfvtogvlyvmlkt.supabase.co/auth/v1/callback
```

6. **Consent Items**에서 최소 `profile_nickname`, `profile_image`를 설정합니다. 철수야는 주문·배송 연락을 위해 이메일을 쓰므로 `account_email` 동의도 요청합니다.

`account_email` 동의 항목은 Kakao Biz App 등록 상태에 따라 제한될 수 있습니다. 이메일이 반드시 필요하면 Biz App 절차를 완료한 뒤 이메일 동의를 필수로 설정합니다. 이메일 없이도 Kakao 가입을 허용하려는 경우에만 Supabase Kakao Provider의 **Allow users without an email**을 사용합니다. [3]

### 4-2. Supabase Kakao Provider 설정

Supabase Dashboard → **Authentication → Providers → Kakao**에서 다음을 입력합니다.

| Supabase Kakao Provider 항목 | Kakao Developers 값 |
| :--- | :--- |
| Kakao Enabled | ON |
| Client ID | REST API Key |
| Client Secret | Kakao Login Client Secret |
| Allow users without an email | OFF 권장 |

Save 후 철수야 로그인 화면에서 Kakao 로그인을 눌러 동의 → `/auth/callback` → 메인 복귀를 검증합니다. [3]

---

## 5. 설정 후 검증 순서

| 순서 | 사용자 동작 | 기대 결과 |
| :---: | :--- | :--- |
| 1 | 백엔드를 `supabase` 프로필로 실행하고 프론트를 `5173`에서 실행 | 공개 상품 API와 앱 화면이 열립니다. |
| 2 | Email로 회원가입 | 확인 메일이 도착하고 링크가 `/auth/callback`으로 돌아옵니다. |
| 3 | Email 로그인 | 철수야 메인으로 이동하고 `/api/auth/me`에 사용자·`CONSUMER` 역할이 반영됩니다. |
| 4 | Google 로그인 | Google 동의 후 동일한 콜백·세션 복구가 완료됩니다. |
| 5 | Kakao 로그인 | Kakao 동의 후 동일한 콜백·세션 복구가 완료됩니다. |
| 6 | 관리자에서 판매자 역할 승인 | 해당 계정의 마이철수에 SELLER WORKFLOW 메뉴가 보입니다. |

## 마스터님이 지금 직접 할 순서

1. Supabase **URL Configuration**에 개발 URL 두 개를 저장합니다.
2. Email Provider를 확인하고, 운영 이메일 테스트가 필요하면 Custom SMTP를 설정합니다.
3. Google Cloud에서 Web OAuth Client를 만든 뒤 Google Provider에 Client ID·Secret을 저장합니다.
4. Kakao Developers에서 Redirect URI와 동의 항목을 설정한 뒤 Kakao Provider에 REST API Key·Secret을 저장합니다.
5. 각 단계가 끝날 때마다 “URL 설정 완료”, “Google 완료”, “Kakao 완료”, “SMTP 보류/완료”처럼 알려주시면, 제가 앱에서 실제 로그인·JWT·역할 연동 검증을 이어서 진행합니다.

## References

[1]: [Supabase Docs — Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
[2]: [Supabase Docs — Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
[3]: [Supabase Docs — Login with Kakao](https://supabase.com/docs/guides/auth/social-login/auth-kakao)
