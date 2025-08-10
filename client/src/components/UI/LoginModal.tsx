import { XIcon } from 'lucide-react';

const LoginModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-zinc-800/90 backdrop-blur-md rounded-2xl w-full max-w-md p-6 relative border border-zinc-700/30">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>
        
        <h2 className="text-2xl font-bold text-gray-100 mb-6">로그인</h2>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              이메일
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 bg-zinc-700/50 border border-zinc-600/30 rounded-xl text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20"
              placeholder="이메일 주소를 입력하세요"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 bg-zinc-700/50 border border-zinc-600/30 rounded-xl text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20"
              placeholder="비밀번호를 입력하세요"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-600 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                로그인 상태 유지
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                비밀번호 찾기
              </a>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-white/10 text-white py-2 px-4 rounded-xl hover:bg-white/20 transition-colors"
          >
            로그인
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-400">
          아직 계정이 없으신가요?{' '}
          <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
            회원가입
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
