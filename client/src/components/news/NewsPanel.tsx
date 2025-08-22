import { NewsItem } from "../../types/news";

const sentimentBadgeClass = (s: string) =>
  s?.includes("부정") ? "bg-red-900/50 text-red-200"
  : s?.includes("긍정") ? "bg-green-800/50 text-green-200"
  : "bg-zinc-700/50 text-gray-200";

const formatKST = (dateStr: string) =>
  new Date(dateStr).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

export default function NewsPanel({
  company, items, fetchedAt, loading, emptyHint = "표시할 뉴스가 없습니다.",
}: {
  company: string;
  items: NewsItem[];
  fetchedAt?: string | null;
  loading?: boolean;
  emptyHint?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-medium text-lg text-gray-100">주요 뉴스</h3>
        {fetchedAt && (
          <span className="text-[11px] text-gray-400">업데이트: {formatKST(fetchedAt)}</span>
        )}
      </div>

      {loading && <div className="text-sm text-gray-400">챗봇에서 뉴스를 검색하면 여기에 표시됩니다</div>}
      {!loading && items.length === 0 && (
        <div className="text-sm text-gray-400">{emptyHint}</div>
      )}

      <div className="space-y-3">
        {items.map((n, idx) => (
          <div key={idx} className="bg-zinc-700/30 p-3 rounded-2xl backdrop-blur-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-blue-300">{company}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${sentimentBadgeClass(n.sentiment)}`}>
                {n.sentiment || "중립"}
              </span>
            </div>

            {n.originalLink ? (
              <a
                href={n.originalLink}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm font-medium mb-1 text-gray-100 hover:underline block"
              >
                {n.title}
              </a>
            ) : (
              <h4 className="text-sm font-medium mb-1 text-gray-100">{n.title}</h4>
            )}

            <div className="text-[11px] text-gray-500 mb-1">{formatKST(n.pubDate)}</div>
            <p className="text-xs text-gray-400">{n.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
