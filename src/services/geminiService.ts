import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface MedicationInfo {
  name: string;
  schedule: string[];
  instructions: string;
  hospitalName?: string;
  pharmacyName?: string;
}

export async function analyzePrescription(base64Image: string): Promise<{ medications: MedicationInfo[], hospitalName?: string, pharmacyName?: string }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
              },
            },
            {
              text: "이 약봉투 사진에서 '모든' 약의 이름, 복용 시간(아침, 점심, 저녁 중 선택), 그리고 주의사항을 추출해줘. 또한 병원 이름과 약국 이름이 있다면 그것도 추출해줘. 여러 개의 약이 있다면 각각의 정보를 모두 포함해야 해. 결과는 반드시 JSON 형식으로 반환해줘.",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hospitalName: { type: Type.STRING, description: "병원 이름 (예: ○○병원)" },
            pharmacyName: { type: Type.STRING, description: "약국 이름 (예: ○○약국)" },
            medications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "약 이름" },
                  schedule: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "복용 시간 (morning, afternoon, evening 중 해당되는 것들)" 
                  },
                  instructions: { type: Type.STRING, description: "주의사항" },
                },
                required: ["name", "schedule", "instructions"],
              },
            },
          },
          required: ["medications"],
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        medications: data.medications.map((m: any) => ({
          ...m,
          hospitalName: data.hospitalName,
          pharmacyName: data.pharmacyName
        })),
        hospitalName: data.hospitalName,
        pharmacyName: data.pharmacyName
      };
    }
    return { medications: [] };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { medications: [] };
  }
}

export interface VideoAnalysisResult {
  cross_verification: {
    envelope_info: string;
    actual_pills_in_vinyl: string;
    is_mismatched: boolean;
  };
  safety_status: {
    decision: 'APPROVE' | 'STOP';
    reason: string;
  };
  tts_message: string;
}

export async function analyzeMedicationVideo(
  base64Video: string, 
  mimeType: string,
  hospitalInfo: string,
  pillsInfo: string
): Promise<VideoAnalysisResult | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Video,
              },
            },
            {
              text: `당신은 복약 사고 방지 전문가입니다. '겉봉투의 처방 정보'와 '실제 꺼낸 약포지 안의 내용물'이 일치하는지 교차 검증하는 것이 당신의 최우선 임무입니다. 포장 비닐(약포지)이 바뀌었을 가능성을 항상 염두에 두고 엄격하게 분석하세요.

[기등록 데이터 (Database)]
등록된 처방 병원/약국: ${hospitalInfo}
등록된 알약 구성: ${pillsInfo}

[분석 미션]
1. 봉투 확인: 영상 시작 시 제시된 겉봉투의 글자를 읽어 기등록 데이터와 맞는지 확인해.
2. 약포지 근접 검사: 어르신이 봉투에서 꺼내 카메라에 가까이 비추는 투명 비닐(약포지) 내부를 집중 분석해. 알약 개수, 색상, 모양을 파악해.
3. 불일치 감지: 만약 겉봉투 정보와 비닐 안의 알약 구성이 등록 데이터와 다르다면 "약이 바뀌었음"을 즉시 알리고 is_mismatched를 true로 설정해.
4. 모든 분석 결과는 정해진 JSON 스카마에 맞춰 출력하며, 어르신께 친절한 한국어 피드백을 제공합니다. 마크다운 기호 없이 순수 JSON만 출력해야 해.`
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cross_verification: {
              type: Type.OBJECT,
              properties: {
                envelope_info: { type: Type.STRING, description: "영상에서 감지된 겉봉투 정보" },
                actual_pills_in_vinyl: { type: Type.STRING, description: "비닐 속 실제 알약 구성" },
                is_mismatched: { type: Type.BOOLEAN, description: "등록 정보와 불일치 여부" },
              },
              required: ["envelope_info", "actual_pills_in_vinyl", "is_mismatched"],
            },
            safety_status: {
              type: Type.OBJECT,
              properties: {
                decision: { type: Type.STRING, enum: ["APPROVE", "STOP"], description: "복용 승인 또는 중단 결정" },
                reason: { type: Type.STRING, description: "결과에 대한 구체적 근거" },
              },
              required: ["decision", "reason"],
            },
            tts_message: { type: Type.STRING, description: "어르신께 드릴 안내 메시지" },
          },
          required: ["cross_verification", "safety_status", "tts_message"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as VideoAnalysisResult;
    }
    return null;
  } catch (error) {
    console.error("Gemini Video Analysis Error:", error);
    return null;
  }
}
