import React, { useState, useEffect, useRef } from 'react';
import { Camera, ChevronLeft } from 'lucide-react';
import Button from './ui/Button';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onCancel: () => void;
  guideText?: string;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ 
  onCapture, 
  onCancel, 
  guideText = "약봉투를 이 칸에 맞춰주세요" 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError("카메라를 시작할 수 없습니다. 권한을 확인해주세요.");
      }
    };
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg');
        onCapture(base64);
      }
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-3xl border-4 border-black">
        <p className="text-xl font-bold text-red-600">{error}</p>
        <Button onClick={onCancel} variant="secondary">뒤로가기</Button>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[3/4] bg-black rounded-3xl border-4 border-black overflow-hidden">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover"
      />
      
      {/* Camera Guide Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[85%] aspect-[1.6/1] border-4 border-yellow-400 rounded-2xl shadow-[0_0_0_2000px_rgba(0,0,0,0.5)] flex items-center justify-center">
          <div className="text-yellow-400 font-black text-xl bg-black/50 px-4 py-2 rounded-lg text-center">
            {guideText}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-6">
        <button 
          onClick={onCancel}
          className="bg-white/20 backdrop-blur-md text-white p-4 rounded-full border-2 border-white active:bg-white/40"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button 
          onClick={capture}
          className="bg-yellow-400 text-black p-6 rounded-full border-4 border-black shadow-lg active:scale-95 transition-transform"
        >
          <Camera className="w-10 h-10" />
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
