import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start items-end gap-3 max-w-[85%]">
      {/* Coach Avatar placeholder */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-md select-none shrink-0">
        J
      </div>
      
      {/* Bouncing Dots Bubble */}
      <div className="bg-[#0f172a]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl rounded-bl-none px-4 py-3 shadow-lg flex items-center gap-1.5 min-h-[42px]">
        <div className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2.5 h-2.5 bg-sky-400/80 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2.5 h-2.5 bg-sky-400/60 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};
