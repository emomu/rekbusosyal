import { useEffect, useState } from 'react';
import { X, Snowflake, Mail } from 'lucide-react';
import Snowfall from 'react-snowfall';
import { API_URL } from '../config/api';
import { useSelector } from 'react-redux';

export default function ChristmasCardModal({ cardId, onClose }) {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGift, setShowGift] = useState(true);
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const res = await fetch(`${API_URL}/api/christmas-cards/${cardId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCard(data);
        }
      } catch (error) {
        console.error('Error fetching Christmas card:', error);
      } finally {
        setLoading(false);
      }
    };

    if (cardId) fetchCard();

    const giftTimer = setTimeout(() => {
      setShowGift(false);
    }, 2200);

    return () => clearTimeout(giftTimer);
  }, [cardId, token]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="animate-pulse text-white text-lg font-serif italic">Yükleniyor...</div>
      </div>
    );
  }

  if (!card) return null;

  // Hediye Paketi Animasyonu (Değiştirilmedi)
  if (showGift) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 text-[10px] sm:text-[16px]">
          <div className="gift">
            <div className="gift__bow"><div className="gift__bow-left"></div><div className="gift__bow-right"></div><div className="gift__bow-center"></div></div>
            <div className="gift__box"><div className="gift__lid-shadow"></div></div>
            <div className="gift__lid"></div>
            <div className="gift__star gift__star--1"></div><div className="gift__star gift__star--2"></div><div className="gift__star gift__star--3"></div><div className="gift__star gift__star--4"></div><div className="gift__star gift__star--5"></div>
          </div>
        </div>
        <style>{`
          .gift { --dur: 1.5s; position: relative; width: 18em; height: 18em; }
          .gift__bow, .gift__bow-center, .gift__bow-left, .gift__bow-right, .gift__box, .gift__lid, .gift__lid-shadow, .gift__star { position: absolute; }
          .gift__bow-center, .gift__bow-left, .gift__bow-right { background-color: hsl(345,100%,38%); }
          .gift__bow { animation: bowBounce var(--dur) ease-in-out; bottom: 11em; left: 7.5em; width: 3em; height: 2em; transform-origin: 50% 230%; }
          .gift__bow-center { border-radius: 1em; width: 100%; height: 100%; }
          .gift__bow-left, .gift__bow-right { box-shadow: 0 0 0 0.7em hsl(345,100%,48%) inset; top: 0.3em; width: 4em; height: 5em; z-index: -1; }
          .gift__bow-left:before, .gift__bow-right:before { background-color: hsl(345,100%,48%); border-radius: inherit; content: ""; display: block; position: absolute; inset: 0; }
          .gift__bow-left { animation: bowLeftPivot var(--dur) ease-in-out; border-radius: 1.5em 0 3em 1em / 1.5em 0 3em 3.5em; right: calc(100% - 0.75em); transform: rotate(35deg); transform-origin: 100% 15%; }
          .gift__bow-left:before { clip-path: polygon(0 42%,100% 12%,100% 100%,0 100%); }
          .gift__bow-right { animation: bowRightPivot var(--dur) ease-in-out; border-radius: 0 1.5em 1em 3em / 0 1.5em 3.5em 3em; left: calc(100% - 0.75em); transform: rotate(-35deg); transform-origin: 0% 15%; }
          .gift__bow-right:before { clip-path: polygon(0 12%,100% 42%,100% 100%,0 100%); }
          .gift__box, .gift__lid, .gift__lid-shadow { transform-origin: 50% 100%; }
          .gift__box { animation: boxBounce var(--dur) ease-in-out; background: linear-gradient(hsl(345,100%,38%),hsl(345,100%,38%)) 50% 50% / 3.3em 100% no-repeat, hsl(0,0%,90%); border-radius: 1.5em; bottom: 0.5em; left: 3.3em; overflow: hidden; width: 11.4em; height: 9em; }
          .gift__lid, .gift__lid-shadow { border-radius: 1em; width: 13em; height: 3.3em; }
          .gift__lid { animation: lidBounce var(--dur) ease-in-out; background: linear-gradient(hsl(345,100%,48%),hsl(345,100%,48%)) 50% 50% / 3.3em 100% no-repeat, hsl(0,0%,100%); bottom: 8.7em; left: 2.5em; }
          .gift__lid-shadow { animation: lidShadowBounce var(--dur) ease-in-out; background-color: hsla(0,0%,0%,0.1); top: -1.5em; left: -1em; }
          .gift__star { animation: starRotateCW var(--dur) ease-in; background-color: hsl(0,0%,100%); clip-path: polygon(50% 0,65% 35%,100% 50%,65% 65%,50% 100%,35% 65%,0 50%,35% 35%); transform: scale(0); }
          .gift__star--2, .gift__star--4, .gift__star--5 { animation-name: starRotateCCW; }
          .gift__star--1 { animation-delay: calc(var(--dur) * 0.5); top: 0; left: 12.5em; width: 1.5em; height: 1.5em; }
          .gift__star--2 { animation-delay: calc(var(--dur) * 0.125); top: 2em; left: 10em; width: 1.75em; height: 1.75em; }
          .gift__star--3 { animation-delay: calc(var(--dur) * 0.25); top: 8em; left: 0; width: 1.25em; height: 1.25em; }
          .gift__star--4 { top: 10.5em; right: 0; width: 1.75em; height: 1.75em; }
          .gift__star--5 { animation-delay: calc(var(--dur) * 0.375); top: 12em; left: 1.8em; width: 2.5em; height: 2.5em; }
          @keyframes bowBounce { from, 50% { transform: translateY(0) rotate(0); } 62.5% { animation-timing-function: ease-in; transform: translateY(75%) rotate(0); } 68.75% { animation-timing-function: ease-out; transform: translateY(-37.5%) rotate(15deg); } 75% { animation-timing-function: ease-in-out; transform: translateY(-150%) rotate(5deg); } 87.5% { transform: translateY(65%) rotate(-3deg); } to { transform: translateY(0) rotate(0); } }
          @keyframes boxBounce { from, 50% { transform: translateY(0) scale(1,1); } 62.5% { transform: translateY(4%) scale(1.12,0.89); } 75% { transform: translateY(-11%) scale(0.92,1.1); } 87.5% { transform: translateY(0) scale(1.05,0.9); } to { transform: translateY(0) scale(1,1); } }
          @keyframes lidBounce { from, 50% { transform: translateY(0) scale(1,1) rotate(0); } 62.5% { animation-timing-function: ease-in; transform: translateY(45%) scale(1.14,0.95) rotate(0); } 68.75% { animation-timing-function: ease-out; transform: translateY(-22.5%) scale(1.05,1.03) rotate(15deg); } 75% { animation-timing-function: ease-in-out; transform: translateY(-90%) scale(0.96,1.1) rotate(5deg); } 87.5% { transform: translateY(30%) scale(1.12,0.93) rotate(-3deg); } to { transform: translateY(0) scale(1,1) rotate(0); } }
          @keyframes starRotateCW { from { transform: scale(0) rotate(0); } 25% { animation-timing-function: ease-out; transform: scale(1) rotate(0.25turn); } 50%, to { transform: scale(0) rotate(0.5turn); } }
          @keyframes starRotateCCW { from { transform: scale(0) rotate(0); } 25% { animation-timing-function: ease-out; transform: scale(1) rotate(-0.25turn); } 50%, to { transform: scale(0) rotate(-0.5turn); } }
        `}</style>
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <Snowfall color="#fff" snowflakeCount={70} style={{ position: 'fixed', pointerEvents: 'none' }} />

      <div
        className="relative bg-[#fdfcf0] rounded-sm shadow-2xl max-w-4xl w-full mx-auto my-auto animate-scale-in postcard-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none noise-bg"></div>

        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 bg-black/5 hover:bg-black/10 rounded-full transition z-30"
        >
          <X size={20} className="text-gray-600" />
        </button>

        {/* Postcard Layout */}
        <div className="flex flex-col md:flex-row h-full min-h-[550px] md:aspect-[1.6/1]">
          
          {/* LEFT SIDE: Personal Message Area */}
          <div className="w-full md:w-3/5 p-6 md:p-12 md:pr-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-300 border-dashed relative">
            <div className="pt-14 md:pt-16 relative"> {/* pt-12'den 16'ya çekerek yazıyı aşağı aldım */}
              <Mail className="text-red-700/10 absolute top-0 -left-2 rotate-12" size={48} />
              <p className="font-['Dancing_Script',cursive] text-2xl md:text-3xl text-gray-800 leading-relaxed min-h-[150px] md:min-h-[200px]">
                {card.message}
              </p>
            </div>
            
            <div className="mt-8 md:mt-auto pb-4">
              <div className="h-[1px] w-24 bg-gray-400 mb-2"></div>
              <p className="font-['Dancing_Script',cursive] text-xl text-red-800">
                {card.sender?.fullName}
              </p>
            </div>
          </div>

          {/* RIGHT SIDE: Stamp and Recipient Info */}
          <div className="w-full md:w-2/5 p-6 md:p-12 md:pl-8 flex flex-col justify-between">
            
            {/* Stamp & Recipient Container (Flex-row on mobile, flex-col on desktop) */}
            <div className="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-start gap-4">
              
              {/* Recipient Lines (Left on mobile, bottom on desktop) */}
              <div className="flex-1 space-y-4 md:space-y-8 w-full order-1 md:order-2">
                <div className="border-b-2 border-gray-300 pb-1">
                  <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold italic">Kime:</span>
                  <p className="font-medium text-gray-700 text-sm md:text-base ml-2">@{card.recipient?.username}</p>
                </div>
                <div className="border-b-2 border-gray-300 pb-1">
                  <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold italic">Adres:</span>
                  <p className="font-medium text-gray-700 text-sm md:text-base ml-2">KBÜSosyal Platformu</p>
                </div>
                <div className="border-b-2 border-gray-300 pb-1 flex justify-between items-end">
                  <p className="font-medium text-gray-700 text-sm md:text-base ml-2">Karabük, TR</p>
                  <span className="text-[10px] font-mono text-gray-400 hidden md:inline">#2026-XMAS</span>
                </div>
              </div>

              {/* The Stamp (Right on mobile, top on desktop) */}
              <div className="order-2 md:order-1 mb-0 md:mb-12 shrink-0">
                <div className="w-20 h-24 md:w-28 md:h-32 bg-white p-1 shadow-md border-[6px] border-double border-red-800 rotate-3 flex flex-col items-center justify-center relative">
                  <div className="absolute -top-3 -left-3">
                      <Snowflake className="text-blue-900/20" size={24} />
                  </div>
                  {card.sender?.profilePicture ? (
                    <img
                      src={card.sender.profilePicture}
                      alt="Stamp"
                      className="w-full h-full object-cover grayscale-[0.2] contrast-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-red-800 font-bold">2025</div>
                  )}
                  <div className="absolute bottom-1 right-1 text-[7px] font-mono text-red-800 font-bold bg-white/80 px-1">
                    POSTA
                  </div>
                </div>
              </div>
            </div>

            {/* Date - Bottom Right */}
            <div className="mt-8 md:mt-auto text-right opacity-40">
              <div className="text-[10px] font-mono italic">
                {new Date(card.createdAt).toLocaleDateString('tr-TR')}
              </div>
            </div>
          </div>
        </div>

        {/* Postcard Airmail Border */}
        <div className="h-2 md:h-3 airmail-stripes w-full"></div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;700&display=swap');
        .postcard-border { border: 1px solid #e2e8f0; }
        .airmail-stripes {
          background: repeating-linear-gradient(45deg, #b91c1c, #b91c1c 15px, #fff 15px, #fff 30px, #1e3a8a 30px, #1e3a8a 45px, #fff 45px, #fff 60px);
        }
        .noise-bg {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.4s ease-out; }
      `}</style>
    </div>
  );
}