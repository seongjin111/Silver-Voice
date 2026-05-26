import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Video, StopCircle, Loader2, X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import Button from './ui/Button';
import { analyzeMedicationVideo, VideoAnalysisResult } from '../services/geminiService';

interface VideoVerificationOverlayProps {
  onClose: () => void;
  onAnalysisComplete: (result: VideoAnalysisResult) => void;
  hospitalInfo: string;
  pillsInfo: string;
}

const VideoVerificationOverlay: React.FC<VideoVerificationOverlayProps> = ({ 
  onClose, 
  onAnalysisComplete,
  hospitalInfo,
  pillsInfo
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  };

  const startRecording = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (!stream) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setVideoBlob(blob);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleAnalyze = async () => {
    if (!videoBlob) return;
    setAnalyzing(true);
    
    // Convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(videoBlob);
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const res = await analyzeMedicationVideo(base64, 'video/webm', hospitalInfo, pillsInfo);
      if (res) {
        setResult(res);
        onAnalysisComplete(res);
      }
      setAnalyzing(false);
    };
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-black bg-opacity-90 flex flex-col p-6 items-center justify-center"
    >
      <div className="w-full max-w-md bg-white rounded-[40px] border-8 border-black overflow-hidden flex flex-col relative max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-white border-4 border-black rounded-full">
          <X className="w-8 h-8" />
        </button>

        <div className="p-6 bg-yellow-400 border-b-8 border-black">
          <h2 className="text-3xl font-black">복용 영상 확인</h2>
          <p className="text-lg font-bold">약을 드시는 모습을 찍어주세요.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {!result ? (
            <>
              <div className="bg-blue-50 p-4 rounded-2xl border-2 border-black">
                <p className="text-sm font-bold text-gray-500 uppercase">확인할 정보</p>
                <p className="text-xl font-black">{hospitalInfo}</p>
                <p className="text-md font-bold text-gray-600 mt-1">{pillsInfo}</p>
              </div>

              <div className="relative aspect-video bg-black rounded-3xl border-4 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full text-white animate-pulse">
                    <div className="w-3 h-3 bg-white rounded-full" />
                    <span className="font-bold">녹화 중</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {!videoBlob && !isRecording && (
                  <Button onClick={startRecording} variant="primary" className="py-6 text-2xl flex items-center justify-center gap-3">
                    <Video className="w-10 h-10" /> 녹화 시작
                  </Button>
                )}
                {isRecording && (
                  <Button onClick={stopRecording} variant="secondary" className="py-6 text-2xl flex items-center justify-center gap-3 bg-red-400">
                    <StopCircle className="w-10 h-10" /> 녹화 중지
                  </Button>
                )}
                {videoBlob && !isRecording && !analyzing && (
                  <div className="flex flex-col gap-3">
                    <Button onClick={handleAnalyze} variant="primary" className="py-6 text-2xl flex items-center justify-center gap-3">
                      <ShieldCheck className="w-10 h-10" /> AI 분석 시작
                    </Button>
                    <Button onClick={() => setVideoBlob(null)} variant="secondary" className="py-4">다시 찍기</Button>
                  </div>
                )}
                {analyzing && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
                    <p className="text-2xl font-black">전문 보조가 영상을<br/>면밀히 분석 중입니다...</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
              <div className={`p-6 rounded-3xl border-4 border-black ${result.safety_status.decision === 'APPROVE' ? 'bg-green-100 border-green-600' : 'bg-red-100 border-red-600'}`}>
                <div className="flex items-center gap-3 mb-4">
                  {result.safety_status.decision === 'APPROVE' ? <CheckCircle2 className="w-10 h-10 text-green-600" /> : <AlertTriangle className="w-10 h-10 text-red-600" />}
                  <h3 className="text-3xl font-black">{result.safety_status.decision === 'APPROVE' ? '복용 가능' : '복용 중지!'}</h3>
                </div>
                <p className="text-2xl font-black leading-tight mb-2">
                  {result.tts_message}
                </p>
                <p className="text-lg font-bold text-gray-700">
                  {result.safety_status.reason}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-sm font-black text-blue-600 uppercase mb-1">감지된 봉투 정보</p>
                  <p className="text-xl font-bold">{result.cross_verification.envelope_info}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-sm font-black text-purple-600 uppercase mb-1">비닐 속 실제 알약</p>
                  <p className="text-xl font-bold">{result.cross_verification.actual_pills_in_vinyl}</p>
                </div>
              </div>

              {result.cross_verification.is_mismatched && (
                <div className="bg-red-600 text-white p-4 rounded-2xl border-4 border-black animate-pulse flex items-center gap-3">
                  <AlertTriangle className="w-10 h-10" />
                  <p className="text-xl font-black text-center">주의! 등록된 정보와 알약 구성이 다릅니다.</p>
                </div>
              )}

              <Button onClick={onClose} variant="primary" className={`py-5 text-2xl ${result.safety_status.decision === 'STOP' ? 'bg-red-600' : ''}`}>
                {result.safety_status.decision === 'APPROVE' ? '확인 완료' : '다시 확인하기'}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VideoVerificationOverlay;
