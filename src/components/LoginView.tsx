import React from 'react';
import { Pill } from 'lucide-react';
import Button from './ui/Button';

interface LoginViewProps {
  onGoogleLogin: () => void;
  onMockLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onGoogleLogin, onMockLogin }) => {
  return (
    <div className="w-full max-w-[450px] min-h-screen sm:min-h-[850px] sm:h-[90vh] bg-yellow-50 p-6 flex flex-col items-center justify-center text-center border-x-0 sm:border-8 border-black shadow-2xl overflow-y-auto">
      <div className="mb-12 w-full px-4">
        <div className="bg-white p-8 rounded-full border-8 border-black mb-6 inline-block shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <Pill className="w-20 h-20 text-blue-600" />
        </div>
        <h1 className="text-5xl font-black mb-4 break-words">실버보이스</h1>
        <p className="text-2xl font-bold text-gray-700 leading-relaxed">어르신의 건강한 하루를 돕는<br/>다정한 복약 비서입니다</p>
      </div>
      
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button onClick={onGoogleLogin} variant="primary">
          구글로 시작하기
        </Button>
        <Button onClick={onMockLogin} variant="secondary">
          테스트 모드로 시작
        </Button>
      </div>
      
      <p className="mt-8 text-sm text-gray-500 font-bold">
        ※ 실제 로그인이 부담스러우시면<br/>'테스트 모드'를 이용해 보세요.
      </p>
    </div>
  );
};

export default LoginView;
