
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function SignupPhone() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send code');
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invalid code');
      router.push(data.redirect);
    } catch (err: any) {
      setError(err.message || 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp('');
    await handleSendOTP(new Event('submit') as any);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .groove-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #FFF5ED 0%, #FFE8D6 50%, #FFF0E6 100%);
          font-family: 'Poppins', sans-serif;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        /* Decorative background blobs */
        .groove-page::before {
          content: '';
          position: absolute;
          top: -120px;
          right: -120px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255, 117, 31, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .groove-page::after {
          content: '';
          position: absolute;
          bottom: -100px;
          left: -100px;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(255, 140, 66, 0.12) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .groove-card {
          background: white;
          border-radius: 28px;
          box-shadow: 0 20px 60px rgba(255, 117, 31, 0.12), 0 4px 20px rgba(0,0,0,0.06);
          padding: 48px 40px;
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 1;
          animation: slideUp 0.4s ease;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .groove-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
        }

        .groove-logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #FF751F 0%, #FF8C42 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 4px 16px rgba(255, 117, 31, 0.35);
          margin-right: 10px;
        }

        .groove-logo-text {
          font-size: 22px;
          font-weight: 800;
          color: #1F2937;
          letter-spacing: -0.5px;
        }

        .groove-logo-text span {
          color: #FF751F;
        }

        .step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 28px;
        }

        .step-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #E5E7EB;
          transition: all 0.3s ease;
        }

        .step-dot.active {
          width: 24px;
          border-radius: 4px;
          background: linear-gradient(135deg, #FF751F, #FF8C42);
        }

        .step-dot.done {
          background: #FF751F;
        }

        .groove-title {
          font-size: 28px;
          font-weight: 800;
          color: #1F2937;
          text-align: center;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .groove-subtitle {
          font-size: 14px;
          color: #6B7280;
          text-align: center;
          margin-bottom: 32px;
          line-height: 1.5;
        }

        .groove-subtitle strong {
          color: #FF751F;
          font-weight: 600;
        }

        .error-box {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #DC2626;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #E5E7EB;
          border-radius: 14px;
          font-size: 16px;
          font-family: 'Poppins', sans-serif;
          color: #1F2937;
          background: #FAFAFA;
          transition: all 0.2s ease;
          outline: none;
        }

        .form-input:focus {
          border-color: #FF751F;
          background: white;
          box-shadow: 0 0 0 4px rgba(255, 117, 31, 0.08);
        }

        .form-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-input.otp-input {
          text-align: center;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 12px;
          padding: 16px;
          color: #FF751F;
        }

        .form-hint {
          font-size: 12px;
          color: #9CA3AF;
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .btn-primary {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #FF751F 0%, #FF8C42 100%);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(255, 117, 31, 0.35);
          position: relative;
          overflow: hidden;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255, 117, 31, 0.4);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn-primary .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .btn-ghost {
          width: 100%;
          padding: 12px;
          background: none;
          border: none;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          color: #FF751F;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 12px;
          margin-top: 8px;
        }

        .btn-ghost:hover:not(:disabled) {
          background: rgba(255, 117, 31, 0.06);
        }

        .btn-ghost:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .btn-ghost.muted {
          color: #9CA3AF;
        }

        .btn-ghost.muted:hover:not(:disabled) {
          color: #6B7280;
          background: rgba(0,0,0,0.03);
        }

        .divider {
          height: 1px;
          background: #F3F4F6;
          margin: 20px 0;
        }

        .phone-display {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #FFF5ED;
          border: 1px solid #FFE4CC;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          color: #FF751F;
        }

        .login-link {
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: #9CA3AF;
        }

        .login-link a {
          color: #FF751F;
          font-weight: 600;
          text-decoration: none;
        }

        .login-link a:hover {
          text-decoration: underline;
        }
      `}</style>

      <div className="groove-page">
        <div className="groove-card">

          {/* Logo */}
          <div className="groove-logo">
            <img src="/images/logo.png" alt="GrooveFund" style={{ height: '40px', width: 'auto' }} />
          </div>

          {/* Step indicator */}
          <div className="step-indicator">
            <div className={`step-dot ${step === 'phone' ? 'active' : 'done'}`} />
            <div className={`step-dot ${step === 'otp' ? 'active' : ''}`} />
          </div>

          {/* Title */}
          <h1 className="groove-title">
            {step === 'phone' ? 'Join the Groove 🎉' : 'Check your phone 📱'}
          </h1>
          <p className="groove-subtitle">
            {step === 'phone'
              ? 'Save smarter. Groove harder. Together.'
              : <>We sent a 6-digit code to <span className="phone-display">📞 {phone}</span></>
            }
          </p>

          {/* Error */}
          {error && (
            <div className="error-box">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* PHONE STEP */}
          {step === 'phone' ? (
            <form onSubmit={handleSendOTP}>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812345678"
                  className="form-input"
                  required
                  disabled={loading}
                />
                <p className="form-hint">🇿🇦 South African numbers only</p>
              </div>

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <><span className="spinner" />Sending...</> : 'Send Code ⚡'}
              </button>
            </form>

          ) : (

          /* OTP STEP */
            <form onSubmit={handleVerifyOTP}>
              <div className="form-group">
                <label className="form-label">Verification Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="form-input otp-input"
                  maxLength={6}
                  required
                  disabled={loading}
                  autoFocus
                />
                <p className="form-hint" style={{ justifyContent: 'center' }}>⏱️ Code expires in 5 minutes</p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn-primary"
              >
                {loading ? <><span className="spinner" />Verifying...</> : 'Verify & Groove In 🚀'}
              </button>

              <div className="divider" />

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="btn-ghost"
              >
                🔄 Resend Code
              </button>

              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                disabled={loading}
                className="btn-ghost muted"
              >
                ← Change Number
              </button>
            </form>
          )}

          {/* Login link */}
          <div className="login-link">
            Already a Groover? <a href="/login">Log in</a>
          </div>

        </div>
      </div>
    </>
  );
}
