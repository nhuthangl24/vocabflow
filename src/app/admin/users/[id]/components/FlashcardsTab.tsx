import { useEffect, useState } from "react";
import { getUserFlashcards } from "../actions";
import { BrainCircuit, RotateCcw, Check, Flame } from "lucide-react";

export default function FlashcardsTab({ userId }: { userId: string }) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserFlashcards(userId).then(data => {
      setCards(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <div className="py-20 text-center text-neutral-500 text-sm">Đang tải Flashcards...</div>;

  if (cards.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-neutral-500 gap-3">
        <BrainCircuit className="w-10 h-10 opacity-20" />
        <p>User này chưa lưu flashcard nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Flashcards & SRS</h2>
        <span className="text-xs text-neutral-500">{cards.length} cards</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
          <div className="text-xs text-neutral-500 mb-1">Tổng số thẻ</div>
          <div className="text-xl font-bold text-white">{cards.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="text-xs font-medium text-emerald-400 mb-1">Đã thuộc (State &gt; 2)</div>
          <div className="text-xl font-bold text-white">{cards.filter(c => c.state > 2).length}</div>
        </div>
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <div className="text-xs font-medium text-amber-400 mb-1">Cần ôn tập</div>
          <div className="text-xl font-bold text-white">{cards.filter(c => new Date(c.next_review_at) < new Date()).length}</div>
        </div>
      </div>
      
      <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl overflow-hidden shadow-xl shadow-black/40">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="text-[10px] text-neutral-500 bg-neutral-900/40 uppercase tracking-wider sticky top-0 backdrop-blur-md">
              <tr>
                <th className="px-4 py-3 font-medium">Từ vựng</th>
                <th className="px-4 py-3 font-medium">Ý nghĩa</th>
                <th className="px-4 py-3 font-medium text-right">State</th>
                <th className="px-4 py-3 font-medium text-right">Reps</th>
                <th className="px-4 py-3 font-medium text-right">Next Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-xs">
              {cards.map((card) => (
                <tr key={card.id} className="hover:bg-neutral-900/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-bold text-white">{card.term}</div>
                    <div className="text-[10px] text-neutral-500 italic mt-0.5">{card.part_of_speech}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate" title={card.meaning}>
                    {card.meaning}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right font-mono">
                    {card.state}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {card.reps || card.repetitions || 0}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {new Date(card.next_review_at).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
