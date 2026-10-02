import * as React from "react";
import { UploadCloud, Clock, UserCheck, ShieldAlert, FileImage, CheckCircle2, AlertCircle, PlusCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { SessionData } from "./ui/pdf-report-modal";

interface ColumnPatientContextProps {
  currentSession: SessionData;
  sessionList: SessionData[];
  onSelectSession: (session: SessionData) => void;
  onInitiateUpload: (file: File) => void;
  isAnalyzing: boolean;
}

export function ColumnPatientContext({
  currentSession,
  sessionList,
  onSelectSession,
  onInitiateUpload,
  isAnalyzing,
}: ColumnPatientContextProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onInitiateUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onInitiateUpload(e.target.files[0]);
    }
  };

  return (
    <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-4.5rem)] pr-0.5 font-sans">
      {/* Session Context Header Card */}
      <Card className="border-slate-200 bg-white shadow-2xs">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="info" className="font-mono text-[10px] uppercase">
              Active Context
            </Badge>
            <span className="text-[10px] text-slate-400 font-medium">SQLite DB Persisted</span>
          </div>
          <CardTitle className="text-lg font-bold text-slate-900 mt-1">
            Session ID: {currentSession.id}
          </CardTitle>
          <p className="text-xs text-slate-500">
            Acquired: {currentSession.timestamp}
          </p>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2.5">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Patient:</span>
              <span className="font-bold text-slate-900">{currentSession.patientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Demographics:</span>
              <span className="font-medium text-slate-700">{currentSession.patientAge} / {currentSession.patientSex}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Fitzpatrick Type:</span>
              <span className="font-medium text-slate-700">{currentSession.fitzpatrick}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Anatomical Site:</span>
              <span className="font-bold text-[#0F52BA]">{currentSession.anatomicalSite}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drag & Drop Upload Zone */}
      <Card className="border-slate-200 bg-white shadow-2xs">
        <CardContent className="p-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 cursor-pointer ${
              isDragging
                ? "border-[#0F52BA] bg-blue-50/60 ring-2 ring-blue-500/20 scale-[0.99]"
                : "border-slate-300 bg-slate-50/50 hover:border-[#0F52BA] hover:bg-blue-50/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-110 ${
              isAnalyzing ? "bg-blue-100 text-[#0F52BA] animate-bounce" : "bg-blue-50 text-[#0F52BA]"
            }`}>
              <UploadCloud className="h-6 w-6" />
            </div>

            <p className="text-xs font-bold text-slate-800 tracking-tight">
              {isAnalyzing ? "Processing PyTorch Inference..." : "Upload Dermoscopic Scan"}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              or <span className="text-[#0F52BA] font-semibold underline underline-offset-2">browse files</span>
            </p>
            <p className="mt-2 text-[10px] text-slate-400">
              Supports PNG, JPG, DICOM (Max 25MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Session History Section */}
      <Card className="border-slate-200 bg-white flex-1 flex flex-col shadow-2xs">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Session History
            </CardTitle>
          </div>
          <Badge variant="neutral" className="text-[10px]">
            {sessionList.length} Archived
          </Badge>
        </CardHeader>

        <CardContent className="p-4 pt-1 flex-1">
          <div className="max-h-[320px] overflow-y-auto space-y-2.5 pr-1 text-xs">
            {sessionList.map((session) => {
              const isSelected = session.id === currentSession.id;
              const isHigh = session.riskLevel === "high";
              const isModerate = session.riskLevel === "moderate";

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session)}
                  className={`group flex items-center justify-between rounded-xl border p-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#0F52BA] bg-blue-50/40 ring-1 ring-blue-500/30 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Thumbnail Image */}
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      <img
                        src={session.imageSrc}
                        alt={`Lesion ${session.id}`}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {/* Small Status Indicator Dot */}
                      <span
                        className={`absolute top-1 right-1 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                          isHigh
                            ? "bg-rose-500"
                            : isModerate
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {session.id}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          • {session.patientName}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {session.timestamp}
                      </p>
                      <p className={`text-[10px] font-semibold mt-0.5 ${
                        isHigh ? "text-rose-600" : isModerate ? "text-amber-700" : "text-emerald-600"
                      }`}>
                        {session.prediction}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {session.confidence}%
                    </span>
                    <p className="text-[9px] text-slate-400">Prob</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
