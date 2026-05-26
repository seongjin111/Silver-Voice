import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Pill, PlusCircle } from 'lucide-react';
import Button from './ui/Button';
import { UserProfile, View } from '../types';

interface SeniorHomeProps {
  profile: UserProfile;
  groupCodeInput: string;
  setGroupCodeInput: (val: string) => void;
  onJoinGroup: () => void;
  setView: (view: View) => void;
  triggerReminder: (schedule: string) => void;
}

const SeniorHome: React.FC<SeniorHomeProps> = ({
  profile,
  groupCodeInput,
  setGroupCodeInput,
  onJoinGroup,
  setView,
  triggerReminder
}) => {
  return (
    <motion.div 
      key="senior-main"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-8"
    >
      <div className="bg-white p-6 rounded-[32px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-3xl font-black mb-2">안녕하세요, {profile.name}님!</h2>
        <p className="text-2xl font-bold text-gray-600">오늘도 건강한 하루 되세요.</p>
        {profile.role === 'senior' && !profile.groupCode && (
          <div className="mt-6 p-4 bg-blue-50 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xl font-bold text-blue-800 mb-4 leading-tight">보호자 그룹 코드를 입력해 연결하세요.</p>
            <div className="flex flex-col gap-3">
              <input 
                type="text" 
                value={groupCodeInput}
                onChange={(e) => setGroupCodeInput(e.target.value)}
                placeholder="코드 입력 (예: ABCDEF)"
                className="w-full p-4 rounded-xl border-4 border-black text-2xl font-bold focus:outline-none focus:ring-4 focus:ring-blue-200"
              />
              <Button 
                onClick={onJoinGroup}
                variant="accent"
                className="py-4"
              >
                연결하기
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Button onClick={() => setView(View.TODAY)} className="h-40">
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="w-14 h-14" />
            <span>오늘 먹을 약</span>
          </div>
        </Button>

        <Button onClick={() => setView(View.SENIOR_DETAIL)} variant="accent" className="h-40">
          <div className="flex flex-col items-center gap-2">
            <Pill className="w-14 h-14" />
            <span>현재 복용 약</span>
          </div>
        </Button>
      </div>

      <Button onClick={() => setView(View.ADD)} variant="secondary" className="h-40">
        <div className="flex flex-col items-center gap-2">
          <PlusCircle className="w-14 h-14" />
          <span>약 등록하기</span>
        </div>
      </Button>

      <div className="mt-auto pt-8 border-t-8 border-black">
        <p className="text-xl font-black mb-4">알람 테스트 (임시)</p>
        <div className="grid grid-cols-3 gap-3">
          <Button onClick={() => triggerReminder('morning')} variant="primary" className="py-4 text-xl">아침</Button>
          <Button onClick={() => triggerReminder('afternoon')} variant="primary" className="py-4 text-xl">점심</Button>
          <Button onClick={() => triggerReminder('evening')} variant="primary" className="py-4 text-xl">저녁</Button>
        </div>
      </div>
    </motion.div>
  );
};

export default SeniorHome;
