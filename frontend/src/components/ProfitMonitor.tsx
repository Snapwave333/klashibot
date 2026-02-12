import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useTradingStore } from '../context/TradingContext';

export const ProfitMonitor = () => {
  const { portfolio, profitSoundEnabled } = useTradingStore();
  const prevEquity = useRef(portfolio.total_equity);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/sounds/ka-ching.mp3');
  }, []);

  useEffect(() => {
    const currentEquity = portfolio.total_equity;
    const previous = prevEquity.current;

    // Detect Profit (Significant increase in equity, filtering out small fluctuations)
    // We assume a realized profit if equity jumps up. 
    // Ideally we would trigger this on a specific "Trade Closed" event, 
    // but watching equity is a good reactive proxy for now.
    if (currentEquity > previous + 0.5) { // Threshold to avoid noise
       const diff = currentEquity - previous;
       
       // Trigger Toast
       toast.success(`Profit Realized: +$${diff.toFixed(2)}`, {
         id: 'profit-toast',
         icon: '💸',
         duration: 5000,
         style: {
           border: '1px solid #00ff88',
           boxShadow: '0 0 15px rgba(0, 255, 136, 0.3)',
         }
       });

       // Play Sound
       if (profitSoundEnabled && audioRef.current) {
         audioRef.current.currentTime = 0;
         audioRef.current.play().catch(e => console.warn("Audio play failed", e));
       }
    }

    prevEquity.current = currentEquity;
  }, [portfolio.total_equity, profitSoundEnabled]);

  return null;
};
