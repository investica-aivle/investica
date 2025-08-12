import { LogInIcon, Menu, UserIcon } from 'lucide-react';

const Header = ({ setShowSideContainer }: { setShowSideContainer: (show: boolean) => void }) => {

  return (
    <>
      <header className="bg-zinc-800/50 backdrop-blur-md text-white py-3 px-4 flex justify-between items-center border-b border-zinc-700/30">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSideContainer(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-gray-100">주식 AI 어드바이저</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            className="flex items-center text-sm px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <LogInIcon className="w-4 h-4 mr-1.5" />
            로그인
          </button>
          <button
            className="flex items-center text-sm bg-white/20 px-3 py-1.5 rounded-xl hover:bg-white/30 transition-colors"
          >
            <UserIcon className="w-4 h-4 mr-1.5" />
            회원가입
          </button>
        </div>
      </header>
    </>
  );
};

export default Header;
