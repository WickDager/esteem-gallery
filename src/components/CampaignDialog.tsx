import React from 'react';
import { Dialog } from './Dialog';

interface CampaignDialogProps {
  onClose: () => void;
}

export const CampaignDialog: React.FC<CampaignDialogProps> = ({ onClose }) => {
  return (
    <Dialog title="Editorial motion study" onClose={onClose} className="campaign-dialog">
      <video
        src="/videos/editorial.mp4"
        poster="/images/hero.webp"
        muted
        autoPlay
        loop
        playsInline
        controls
        aria-label="Editorial motion study playback"
      />
      <div>
        <p className="eyebrow">THE ROOTS COLLECTION / EDITORIAL MOTION STUDY</p>
        <h2>The streets are our gallery.</h2>
        <p>A moving portrait of our signature silhouette.</p>
      </div>
    </Dialog>
  );
};
