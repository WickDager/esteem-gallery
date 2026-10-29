import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  type Product,
  DESIGNS_COLLECTION,
  LOGO_STUDY_LABELS,
} from '../lib/catalog';
import { ArrowRight, Plus } from 'lucide-react';

interface DesignArchiveProps {
  onSelectProduct: (product: Product) => void;
}

export const DesignArchive: React.FC<DesignArchiveProps> = ({ onSelectProduct }) => {
  const [activeBrand, setActiveBrand] = useState<'eg' | 'sza'>('eg');

  return (
    <section className="design-archive section-pad" id="designs">
      <motion.div
        className="section-head"
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <p className="eyebrow">04 / BEYOND THE ROOTS</p>
          <h2>
            OTHER DESIGNS.
            <br />
            <span>NEW EXPRESSIONS.</span>
          </h2>
        </div>
        <div className="archive-intro">
          <p>
            The same independent spirit. A different canvas.
            <br />
            SZA graphic studies and alternate Esteem identities,
            <br />
            taken directly from our design boards.
          </p>
          <span>DESIGN ENQUIRIES / AVAILABILITY CONFIRMED IN CHAT</span>
        </div>
      </motion.div>

      <div className="archive-products">
        {DESIGNS_COLLECTION.map((product, idx) => (
          <motion.div
            key={product.id}
            className="archive-product"
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.8, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              className={`archive-image ${product.back ? 'has-back' : 'zoom-only'}`}
              onClick={() => onSelectProduct(product)}
              aria-label={`View ${product.name} ${product.title}`}
            >
              <img
                className="archive-front"
                src={`/images/${product.id}.webp`}
                loading="lazy"
                alt={`${product.name} supplied garment design`}
              />
              {product.back && (
                <img
                  className="archive-back"
                  loading="lazy"
                  src={product.back}
                  alt={`${product.name} supplied worn back reference`}
                />
              )}
              <span className="archive-tag">
                {product.id.startsWith('sza') ? 'SZA / GRAPHIC STUDY' : 'EG / IDENTITY STUDY'}
              </span>
              <span className="archive-plus">
                <Plus size={18} />
              </span>
            </button>

            <button className="archive-name" onClick={() => onSelectProduct(product)}>
              <span>
                <h3>{product.name}</h3>
                <p>{product.title}</p>
              </span>
              <ArrowRight size={16} />
            </button>
            <p className="archive-availability">PRICE & AVAILABILITY ON ENQUIRY</p>
          </motion.div>
        ))}
      </div>

      <div className="identity-studies">
        <motion.div
          className="identity-head"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <p className="eyebrow">THE IDENTITY LAB</p>
            <h3>ONE NAME. MANY PERSPECTIVES.</h3>
            <p>A closer look at the logo directions in our supplied reference boards.</p>
          </div>
          <div className="identity-tabs" aria-label="Logo study family">
            {(['eg', 'sza'] as const).map((brand) => (
              <button
                key={brand}
                aria-pressed={activeBrand === brand}
                onClick={() => setActiveBrand(brand)}
                className={activeBrand === brand ? 'selected' : ''}
              >
                {brand === 'eg' ? 'ESTEEM GALLERY' : 'SZA GALLERY'}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="logo-grid">
          {LOGO_STUDY_LABELS.map((label, idx) => (
            <figure key={activeBrand + label}>
              <img
                loading="lazy"
                src={`/images/${activeBrand}-logo-study-${idx + 1}.webp`}
                alt={`${activeBrand === 'eg' ? 'Esteem Gallery' : 'SZA Gallery'} ${label} logo reference`}
              />
              <figcaption>
                <span>0{idx + 1}</span>
                {label}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
