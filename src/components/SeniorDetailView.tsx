import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Trash2, Info, Edit3, Calendar, Package } from 'lucide-react';
import Button from './ui/Button';
import { MedicationPouch, View } from '../types';

interface SeniorDetailViewProps {
  selectedSenior: { id: string; name: string };
  medications: MedicationPouch[];
  setView: (view: View) => void;
  setEditingMed: (med: MedicationPouch) => void;
  onDeleteMed: (med: MedicationPouch) => void;
  onUpdatePouch: (pouch: MedicationPouch) => void;
}

const SeniorDetailView: React.FC<SeniorDetailViewProps> = ({
  selectedSenior,
  medications,
  setView,
  setEditingMed,
  onDeleteMed,
  onUpdatePouch
}) => {
  const [viewingDetails, setViewingDetails] = React.useState<string | null>(null);

  const handleAdjustQuantity = (pouch: MedicationPouch, amount: number) => {
    const newQty = Math.max(0, pouch.remainingPouches + amount);
    onUpdatePouch({ ...pouch, remainingPouches: newQty });
  };

  const selectedPouch = medications.find(m => m.id === viewingDetails);

  if (viewingDetails && selectedPouch) {
    return (
      <motion.div 
        key="pouch-detail"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col gap-6"
      >
        <header className="flex items-center gap-2">
          <button onClick={() => setViewingDetails(null)} className="p-2 -ml-2">
            <ChevronLeft className="w-8 h-8" /> 
          </button>
          <h2 className="text-2xl font-black">{selectedPouch.pouchName} 상세</h2>
        </header>

        <div className="bg-white p-6 rounded-[32px] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest border-b-2 border-gray-100 pb-2">포함된 약 성분</h3>
            {selectedPouch.medications.map(med => (
              <div key={med.id} className="p-4 bg-gray-50 rounded-2xl border-2 border-black">
                <p className="text-xl font-black text-blue-600">{med.name}</p>
                <p className="font-bold text-gray-600">{med.instructions}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-yellow-50 rounded-2xl border-2 border-black border-dashed flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-500">병원</span>
              <span className="font-black text-gray-800">{selectedPouch.hospitalName || '정보 없음'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-500">약국</span>
              <span className="font-black text-gray-800">{selectedPouch.pharmacyName || '정보 없음'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-500">조제일</span>
              <span className="font-black text-gray-800">{selectedPouch.prescriptionDate}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      key="senior-detail"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-6"
    >
      <button onClick={() => setView(View.MAIN)} className="flex items-center gap-2 text-2xl font-black mb-2">
        <ChevronLeft className="w-8 h-8" /> 대시보드로
      </button>
      
      <h2 className="text-3xl font-black">{selectedSenior.name}님의 약봉투</h2>

      {medications.length === 0 ? (
        <div className="bg-white p-8 rounded-[32px] border-4 border-black border-dashed text-center text-gray-400 font-bold">
          등록된 약봉투가 없습니다.
        </div>
      ) : (
        medications.map(pouch => (
          <div key={pouch.id} className="bg-white p-6 rounded-[32px] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
            <div className="flex justify-between items-start gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h3 className="text-2xl font-black break-words">{pouch.pouchName}</h3>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>조제일: {pouch.prescriptionDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onDeleteMed(pouch)}
                  className="p-2 rounded-lg border-2 border-black bg-red-50 text-red-600 active:scale-95 transition-transform"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <span className={`px-2 py-1 rounded-lg text-xs font-black border-2 border-black ${pouch.status === 'approved' ? 'bg-green-200' : 'bg-red-200'}`}>
                  {pouch.status === 'approved' ? '승인됨' : '승인 대기'}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border-2 border-black flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-blue-800">남은 약봉지 수</span>
                  <span className="text-2xl font-black text-blue-600">{pouch.remainingPouches}포 남음</span>
                </div>
                <button 
                  onClick={() => {
                    setEditingMed(pouch);
                    setView(View.EDIT_MED);
                  }}
                  className="p-3 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                >
                  <Edit3 className="w-6 h-6" />
                </button>
              </div>
              <div className="flex gap-2 w-full">
                <button 
                  onClick={() => handleAdjustQuantity(pouch, -1)}
                  className="flex-1 py-2 rounded-xl border-2 border-black bg-white font-black text-xl active:bg-gray-100"
                >
                  - 1포
                </button>
                <button 
                  onClick={() => handleAdjustQuantity(pouch, 1)}
                  className="flex-1 py-2 rounded-xl border-2 border-black bg-white font-black text-xl active:bg-gray-100"
                >
                  + 1포
                </button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => setViewingDetails(pouch.id)} 
                variant="secondary" 
                className="py-3 text-lg flex items-center justify-center gap-2 flex-1"
              >
                <Info className="w-5 h-5" /> 약 정보 보기
              </Button>
              {pouch.status === 'pending_approval' && (
                <Button 
                  onClick={() => {
                    setEditingMed(pouch);
                    setView(View.REVIEW_MED);
                  }} 
                  variant="primary" 
                  className="py-3 text-lg flex-1"
                >
                  승인하기
                </Button>
              )}
            </div>
          </div>
        ))
      )}
    </motion.div>
  );
};

export default SeniorDetailView;
