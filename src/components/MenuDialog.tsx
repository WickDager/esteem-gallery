import React from 'react';
import { Dialog } from './Dialog';
import { NAV_LINKS } from '../lib/catalog';
import { ArrowRight } from 'lucide-react';

interface MenuDialogProps {
  onClose: () => void;
}

export const MenuDialog: React.FC<MenuDialogProps> = ({ onClose }) => {
  return (
    <Dialog title="Navigation" onClose={onClose} className="menu-dialog">
      <img src="/images/eg-logo.png" className="menu-logo" alt="Esteem Gallery" />
      <nav aria-label="Mobile navigation">
        {NAV_LINKS.map(([label, href], idx) => (
          <a key={label} href={href} onClick={onClose}>
            <small>0{idx + 1}</small>
            {label}
            <ArrowRight size={26} />
          </a>
        ))}
      </nav>
      <span className="eyebrow">WEAR YOUR VISION. / EST. 2025</span>
    </Dialog>
  );
};
