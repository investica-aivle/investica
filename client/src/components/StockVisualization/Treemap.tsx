// TradingViewWidget.jsx
import { memo, useEffect, useRef } from 'react';

function Treemap() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(
    () => {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = `
        {
          "dataSource": "KOSPI200",
          "blockSize": "market_cap_basic",
          "blockColor": "change",
          "grouping": "sector",
          "locale": "kr",
          "symbolUrl": "",
          "colorTheme": "dark",
          "exchanges": [],
          "hasTopBar": true,
          "isDataSetEnabled": true,
          "isZoomEnabled": false,
          "hasSymbolTooltip": true,
          "isMonoSize": false,
          "width": "100%",
          "height": "100%"
        }`;
      if (container.current) {
        container.current.appendChild(script);
      }
    },
    []
  );


  return (
    <div className="bg-zinc-700/30 p-4 rounded-2xl backdrop-blur-md">
      <h4 className="text-base font-medium mb-3 text-gray-100">시가총액 기준 주식 분포</h4>
      <div className="h-108 w-full">
        <div className="tradingview-widget-container" ref={container}>
          <div className="tradingview-widget-container__widget"></div>
          <div className="tradingview-widget-copyright"><a href="https://kr.tradingview.com/heatmap/stock/" rel="noopener nofollow" target="_blank"><span className="blue-text">Track all markets on TradingView</span></a></div>
        </div>
      </div>
    </div>
  );
}

export default memo(Treemap);
