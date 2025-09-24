# investica
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Finvestica-aivle%2Finvestica.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Finvestica-aivle%2Finvestica?ref=badge_shield)

2025 오픈소스 개발자대회

> AI 기반 주식 투자 분석 플랫폼 - Agentica Framework 데모

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0.0-red.svg)](https://nestjs.com/)
[![Agentica](https://img.shields.io/badge/Agentica-0.30.5-purple.svg)](https://github.com/wrtnlabs/agentica)

https://github.com/user-attachments/assets/66027ab4-ec71-4cf9-8e3c-d8b10a2d3a64


[시연 영상(유튜브)](https://www.youtube.com/watch?v=lRAGhhJsJKI&t=38s)
## 프로젝트 개요

이 프로젝트는 [Agentica](https://github.com/wrtnlabs/agentica) 프레임워크의 **긍정적 활용 사례** 를 실증하기 위해 개발되었습니다. Agentica를 통해 잘 구성된 API들을 활용하여 **빠르고 완성도 높은 혁신적인 챗봇 서비스**를 개발할 수 있음을 보여줍니다.

### 해결하고자 하는 문제

기존 주식 투자 플랫폼들은 **디지털 소외계층(고령자 등)**에게 다음과 같은 장벽을 만들어 투자 리스크로 작용합니다:

- **복잡한 UI**: 수많은 메뉴와 기능들로 인한 혼란
- **어려운 도메인 지식**: 전문 투자 용어와 개념들
- **방대한 정보**: 차트, 뉴스, 지표 등 압도적인 데이터량
- **접근성 문제**: 원하는 시점에 빠른 매매 실행의 어려움

### Investica의 솔루션

**1. 자연어 기반 투자**
- 복잡한 UI 탐색 없이 "삼성전자 100주 매수해줘" 같은 자연어로 거래
- AI 에이전트가 사용자 의도를 파악하여 적절한 API 함수 자동 호출

**2. 지능형 화면 전환**
- 사용자가 기능을 찾아 헤맬 필요 없이 에이전트가 필요한 화면으로 자동 이동
- 맥락에 맞는 정보를 적시에 제공

**3. 쉬운 용어 해설**
- 어려운 주식 용어 자동 감지 및 쉬운 표현으로 즉시 설명
- 예: "PER(주가수익비율: 주가 ÷ 주당순이익)이 15배입니다"

**4. 쉬운 정보 획득**
- 투자 보고서 자동 스크래핑 및 챗봇을 통한 요약 제공
- 복잡한 시장 데이터를 쉽게 이해할 수 있는 시각화
- AI 기반 산업 분석 리포트 제공 및 다운로드 지원
- 코스피 시장 상황을 직관적인 차트로 실시간 제공

## 주요 기능

- **AI 투자 상담**: 실시간 에이전트 상호작용
- **주식 데이터**: 실시간 시세, 차트, 뉴스 분석
- **포트폴리오**: 보유 주식 및 수익률 추적
- **모의거래**: KIS API 연동 (실제 거래 미지원)
- **양방향 UI**: AI 호출에 따른 화면 자동 전환

## 기술 스택

- **Frontend**: React 19.1.0 + TypeScript + Vite + Tailwind CSS
- **Backend**: NestJS 11.0.0 + Nestia 7.3.0
- **AI**: Agentica Core/RPC 0.30.5
- **Visualization**: Recharts 3.1.2

## 빠른 시작

### 요구사항
- Node.js 18+, PNPM
- 한국투자증권 Open API 계정

### 설치 및 실행
```bash
# 1. 클론
git clone https://github.com/investica-aivle/investica.git
cd investica

# 2. 의존성 설치
cd server && pnpm install
cd ../client && pnpm install

# 3. 환경 설정
cp server/.env.example server/.env  # KIS API 키 설정
cp client/.env.example client/.env

# 4. 실행
cd server && pnpm start:dev  # 터미널 1
cd client && pnpm dev        # 터미널 2
```

## 문서

- [기술 스택](./docs/TECH_STACK.md)

## 이슈 제보

**버그 리포트** | **기능 제안**
[GitHub Issues](https://github.com/investica-aivle/investica/issues)에 제보해주세요.

---

## 중요 고지

> **데모 프로젝트**: Agentica 프레임워크 활용 시연 목적  
> **모의투자만**: 실제 거래 미지원, 학습용으로만 사용  
> **투자 책임**: AI 조언은 참고용, 투자 결정 책임은 사용자 본인

### 실제 서비스 적용 시 필수 보완사항
- 강화된 인증/보안 시스템
- 개인정보 보호 및 데이터 암호화  
- 금융 규제 준수 (전자금융거래법 등)
- 사용자 자금 보호 시스템

## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Finvestica-aivle%2Finvestica.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Finvestica-aivle%2Finvestica?ref=badge_large)
MIT License - 자세한 내용은 [LICENSE](LICENSE) 참조
