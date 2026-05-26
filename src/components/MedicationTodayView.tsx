import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, CheckCircle2, Pill, Home, Volume2, PlusCircle, Trash2, Camera, Package } from 'lucide-react';
import Button from './ui/Button';
import { MedicationPouch, View } from '../types';
import VideoVerificationOverlay from './VideoVerificationOverlay';
import { VideoAnalysisResult } from '../services/geminiService';

interface MedicationTodayViewProps {
  medications: MedicationPouch[];
  setView: (view: View) => void;
  onTakeMedGroups: (meds: MedicationPouch[], analysisResult?: VideoAnalysisResult) => void;
  onDeleteGroup: (meds: MedicationPouch[]) => void;
  onSeedMockData: () => void;
}

type ScheduleTab = 'morning' | 'afternoon' | 'evening';

const MedicationTodayView: React.FC<MedicationTodayViewProps> = ({
  medications,
  setView,
  onTakeMedGroups,
  onDeleteGroup,
  onSeedMockData
}) => {
  const [activeTab, setActiveTab] = useState<ScheduleTab>('morning');
  const [inProgressStates, setInProgressStates] = useState<{[key: string]: number}>({});
  const [showVideoOverlay, setShowVideoOverlay] = useState<MedicationPouch | null>(null);
  const [expandedPrecautions, setExpandedPrecautions] = useState<{[key: string]: boolean}>({});

  const formatInstructions = (text: string) => {
    if (!text) return ["특이사항 없음"];
    
    // Split into sentences using punctuation or newlines
    const sentences = text.split(/[.!?\n]/).map(s => s.trim()).filter(s => s.length > 0);
    
    // Target keywords for actionable instructions
    const actionableKeywords = ['물', '금주', '음주', '금연', '식후', '식전', '중단', '주의', '상담', '얼음', '건조', '졸음', '운전'];
    
    const actionableItems = sentences.filter(s => {
      // 1. Skip professional mechanism descriptions (e.g., "~입니다", "~하는 약입니다")
      const isMechanismDescription = (s.endsWith('입니다') || s.includes('진경제') || s.includes('진통제') || s.includes('완화하는')) && 
                                    !s.includes('마세요') && !s.includes('하세요');
      
      // 2. Keep sentences that imply action or use behavioral endings
      const hasActionSuffix = s.endsWith('세요') || s.endsWith('하십시오') || s.endsWith('마세요') || s.endsWith('금지');
      const hasActionKeyword = actionableKeywords.some(key => s.includes(key));
      
      return (hasActionSuffix || hasActionKeyword) && !isMechanismDescription;
    });

    // Final cleanup: ensure it's presented as a clear list
    const results = actionableItems.length > 0 ? actionableItems : sentences.slice(0, 3);
    
    return results.map(s => {
      const cleaned = s.replace(/^•\s*/, ''); // Remove existing bullets to re-standardize
      return `• ${cleaned}`;
    });
  };

  const togglePrecautions = (id: string) => {
    setExpandedPrecautions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredMeds = medications.filter(m => 
    m.schedule.includes(activeTab) && 
    (m.status === 'approved' || m.status === 'pending_approval')
  );

  const handleNextStep = (pouchId: string, pouch: MedicationPouch) => {
    const currentStep = inProgressStates[pouchId] || 1;
    if (currentStep === 3) {
      onTakeMedGroups([pouch]);
      setInProgressStates(prev => ({ ...prev, [pouchId]: 4 }));
    } else {
      setInProgressStates(prev => ({ ...prev, [pouchId]: currentStep + 1 }));
    }
  };

  const handleAnalysisComplete = (pouch: MedicationPouch, result: VideoAnalysisResult) => {
    onTakeMedGroups([pouch], result);
    setInProgressStates(prev => ({ ...prev, [pouch.id]: 4 }));
    setShowVideoOverlay(null);
  };

  return (
    <motion.div 
      key="today"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col gap-6"
    >
      {showVideoOverlay && (
        <VideoVerificationOverlay 
          onClose={() => setShowVideoOverlay(null)}
          onAnalysisComplete={(res) => {
            handleAnalysisComplete(showVideoOverlay, res);
          }}
          hospitalInfo={showVideoOverlay.hospitalName || "병원 정보 없음"}
          pillsInfo={showVideoOverlay.medications.map(m => m.name).join(', ')}
        />
      )}
      <button onClick={() => setView(View.MAIN)} className="flex items-center gap-2 text-3xl font-black mb-4">
        <ChevronLeft className="w-10 h-10" /> 처음으로
      </button>
      
      <h2 className="text-4xl font-black mb-2">오늘의 약봉지</h2>

      {/* Tabs */}
      <div className="flex gap-2 p-2 bg-gray-100 rounded-[24px] border-4 border-black">
        {(['morning', 'afternoon', 'evening'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 rounded-xl text-2xl font-black transition-all ${
              activeTab === tab 
              ? 'bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
              : 'text-gray-500'
            }`}
          >
            {tab === 'morning' ? '아침' : tab === 'afternoon' ? '점심' : '저녁'}
          </button>
        ))}
      </div>

      {filteredMeds.length === 0 ? (
        <div className="bg-white p-12 rounded-[40px] border-8 border-black text-center flex flex-col gap-6 mt-4">
          <p className="text-3xl font-bold">이 시간에 드실 약이<br/>등록되지 않았습니다.</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => setView(View.ADD)} variant="primary">약 등록하러 가기</Button>
            <Button onClick={onSeedMockData} variant="secondary">예시 데이터 넣기</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 mt-4 pb-10">
          {filteredMeds.map((pouch) => {
            const isTaken = pouch.takenToday;
            const step = isTaken ? 4 : (inProgressStates[pouch.id] || 1);
            
            return (
              <div 
                key={pouch.id} 
                className={`p-6 rounded-[32px] border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6 transition-all ${
                  isTaken ? 'bg-green-50/50 opacity-80' : ''
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-3 overflow-hidden">
                    <div className={`p-3 rounded-xl border-4 border-black shrink-0 ${isTaken ? 'bg-green-400' : 'bg-blue-400'}`}>
                      <Package className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl md:text-3xl font-black truncate">{pouch.pouchName || "이름 없는 약봉투"}</h3>
                        {pouch.status === 'pending_approval' && (
                          <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-lg border-2 border-orange-400 shrink-0">
                            승인 대기
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs md:text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 shrink-0">
                          조제일: {pouch.prescriptionDate || "날짜 미상"}
                        </span>
                        <span className="text-xs md:text-sm font-bold text-gray-400 truncate">
                          {pouch.hospitalName || "정보 없음"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => onDeleteGroup([pouch])}
                      className="p-2 rounded-xl border-4 border-black bg-white text-red-600 active:bg-red-50 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                    {isTaken && (
                      <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        className="text-green-600"
                      >
                        <CheckCircle2 className="w-10 h-10" />
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center px-1 overflow-x-auto no-scrollbar">
                  {[1, 2, 3, 4].map(s => (
                    <React.Fragment key={s}>
                      <div className={`flex flex-col items-center gap-2 relative z-10 shrink-0`}>
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-black flex items-center justify-center font-black text-lg md:text-xl transition-all ${
                          step === s ? 'bg-yellow-400 ring-4 ring-yellow-100' : 
                          step > s ? 'bg-green-400 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {s === 4 ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : s}
                        </div>
                        <span className={`text-[10px] md:text-xs font-bold ${step === s ? 'text-black' : 'text-gray-400'}`}>
                          {s === 1 ? '봉투' : s === 2 ? '뜯기' : s === 3 ? '먹기' : '완료'}
                        </span>
                      </div>
                      {s < 4 && (
                        <div className={`flex-1 h-1.5 border-y-2 border-black -mt-5 transition-all min-w-[20px] ${
                          step > s ? 'bg-green-400' : 'bg-gray-100'
                        }`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="bg-yellow-50 p-4 md:p-6 rounded-2xl border-2 border-black flex flex-col gap-3 overflow-hidden">
                  <p className="text-lg md:text-xl font-bold text-gray-800 leading-tight">
                    포함된 약: <span className="font-black text-blue-600 break-words">{pouch.medications.map(m => m.name).join(', ')}</span>
                  </p>
                  
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => togglePrecautions(pouch.id)}
                      className="flex items-center justify-between w-full p-3 bg-red-100/50 rounded-xl border-2 border-red-200 text-red-700 font-black text-base md:text-lg hover:bg-red-100 transition-colors"
                    >
                      <span>⚠️ 주의사항 {expandedPrecautions[pouch.id] ? '접기' : '보기'}</span>
                      <motion.span
                        animate={{ rotate: expandedPrecautions[pouch.id] ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        ▽
                      </motion.span>
                    </button>
                    
                    {expandedPrecautions[pouch.id] && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex flex-col gap-1.5 px-2 py-1"
                      >
                        {formatInstructions(pouch.instructions).map((line, i) => (
                          <p key={i} className="text-sm md:text-base font-bold text-red-600 leading-relaxed break-words">
                            {line}
                          </p>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  <div className="mt-1 pt-3 border-t border-yellow-200 text-right">
                    <span className="font-black text-blue-600 text-xl md:text-2xl">남은 수량: {pouch.remainingPouches}포</span>
                  </div>
                </div>

                {!isTaken && (
                  <div className="flex flex-col gap-4">
                    {step === 1 && (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                          <PlusCircle className="w-10 h-10 text-blue-600" />
                          <p className="text-2xl font-black text-blue-800">"{pouch.pouchName}" 봉투를 꺼내주세요.</p>
                        </div>
                        <Button onClick={() => handleNextStep(pouch.id, pouch)} variant="primary">꺼냈어요!</Button>
                      </div>
                    )}
                    {step === 2 && (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 bg-orange-50 p-4 rounded-xl border-2 border-orange-200">
                          <Pill className="w-10 h-10 text-orange-600" />
                          <p className="text-2xl font-black text-orange-800">약봉지를 뜯어주세요.</p>
                        </div>
                        <Button onClick={() => handleNextStep(pouch.id, pouch)} variant="primary">뜯었어요!</Button>
                      </div>
                    )}
                    {step === 3 && (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 bg-green-50 p-4 rounded-xl border-2 border-green-200">
                          <Volume2 className="w-10 h-10 text-green-600" />
                          <p className="text-2xl font-black text-green-800">물을 가득 떠서 약을 드세요.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          <Button onClick={() => setShowVideoOverlay(pouch)} variant="primary" className="bg-blue-600 flex items-center justify-center gap-2">
                            <Camera className="w-8 h-8" /> 영상 찍고 먹기
                          </Button>
                          <Button onClick={() => handleNextStep(pouch.id, pouch)} variant="secondary" className="border-4 border-black font-black">
                            그냥 먹었어요
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isTaken && (
                  <div className="bg-green-100 p-4 rounded-xl border-2 border-green-600 text-center">
                    <p className="text-3xl font-black text-green-800">복용 완료 ✅</p>
                    <p className="text-lg font-bold text-green-700 mt-1">참 잘하셨어요!</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default MedicationTodayView;
