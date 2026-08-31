"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Volume2 } from "lucide-react";
import toast from "react-hot-toast";

export default function FlashcardReviewClient({ initialCards }: { initialCards: any[] }) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (cards.length === 0 || currentIndex >= cards.length) {
    return (
      <div className="text-center py-24 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Đã xong!</h2>
        <p className="text-gray-500 dark:text-neutral-400 mb-6">
          Bạn đã ôn tập xong tất cả thẻ trong hàng đợi.
        </p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
        >
          Trở về Dashboard
        </button>
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
    // Rough language detection for demo, in production we should pass targetLanguage
    utterance.lang = "en-US"; 
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6 flex items-center justify-between text-sm font-medium text-gray-500">
        <span>Thẻ {currentIndex + 1} / {cards.length}</span>
        <div className="flex gap-2">
          <span className="text-blue-500">Mới: {cards.filter(c => c.state === 0).length}</span>
          <span className="text-red-500">Đang học: {cards.filter(c => c.state === 1 || c.state === 3).length}</span>
          <span className="text-green-500">Ôn tập: {cards.filter(c => c.state === 2).length}</span>
        </div>
      </div>

      {/* Card */}
      <div 
        className={`relative min-h-[400px] w-full preserve-3d transition-transform duration-500 cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-xl flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {currentCard.term}
          </h2>
          {currentCard.pronunciation && (
            <p className="text-lg text-gray-500 dark:text-neutral-400 font-mono mb-4">
              /{currentCard.pronunciation}/
            </p>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); playAudio(currentCard.term); }}
            className="p-3 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <Volume2 className="w-5 h-5" />
          </button>
          
          <div className="absolute bottom-8 left-0 right-0 text-center text-sm text-gray-400 animate-pulse">
            Chạm để xem đáp án
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-xl flex flex-col items-center p-8 overflow-y-auto">
           <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 mt-4">
            {currentCard.term}
          </h2>
          <p className="text-xl text-indigo-600 dark:text-indigo-400 font-semibold mb-6">
            {currentCard.meaning}
          </p>
          
          <div className="w-full text-left space-y-4 text-gray-700 dark:text-neutral-300">
            {currentCard.part_of_speech && (
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">Từ loại:</span> {currentCard.part_of_speech}
              </div>
            )}
            {currentCard.context_sentence && (
              <div className="p-4 bg-gray-50 dark:bg-neutral-900 rounded-xl">
                <span className="font-semibold text-gray-900 dark:text-white block mb-1">Ví dụ ngữ cảnh:</span> 
                <span className="italic">{currentCard.context_sentence}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`mt-8 transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="grid grid-cols-4 gap-3">
          <button 
            onClick={() => handleRating(1)}
            disabled={isSubmitting}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
          >
            <span className="font-bold mb-1">Quên (1)</span>
            <span className="text-xs opacity-70">&lt; 1 phút</span>
          </button>
          <button 
            onClick={() => handleRating(2)}
            disabled={isSubmitting}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 transition-colors"
          >
            <span className="font-bold mb-1">Khó (2)</span>
            <span className="text-xs opacity-70">Vài phút</span>
          </button>
          <button 
            onClick={() => handleRating(3)}
            disabled={isSubmitting}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-green-50 hover:bg-green-100 dark:bg-green-500/10 dark:hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-colors"
          >
            <span className="font-bold mb-1">Tốt (3)</span>
            <span className="text-xs opacity-70">Vài ngày</span>
          </button>
          <button 
            onClick={() => handleRating(4)}
            disabled={isSubmitting}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
          >
            <span className="font-bold mb-1">Dễ (4)</span>
            <span className="text-xs opacity-70">Nhiều ngày</span>
          </button>
        </div>
      </div>
    </div>
  );
}
