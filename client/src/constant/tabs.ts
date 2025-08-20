export enum TabType {
  PORTFOLIO = 'portfolio',
  KOSPI = 'kospi',
  NEWS = 'news',
  TRADING = 'trading',
  AI = 'ai'
}

export interface TabDetail {
  name: string;
  function: string[];
  description: string;
}

type TabsConfig = Record<TabType, TabDetail>;

const tabs: TabsConfig = {
  [TabType.PORTFOLIO]: {
    name: "portfolio",
    function: [],
    description: "포트폴리오"
  },
  [TabType.KOSPI]: {
    name: "kospi",
    function: [        
        "getRecentMarketSummary",
        "getSecuritiesISReportList",
        "getSpecificReportContent",
        "fetchKospiIndexPrices",
        "getKospiPrices",
    ],
    description: "코스피 현황"
  },
  [TabType.NEWS]: {
    name: "news",
    function: [
      "getNewsSummary",
    ],
    description: "주요 뉴스"
  },
  [TabType.TRADING]: {
    name: "trading",
    function: [],
    description: "매매 기능"
  },
  [TabType.AI]: {
    name: "ai",
    function: [],
    description: "AI 분석"
  }
};

export default tabs;