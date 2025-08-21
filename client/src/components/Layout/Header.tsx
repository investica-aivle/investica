import { Menu, UserIcon, LogOutIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector, selectMaskedAccountNumber, selectAccountType } from '../../store/hooks';
import { logout as logoutAction } from '../../store/slices/authSlice';
import { useLogoutMutation } from '../../store/api/authApi';
import { SessionManager } from '../../utils/sessionManager';
import logo from "../../assets/logo.png"

const Header = ({ setShowSideContainer }: { setShowSideContainer: (show: boolean) => void }) => {
  const dispatch = useAppDispatch();
  const maskedAccountNumber = useAppSelector(selectMaskedAccountNumber);
  const accountType = useAppSelector(selectAccountType);
  const [logoutMutation] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      // 서버에 로그아웃 API 호출 (RTK Query 사용)
      await logoutMutation().unwrap();
    } catch (error: any) {
      console.warn('서버 로그아웃 실패, 로컬 로그아웃 진행:', error.message);
      // 서버 로그아웃 실패해도 로컬 로그아웃은 진행
    } finally {
      // 로컬 세션 삭제 및 Redux 상태 초기화
      SessionManager.clearSession();
      dispatch(logoutAction());
    }
  };

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
          <div className="flex items-center space-x-0.1">
            <img
                src={logo}
                alt="로고"
                className="w-12 h-8"
            />
            <h1 className="text-xl font-bold text-gray-100">investica</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* 인증된 사용자 정보 */}
          <div className="flex items-center text-sm px-3 py-1.5 rounded-xl bg-green-600/20 border border-green-500/30">
            <UserIcon className="w-4 h-4 mr-1.5" />
            <span>{maskedAccountNumber}</span>
            {accountType && (
              <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
                accountType === 'REAL' 
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {accountType === 'REAL' ? '실전' : '모의'}
              </span>
            )}
          </div>

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            className="flex items-center text-sm px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 transition-colors border border-red-500/30"
          >
            <LogOutIcon className="w-4 h-4 mr-1.5" />
            로그아웃
          </button>
        </div>
      </header>
    </>
  );
};

export default Header;
