
import React from 'react';

/**
 * Renderiza o texto narrativo processando as quebras de capítulo.
 * Separa o texto pelo marcador '---CHAPTER-BREAK---' e insere um divisor visual.
 */
export const renderNarrativeWithBreaks = (text: string) => {
  if (!text) return null;
  const parts = text.split('---CHAPTER-BREAK---');
  return parts.map((part, index) => (
    <React.Fragment key={index}>
      <div className="narrative-segment whitespace-pre-wrap">{part.trim()}</div>
      {index < parts.length - 1 && (
        <div className="chapter-divider" aria-hidden="true">
          <span>❦</span>
        </div>
      )}
    </React.Fragment>
  ));
};

/**
 * Gera um objeto de estilo consistente para um determinado ID de autor.
 * Usa hashing simples para selecionar uma cor da paleta predefinida.
 */
export const getAuthorStyle = (authorId: string) => {
  if (!authorId) return { 
    bg: 'bg-white dark:bg-[#1a1a1c]', 
    text: 'text-slate-800 dark:text-slate-200', 
    border: 'border-gray-100 dark:border-white/5',
    label: 'bg-slate-100 text-slate-500'
  };

  const colors = [
    { name: 'emerald', bg: 'bg-emerald-50 dark:bg-emerald-500/5', border: 'border-emerald-200 dark:border-emerald-500/20', text: 'text-slate-800 dark:text-slate-200', label: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
    { name: 'rose', bg: 'bg-rose-50 dark:bg-rose-500/5', border: 'border-rose-200 dark:border-rose-500/20', text: 'text-slate-800 dark:text-slate-200', label: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400' },
    { name: 'amber', bg: 'bg-amber-50 dark:bg-amber-500/5', border: 'border-amber-200 dark:border-amber-500/20', text: 'text-slate-800 dark:text-slate-200', label: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' },
    { name: 'cyan', bg: 'bg-cyan-50 dark:bg-cyan-500/5', border: 'border-cyan-200 dark:border-cyan-500/20', text: 'text-slate-800 dark:text-slate-200', label: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400' },
    { name: 'violet', bg: 'bg-violet-50 dark:bg-violet-500/5', border: 'border-violet-200 dark:border-violet-500/20', text: 'text-slate-800 dark:text-slate-200', label: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400' },
    { name: 'fuchsia', bg: 'bg-fuchsia-50 dark:bg-fuchsia-500/5', border: 'border-fuchsia-200 dark:border-fuchsia-500/20', text: 'text-slate-800 dark:text-slate-200', label: 'bg-fuchsia-100 dark:bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-400' },
  ];

  // Hash simples
  let hash = 0;
  for (let i = 0; i < authorId.length; i++) {
    hash = authorId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
