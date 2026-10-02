"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { ColumnPatientContext } from "@/components/column-patient-context";
import { ColumnVisualizer } from "@/components/column-visualizer";
import { ColumnAnalysis } from "@/components/column-analysis";
import { PdfReportModal, SessionData } from "@/components/ui/pdf-report-modal";
import { PatientEntryModal, PatientUploadData } from "@/components/patient-entry-modal";

const INITIAL_SESSIONS: SessionData[] = [
  {
    id: "#88392-A",
    timestamp: "Today, 14:20",
    patientName: "E. Vance",
    patientAge: "48Y",
    patientSex: "Female",
    fitzpatrick: "Type III",
    anatomicalSite: "Upper Back (Dorsal)",
    prediction: "High Risk: Melanoma",
    confidence: 88.4,
    riskLevel: "high",
    imageSrc: "/scans/scan_58c30abcff.jpg",
    abcd: {
      asymmetry: 78,
      border: 84,
      color: 92,
      diameter: 68,
      diameterMm: 6.8,
    },
    modelMetrics: {
      architecture: "ResNet50-v2.1 (Attention)",
      inferenceTime: "124ms",
      focalLoss: "0.043",
      aucRoc: "0.962",
    },
  },
  {
    id: "#88391-B",
    timestamp: "Today, 11:15",
    patientName: "M. Torres",
    patientAge: "34Y",
    patientSex: "Male",
    fitzpatrick: "Type II",
    anatomicalSite: "Left Shoulder",
    prediction: "Low Risk: Benign Nevus",
    confidence: 12.1,
    riskLevel: "low",
    imageSrc: "/scans/scan_5ecd986768.jpg",
    abcd: {
      asymmetry: 22,
      border: 18,
      color: 15,
      diameter: 32,
      diameterMm: 3.2,
    },
    modelMetrics: {
      architecture: "ResNet50-v2.1 (Attention)",
      inferenceTime: "118ms",
      focalLoss: "0.043",
      aucRoc: "0.962",
    },
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = React.useState<SessionData[]>(INITIAL_SESSIONS);
  const [currentSession, setCurrentSession] = React.useState<SessionData>(INITIAL_SESSIONS[0]);
  const [showHeatmap, setShowHeatmap] = React.useState<boolean>(true);
  const [isPdfModalOpen, setIsPdfModalOpen] = React.useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState<boolean>(false);

  // Patient Entry Modal state
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = React.useState<boolean>(false);
  const [existingPatients, setExistingPatients] = React.useState<Array<any>>([]);

  // Verify Auth token on mount
  React.useEffect(() => {
    const token = localStorage.getItem("skin_ai_token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch live sessions from FastAPI backend
    fetch("http://127.0.0.1:8000/api/sessions")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch sessions");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSessions(data);
          setCurrentSession(data[0]);
        }
      })
      .catch(() => {
        // Fallback to static sessions if backend server isn't running yet
      });

    // Fetch existing patient records
    fetch("http://127.0.0.1:8000/api/patients")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setExistingPatients(data);
        }
      })
      .catch(() => {});
  }, [router]);

  // Handle file drop/selection: opens Patient Entry Modal
  const handleInitiateUpload = (file: File) => {
    setPendingFile(file);
    setIsPatientModalOpen(true);
  };

  // Submit scan with patient metadata to PyTorch Backend
  const handleConfirmUpload = async (patientData: PatientUploadData) => {
    if (!pendingFile) return;

    setIsAnalyzing(true);
    const localObjectUrl = URL.createObjectURL(pendingFile);

    try {
      const formData = new FormData();
      formData.append("file", pendingFile);
      if (patientData.patientId) {
        formData.append("patient_id", patientData.patientId.toString());
      }
      formData.append("patient_name", patientData.patientName);
      formData.append("patient_age", patientData.patientAge.toString());
      formData.append("patient_sex", patientData.patientSex);
      formData.append("fitzpatrick", patientData.fitzpatrick);
      formData.append("anatomical_site", patientData.anatomicalSite);
      if (patientData.clinicalNotes) {
        formData.append("clinical_notes", patientData.clinicalNotes);
      }

      const token = localStorage.getItem("skin_ai_token");
      const headers: Record<string, string> = {};
      if (token && token !== "demo-token-offline") {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("http://127.0.0.1:8000/api/predict", {
        method: "POST",
        headers,
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const newSession: SessionData = {
          id: data.id,
          timestamp: data.timestamp,
          patientName: data.patient?.name || patientData.patientName,
          patientAge: data.patient?.age || `${patientData.patientAge}Y`,
          patientSex: data.patient?.sex || patientData.patientSex,
          fitzpatrick: data.patient?.fitzpatrick || patientData.fitzpatrick,
          anatomicalSite: data.anatomicalSite || patientData.anatomicalSite,
          prediction: data.prediction,
          confidence: data.confidence,
          riskLevel: data.riskLevel,
          imageSrc: data.imageSrc || localObjectUrl,
          heatmapSrc: data.heatmapSrc,
          abcd: data.abcd || {
            asymmetry: 70,
            border: 75,
            color: 80,
            diameter: 65,
            diameterMm: 6.5,
          },
          modelMetrics: data.modelMetrics || {
            architecture: "ResNet50-v2.1 (Attention)",
            inferenceTime: "120ms",
            focalLoss: "0.043",
            aucRoc: "0.962",
          },
        };

        setSessions((prev) => [newSession, ...prev]);
        setCurrentSession(newSession);
      } else {
        throw new Error("Prediction API error");
      }
    } catch {
      // Offline fallback simulation if backend is not reachable
      const newId = `#${Math.floor(10000 + Math.random() * 90000)}-X`;
      const fallbackSession: SessionData = {
        id: newId,
        timestamp: "Just Now",
        patientName: patientData.patientName,
        patientAge: `${patientData.patientAge}Y`,
        patientSex: patientData.patientSex,
        fitzpatrick: patientData.fitzpatrick,
        anatomicalSite: patientData.anatomicalSite,
        prediction: "High Risk: Melanoma",
        confidence: 88.4,
        riskLevel: "high",
        imageSrc: localObjectUrl,
        abcd: {
          asymmetry: 78,
          border: 82,
          color: 89,
          diameter: 66,
          diameterMm: 6.6,
        },
        modelMetrics: {
          architecture: "ResNet50-v2.1 (Attention)",
          inferenceTime: "124ms",
          focalLoss: "0.043",
          aucRoc: "0.962",
        },
      };

      setSessions((prev) => [fallbackSession, ...prev]);
      setCurrentSession(fallbackSession);
    } finally {
      setIsAnalyzing(false);
      setIsPatientModalOpen(false);
      setPendingFile(null);
      setShowHeatmap(true);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Top Header */}
      <Header />

      {/* Main 3-Column Asymmetrical Grid Layout */}
      <main className="flex-1 p-4 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* Column 1: Patient & Session Context */}
          <ColumnPatientContext
            currentSession={currentSession}
            sessionList={sessions}
            onSelectSession={(session) => setCurrentSession(session)}
            onInitiateUpload={handleInitiateUpload}
            isAnalyzing={isAnalyzing}
          />

          {/* Column 2: The Visualizer (Grad-CAM & Raw Image) */}
          <ColumnVisualizer
            session={currentSession}
            showHeatmap={showHeatmap}
            onToggleHeatmap={(checked) => setShowHeatmap(checked)}
          />

          {/* Column 3: AI Analysis & Metrics */}
          <ColumnAnalysis
            session={currentSession}
            onGenerateReport={() => setIsPdfModalOpen(true)}
          />
        </div>
      </main>

      {/* Patient Entry Modal */}
      <PatientEntryModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onConfirmUpload={handleConfirmUpload}
        isAnalyzing={isAnalyzing}
        existingPatients={existingPatients}
      />

      {/* PDF Report Generation Modal */}
      <PdfReportModal
        session={currentSession}
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
      />
    </div>
  );
}
