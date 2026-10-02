"use client";

import * as React from "react";
import { User, Activity, AlertCircle, FilePlus, Sparkles, X, Check } from "lucide-react";
import { Button } from "./ui/button";

export interface PatientUploadData {
  patientId?: number;
  patientName: string;
  patientAge: number;
  patientSex: string;
  fitzpatrick: string;
  anatomicalSite: string;
  clinicalNotes: string;
}

interface PatientEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmUpload: (data: PatientUploadData) => void;
  isAnalyzing: boolean;
  existingPatients: Array<{ id: number; name: string; age: number; sex: string; fitzpatrick: string }>;
}

export function PatientEntryModal({
  isOpen,
  onClose,
  onConfirmUpload,
  isAnalyzing,
  existingPatients,
}: PatientEntryModalProps) {
  const [selectedPatientId, setSelectedPatientId] = React.useState<string>("new");
  const [name, setName] = React.useState("");
  const [age, setAge] = React.useState<number>(45);
  const [sex, setSex] = React.useState("Female");
  const [fitzpatrick, setFitzpatrick] = React.useState("Type III");
  const [anatomicalSite, setAnatomicalSite] = React.useState("Upper Back (Dorsal)");
  const [clinicalNotes, setClinicalNotes] = React.useState("");

  React.useEffect(() => {
    if (selectedPatientId !== "new") {
      const p = existingPatients.find((item) => item.id.toString() === selectedPatientId);
      if (p) {
        setName(p.name);
        setAge(p.age);
        setSex(p.sex);
        setFitzpatrick(p.fitzpatrick);
      }
    }
  }, [selectedPatientId, existingPatients]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmUpload({
      patientId: selectedPatientId !== "new" ? parseInt(selectedPatientId) : undefined,
      patientName: name || "Anonymous Patient",
      patientAge: age,
      patientSex: sex,
      fitzpatrick,
      anatomicalSite,
      clinicalNotes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#0F52BA] flex items-center justify-center font-bold">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Patient & Lesion Context Entry
              </h3>
              <p className="text-xs text-slate-500">
                Attach clinical metadata before running AI screening
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Patient Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Select Patient Record
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-[#0F52BA] focus:outline-none"
            >
              <option value="new">+ Register New Patient Details</option>
              {existingPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.age}Y, {p.sex}, {p.fitzpatrick})
                </option>
              ))}
            </select>
          </div>

          {/* Patient Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Patient Full Name / Code
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. E. Vance"
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-[#0F52BA] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Patient Age (Years)
              </label>
              <input
                type="number"
                required
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 45)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-[#0F52BA] focus:outline-none"
              />
            </div>
          </div>

          {/* Sex & Fitzpatrick */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Biological Sex
              </label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-[#0F52BA] focus:outline-none"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Unspecified">Unspecified / Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Fitzpatrick Skin Phototype
              </label>
              <select
                value={fitzpatrick}
                onChange={(e) => setFitzpatrick(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-[#0F52BA] focus:outline-none"
              >
                <option value="Type I">Type I (Always burns, never tans)</option>
                <option value="Type II">Type II (Usually burns, tans minimally)</option>
                <option value="Type III">Type III (Sometimes burns, tans uniformly)</option>
                <option value="Type IV">Type IV (Burns minimally, tans easily)</option>
                <option value="Type V">Type V (Rarely burns, tans profusely)</option>
                <option value="Type VI">Type VI (Never burns, deeply pigmented)</option>
              </select>
            </div>
          </div>

          {/* Anatomical Site */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Lesion Anatomical Site
            </label>
            <select
              value={anatomicalSite}
              onChange={(e) => setAnatomicalSite(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-[#0F52BA] focus:outline-none font-semibold text-[#0F52BA]"
            >
              <option value="Upper Back (Dorsal)">Upper Back (Dorsal)</option>
              <option value="Left Shoulder">Left Shoulder</option>
              <option value="Right Forearm">Right Forearm</option>
              <option value="Lower Lumbar">Lower Lumbar</option>
              <option value="Anterior Chest">Anterior Chest</option>
              <option value="Face / Scalp">Face / Scalp</option>
              <option value="Lower Extremity / Shin">Lower Extremity / Shin</option>
              <option value="Abdomen / Palmar">Abdomen / Palmar</option>
            </select>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Clinical Symptoms & Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="e.g. Recent rapid size growth reported by patient, bleeding or itching..."
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-[#0F52BA] focus:outline-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isAnalyzing}
              className="gap-2 shadow-md font-bold"
            >
              {isAnalyzing ? (
                <>
                  <Activity className="h-4 w-4 animate-spin" />
                  <span>Computing PyTorch Grad-CAM...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Run AI Model Screening</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
