import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Users } from 'lucide-react';
import Button from './ui/Button';
import { Group, View } from '../types';

interface GuardianHomeProps {
  guardianGroup: Group | null;
  seniors: { id: string; name: string }[];
  seniorStatus: { [key: string]: string };
  isEditingCode: boolean;
  setIsEditingCode: (val: boolean) => void;
  newGroupCode: string;
  setNewGroupCode: (val: string) => void;
  onUpdateGroupCode: () => void;
  onSelectSenior: (senior: { id: string; name: string }) => void;
  onResetRole: () => void;
}

const GuardianHome: React.FC<GuardianHomeProps> = ({
  guardianGroup,
  seniors,
  seniorStatus,
  isEditingCode,
  setIsEditingCode,
  newGroupCode,
  setNewGroupCode,
  onUpdateGroupCode,
  onSelectSenior,
  onResetRole
}) => {
  return (
    <motion.div 
      key="guardian-main"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-6"
    >
      <div className="bg-white p-6 rounded-[32px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-3xl font-black mb-2">보호자 관리 대시보드</h2>
        <p className="text-xl font-bold text-gray-600">연결된 어르신들을 관리합니다.</p>
        <div className="mt-4 p-4 bg-yellow-100 rounded-2xl border-4 border-black">
          <div className="flex justify-between items-center mb-2">
            <p className="text-lg font-bold">내 그룹 코드</p>
            <button 
              onClick={() => {
                setIsEditingCode(!isEditingCode);
                setNewGroupCode(guardianGroup?.groupCode || '');
              }}
              className="text-blue-600 font-black underline"
            >
              {isEditingCode ? '취소' : '변경'}
            </button>
          </div>
          
          {isEditingCode ? (
            <div className="flex flex-col gap-2">
              <input 
                type="text"
                maxLength={6}
                value={newGroupCode}
                onChange={(e) => setNewGroupCode(e.target.value.toUpperCase())}
                className="w-full p-3 rounded-xl border-4 border-black text-2xl font-black"
                placeholder="6자리 코드"
              />
              <Button onClick={onUpdateGroupCode} variant="accent" className="py-3 text-xl">
                저장하기
              </Button>
            </div>
          ) : (
            <>
              <p className="text-4xl font-black text-blue-600 tracking-widest">
                {guardianGroup?.groupCode || '------'}
              </p>
              <p className="text-sm text-gray-600 mt-2 font-bold">어르신 앱에 이 코드를 입력하면 연결됩니다.</p>
            </>
          )}
        </div>
      </div>

      <h3 className="text-3xl font-black mt-4">피보호자 목록</h3>
      
      {seniors.length === 0 ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-8 rounded-[32px] border-4 border-black border-dashed flex flex-col items-center justify-center text-gray-400">
              <Users className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-xl font-bold opacity-40">연결된 어르신이 없습니다</p>
            </div>
          ))}
        </div>
      ) : (
        seniors.map(senior => (
          <div 
            key={senior.id}
            onClick={() => onSelectSenior(senior)}
            className="bg-white p-6 rounded-[32px] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none overflow-hidden gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-black truncate">{senior.name}</p>
              <p className={`text-lg font-bold ${seniorStatus[senior.id]?.includes('대기') || seniorStatus[senior.id]?.includes('미복용') ? 'text-red-600' : 'text-green-600'}`}>
                {seniorStatus[senior.id] || "상태 확인 중..."}
              </p>
            </div>
            <ChevronLeft className="w-8 h-8 rotate-180 flex-shrink-0" />
          </div>
        ))
      )}

      <div className="mt-10 pt-10 border-t-8 border-black">
        <Button onClick={onResetRole} variant="secondary">
          처음 화면으로 (역할 변경)
        </Button>
        <p className="mt-4 text-center text-gray-500 font-bold">
          다른 어르신을 관리하거나 역할을 바꾸려면<br/>위 버튼을 눌러주세요.
        </p>
      </div>
    </motion.div>
  );
};

export default GuardianHome;
