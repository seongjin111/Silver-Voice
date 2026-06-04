import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Calendar, Package } from 'lucide-react';
import Button from './ui/Button';
import { MedicationPouch, View, UserProfile } from '../types';

interface MedicationEditViewProps {
  mode: 'review' | 'edit' | 'registration';
  editingMed: MedicationPouch;
  setEditingMed: (med: MedicationPouch) => void;
  profile: UserProfile | null;
  setView: (view: View) => void;
  onApprove: (med: MedicationPouch) => void;
  onUpdate: (e: React.FormEvent) => void;
}

const MedicationEditView: React.FC<MedicationEditViewProps> = ({
  mode,
  editingMed,
  setEditingMed,
  profile,
  setView,
  onApprove,
  onUpdate
}) => {
  const isReview = mode === 'review';
  const isRegistration = mode === 'registration';

  const isValid = editingMed.pouchName.trim() !== '' && 
                  editingMed.dosageDays > 0 && 
                  editingMed.schedule.length > 0;

  const handleScheduleToggle = (s: string) => {
    const newSchedule = editingMed.schedule.includes(s)
      ? editingMed.schedule.filter(item => item !== s)
      : [...editingMed.schedule, s];
    
    const newTimes = newSchedule.length;
    setEditingMed({
      ...editingMed, 
      schedule: newSchedule, 
      timesPerDay: newTimes, // For registration/review, we strictly link these
      remainingPouches: newTimes * editingMed.dosageDays
    });
  };

  return (
    <motion.div 
      key={mode}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <button 
        onClick={() => setView(isRegistration ? View.ADD : (profile?.role === 'solo' ? View.TODAY : View.SENIOR_DETAIL))} 
        className="flex items-center gap-2 text-2xl font-black mb-2"
      >
        <ChevronLeft className="w-8 h-8" /> {isRegistration ? '다시 촬영하기' : '뒤로가기'}
      </button>
      
      <h2 className="text-3xl font-black">
        {isRegistration ? '필수 정보를 입력해주세요' : isReview ? '약봉투 등록 정보 확인' : '약봉투 정보 수정'}
      </h2>

      <div className="bg-white p-6 rounded-[32px] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6">
        <form onSubmit={onUpdate} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-lg font-black text-gray-700 flex items-center gap-2">
              <Package className="w-5 h-5" /> 약봉투 이름 <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={editingMed.pouchName}
              onChange={(e) => setEditingMed({...editingMed, pouchName: e.target.value})}
              className={`p-4 rounded-2xl border-4 border-black text-2xl font-bold transition-colors ${editingMed.pouchName ? 'bg-yellow-50' : 'bg-red-50'}`}
              placeholder="예: 아침 감기약, 아빠 혈압약"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-lg font-black text-gray-700">복용 시간대 <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              {['morning', 'afternoon', 'evening'].map(s => {
                const isActive = editingMed.schedule.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleScheduleToggle(s)}
                    className={`flex-1 py-4 rounded-xl border-4 border-black font-black text-xl transition-all ${
                      isActive 
                      ? 'bg-blue-500 text-white shadow-none translate-x-1 translate-y-1' 
                      : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    {s === 'morning' ? '아침' : s === 'afternoon' ? '점심' : '저녁'}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-4 border-t-2 border-black border-dashed">
            <div className="flex flex-col gap-2">
              <label className="text-lg font-black text-gray-700">투약 일수 (며칠 동안 드시나요?) <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  value={editingMed.dosageDays || ''}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value) || 0);
                    setEditingMed({
                      ...editingMed, 
                      dosageDays: val,
                      remainingPouches: editingMed.timesPerDay * val
                    });
                  }}
                  className={`flex-1 p-4 rounded-2xl border-4 border-black text-2xl font-bold ${editingMed.dosageDays > 0 ? 'bg-yellow-50' : 'bg-red-50'}`}
                  placeholder="0"
                  required
                />
                <span className="font-black text-2xl">일분</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-blue-50 p-6 rounded-2xl border-4 border-black mt-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-lg font-black text-blue-800">자동 계산된 총 약봉투 수</label>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 p-4 rounded-xl border-4 border-black text-4xl font-black bg-white text-blue-600 text-center">
                {editingMed.remainingPouches}
              </div>
              <span className="font-black text-2xl">포</span>
            </div>
            <p className="text-sm font-bold text-blue-600 mt-2 text-center bg-white/50 py-1 rounded-lg">
              {editingMed.schedule.length}회(시간대) × {editingMed.dosageDays}일 = {editingMed.remainingPouches}포
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-4 border-t-4 border-black pt-6">
            <p className="text-xl font-black text-blue-600">등록할 사진 확인</p>
            {editingMed.imageUrl ? (
              <img 
                src={editingMed.imageUrl} 
                alt="Prescription" 
                className="w-full rounded-2xl border-4 border-black object-cover max-h-48 shadow-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-32 bg-gray-100 rounded-2xl border-4 border-black border-dashed flex items-center justify-center text-gray-400 font-bold">
                사진 없음
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-2">
            {isRegistration ? (
              <Button
                type="button"
                onClick={() => onApprove(editingMed)}
                variant="primary"
                className={`py-5 text-3xl ${!isValid ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                disabled={!isValid}
              >
                등록 완료하기
              </Button>
            ) : isReview ? (
              <>
                <Button 
                  onClick={() => onApprove(editingMed)} 
                  variant="primary"
                  className="py-5 text-3xl"
                >
                  확인 및 승인하기
                </Button>
                <p className="text-center text-gray-500 font-bold text-sm">
                  사진과 내용이 맞는지 꼭 확인해주세요!
                </p>
              </>
            ) : (
              <div className="flex gap-4">
                <Button 
                  onClick={() => setView(profile?.role === 'solo' ? View.TODAY : View.SENIOR_DETAIL)} 
                  variant="secondary"
                  className="flex-1"
                >
                  취소
                </Button>
                <Button type="submit" variant="primary" className={`flex-1 ${!isValid ? 'opacity-50 grayscale' : ''}`} disabled={!isValid}>저장 완료</Button>
              </div>
            )}
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default MedicationEditView;
