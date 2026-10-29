import React from 'react';
import { Dialog } from './Dialog';
import { LOOKBOOK_ITEMS } from '../lib/catalog';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface EditorialDialogProps {
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export const EditorialDialog: React.FC<EditorialDialogProps> = ({ index, onClose, onNavigate }) => {
  const item = LOOKBOOK_ITEMS[index];
  if (!item) return null;

  return (
    <Dialog title="Lookbook image" onClose={onClose} className="editorial-dialog">
      <img src={`/images/${item.image}-final.webp`} alt={item.title} />
      <div>
        <button
          aria-label="Previous editorial"
          onClick={() => onNavigate((index + LOOKBOOK_ITEMS.length - 1) % LOOKBOOK_ITEMS.length)}
        >
          <ArrowLeft size={18} />
        </button>
        <span>{item.title}</span>
        <button
          aria-label="Next editorial"
          onClick={() => onNavigate((index + 1) % LOOKBOOK_ITEMS.length)}
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </Dialog>
  );
};
