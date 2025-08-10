import { useState } from "react";

export interface IKisAuthData {
  accountNumber: string;
  appKey: string;
  appSecret: string;
}

interface KisAuthFormProps {
  onSubmit: (authData: IKisAuthData) => void;
  isLoading?: boolean;
  error?: string;
}

export function KisAuthForm({ onSubmit, isLoading, error }: KisAuthFormProps) {
  const [formData, setFormData] = useState<IKisAuthData>({
    accountNumber: "",
    appKey: "",
    appSecret: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.accountNumber && formData.appKey && formData.appSecret) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof IKisAuthData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value.trim()
    }));
  };

  const isFormValid = formData.accountNumber && formData.appKey && formData.appSecret;

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-800/50 backdrop-blur-md rounded-2xl p-8 border border-zinc-700/30">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">한국투자증권 연결</h2>
          <p className="text-zinc-400">계좌 정보를 입력하여 AI 투자 상담을 시작하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-zinc-300 mb-2">
              계좌번호
            </label>
            <input
              id="accountNumber"
              type="text"
              value={formData.accountNumber}
              onChange={handleChange("accountNumber")}
              placeholder="12345678-01"
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="appKey" className="block text-sm font-medium text-zinc-300 mb-2">
              App Key
            </label>
            <input
              id="appKey"
              type="text"
              value={formData.appKey}
              onChange={handleChange("appKey")}
              placeholder="App Key를 입력하세요"
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="appSecret" className="block text-sm font-medium text-zinc-300 mb-2">
              App Secret
            </label>
            <input
              id="appSecret"
              type="password"
              value={formData.appSecret}
              onChange={handleChange("appSecret")}
              placeholder="App Secret을 입력하세요"
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            {isLoading ? "연결 중..." : "연결하기"}
          </button>
        </form>

        <div className="mt-6 text-xs text-zinc-500">
          <p>• 한국투자증권 Open API 서비스 신청 후 발급받은 정보를 입력하세요</p>
          <p>• 입력한 정보는 안전하게 암호화되어 전송됩니다</p>
        </div>
      </div>
    </div>
  );
}
