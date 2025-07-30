  

# 🚀 시작하기 전에
해당 서버는 한국투자증권의 Open API를 활용하여 주식 거래 기능을 구현합니다.  
API 사용을 위해서는 한국투자증권 계좌와 KIS Developers 서비스 신청이 필요합니다.  


---  
### 📋 사전 준비사항
1. **주식계좌 개설**: 한국투자증권 홈페이지 → 계좌개설 → **주식계좌** 개설

2. **모의투자계좌 개설**:
    한국투자증권 로그인 → 트레이딩 → 모의투자 → 주식/선물옵션 모의투자 → 모의투자안내 → 모의투자 참가신청 → **모의투자계좌** 개설
   
    <img width="1768" height="901" alt="image" src="https://github.com/user-attachments/assets/a139e56b-28e3-4257-ac5c-4c67b6e0f96d" />
3. **KIS Developers API 키 발급**:
    한국투자증권 로그인 → 트레이딩 → Open API → KIS Developers → KIS Developers 서비스 신청/조회(실전투자계좌/모의투자계좌) → **APP Key, APP Secret** 발급
    <img width="1803" height="873" alt="image" src="https://github.com/user-attachments/assets/33aea310-92d2-4da8-bd5f-d94a7e6501b0" />
    <img width="1762" height="787" alt="image" src="https://github.com/user-attachments/assets/8ebc2751-addf-4c5d-985e-918f0789b9df" />

---
### ⚙️ 환경 설정
**환경변수 설정**  
프로젝트 루트 디렉토리에 .env 파일을 생성하고 다음 정보를 입력하세요.
```
API_PORT=37001  
OPENAI_API_KEY=your_openai_api_key  
APP_Key=your_APP_Key  
APP_Secret=your_APP_Secret
KIS_BASE_URL=https://openapi.koreainvestment.com:29443
```

**주의사항**  
**⚠️ API 키는 절대 공개 저장소에 업로드하지 마세요.**  
.env 파일을 .gitignore에 추가하는 것을 권장합니다.  
실제 거래용과 모의투자용 API 키는 구분하여 관리하세요.  

  ---

### 🔧 설치 및 실행  
**기본 명령어**
```
npm install
npm run build
npm run test
```
**의존성 설치**
```
npm install
#또는
pip install -r requirements.txt
```
**애플리케이션 실행**
```
npm start
#또는
python main.py
```

---
### 📚 API 문서
한국투자증권 KIS Developers API에 대한 자세한 정보는 공식 문서를 참조하세요.

### 🛠️ 개발 환경
언어: Python/Node.js  
API: 한국투자증권 KIS Developers API  
포트: 37001 (기본값)

### 📞 문의  
API 관련 문의사항은 한국투자증권 고객센터(1544-5000)로 연락하시기 바랍니다.

### 💡 Tip: 개발 초기에는 모의투자계좌를 사용하여 안전하게 테스트하는 것을 권장합니다.
