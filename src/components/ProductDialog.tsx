import React, { useState } from 'react';
import { Dialog } from './Dialog';
import {
  type Product,
  ROOTS_COLLECTION,
  ALL_PRODUCTS,
  AVAILABLE_SIZES,
  type ShirtSize,
} from '../lib/catalog';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface ProductDialogProps {
  initial: Product;
  onClose: () => void;
  onAdd: (product: Product, size: ShirtSize) => void;
  onOpenBag?: () => void;
}

export const ProductDialog: React.FC<ProductDialogProps> = ({ initial, onClose, onAdd, onOpenBag }) => {
  const [product, setProduct] = useState<Product>(initial);
  const [selectedSize, setSelectedSize] = useState<ShirtSize | ''>('');
  const [showBack, setShowBack] = useState<boolean>(false);
  const [showFitGuide, setShowFitGuide] = useState<boolean>(false);
  const [added, setAdded] = useState<boolean>(false);

  const swatches = product.group === 'roots' ? ROOTS_COLLECTION : ALL_PRODUCTS.filter((p) => p.id === product.id);

  const handleSelectSize = (size: ShirtSize) => {
    setSelectedSize(size);
    setAdded(false);
  };

  const handleAdd = () => {
    if (!selectedSize) return;
    onAdd(product, selectedSize);
    setAdded(true);
  };

  const imgSrc = showBack && product.back ? product.back : `/images/${product.id}.webp`;

  return (
    <Dialog title="Collection preview" onClose={onClose} className="product-dialog">
      <div className="product-preview">
        <img
          src={imgSrc}
          className={showBack && !product.back ? 'preview-zoom' : ''}
          alt={showBack ? `${product.name} alternate supplied view` : `${product.name} ${product.title}`}
        />
        <button className="image-switch" onClick={() => setShowBack(!showBack)}>
          {showBack
            ? 'View front'
            : product.back
            ? 'Explore supplied back view'
            : 'Zoom fabric & print'}{' '}
          <ArrowRight size={15} />
        </button>
      </div>

      <div className="product-information">
        <p className="eyebrow">
          {product.group === 'roots' ? 'THE ROOTS COLLECTION / 001' : 'OTHER DESIGNS / DESIGN ARCHIVE'}
        </p>
        <h2>{product.title}</h2>
        <p className="product-price">
          Price on enquiry <span>Availability on WhatsApp</span>
        </p>
        <p className="description">{product.description}</p>

        <p className="field-label">
          {product.group === 'roots' ? 'COLOR' : 'DESIGN'} — {product.name.toUpperCase()}
        </p>
        <div className="swatches">
          {swatches.map((w) => (
            <button
              key={w.id}
              className={product.id === w.id ? 'active' : ''}
              style={{ ['--swatch' as any]: w.color }}
              aria-label={w.name}
              aria-pressed={product.id === w.id}
              onClick={() => {
                setProduct(w);
                setShowBack(false);
                setAdded(false);
              }}
            />
          ))}
        </div>

        <div className="size-title">
          <p className="field-label">SELECT SIZE</p>
          <button className="text-button" onClick={() => setShowFitGuide(!showFitGuide)}>
            Fit guide
          </button>
        </div>

        {showFitGuide && (
          <p className="fit-guide">
            Oversized, drop-shoulder fit. Choose your usual size for a relaxed look. S–XXL are
            request options; confirm measurements and stock on WhatsApp.
          </p>
        )}

        <div className="sizes">
          {AVAILABLE_SIZES.map((sz) => (
            <button
              key={sz}
              className={sz === selectedSize ? 'selected' : ''}
              aria-pressed={sz === selectedSize}
              onClick={() => handleSelectSize(sz)}
            >
              {sz}
            </button>
          ))}
        </div>

        <button
          className="solid-button"
          disabled={!selectedSize}
          onClick={handleAdd}
        >
          {added ? 'Added to your bag ✓' : selectedSize ? 'Add to bag' : 'Select a size'}{' '}
          <ShoppingBag size={17} />
        </button>

        {added && onOpenBag && (
          <button
            type="button"
            className="text-button"
            style={{ marginTop: '12px', fontSize: '10px', textDecoration: 'underline', display: 'block' }}
            onClick={() => {
              onClose();
              onOpenBag();
            }}
          >
            View bag & checkout →
          </button>
        )}

        <p className="preview-note" aria-live="polite">
          Send your selected design, size and quantity on WhatsApp. Pricing and availability are confirmed before payment.
        </p>
      </div>
    </Dialog>
  );
};
