import { useState, useRef, useEffect } from "react";
import { Shield, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const PASSCODE = "DEEPDIVE";

export function PasscodeGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", "", "", ""]);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("osint-auth");
    if (stored === "authenticated") {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInput = (index: number, value: string) => {
    const upper = value.toUpperCase().slice(-1);
    const newCode = [...code];
    newCode[index] = upper;
    setCode(newCode);
    setError(false);

    if (upper && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (upper && index === 7) {
      const fullCode = newCode.join("");
      if (fullCode === PASSCODE) {
        sessionStorage.setItem("osint-auth", "authenticated");
        setAuthenticated(true);
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setCode(["", "", "", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }, 600);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      const fullCode = code.join("");
      if (fullCode.length === 8) {
        if (fullCode === PASSCODE) {
          sessionStorage.setItem("osint-auth", "authenticated");
          setAuthenticated(true);
        } else {
          setError(true);
          setShake(true);
          setTimeout(() => {
            setShake(false);
            setCode(["", "", "", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
          }, 600);
        }
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").toUpperCase().slice(0, 8);
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    if (pasted.length === 8) {
      if (pasted === PASSCODE) {
        sessionStorage.setItem("osint-auth", "authenticated");
        setAuthenticated(true);
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setCode(["", "", "", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }, 600);
      }
    } else {
      inputRefs.current[Math.min(pasted.length, 7)]?.focus();
    }
  };

  if (authenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Shield */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-lg shadow-primary/5">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">OSINT Deep Dive</h1>
          <p className="text-sm text-muted-foreground mt-2">Enter access code to continue</p>
        </div>

        {/* Code Input */}
        <div className={`transition-transform ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-10 h-12 text-center text-lg font-mono font-bold rounded-lg border-2 bg-card text-foreground outline-none transition-all duration-200
                  ${error ? "border-red-500 text-red-400" : digit ? "border-primary/60 text-primary" : "border-border"}
                  focus:border-primary focus:ring-2 focus:ring-primary/20`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-center gap-2 text-red-400 text-sm mb-4">
            <AlertCircle className="h-4 w-4" />
            <span>Invalid access code. Try again.</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
          <Lock className="h-3 w-3" />
          <span>Classified Intelligence System — Authorized Personnel Only</span>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
