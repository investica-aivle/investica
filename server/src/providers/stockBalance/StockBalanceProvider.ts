import axios from 'axios';

export const STOCK_BALANCE_PROVIDERS = [
  {
    provide: 'AXIOS_CLIENT',
    useValue: axios
  },
  {
    provide: 'KIS_CONFIG',
    useValue: {
      // 모의투자 (테스트용)
      domain: 'https://openapivts.koreainvestment.com:29443',
      tr_id: 'VTTC8434R',
      endpoints: {
        balance: '/uapi/domestic-stock/v1/trading/inquire-balance',
        token: '/oauth2/tokenP'
      }
    }
  },
  {
    provide: 'KIS_CREDENTIALS',
    useFactory: () => ({
      appkey: process.env.KIS_APPKEY,
      appsecret: process.env.KIS_APPSECRET,
      account: process.env.KIS_ACCOUNT_NO
    })
  }
];