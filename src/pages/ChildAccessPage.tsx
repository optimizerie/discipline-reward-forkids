import { useState, useEffect, useRef } from 'react';
import { navigate, useChildSession } from '../App';
import { findChildrenForAccess, verifyChildAccess } from '../lib/supabase';
import { hashPin, setChildSession } from '../lib/auth';

interface ChildOption {
  id: string;
  name: string;
  avatar_color: string;
}

type Step = 'pick-child' | 'birthdate' | 'pin';

export function ChildAccessPage() {
  const { setChildSession: setCtxChildSession } = useChildSession();
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<Step>('pick-child');
  const [selectedChild, setSelectedChild] = useState<ChildOption | null>(null);
  const [birthdate, setBirthdate] = useState('');
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    findChildrenForAccess().then(kids => {
      setChildren(kids);
      setLoading(false);
    });
  }, []);

  const handlePickChild = (child: ChildOption) => {
    setSelectedChild(child);
    setError('');
    setStep('birthdate');
  };

  const handleBirthdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthdate) return;
    setError('');
    setStep('pin');
    // Focus first PIN digit
    setTimeout(() => pinRefs[0].current?.focus(), 100);
  };

  const handlePinChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = digit;
    setPinDigits(newDigits);

    if (digit && index < 3) {
      pinRefs[index + 1].current?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (digit && index === 3) {
      const fullPin = [...newDigits.slice(0, 3), digit].join('');
      if (fullPin.length === 4) {
        setTimeout(() => submitPin(fullPin), 100);
      }
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  const submitPin = async (pin: string) => {
    if (!selectedChild || !birthdate) return;
    setVerifying(true);
    setError('');

    try {
      const pinHash = await hashPin(pin);
      const child = await verifyChildAccess(selectedChild.id, birthdate, pinHash);

      if (!child) {
        setError("That doesn't match — try again!");
        setPinDigits(['', '', '', '']);
        setTimeout(() => pinRefs[0].current?.focus(), 100);
        setVerifying(false);
        return;
      }

      const session = {
        childId: child.id,
        childName: child.name,
        parentId: child.parent_id,
        avatarColor: child.avatar_color,
      };
      setChildSession(session);
      setCtxChildSession(session);
      navigate('/child/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
      setPinDigits(['', '', '', '']);
      setVerifying(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="child-access-page">
      <div className="child-access-card">
        {/* Back button */}
        {step !== 'pick-child' ? (
          <button
            className="auth-back"
            onClick={() => {
              setError('');
              if (step === 'pin') { setPinDigits(['', '', '', '']); setStep('birthdate'); }
              else { setStep('pick-child'); setSelectedChild(null); setBirthdate(''); }
            }}
          >
            ← Back
          </button>
        ) : (
          <button className="auth-back" onClick={() => navigate('/')}>
            ← Home
          </button>
        )}

        {/* Step: Pick Child */}
        {step === 'pick-child' && (
          <>
            <h1 className="child-access-title">Who are you? 👋</h1>
            <p className="child-access-sub">Tap your name to start your quest!</p>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }} />
                <div style={{ color: 'var(--gray-600)', fontWeight: 700 }}>Loading...</div>
              </div>
            ) : children.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>😢</div>
                <p style={{ color: 'var(--gray-600)', fontWeight: 700 }}>
                  No children set up yet. Ask your parent to add you!
                </p>
                <button
                  className="btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={() => navigate('/parent/auth')}
                >
                  Parent Login
                </button>
              </div>
            ) : (
              <div className="child-picker-grid">
                {children.map(child => (
                  <button
                    key={child.id}
                    className="child-pick-btn"
                    onClick={() => handlePickChild(child)}
                  >
                    <div
                      className="child-pick-avatar"
                      style={{ background: child.avatar_color }}
                    >
                      {getInitials(child.name)}
                    </div>
                    <div className="child-pick-name">{child.name}</div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Step: Birthdate */}
        {step === 'birthdate' && selectedChild && (
          <>
            <div style={{ marginBottom: 20, textAlign: 'center' }}>
              <div
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: selectedChild.avatar_color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 900, color: '#fff',
                  margin: '0 auto 12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                }}
              >
                {getInitials(selectedChild.name)}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>Hi, {selectedChild.name}!</div>
            </div>

            <h2 className="child-access-title" style={{ fontSize: 22 }}>When's your birthday? 🎂</h2>
            <p className="child-access-sub">Enter your date of birth</p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleBirthdate}>
              <input
                type="date"
                className="form-input"
                value={birthdate}
                onChange={e => setBirthdate(e.target.value)}
                required
                style={{ fontSize: 18, padding: '14px 16px', marginBottom: 20 }}
                max={new Date().toISOString().split('T')[0]}
              />
              <button
                type="submit"
                className="btn-primary btn-full btn-lg"
              >
                Next →
              </button>
            </form>
          </>
        )}

        {/* Step: PIN */}
        {step === 'pin' && selectedChild && (
          <>
            <div style={{ marginBottom: 20, textAlign: 'center' }}>
              <div
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: selectedChild.avatar_color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 900, color: '#fff',
                  margin: '0 auto 12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                }}
              >
                {getInitials(selectedChild.name)}
              </div>
            </div>

            <h2 className="child-access-title" style={{ fontSize: 22 }}>Enter your PIN 🔐</h2>
            <p className="child-access-sub">Type your 4-digit secret PIN</p>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="pin-input-row">
              {pinDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  className={`pin-digit ${digit ? 'filled' : ''}`}
                  value={digit}
                  onChange={e => handlePinChange(i, e.target.value)}
                  onKeyDown={e => handlePinKeyDown(i, e)}
                  disabled={verifying}
                />
              ))}
            </div>

            {verifying ? (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }} />
                <div style={{ color: 'var(--gray-600)', fontWeight: 700 }}>Checking...</div>
              </div>
            ) : (
              <button
                className="btn-primary btn-full btn-lg"
                onClick={() => submitPin(pinDigits.join(''))}
                disabled={pinDigits.some(d => !d)}
              >
                Let's Go! 🚀
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
