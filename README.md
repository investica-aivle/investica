# investica
2025 오픈소스 개발자대회

# 프로젝트 시작 가이드 (한글)

## 1. 패키지 매니저 설치
이 프로젝트는 pnpm을 사용합니다. pnpm이 없다면 아래 명령어로 설치하세요:

```
npm install -g pnpm
```

## 2. 의존성 설치
아래 두 폴더 각각에서 의존성 설치 명령어를 실행하세요:

```
cd client
pnpm install

cd ../server
pnpm install
```

## 3. 클라이언트 개발 서버 실행
client 폴더에서 아래 명령어를 실행하세요:

```
pnpm run dev
```

## 4. 서버 실행 방법
server 폴더에서 아래 명령어를 실행하세요:

```
pnpm run start:dev
```

## 5. 기타
- 서버 코드 실행 등 추가 안내가 필요하면 알려주세요.

- npm run build:sdk - 툴 등록, 서버 실행전 필요

## 6. Open API 키 설정
프로젝트를 정상적으로 실행하려면 Open API 키를 반드시 설정해야 합니다.

- Open API 키가 무엇인지, 어디에 입력해야 하는지 잘 모르겠다면 제공된 튜토리얼 영상을 참고해 주세요.
