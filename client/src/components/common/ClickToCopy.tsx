import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ClickToCopyProps {
  text: string;
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ClickToCopy: React.FC<ClickToCopyProps> = ({
  text,
  label = 'Value',
  className = '',
  children
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`Copied ${label} to clipboard: ${text}`, { duration: 2500 });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      title={`Click to copy ${label}`}
      className={`inline-flex items-center space-x-1.5 transition active:scale-95 group/copy focus:outline-none ${className}`}
    >
      {children || <span>{text}</span>}
      <span className="p-1 rounded-md bg-slate-900/60 border border-slate-800 text-slate-400 group-hover/copy:text-cyan-300 group-hover/copy:border-cyan-500/40 transition">
        {copied ? (
          <Check className="h-3 w-3 text-emerald-400 animate-in zoom-in-50" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </span>
    </button>
  );
};

export default ClickToCopy;
