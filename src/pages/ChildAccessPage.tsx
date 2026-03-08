import { useState, useRef } from 'react';
import { navigate, useChildSession } from '../App';
import { findChildByBirthdateAndPin } from '../lib/supabase';
import { hashPin, setChildSession } from '../lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GeminiIcon } from '@/components/GeminiIcon';
import { ICON_KEYS } from '@/lib/gemini';
import { cn } from '@/lib/utils';

export function ChildAccessPage() {
  const { setChildSession: setCtxChildSession } = useChildSession();

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

  const handlePinChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = digit;
    setPinDigits(newDigits);

    if (digit && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
    if (digit && index === 3) {
      const fullPin = [...newDigits.slice(0, 3), digit].join('');
      if (fullPin.length === 4 && birthdate) {
        setTimeout(() => submitCredentials(birthdate, fullPin), 100);
      }
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullPin = pinDigits.join('');
    if (!birthdate || fullPin.length !== 4) return;
    submitCredentials(birthdate, fullPin);
  };

  const submitCredentials = async (bd: string, pin: string) => {
    setVerifying(true);
    setError('');
    try {
      const pinHash = await hashPin(pin);
      const child = await findChildByBirthdateAndPin(bd, pinHash);
      if (!child) {
        setError("That doesn't match — check your birthdate and PIN and try again.");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/')}>
          Back to Home
        </Button>

        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <GeminiIcon iconKey={ICON_KEYS.CHILD_ACCESS} size={72} className="rounded-2xl" />
            </div>
            <CardTitle className="text-2xl">Start your quests!</CardTitle>
            <CardDescription>Enter your birthday and secret PIN</CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {error && (
              <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold p-3 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Birthdate */}
              <div className="space-y-2">
                <Label className="text-base font-extrabold">Your Birthday</Label>
                <Input
                  type="date"
                  value={birthdate}
                  onChange={e => setBirthdate(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="text-base h-12"
                />
              </div>

              {/* PIN */}
              <div className="space-y-3">
                <Label className="text-base font-extrabold">Your Secret PIN</Label>
                <div className="flex justify-center gap-3">
                  {pinDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={pinRefs[i]}
                      type="tel"
                      inputMode="numeric"
                      maxLength={1}
                      className={cn(
                        'w-14 h-14 text-center text-2xl font-black rounded-2xl border-2 outline-none transition-all',
                        digit
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input bg-white text-foreground',
                        'focus:border-primary focus:ring-2 focus:ring-primary/30 focus:ring-offset-1'
                      )}
                      value={digit}
                      onChange={e => handlePinChange(i, e.target.value)}
                      onKeyDown={e => handlePinKeyDown(i, e)}
                      disabled={verifying}
                    />
                  ))}
                </div>
              </div>

              {verifying ? (
                <div className="text-center py-3 space-y-2">
                  <div className="w-8 h-8 rounded-full shimmer-bg mx-auto" />
                  <p className="text-muted-foreground font-bold text-sm">Checking...</p>
                </div>
              ) : (
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={!birthdate || pinDigits.some(d => !d) || verifying}
                >
                  Let's Go!
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground font-semibold mt-4">
          Ask your parent if you don't remember your PIN
        </p>
      </div>
    </div>
  );
}
