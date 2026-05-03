import { useEffect, useState } from 'react';

export interface CountdownTime {
  days: number; hours: number; minutes: number; seconds: number; ended: boolean;
}

export function useCountdown(targetIso: string | null | undefined): CountdownTime | null {
  const [time, setTime] = useState<CountdownTime | null>(null);

  useEffect(() => {
    if (!targetIso) return;

    function calc() {
      const diff = new Date(targetIso!).getTime() - Date.now();
      if (diff <= 0) { setTime({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true }); return; }
      setTime({
        ended:   false,
        days:    Math.floor(diff / 86_400_000),
        hours:   Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000)  /    60_000),
        seconds: Math.floor((diff %    60_000)  /     1_000),
      });
    }

    calc();
    const id = setInterval(calc, 1_000);
    return () => clearInterval(id);
  }, [targetIso]);

  return time;
}
