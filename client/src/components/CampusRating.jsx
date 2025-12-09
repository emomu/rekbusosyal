import React, { useState } from 'react';
import Lottie from 'lottie-react';
import loaderAnimation from '../assets/loader.json';

const CampusRating = ({ data, onVote }) => {
  const [isVoting, setIsVoting] = useState(false);
  // Toplam oy sayısını hesapla
  const totalVotes = data.votes.negative + data.votes.neutral + data.votes.positive;
  
  // Yüzdeleri hesapla (Bar genişliği için)
  const negPct = totalVotes ? (data.votes.negative / totalVotes) * 100 : 0;
  const neuPct = totalVotes ? (data.votes.neutral / totalVotes) * 100 : 0;
  const posPct = totalVotes ? (data.votes.positive / totalVotes) * 100 : 0;

  const handleVote = async (type) => {
    setIsVoting(true);
    await onVote(data._id, type);
    setIsVoting(false);
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">{data.name}</h3>

        {/* İLERLEME ÇUBUĞU (BAR) */}
        <div className="flex h-4 w-full rounded-full overflow-hidden bg-gray-100 mb-6">
          <div style={{ width: `${negPct}%` }} className="bg-red-500 transition-all duration-500"></div>
          <div style={{ width: `${neuPct}%` }} className="bg-blue-500 transition-all duration-500"></div>
          <div style={{ width: `${posPct}%` }} className="bg-green-500 transition-all duration-500"></div>
        </div>

        {/* BUTONLAR */}
        <div className="flex gap-2 justify-between">
          <button
            onClick={() => handleVote('negative')}
            disabled={isVoting}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-3 px-2 rounded-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Şiddetle Önermiyorum
          </button>
          <button
            onClick={() => handleVote('neutral')}
            disabled={isVoting}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-3 px-2 rounded-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ne İyi Ne Kötü
          </button>
          <button
            onClick={() => handleVote('positive')}
            disabled={isVoting}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-3 px-2 rounded-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Kesinlikle Öneriyorum
          </button>
        </div>

        <div className="text-center mt-3 text-xs text-gray-400">
          Toplam {totalVotes} oy kullanıldı
        </div>
      </div>

      {/* LOADING DIALOG */}
      {isVoting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-2xl p-8 shadow-2xl animate-scale-in">
            <div className="w-24 h-24 mx-auto mb-4">
              <Lottie animationData={loaderAnimation} loop={true} />
            </div>
            <p className="text-center text-gray-700 font-medium">Oyunuz kaydediliyor...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default CampusRating;