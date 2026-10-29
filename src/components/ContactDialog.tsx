import React from 'react';
import { Dialog } from './Dialog';
import { STORE_INFO } from '../lib/catalog';
import { ArrowRight } from 'lucide-react';

interface ContactDialogProps {
  onClose: () => void;
}

export const ContactDialog: React.FC<ContactDialogProps> = ({ onClose }) => {
  return (
    <Dialog title="Contact" onClose={onClose} className="social-dialog">
      <p className="eyebrow">STAY IN THE LOOP</p>
      <h2>Let’s connect.</h2>
      <p>
        Our primary location is <strong>{STORE_INFO.location}.</strong> For design enquiries, availability and pickup or delivery arrangements, message us on WhatsApp or give us a call.
      </p>
      <div className="contact-actions">
        <a href={STORE_INFO.whatsappUrl} target="_blank" rel="noopener noreferrer">
          WhatsApp {STORE_INFO.phoneFormatted} <ArrowRight size={16} />
        </a>
        <a href={`tel:${STORE_INFO.phone}`}>
          Call {STORE_INFO.phoneFormatted} <ArrowRight size={16} />
        </a>
        <a href={STORE_INFO.instagram} target="_blank" rel="noopener noreferrer">
          Instagram / @call_me_vashe <ArrowRight size={16} />
        </a>
        <a href={STORE_INFO.tiktok} target="_blank" rel="noopener noreferrer">
          TikTok / @im_vashe <ArrowRight size={16} />
        </a>
      </div>
      <button className="solid-button" onClick={onClose}>
        Back to the gallery <ArrowRight size={17} />
      </button>
    </Dialog>
  );
};
