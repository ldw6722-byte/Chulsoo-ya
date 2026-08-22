# 거래 서류 PDF 정책

## 구현 경계

- 주문이 `COMPLETED`인 경우에만 주문·품목·결제·판매점 DB 스냅샷을 읽어 영수증, 주문 내역서, 거래명세서를 즉시 생성한다.
- 생성된 PDF 파일은 Storage에 보관하지 않는다. 문서함 열기·다운로드 요청 때마다 서버가 결정적 템플릿으로 새 PDF를 반환한다.
- 전자세금계산서는 발행 대행 연동·사업자 정보·세무 검토가 완료되기 전까지 이 모듈에서 생성하지 않는다.
- 문서 본문은 AI를 사용하지 않고 DB 확정값만 주입한다.

## 라이브러리·비용·라이선스

- PDF 생성은 Apache PDFBox를 사용한다. PDFBox 공식 사이트는 Java PDF 생성·조작 도구이며 Apache License 2.0으로 배포됨을 명시한다.
- Apache License 2.0은 사용·복제·배포에 대한 무상·로열티 프리 권리를 부여한다. 따라서 PDFBox 자체에는 건당·월정액 API 사용료가 없다.
- 운영 비용은 기존 서버의 PDF 생성 CPU/메모리와 다운로드 네트워크 사용량뿐이다. Storage 보관 비용은 이 설계에 포함하지 않는다.
- 배포 시 Apache 2.0 라이선스 및 PDFBox NOTICE 요구사항을 보존한다.

## 출처

1. Apache PDFBox 공식 사이트: https://pdfbox.apache.org/
2. Apache License 2.0 전문: https://www.apache.org/licenses/LICENSE-2.0
