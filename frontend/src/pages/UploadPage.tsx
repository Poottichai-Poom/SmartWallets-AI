import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '../components/Layout/AppBar';
import { pdfApi } from '../api/pdf';

type Stage = 'pick' | 'password' | 'uploading' | 'analyzing' | 'done' | 'error';

const STEPS = [
  { label: 'เลือกไฟล์ PDF', en: 'Select PDF file' },
  { label: 'กรอกข้อมูลเพิ่มเติม', en: 'Fill in details' },
  { label: 'อัปโหลดและเข้ารหัส', en: 'Upload & encrypt' },
  { label: 'วิเคราะห์ด้วย AI', en: 'AI analysis' },
];

export default function UploadPage() {
  const [stage, setStage] = useState<Stage>('pick');
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [bankPassword, setBankPassword] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ imported: number } | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  function pickFile(f: File) {
    if (!f.name.endsWith('.pdf')) { setError('กรุณาเลือกไฟล์ PDF เท่านั้น'); return; }
    if (f.size > 10 * 1024 * 1024) { setError('ไฟล์ใหญ่เกิน 10 MB'); return; }
    setFile(f); setError(''); setStage('password');
  }

  function onDrop(e: DragEvent) {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) pickFile(e.target.files[0]);
  }

  async function handleUploadAndAnalyze() {
    setError('');

    try {
      // Step 3: Upload
      setStage('uploading'); setActiveStep(2);
      const uploadRes = await pdfApi.upload(file!, month);
      const pdfId = uploadRes.data.pdf.id;
      const sessionToken = uploadRes.data.sessionToken;

      // Step 4: Analyze
      setStage('analyzing'); setActiveStep(3);
      const analyzeRes = await pdfApi.analyze(pdfId, sessionToken, bankPassword || undefined);
      setResult({ imported: analyzeRes.data.transactionsImported });
      setStage('done');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'เกิดข้อผิดพลาด');
      setStage('error');
    }
  }

  const stepIdx = stage === 'pick' ? 0 : stage === 'password' ? 1 : stage === 'uploading' ? 2 : stage === 'analyzing' ? 3 : activeStep;

  return (
    <>
      <AppBar />
      <main className="page appear">
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p className="text-xs text-3 fw-600" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>PDF Upload</p>
          <h1 style={{ marginTop: 4 }}>อัปโหลด <span className="accent">PDF สเตทเมนต์</span></h1>
          <p className="text-3 mt-8">ไฟล์จะถูกเข้ารหัสด้วย AES-256 และวิเคราะห์ด้วย AI</p>

          {/* Progress steps */}
          <div className="card mt-20" style={{ padding: 20 }}>
            {STEPS.map((s, i) => (
              <div key={i} className="progress-step" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)', paddingTop: i === 0 ? 0 : 10, marginTop: i === 0 ? 0 : 10 }}>
                <div className={`step-dot ${i < stepIdx ? 'done' : i === stepIdx ? 'active' : ''}`}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <div>
                  <div className={`fw-600 ${i < stepIdx ? 'text-3' : ''}`} style={{ fontSize: 13 }}>{s.label}</div>
                  <div className="text-xs text-3">{s.en}</div>
                </div>
                {(i === 2 && stage === 'uploading') || (i === 3 && stage === 'analyzing') ? (
                  <span className="spinner" style={{ marginLeft: 'auto' }} />
                ) : null}
              </div>
            ))}
          </div>

          {/* Stage: pick file */}
          {stage === 'pick' && (
            <div
              className={`drop-zone mt-20 appear ${drag ? 'drag' : ''}`}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <div className="drop-icon"><svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>
              <div className="fw-700 mt-16" style={{ fontSize: 15 }}>ลากไฟล์ PDF มาวางที่นี่</div>
              <div className="text-sm text-3 mt-8">หรือ <span className="text-mint">คลิกเพื่อเลือกไฟล์</span> · สูงสุด 10 MB</div>
              <div className="row center mt-16" style={{ gap: 6 }}>
                {['SCB', 'KBank', 'BBL', 'KTB', 'BAY', 'ttb'].map(b => (
                  <span key={b} className="chip" style={{ fontSize: 10 }}>{b}</span>
                ))}
              </div>
              <input ref={fileRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={onInputChange} />
            </div>
          )}

          {/* Stage: set password */}
          {stage === 'password' && (
            <div className="card mt-20 appear" style={{ padding: 24 }}>
              <div className="row" style={{ gap: 12, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--mint-glow)', color: 'var(--mint)', display: 'grid', placeItems: 'center' }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div>
                  <div className="fw-700">{file?.name}</div>
                  <div className="text-xs text-3">{((file?.size ?? 0) / 1024).toFixed(0)} KB</div>
                </div>
              </div>

              <div className="col" style={{ gap: 14 }}>
                <div className="input-group">
                  <label className="label">
                    รหัส PDF จากธนาคาร · Bank PDF Password
                    <span className="chip" style={{ marginLeft: 8, fontSize: 10 }}>ถ้ามี · if protected</span>
                  </label>
                  <input
                    className="input"
                    type="password"
                    placeholder="ว่างได้ถ้า PDF ไม่มีรหัส · Leave blank if open"
                    value={bankPassword}
                    onChange={e => setBankPassword(e.target.value)}
                  />
                  <p className="text-xs text-3">รหัสที่ธนาคารส่งมาพร้อม statement เช่น เลขบัตรประชาชน หรือวันเกิด</p>
                </div>
                <div className="input-group">
                  <label className="label">เดือนของสเตทเมนต์ · Statement Month</label>
                  <input className="input" type="month" value={month} onChange={e => setMonth(e.target.value)} />
                </div>
              </div>

              {error && <div className="auth-error mt-16">{error}</div>}

              <div className="row" style={{ gap: 10, marginTop: 20 }}>
                <button className="btn" onClick={() => { setStage('pick'); setFile(null); setBankPassword(''); setError(''); setActiveStep(0); }}>← กลับ</button>
                <button className="btn btn-primary grow" style={{ justifyContent: 'center' }} onClick={handleUploadAndAnalyze}>
                  อัปโหลดและวิเคราะห์ · Upload & Analyze
                </button>
              </div>
            </div>
          )}

          {/* Stage: processing */}
          {(stage === 'uploading' || stage === 'analyzing') && (
            <div className="card mt-20 appear" style={{ padding: 24, textAlign: 'center' }}>
              <span className="spinner" style={{ width: 32, height: 32, margin: '0 auto', display: 'block' }} />
              <div className="fw-700 mt-16">
                {stage === 'uploading' ? 'กำลังเข้ารหัสและอัปโหลด…' : 'AI กำลังวิเคราะห์รายการ…'}
              </div>
              <p className="text-3 text-sm mt-8">
                {stage === 'uploading' ? 'Encrypting with AES-256-GCM' : 'Extracting transactions with Gemini AI'}
              </p>
            </div>
          )}

          {/* Stage: done */}
          {stage === 'done' && result && (
            <div className="card mt-20 appear" style={{ padding: 28, textAlign: 'center', borderColor: 'var(--mint)' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--mint-glow)', color: 'var(--mint)', display: 'grid', placeItems: 'center', margin: '0 auto' }}>
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 className="mt-16">วิเคราะห์สำเร็จ · Analysis Complete</h2>
              <p className="text-3 mt-8">พบ <span className="text-mint fw-700">{result.imported}</span> รายการ · Imported {result.imported} transactions</p>
              <div className="row center" style={{ gap: 12, marginTop: 24 }}>
                <button className="btn" onClick={() => { setStage('pick'); setFile(null); setBankPassword(''); setError(''); setActiveStep(0); }}>
                  อัปโหลดไฟล์อื่น
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                  ดูแดชบอร์ด · View Dashboard →
                </button>
              </div>
            </div>
          )}

          {/* Stage: error */}
          {stage === 'error' && (
            <div className="card mt-20 appear" style={{ padding: 24, borderColor: 'var(--leak)' }}>
              <div className="auth-error mb-16">{error}</div>
              <button className="btn" onClick={() => { setStage('password'); setError(''); }}>← ลองใหม่</button>
            </div>
          )}

          {/* Security note */}
          {stage === 'pick' && (
            <div className="row mt-16" style={{ gap: 8, color: 'var(--text-3)', fontSize: 12 }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              ไฟล์ถูกเข้ารหัส AES-256-GCM ก่อนจัดเก็บ · Encrypted before storage · Session expires in 30 min
            </div>
          )}
        </div>
      </main>
    </>
  );
}
