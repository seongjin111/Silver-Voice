import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Camera, Loader2 } from 'lucide-react';
import Button from './ui/Button';
import CameraCapture from './CameraCapture';
import { View } from '../types';

interface AddMedicationViewProps {
  isCameraOpen: boolean;
  setIsCameraOpen: (val: boolean) => void;
  analyzing: boolean;
  onCapture: (base64: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setView: (view: View) => void;
}

const AddMedicationView: React.FC<AddMedicationViewProps> = ({
  isCameraOpen,
  setIsCameraOpen,
  analyzing,
  onCapture,
  onFileUpload,
  fileInputRef,
  setView
}) => {
  return (
    <motion.div 
      key="add"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col gap-8"
    >
      <button onClick={() => { setView(View.MAIN); setIsCameraOpen(false); }} className="flex items-center gap-2 text-3xl font-black mb-4">
        <ChevronLeft className="w-10 h-10" /> 처음으로
      </button>

      <h2 className="text-4xl font-black mb-4">약 등록하기</h2>

      {isCameraOpen ? (
        <CameraCapture 
          onCapture={(base64) => {
            onCapture(base64);
            setIsCameraOpen(false);
          }}
          onCancel={() => setIsCameraOpen(false)}
        />
      ) : (
        <div className="bg-white p-8 rounded-[32px] border-4 border-black text-center">
          <div className="mb-6 flex justify-center">
            <Camera className="w-24 h-24 text-gray-400" />
          </div>
          <p className="text-2xl font-bold mb-8">약봉투 사진을 찍어서<br/>올려주세요.</p>
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            ref={fileInputRef}
            onChange={onFileUpload}
          />
          
          <div className="flex flex-col gap-4">
            <Button 
              onClick={() => setIsCameraOpen(true)} 
              disabled={analyzing}
              variant="primary"
            >
              {analyzing ? (
                <div className="flex items-center justify-center gap-4">
                  <Loader2 className="animate-spin w-10 h-10" />
                  <span>분석 중...</span>
                </div>
              ) : '카메라로 찍기'}
            </Button>
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={analyzing}
              variant="secondary"
            >
              앨범에서 선택
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AddMedicationView;
