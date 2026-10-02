import * as React from "react";
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";

export interface SessionData {
  id: string;
  timestamp: string;
  patientName: string;
  patientAge: string;
  patientSex: string;
  fitzpatrick: string;
  anatomicalSite: string;
  prediction:
    | "High Risk: Melanoma"
    | "Low Risk: Benign Nevus"
    | "Moderate Risk: Dysplastic Nevus";
  confidence: number; // e.g. 88.4
  riskLevel: "high" | "low" | "moderate";
  imageSrc: string;
  heatmapSrc?: string;
  abcd: {
    asymmetry: number;
    border: number;
    color: number;
    diameter: number;
    diameterMm: number;
  };
  modelMetrics: {
    architecture: string;
    inferenceTime: string;
    focalLoss: string;
    aucRoc: string;
  };
}

export function PdfReportModal({
  session,
  isOpen,
  onClose,
}: {
  session: SessionData;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0F52BA]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Clinical XAI Diagnostic Report
              </h2>
              <p className="text-xs text-slate-500">
                Official AI-Assisted Clinical Evaluation Summary
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Report Content - Printable Area */}
        <div
          id="printable-report"
          className="py-6 space-y-6 text-slate-800 text-xs"
        >
          {/* Header Banner */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <p className="text-base font-extrabold text-[#0F52BA]">
                SKIN-AI DERMATOLOGY CLINIC
              </p>
              <p className="text-[11px] text-slate-500">
                Department of Cutaneous Oncology & Medical AI
              </p>
              <p className="text-[11px] text-slate-500">
                Standardizing XAI Diagnostics • ISO-13485 Compliant Workflow
              </p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="font-semibold text-slate-900">
                Report ID:{" "}
                <span className="font-mono text-[#0F52BA]">
                  RPT-{session.id.replace("#", "")}
                </span>
              </p>
              <p className="text-slate-500">Date: {session.timestamp}</p>
              <Badge
                variant={
                  session.riskLevel === "high"
                    ? "danger"
                    : session.riskLevel === "moderate"
                      ? "warning"
                      : "success"
                }
              >
                {session.riskLevel.toUpperCase()} RISK
              </Badge>
            </div>
          </div>

          {/* Patient Context & Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200/80">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-400 mb-2">
                Patient Details
              </p>
              <div className="space-y-1">
                <p>
                  <span className="text-slate-500">Patient ID / Name:</span>{" "}
                  <strong className="text-slate-900">
                    {session.patientName}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Age / Sex:</span>{" "}
                  <strong className="text-slate-900">
                    {session.patientAge} / {session.patientSex}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Fitzpatrick Skin Type:</span>{" "}
                  <strong className="text-slate-900">
                    {session.fitzpatrick}
                  </strong>
                </p>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-400 mb-2">
                Examination Context
              </p>
              <div className="space-y-1">
                <p>
                  <span className="text-slate-500">Session ID:</span>{" "}
                  <strong className="font-mono text-slate-900">
                    {session.id}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Anatomical Site:</span>{" "}
                  <strong className="text-slate-900">
                    {session.anatomicalSite}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Imaging Device:</span>{" "}
                  <strong className="text-slate-900">
                    DermLite DL4 (Polarized 10x)
                  </strong>
                </p>
              </div>
            </div>
          </div>

          {/* Diagnostic Result */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
            <p className="text-[11px] font-semibold uppercase text-slate-400">
              Deep Learning Primary Diagnosis
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {session.riskLevel === "high" ? (
                  <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {session.prediction}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Calculated Model Softmax Probability:{" "}
                    <strong className="text-slate-800">
                      {session.confidence}%
                    </strong>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-600">
                  Decision Cutoff: 50.0%
                </div>
                <div className="text-[11px] text-slate-400">
                  Class:{" "}
                  {session.riskLevel === "high"
                    ? "Malignant (Class 1)"
                    : "Benign (Class 0)"}
                </div>
              </div>
            </div>
          </div>

          {/* Clinical ABCD Feature Matrix */}
          <div>
            <p className="text-[11px] font-semibold uppercase text-slate-400 mb-2">
              Quantitative ABCD Dermatology Rule
            </p>
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">
                  Asymmetry (A)
                </p>
                <p className="text-base font-extrabold text-slate-900 mt-1">
                  {session.abcd.asymmetry}%
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  Bi-axial variance
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">
                  Border (B)
                </p>
                <p className="text-base font-extrabold text-slate-900 mt-1">
                  {session.abcd.border}%
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  Scalloped margins
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">
                  Color Var. (C)
                </p>
                <p className="text-base font-extrabold text-slate-900 mt-1">
                  {session.abcd.color}%
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  Polychromatic index
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">
                  Diameter (D)
                </p>
                <p className="text-base font-extrabold text-slate-900 mt-1">
                  {session.abcd.diameterMm} mm
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  &gt;6.0mm cutoff
                </p>
              </div>
            </div>
          </div>

          {/* Model Specification & Validation Footer */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-[11px] space-y-2">
            <p className="font-semibold text-slate-700">
              Model Verification Specs
            </p>
            <div className="grid grid-cols-3 gap-2 text-slate-600">
              <div>
                • Architecture:{" "}
                <span className="font-mono text-slate-900">
                  {session.modelMetrics.architecture}
                </span>
              </div>
              <div>
                • Inference Latency:{" "}
                <span className="font-mono text-slate-900">
                  {session.modelMetrics.inferenceTime}
                </span>
              </div>
              <div>
                • Focal Loss:{" "}
                <span className="font-mono text-slate-900">
                  {session.modelMetrics.focalLoss}
                </span>
              </div>
            </div>
          </div>

          {/* Doctor Signature Block */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-slate-600">
            <div>
              <p className="text-[10px] text-slate-400">Clinical Disclaimer</p>
              <p className="text-[10px] text-slate-500 max-w-sm">
                This XAI diagnostic report is an AI decision support tool. Final
                clinical diagnosis requires histological examination by a
                board-certified dermatologist.
              </p>
            </div>
            <div className="border-t border-slate-400 w-48 text-center pt-1">
              <p className="font-medium text-slate-800">
                Attending Physician Sign-off
              </p>
              <p className="text-[10px] text-slate-400">MD, DermOncology</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
