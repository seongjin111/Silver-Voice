import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Loader2, AlertTriangle } from 'lucide-react';
import Button from './ui/Button';
import CameraCapture from './CameraCapture';
import { MedicationPouch } from '../types';

interface OverlayModalsProps {
  feedback: string | null;
  activeReminder: string | null;
  setActiveReminder: (val: string | null) => void;
  medications: MedicationPouch[];
  onTakeMed: (med: MedicationPouch) => void;
  setFeedback: (msg: string | null) => void;
  profileRole: string | undefined;
}

const OverlayModals: React.FC<OverlayModalsProps> = ({
  feedback,
  activeReminder,
  setActiveReminder,
  medications,
  onTakeMed,
  setFeedback,
  profileRole
}) => {
  return (
    <>
      {/* Feedback Overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none p-6"
          >
            <div className="bg-white p-10 rounded-[50px] border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] w-full max-w-[400px]">
              <p className="text-5xl font-black text-center leading-tight">{feedback}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reminder Modal */}
      {activeReminder && (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-[450px] bg-white rounded-[40px] border-8 border-blue-600 p-8 flex flex-col gap-6 text-center"
          >
            <div className="flex justify-center">
              <Bell className="w-24 h-24 text-blue-600 animate-ring" />
            </div>
            <h2 className="text-4xl font-black text-blue-600">약 드실 시간!</h2>
            <p className="text-2xl font-bold">
              {activeReminder === 'morning' ? '아침' : activeReminder === 'afternoon' ? '점심' : '저녁'} 약을 드실 시간입니다.
            </p>
            <div className="bg-blue-50 p-6 rounded-2xl border-4 border-blue-200">
              <p className="text-xl font-bold">약을 드셨다면 "먹었어"라고 말씀하시거나 아래 버튼을 눌러주세요.</p>
            </div>
            
            <div className="flex flex-col gap-4">
              <Button 
                onClick={() => {
                  const scheduleToConfirm = activeReminder;
                  setActiveReminder(null);
                  const dueMeds = medications.filter(m =>
                    !m.takenToday &&
                    m.schedule.includes(scheduleToConfirm)
                  );
                  if (dueMeds.length > 0) {
                    onTakeMed(dueMeds[0]);
                  } else {
                    setFeedback("복용할 약이 없습니다.");
                    setTimeout(() => setFeedback(null), 2000);
                  }
                }} 
                variant="primary"
                className="py-6 text-2xl"
              >
                확인 (먹었어요)
              </Button>
              <Button 
                onClick={() => setActiveReminder(null)} 
                variant="secondary"
              >
                나중에
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default OverlayModals;
