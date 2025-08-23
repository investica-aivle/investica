# Investica Server

> NestJS + TypeScript 기반 AI 투자 분석 플랫폼 백엔드

## 🛠️ 기술 스택

- **NestJS 11.0.0**: 엔터프라이즈급 Node.js 프레임워크
- **TypeScript 5.9.2**: 타입 안전성
- **Nestia 7.3.0**: 자동 API 생성 및 SDK
- **Agentica Framework**: AI 에이전트 시스템
- **Typia**: 고성능 런타임 타입 검증

## 🚀 시작하기 전에

해당 서버는 [한국투자증권](https://securities.koreainvestment.com/main/Main.jsp)의 Open API를 활용하여 주식 거래 기능을 구현합니다.  
API 사용을 위해서는 한국투자증권 계좌와 KIS Developers 서비스 신청이 필요합니다.

### 📋 사전 준비사항

1. **주식계좌 개설**: 한국투자증권 홈페이지 → 계좌개설 → **주식계좌** 개설
2. **KIS Developers 신청**: [KIS Developers](https://apiportal.koreainvestment.com/) → API 신청
3. **앱 키 발급**: API 승인 후 App Key와 App Secret 발급받기

### ⚙️ 환경 설정

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에 KIS API 키 입력

# 개발 서버 시작
pnpm run start:dev

# 빌드
pnpm run build

# 프로덕션 실행
pnpm run start
```

### 📊 API 문서

서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:
- **Swagger UI**: http://localhost:3000/docs
- **Nestia Editor**: http://localhost:3000/editor

### 📁 주요 디렉토리

- `src/controllers/`: API 컨트롤러
- `src/providers/`: 비즈니스 로직
- `src/models/`: 데이터 모델
- `src/types/`: TypeScript 타입 정의

### 🔗 관련 문서

자세한 내용은 [메인 README](../README.md) 및 [설치 가이드](../docs/INSTALLATION.md)를 참조하세요.
