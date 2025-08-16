export type NewsItem = {
  title: string;
  pubDate: string;
  summary: string;
  sentiment: string;       // '긍정' | '부정' | 그 외 문자열
  originalLink?: string;
};

export type NewsPushPayload = {
  company: string;
  items: NewsItem[];
  fetchedAt: string;       // ISO
};