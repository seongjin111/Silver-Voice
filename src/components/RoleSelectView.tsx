import React from 'react';
import { Pill, Users, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import Button from './ui/Button';

interface RoleSelectViewProps {
  onRoleSelect: (role: 'senior' | 'guardian' | 'solo') => void;
  onLogout: () => void;
}

const RoleSelectView: React.FC<RoleSelectViewProps> = ({ onRoleSelect, onLogout }) => {
  return (
    <div className="w-full max-w-[450px] min-h-screen sm:min-h-[850px] sm:h-[90vh] bg-yellow-50 p-6 flex flex-col items-center justify-center border-x-0 sm:border-8 border-black shadow-2xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col gap-8 w-full"
      >
        <h2 className="text-4xl font-black text-center mb-4 leading-tight">반갑습니다!<br/>역할을 선택해주세요</h2>
        <Button onClick={() => onRoleSelect('senior')} variant="primary" className="h-48">
          <div className="flex flex-col items-center gap-2">
            <Pill className="w-16 h-16" />
            <span>피보호자 (어르신)</span>
          </div>
        </Button>
        <Button onClick={() => onRoleSelect('guardian')} variant="accent" className="h-40">
          <div className="flex flex-col items-center gap-2">
            <Users className="w-12 h-12" />
            <span>보호자 (가족/돌보미)</span>
          </div>
        </Button>
        <Button onClick={() => onRoleSelect('solo')} variant="secondary" className="h-40">
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
            <span>혼자 관리 (알림 전용)</span>
          </div>
        </Button>
        
        <button 
          onClick={onLogout}
          className="mt-4 text-xl font-bold text-gray-500 underline decoration-2 underline-offset-4"
        >
          로그아웃하고 처음으로
        </button>
      </motion.div>
    </div>
  );
};

export default RoleSelectView;
