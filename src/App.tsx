/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc,
  doc, 
  Timestamp,
  getDocFromServer,
  getDocs,
  arrayUnion
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, logout, signInWithGoogle } from './firebase';
import { analyzePrescription } from './services/geminiService';
import { Pill, LogOut, Users, Loader2 } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

// Specialized Components
import Button from './components/ui/Button';
import ErrorBoundary from './components/ui/ErrorBoundary';
import LoginView from './components/LoginView';
import RoleSelectView from './components/RoleSelectView';
import SeniorHome from './components/SeniorHome';
import GuardianHome from './components/GuardianHome';
import SeniorDetailView from './components/SeniorDetailView';
import MedicationEditView from './components/MedicationEditView';
import MedicationTodayView from './components/MedicationTodayView';
import AddMedicationView from './components/AddMedicationView';
import OverlayModals from './components/OverlayModals';

// Types
import { 
  OperationType, 
  MedicationPouch, 
  UserProfile, 
  Group, 
  View 
} from './types';

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>(View.MAIN);
  const [medications, setMedications] = useState<MedicationPouch[]>([]);
  const [seniors, setSeniors] = useState<{id: string, name: string}[]>([]);
  const [seniorStatus, setSeniorStatus] = useState<{[key: string]: string}>({});
  const [selectedSenior, setSelectedSenior] = useState<{id: string, name: string} | null>(null);
  const [editingMed, setEditingMed] = useState<MedicationPouch | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [groupCodeInput, setGroupCodeInput] = useState('');
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newGroupCode, setNewGroupCode] = useState('');
  const [guardianGroup, setGuardianGroup] = useState<Group | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [lastReminderTime, setLastReminderTime] = useState<number>(0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeReminder, setActiveReminder] = useState<string | null>(null);
  const [pouchFlow, setPouchFlow] = useState<{
    schedule: string;
    step: 1 | 2 | 3 | 4;
    meds: MedicationPouch[];
  } | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Auth & Profile ---
  useEffect(() => {
    const savedMockUser = localStorage.getItem('mock_user');
    if (savedMockUser) {
      const u = JSON.parse(savedMockUser);
      setUser(u);
      checkProfile(u.uid);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) checkProfile(u.uid);
      else setProfile(null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const checkProfile = async (uid: string) => {
    if (uid.startsWith('mock_')) {
      const savedProfile = localStorage.getItem(`profile_${uid}`);
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
        setView(View.MAIN);
        return;
      }
      setView(View.LOGIN_ROLE);
      return;
    }

    const docRef = doc(db, 'users', uid);
    try {
      const docSnap = await getDocFromServer(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
        setView(View.MAIN);
      } else {
        setView(View.LOGIN_ROLE);
      }
    } catch (error) {
      console.error("Profile check error:", error);
      setView(View.LOGIN_ROLE);
    }
  };

  // --- Real-time Listeners ---
  useEffect(() => {
    if (!user || !profile) return;

    if (user.uid.startsWith('mock_') && (profile.role === 'senior' || profile.role === 'solo')) {
      const syncMeds = () => {
        const allMeds = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('med_')) {
            const med = JSON.parse(localStorage.getItem(key) || '{}');
            if (med.userId === user.uid) allMeds.push(med);
          }
        }
        setMedications(allMeds);
      };
      const interval = setInterval(syncMeds, 2000);
      return () => clearInterval(interval);
    } else if (profile.role === 'senior' || profile.role === 'solo') {
      const q = query(collection(db, 'medications'), where('userId', '==', user.uid));
      return onSnapshot(q, (snapshot) => {
        setMedications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MedicationPouch[]);
      }, (error) => console.error("Firestore Error:", error));
    }
  }, [user, profile]);

  useEffect(() => {
    if (!user || profile?.role !== 'guardian') return;

    const syncGuardianData = async (groupData: Group) => {
      setGuardianGroup(groupData);
      const seniorList: {id: string, name: string}[] = [];
      for (const seniorId of groupData.memberIds) {
        try {
          let sName = '어르신';
          if (user.uid.startsWith('mock_')) {
            const sp = JSON.parse(localStorage.getItem(`profile_${seniorId}`) || '{}');
            sName = sp.name || '어르신';
            const meds: any[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key?.startsWith('med_')) {
                const med = JSON.parse(localStorage.getItem(key) || '{}');
                if (med.userId === seniorId) meds.push(med);
              }
            }
            const untakenCount = meds.filter(m => !m.takenToday).length;
            let statusText = untakenCount > 0 ? `${untakenCount}건 미복용` : "모두 복용함";
            setSeniorStatus(prev => ({ ...prev, [seniorId]: statusText }));
          } else {
            const sDoc = await getDocFromServer(doc(db, 'users', seniorId));
            if (sDoc.exists()) sName = sDoc.data().name;
          }
          seniorList.push({ id: seniorId, name: sName });
        } catch (e) { console.error(e); }
      }
      setSeniors(seniorList);
    };

    if (user.uid.startsWith('mock_')) {
      const interval = setInterval(() => {
        const saved = localStorage.getItem(`group_${user.uid}`);
        if (saved) syncGuardianData(JSON.parse(saved));
      }, 2000);
      return () => clearInterval(interval);
    } else {
      return onSnapshot(doc(db, 'groups', user.uid), (snapshot) => {
        if (snapshot.exists()) syncGuardianData(snapshot.data() as Group);
      }, (error) => console.error("Guardian sync error:", error));
    }
  }, [user, profile]);

  // 피보호자 약 복용 상태 실시간 감지 (Firestore 전용)
  useEffect(() => {
    if (!user || profile?.role !== 'guardian' || user.uid.startsWith('mock_') || seniors.length === 0) return;

    const computeStatus = (meds: any[]) => {
      const untakenCount = meds.filter(m => !m.takenToday).length;
      if (untakenCount > 0) return `${untakenCount}건 미복용`;
      return "모두 복용함";
    };

    const unsubscribers = seniors.map(senior => {
      const q = query(collection(db, 'medications'), where('userId', '==', senior.id));
      return onSnapshot(q, (snapshot) => {
        const meds = snapshot.docs.map(d => d.data());
        setSeniorStatus(prev => ({ ...prev, [senior.id]: computeStatus(meds) }));
      }, (error) => console.error("Senior med sync error:", error));
    });

    return () => unsubscribers.forEach(u => u());
  }, [user, profile, seniors]);

  useEffect(() => {
    if (!selectedSenior) return;
    if (selectedSenior.id.startsWith('mock_')) {
      const interval = setInterval(() => {
        const allMeds = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('med_')) {
            const med = JSON.parse(localStorage.getItem(key) || '{}');
            if (med.userId === selectedSenior.id) allMeds.push(med);
          }
        }
        setMedications(allMeds);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      const q = query(collection(db, 'medications'), where('userId', '==', selectedSenior.id));
      return onSnapshot(q, (snapshot) => {
        setMedications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MedicationPouch[]);
      });
    }
  }, [selectedSenior]);

  // --- Speech & Reminders ---
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!user || (profile?.role !== 'senior' && profile?.role !== 'solo')) return;
    const interval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const currentTime = now.getTime();
      if (currentTime - lastReminderTime < 3600000) return;

      let targetSchedule = "";
      if (hour >= 6 && hour < 10) targetSchedule = "morning";
      else if (hour >= 11 && hour < 14) targetSchedule = "afternoon";
      else if (hour >= 17 && hour < 21) targetSchedule = "evening";

      if (targetSchedule) {
        const dueMeds = medications.filter(m => !m.takenToday && m.schedule.includes(targetSchedule));
        if (dueMeds.length > 0) {
          const name = targetSchedule === "morning" ? "아침" : targetSchedule === "afternoon" ? "점심" : "저녁";
          const msg = `어르신, ${name} 약 드실 시간이에요. 드시고 나서 꼭 '먹었어'라고 말씀해 주세요.`;
          speak(msg);
          setFeedback(msg);
          setLastReminderTime(currentTime);
          setTimeout(() => setFeedback(null), 10000);
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [user, profile, medications, lastReminderTime]);

  const triggerReminder = (schedule: string) => {
    setActiveReminder(schedule);
    const name = schedule === "morning" ? "아침" : schedule === "afternoon" ? "점심" : "저녁";
    speak(`어르신, ${name} 약 드실 시간이에요. 약을 드셨다면 '먹었어'라고 말씀하시거나 확인 버튼을 눌러주세요.`);
    startListening(true);
  };

  const startListening = (isForReminder = false) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'ko-KR';
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.includes("먹었어") || transcript.includes("응") || transcript.includes("방금")) {
        if (isForReminder && activeReminder) {
          const target = activeReminder;
          setActiveReminder(null);
          const due = medications.filter(m => !m.takenToday && m.schedule.includes(target));
          if (due.length > 0) handleTakeMed(due[0]);
        } else {
          const untaken = medications.filter(m => !m.takenToday);
          if (untaken.length > 0) handleTakeMed(untaken[0]);
        }
      }
    };
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // --- Handlers ---
  const handleLogout = async () => {
    localStorage.removeItem('mock_user');
    setUser(null);
    setProfile(null);
    setView(View.MAIN);
    await logout();
  };

  const handleRoleSelect = async (role: 'senior' | 'guardian' | 'solo') => {
    if (!user) return;
    const newProfile: UserProfile = { role, name: user.displayName || '사용자' };
    if (user.uid.startsWith('mock_')) localStorage.setItem(`profile_${user.uid}`, JSON.stringify(newProfile));
    else await setDoc(doc(db, 'users', user.uid), newProfile);
    
    if (role === 'guardian') {
      const groupCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newGroup = { adminId: user.uid, groupCode, memberIds: [] };
      if (user.uid.startsWith('mock_')) localStorage.setItem(`group_${user.uid}`, JSON.stringify(newGroup));
      else await setDoc(doc(db, 'groups', user.uid), newGroup);
    }
    setProfile(newProfile);
    setView(View.MAIN);
  };

  const handleJoinGroup = async () => {
    if (!user || !groupCodeInput) return;
    const code = groupCodeInput.toUpperCase();
    let groupData: Group | null = null;
    let groupId: string | null = null;

    try {
      const q = query(collection(db, 'groups'), where('groupCode', '==', code));
      const snap = await getDocs(q);
      if (!snap.empty) {
        groupId = snap.docs[0].id;
        groupData = snap.docs[0].data() as Group;
      } else {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith('group_mock_')) {
            const d = JSON.parse(localStorage.getItem(k) || '{}');
            if (d.groupCode === code) { groupData = d; groupId = k.replace('group_', ''); break; }
          }
        }
      }

      if (!groupId) { setFeedback("존재하지 않는 그룹 코드입니다."); return; }

      if (groupId.startsWith('mock_')) {
        const updated = { ...groupData, memberIds: Array.from(new Set([...(groupData!.memberIds || []), user.uid])) };
        localStorage.setItem(`group_${groupId}`, JSON.stringify(updated));
      } else {
        await updateDoc(doc(db, 'groups', groupId), { memberIds: arrayUnion(user.uid) });
      }

      if (user.uid.startsWith('mock_')) {
        const p = JSON.parse(localStorage.getItem(`profile_${user.uid}`) || '{}');
        p.groupCode = code;
        localStorage.setItem(`profile_${user.uid}`, JSON.stringify(p));
      } else {
        await updateDoc(doc(db, 'users', user.uid), { groupCode: code } as any);
      }
      setProfile(prev => prev ? { ...prev, groupCode: code } : null);
      setFeedback("그룹에 연결되었습니다!");
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('그룹 연결 오류:', error);
      setFeedback("그룹 연결 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleUpdateGroupCode = async () => {
    if (!user || !newGroupCode) return;
    const code = newGroupCode.toUpperCase();
    if (user.uid.startsWith('mock_')) {
      const g = JSON.parse(localStorage.getItem(`group_${user.uid}`) || '{}');
      g.groupCode = code;
      localStorage.setItem(`group_${user.uid}`, JSON.stringify(g));
      setGuardianGroup(g);
    } else await updateDoc(doc(db, 'groups', user.uid), { groupCode: code });
    setIsEditingCode(false);
    setFeedback("그룹 코드가 변경되었습니다!");
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleTakeMed = async (med: MedicationPouch) => {
    if (med.takenToday) { speak("이미 드셨어요!"); return; }
    await finalizeTakeMed(med);
    speak("기록 완료하였습니다.");
  };

  const finalizeTakeMed = async (med: MedicationPouch) => {
    const newRemaining = Math.max(0, med.remainingPouches - 1);
    const updates: any = { 
      takenToday: true, 
      remainingPouches: newRemaining 
    };
    
    if (med.id.startsWith('mock_med_')) {
      const saved = localStorage.getItem(`med_${med.id}`);
      if (saved) {
        const d = JSON.parse(saved);
        Object.assign(d, updates);
        localStorage.setItem(`med_${med.id}`, JSON.stringify(d));
      }
    } else await updateDoc(doc(db, 'medications', med.id), updates);
  };

  const handleDeleteMeds = async (meds: MedicationPouch[]) => {
    try {
      for (const med of meds) {
        if (med.id.startsWith('mock_med_')) {
          localStorage.removeItem(`med_${med.id}`);
        } else {
          await deleteDoc(doc(db, 'medications', med.id));
        }
      }
      setFeedback("삭제되었습니다.");
      setTimeout(() => setFeedback(null), 2000);
    } catch (error) {
      console.error("Delete error:", error);
      handleFirestoreError(error, OperationType.DELETE, 'medications');
    }
  };

  const handleUpdatePouch = async (med: MedicationPouch) => {
    const updates = { 
      pouchName: med.pouchName,
      prescriptionDate: med.prescriptionDate,
      instructions: med.instructions, 
      schedule: med.schedule, 
      status: med.status,
      remainingPouches: med.remainingPouches,
      dosageDays: med.dosageDays,
      timesPerDay: med.timesPerDay
    };
    if (med.id.startsWith('mock_med_')) {
      const saved = localStorage.getItem(`med_${med.id}`);
      if (saved) {
        const d = JSON.parse(saved);
        Object.assign(d, updates);
        localStorage.setItem(`med_${med.id}`, JSON.stringify(d));
        // Force state update for mock to see immediate results
        setMedications(prev => prev.map(m => m.id === med.id ? { ...m, ...updates } : m));
      }
    } else await updateDoc(doc(db, 'medications', med.id), updates as any);
  };

  const handleApproveMed = async (med: MedicationPouch) => {
    await handleUpdatePouch({ ...med, status: 'approved' });
    setView(profile?.role === 'solo' ? View.TODAY : View.SENIOR_DETAIL);
    setFeedback("승인되었습니다!");
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCaptureMed = async (base64: string) => {
    setAnalyzing(true);
    const b64 = base64.split(',')[1];
    try {
      const { medications: info, hospitalName, pharmacyName } = await analyzePrescription(b64);
      
      const prescriptionDate = new Date().toISOString().split('T')[0];
      
      // Default info but mark as needs validation
      const pouchData: Partial<MedicationPouch> = {
        userId: user?.uid,
        pouchName: "", // Empty so user MUST enter it
        prescriptionDate,
        hospitalName,
        pharmacyName,
        medications: info.map((m, idx) => ({ ...m, id: `item_${idx}` })),
        takenToday: false,
        status: 'approved',
        createdAt: Timestamp.now(),
        imageUrl: base64,
        timesPerDay: 0, 
        dosageDays: 0,
        remainingPouches: 0,
        instructions: info.map(m => m.instructions).join(', '),
        schedule: [] // Empty so user MUST select
      };

      setEditingMed(pouchData as MedicationPouch);
      setView(View.REGISTRATION);
    } finally { setAnalyzing(false); }
  };

  const handleFinalizeRegistration = async (med: MedicationPouch) => {
    try {
      if (user?.uid.startsWith('mock_')) {
        const id = `mock_med_${Date.now()}`;
        const newMed = { ...med, id, createdAt: new Date().toISOString() };
        localStorage.setItem(`med_${id}`, JSON.stringify(newMed));
        setMedications(prev => [newMed, ...prev]);
      } else {
        await addDoc(collection(db, 'medications'), med);
      }
      setView(View.MAIN);
      setFeedback("약봉투가 성공적으로 등록되었습니다.");
      setTimeout(() => setFeedback(null), 5000);
    } catch (error) {
      console.error('약 등록 오류:', error);
      setFeedback("등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleSeedMockData = async () => {
    const mock1: Partial<MedicationPouch> = { 
      pouchName: "아침 혈압약", 
      prescriptionDate: "2024-05-13",
      medications: [{ id: "1", name: "아모디핀", instructions: "식후 30분", schedule: ["morning"] }],
      schedule: ["morning"], 
      instructions: "식후 30분", 
      userId: user?.uid, 
      takenToday: false, 
      status: 'approved',
      timesPerDay: 1,
      dosageDays: 30,
      remainingPouches: 30,
    };
    const mock2: Partial<MedicationPouch> = { 
      pouchName: "감기약", 
      prescriptionDate: "2024-05-13",
      medications: [{ id: "2", name: "타이레놀", instructions: "기침, 발열 시", schedule: ["morning", "afternoon", "evening"] }],
      schedule: ["morning", "afternoon", "evening"], 
      instructions: "많이 아플때 드세요", 
      userId: user?.uid, 
      takenToday: false, 
      status: 'approved',
      timesPerDay: 3,
      dosageDays: 3,
      remainingPouches: 9,
    };

    const id1 = `mock_med_${Date.now()}_1`;
    const id2 = `mock_med_${Date.now()}_2`;
    localStorage.setItem(`med_${id1}`, JSON.stringify({ ...mock1, id: id1, createdAt: new Date().toISOString() }));
    localStorage.setItem(`med_${id2}`, JSON.stringify({ ...mock2, id: id2, createdAt: new Date().toISOString() }));
    setMedications(prev => [{ ...mock1, id: id1 } as MedicationPouch, { ...mock2, id: id2 } as MedicationPouch, ...prev]);
    
    setFeedback("예시 데이터가 생성되었습니다.");
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleGoParent = () => {
    if ([View.SENIOR_DETAIL, View.EDIT_MED, View.REVIEW_MED, View.ADD, View.TODAY, View.REGISTRATION].includes(view)) {
      setView(View.MAIN);
    } else if (view === View.MAIN) {
      setView(View.LOGIN_ROLE);
    }
  };

  if (loading) return <div className="min-h-screen bg-yellow-50 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user) return (
    <div className="min-h-screen bg-gray-200 flex justify-center items-start sm:items-center overflow-x-hidden">
      <LoginView onGoogleLogin={signInWithGoogle} onMockLogin={() => {
        const mock = { uid: 'mock_user_123', displayName: '테스트 사용자' };
        localStorage.setItem('mock_user', JSON.stringify(mock));
        setUser(mock as any);
      }} />
    </div>
  );
  if (!profile || view === View.LOGIN_ROLE) return (
    <div className="min-h-screen bg-gray-200 flex justify-center items-start sm:items-center overflow-x-hidden">
      <RoleSelectView onRoleSelect={handleRoleSelect} onLogout={handleLogout} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-200 flex justify-center items-start sm:items-center overflow-x-hidden">
      <div className="w-full max-w-[450px] min-h-screen sm:min-h-[850px] sm:h-[90vh] bg-yellow-50 flex flex-col border-x-0 sm:border-x-8 border-black shadow-2xl relative overflow-hidden">
        <header className="bg-white border-b-8 border-black p-4 flex justify-between items-center sticky top-0 z-40">
          <div onClick={() => setView(View.MAIN)} className="flex items-center gap-3 cursor-pointer">
            <div className="bg-yellow-400 p-2 rounded-xl border-4 border-black"><Pill /></div>
            <span className="text-2xl font-black">실버보이스</span>
          </div>
          <div className="flex -space-x-1">
            <button 
              onClick={() => setView(View.LOGIN_ROLE)} 
              className="p-3 bg-blue-100 rounded-2xl border-4 border-black z-20 transition-transform active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              title="역할 선택"
            >
              <Users className="w-6 h-6" />
            </button>
            <button 
              onClick={handleGoParent} 
              className="p-3 bg-gray-200 rounded-2xl border-4 border-black z-10 transition-transform active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -ml-4 pl-6"
              title="상위 메뉴로 가기"
            >
              <div className="flex items-center justify-center w-6 h-6">
                <img 
                  src="https://api.iconify.design/lucide:arrow-up-right-from-circle.svg?color=black" 
                  alt="Go Parent" 
                  className="w-6 h-6"
                  referrerPolicy="no-referrer"
                />
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 flex flex-col gap-5 overflow-y-auto">
          <AnimatePresence mode="wait">
            {view === View.MAIN && (profile.role === 'senior' || profile.role === 'solo') && (
              <SeniorHome profile={profile} groupCodeInput={groupCodeInput} setGroupCodeInput={setGroupCodeInput} onJoinGroup={handleJoinGroup} setView={setView} triggerReminder={triggerReminder} />
            )}
            {view === View.MAIN && profile.role === 'guardian' && (
              <GuardianHome guardianGroup={guardianGroup} seniors={seniors} seniorStatus={seniorStatus} isEditingCode={isEditingCode} setIsEditingCode={setIsEditingCode} newGroupCode={newGroupCode} setNewGroupCode={setNewGroupCode} onUpdateGroupCode={handleUpdateGroupCode} onResetRole={() => setView(View.LOGIN_ROLE)} />
            )}
            {view === View.SENIOR_DETAIL && (selectedSenior || profile.role !== 'guardian') && (
              <SeniorDetailView 
                selectedSenior={selectedSenior || { id: user.uid, name: profile.name }} 
                medications={medications} 
                setView={setView} 
                setEditingMed={setEditingMed} 
                onDeleteMed={(med) => handleDeleteMeds([med])}
                onUpdatePouch={handleUpdatePouch}
              />
            )}
            {(view === View.EDIT_MED || view === View.REVIEW_MED || view === View.REGISTRATION) && editingMed && (
              <MedicationEditView 
                mode={view === View.REGISTRATION ? 'registration' : view === View.REVIEW_MED ? 'review' : 'edit'} 
                editingMed={editingMed} 
                setEditingMed={setEditingMed} 
                profile={profile} 
                setView={setView} 
                onApprove={view === View.REGISTRATION ? handleFinalizeRegistration : handleApproveMed} 
                onUpdate={(e) => { 
                  e.preventDefault(); 
                  if (view === View.REGISTRATION) handleFinalizeRegistration(editingMed);
                  else handleApproveMed(editingMed); 
                }} 
              />
            )}
            {view === View.TODAY && (
              <MedicationTodayView 
                medications={medications} 
                setView={setView} 
                onTakeMedGroups={async (meds, analysisResult) => {
                  try {
                    await Promise.all(meds.map(m => finalizeTakeMed(m)));
                    if (analysisResult) {
                      speak(analysisResult.tts_message);
                      setFeedback(analysisResult.tts_message);
                    } else {
                      const msg = "복용 완료! 건강하고 활기찬 하루 되세요 ✅";
                      speak(msg);
                      setFeedback(msg);
                    }
                    setTimeout(() => setFeedback(null), 5000);
                  } catch (e) {
                    console.error(e);
                  }
                }} 
                onDeleteGroup={handleDeleteMeds}
                onSeedMockData={handleSeedMockData} 
              />
            )}
            {view === View.ADD && (
              <AddMedicationView isCameraOpen={isCameraOpen} setIsCameraOpen={setIsCameraOpen} analyzing={analyzing} onCapture={handleCaptureMed} onFileUpload={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => handleCaptureMed(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} fileInputRef={fileInputRef} setView={setView} />
            )}
          </AnimatePresence>
        </main>

        <OverlayModals 
          feedback={feedback} 
          activeReminder={activeReminder} 
          setActiveReminder={setActiveReminder}
          medications={medications} 
          onTakeMed={handleTakeMed} 
          setFeedback={setFeedback}
          profileRole={profile?.role} 
        />
      </div>
    </div>
  );
}
