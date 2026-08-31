"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Volume2, Star, Info, MessageSquare, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function StudyClient({ initialCards, deckId }: { initialCards: any[], deckId: string }) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (cards.length === 0 || currentIndex >= cards.length) {
    return (
      <div className="text-center py-24 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm flex-1 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Đã xong!</h2>
        <p className="text-slate-500 dark:text-neutral-400 mb-8">
          Bạn đã hoàn thành phiên học xuất sắc!
        </p>
        <Link 
          href="/flashcards"
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold shadow-lg transition-colors hover:scale-105"
        >
          Trở về Dashboard
        </Link>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleRating = async (rating: number) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/flashcards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId: currentCard.id, rating })
      });
      
      if (!res.ok) throw new Error("Failed to submit review");
      const data = await res.json();
      
      if (data.success && data.nextCard) {
        // Update the card locally so stats progress
        setCards(prev => {
          const updated = [...prev];
          updated[currentIndex] = { ...updated[currentIndex], state: data.nextCard.state };
          return updated;
        });
      }
      
      // Move to next card
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } catch (e: any) {
      toast.error(e.message || "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const playAudio = (text: string) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US"; 
    window.speechSynthesis.speak(utterance);
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (!isFlipped) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          setIsFlipped(true);
        }
      } else {
        if (!isSubmitting) {
          switch (e.key) {
            case '1': e.preventDefault(); handleRating(1); break;
            case '2': e.preventDefault(); handleRating(2); break;
            case '3': e.preventDefault(); handleRating(3); break;
            case '4': e.preventDefault(); handleRating(4); break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isSubmitting, currentCard]);

  return (
    <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto relative">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-neutral-500 mb-2 uppercase tracking-wider">
          <span>Thẻ {currentIndex + 1} / {cards.length}</span>
          <div className="flex gap-4">
            <span className="text-indigo-500">Mới: {cards.filter(c => c.state === 0).length}</span>
            <span className="text-orange-500">Đang học: {cards.filter(c => c.state === 1 || c.state === 3).length}</span>
            <span className="text-emerald-500">Ôn tập: {cards.filter(c => c.state === 2).length}</span>
          </div>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden flex">
           <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${((currentIndex) / cards.length) * 100}%` }}></div>
        </div>
      </div>

      {/* Card */}
      <div 
        className={`relative flex-1 min-h-[450px] w-full preserve-3d transition-transform duration-500 cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
        onClick={() => setIsFlipped(prev => !prev)}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden bg-white dark:bg-[#0a0a0a] rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center p-8 text-center group">
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
             <button className="p-2 text-slate-300 hover:text-amber-400 dark:text-neutral-700 dark:hover:text-amber-500 transition-colors">
               <Star className={`w-6 h-6 ${currentCard.is_favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
             </button>
          </div>
          <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
            {currentCard.term}
          </h2>
          {currentCard.pronunciation && (
            <p className="text-xl text-slate-400 dark:text-neutral-500 font-mono mb-8">
              /{currentCard.pronunciation}/
            </p>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); playAudio(currentCard.term); }}
            className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors shadow-sm"
          >
            <Volume2 className="w-8 h-8" />
          </button>
          
          <div className="absolute bottom-8 left-0 right-0 text-center text-sm font-semibold text-slate-400 dark:text-neutral-600">
            Chạm vào thẻ để xem đáp án
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white dark:bg-[#0a0a0a] rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col p-8 overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {currentCard.term}
              </h2>
              <div className="flex items-center gap-3">
                 <p className="text-lg text-slate-500 dark:text-neutral-400 font-mono">
                  /{currentCard.pronunciation}/
                 </p>
                 <button 
                  onClick={(e) => { e.stopPropagation(); playAudio(currentCard.term); }}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:text-indigo-600 transition-colors"
                 >
                  <Volume2 className="w-4 h-4" />
                 </button>
              </div>
            </div>
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold rounded-lg text-sm border border-indigo-100 dark:border-indigo-500/20">
              {currentCard.part_of_speech}
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-neutral-900/50 rounded-xl border border-slate-100 dark:border-neutral-800 mb-6 shrink-0">
             <p className="text-xl font-bold text-slate-800 dark:text-neutral-200">
              {currentCard.meaning}
            </p>
            {currentCard.vocabData?.context_meaning_vi && (
              <p className="text-sm text-slate-600 mt-2 dark:text-neutral-400">
                <span className="font-semibold text-slate-700 dark:text-neutral-300">Ngữ cảnh:</span> {currentCard.vocabData.context_meaning_vi}
              </p>
            )}
          </div>
          
          <div className="w-full text-left space-y-6 text-slate-700 dark:text-neutral-300">
            {currentCard.context_sentence && (
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100/50 dark:border-emerald-800/30">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-2 text-sm">
                  <MessageSquare className="w-4 h-4" /> Ví dụ từ Video:
                </span> 
                <p className="text-lg italic text-slate-700 dark:text-neutral-200">"{currentCard.context_sentence}"</p>
                {currentCard.vocabData?.sentence_translation_vi && (
                  <p className="text-sm text-slate-600 dark:text-neutral-400 mt-1 flex items-start gap-1">
                    <span className="shrink-0 text-emerald-500">↳</span> {currentCard.vocabData.sentence_translation_vi}
                  </p>
                )}
              </div>
            )}

            {currentCard.vocabData?.examples && currentCard.vocabData.examples.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ví dụ bổ sung</h4>
                <div className="space-y-3">
                  {currentCard.vocabData.examples.map((ex: any, i: number) => (
                    <div key={i} className="pl-3 border-l-2 border-slate-300 dark:border-neutral-700">
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{ex.sentence}</p>
                      <p className="text-sm text-slate-500 italic mt-1 dark:text-neutral-400">{ex.translationVi}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentCard.vocabData?.usage_note_vi && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lưu ý cách dùng</h4>
                <p className="text-sm text-slate-700 dark:text-neutral-300">{currentCard.vocabData.usage_note_vi}</p>
              </div>
            )}

            {((currentCard.vocabData?.synonyms?.length || 0) > 0 || (currentCard.vocabData?.antonyms?.length || 0) > 0) && (
              <div className="flex flex-col gap-3">
                {(currentCard.vocabData?.synonyms?.length || 0) > 0 && (
                  <div className="flex-1 bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                    <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1.5">Từ đồng nghĩa</h4>
                    <div className="flex flex-wrap gap-1">
                      {currentCard.vocabData.synonyms.map((syn: string, i: number) => (
                        <span key={i} className="bg-white dark:bg-[#0a0a0a] text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-xs border border-indigo-100 dark:border-indigo-900/50 shadow-sm font-medium">{syn}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(currentCard.vocabData?.antonyms?.length || 0) > 0 && (
                  <div className="flex-1 bg-rose-50/50 dark:bg-rose-900/10 p-3 rounded-lg border border-rose-100 dark:border-rose-900/30">
                    <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1.5">Từ trái nghĩa</h4>
                    <div className="flex flex-wrap gap-1">
                      {currentCard.vocabData.antonyms.map((ant: string, i: number) => (
                        <span key={i} className="bg-white dark:bg-[#0a0a0a] text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded text-xs border border-rose-100 dark:border-rose-900/50 shadow-sm font-medium">{ant}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {currentCard.difficulty && (
             <div className="mt-8 shrink-0 flex items-center gap-2 text-xs font-semibold text-slate-400">
               <Info className="w-4 h-4" /> Độ khó CEFR: <span className="uppercase">{currentCard.difficulty}</span>
             </div>
          )}
          {/* Flip back hint */}
          <div className="absolute bottom-4 right-4">
            <button
              onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
              className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-neutral-600 hover:text-slate-700 dark:hover:text-neutral-300 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800"
            >
              <RotateCcw className="w-3 h-3" /> Xem lại mặt trước
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons (FSRS Grading) */}
      <div className="mt-8 shrink-0">
        {!isFlipped ? (
          <button
            onClick={() => setIsFlipped(true)}
            className="w-full py-4 rounded-2xl bg-white dark:bg-[#0a0a0a] border-2 border-slate-200 dark:border-neutral-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-600 dark:text-neutral-300 font-bold text-base transition-all hover:shadow-md flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Xem đáp án
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            <button 
              onClick={() => handleRating(1)}
              disabled={isSubmitting}
              className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0a0a0a] border-2 border-red-100 dark:border-red-900/30 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-700 dark:text-neutral-300 transition-all group disabled:opacity-50"
            >
              <span className="font-black text-red-500 mb-1 text-lg group-hover:scale-110 transition-transform">1</span>
              <span className="font-bold text-sm">Quên</span>
              <span className="text-[10px] font-semibold text-slate-400 mt-1">&lt; 1p</span>
            </button>
            
            <button 
              onClick={() => handleRating(2)}
              disabled={isSubmitting}
              className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0a0a0a] border-2 border-orange-100 dark:border-orange-900/30 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-slate-700 dark:text-neutral-300 transition-all group disabled:opacity-50"
            >
              <span className="font-black text-orange-500 mb-1 text-lg group-hover:scale-110 transition-transform">2</span>
              <span className="font-bold text-sm">Khó</span>
              <span className="text-[10px] font-semibold text-slate-400 mt-1">5p</span>
            </button>
            
            <button 
              onClick={() => handleRating(3)}
              disabled={isSubmitting}
              className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0a0a0a] border-2 border-green-100 dark:border-green-900/30 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 text-slate-700 dark:text-neutral-300 transition-all group disabled:opacity-50"
            >
              <span className="font-black text-green-500 mb-1 text-lg group-hover:scale-110 transition-transform">3</span>
              <span className="font-bold text-sm">Tốt</span>
              <span className="text-[10px] font-semibold text-slate-400 mt-1">10p</span>
            </button>
            
            <button 
              onClick={() => handleRating(4)}
              disabled={isSubmitting}
              className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0a0a0a] border-2 border-blue-100 dark:border-blue-900/30 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-700 dark:text-neutral-300 transition-all group disabled:opacity-50"
            >
              <span className="font-black text-blue-500 mb-1 text-lg group-hover:scale-110 transition-transform">4</span>
              <span className="font-bold text-sm">Dễ</span>
              <span className="text-[10px] font-semibold text-slate-400 mt-1">4n</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
