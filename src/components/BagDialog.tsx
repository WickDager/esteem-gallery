import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from './Dialog';
import { type BagItem, type ShirtSize, findProductById } from '../lib/catalog';
import { ShoppingBag, ArrowRight, Plus, Minus } from 'lucide-react';

interface BagDialogProps {
  items: BagItem[];
  onClose: () => void;
  onUpdate: (id: string, size: ShirtSize, quantity: number) => void;
}

interface PreparedOrderResult {
  reference: string;
  whatsappUrl: string;
  message: string;
  totalQuantity: number;
}

export const BagDialog: React.FC<BagDialogProps> = ({ items, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<PreparedOrderResult | null>(null);
  const [copied, setCopied] = useState(false);

  const serializedItems = JSON.stringify(items);
  const prevItemsRef = useRef(serializedItems);

  useEffect(() => {
    if (prevItemsRef.current !== serializedItems) {
      prevItemsRef.current = serializedItems;
      setOrderResult(null);
      setError(null);
      setCopied(false);
    }
  }, [serializedItems]);

  const totalQuantity = items.reduce((acc, curr) => acc + curr.quantity, 0);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    // Attempt popup for desktop, but if blocked or mobile, fallback cleanly
    let popupWindow: Window | null = null;
    try {
      popupWindow = window.open('about:blank', '_blank');
      if (popupWindow) popupWindow.opener = null;
    } catch {
      popupWindow = null;
    }

    try {
      const res = await fetch('/api/orders/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to prepare order request');
      }

      const data: PreparedOrderResult = await res.json();
      setOrderResult(data);

      if (popupWindow && !popupWindow.closed) {
        popupWindow.location.href = data.whatsappUrl;
      } else if (data.whatsappUrl) {
        // Fallback for mobile / popup blocked: direct navigation to wa.me
        window.location.href = data.whatsappUrl;
      }
    } catch (err) {
      if (popupWindow && !popupWindow.closed) popupWindow.close();
      setError(err instanceof Error ? err.message : 'Could not prepare request.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = async () => {
    if (!orderResult?.message) return;
    try {
      await navigator.clipboard.writeText(orderResult.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
    }
  };

  const handleExplore = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    document.body.style.overflow = '';
    onClose();
    setTimeout(() => {
      document.body.style.overflow = '';
      const el = document.getElementById('collection') || document.getElementById('products');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.location.hash = 'collection';
      }
    }, 60);
    setTimeout(() => {
      const el = document.getElementById('collection') || document.getElementById('products');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 320);
  };

  return (
    <Dialog title="Your bag" onClose={onClose} className="bag-dialog">
      <p className="eyebrow">A VISION WORTH KEEPING</p>
      <h2>
        Your bag <span>({totalQuantity})</span>
      </h2>

      <div className="bag-items">
        {items.length > 0 ? (
          items.map((item) => {
            const product = findProductById(item.id);
            if (!product) return null;

            return (
              <div className="bag-item" key={item.id + item.size}>
                <img src={`/images/${product.id}.webp`} alt={`${product.name} tee`} />
                <div>
                  <h3>{product.name}</h3>
                  <p>
                    {product.title} · {item.size}
                  </p>
                  <span className="coming">Price on enquiry</span>
                  <div className="quantity">
                    <button
                      aria-label={`Decrease ${product.name} quantity`}
                      onClick={() => onUpdate(item.id, item.size, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      aria-label={`Increase ${product.name} quantity`}
                      onClick={() => onUpdate(item.id, item.size, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      className="remove"
                      onClick={() => onUpdate(item.id, item.size, 0)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-bag">
            <ShoppingBag size={38} strokeWidth={1} />
            <h3>Your vision starts here.</h3>
            <p>Explore the collection and save your favorite colorways.</p>
            <button
              type="button"
              className="solid-button"
              onClick={handleExplore}
              aria-label="Explore the collection"
            >
              Explore the collection <ArrowRight size={17} />
            </button>
          </div>
        )}
      </div>

      <p className="bag-notice">
        Checkout creates a saved request, then opens WhatsApp with your items. Tap Send there to contact us. No payment is taken; stock, price and delivery are confirmed in chat. Harare, Zimbabwe.
      </p>

      {items.length > 0 && (
        <div className="checkout-panel">
          {orderResult ? (
            <>
              <p className="request-ready" role="note">
                Request saved: <strong>{orderResult.reference}</strong>
                <br />
                WhatsApp send status is not tracked. Please tap Send in WhatsApp.
              </p>

              <a
                className="solid-button whatsapp-checkout"
                href={orderResult.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open WhatsApp to send <ArrowRight size={17} />
              </a>

              <details className="request-message" open>
                <summary>View / copy your message</summary>
                <pre>{orderResult.message}</pre>
                <button className="text-button" onClick={handleCopyMessage}>
                  {copied ? 'Message copied!' : 'Copy message'}
                </button>
              </details>
            </>
          ) : (
            <button
              className="solid-button whatsapp-checkout"
              disabled={loading}
              onClick={handleCheckout}
            >
              {loading ? 'Preparing your request…' : 'Checkout on WhatsApp'}{' '}
              <ArrowRight size={17} />
            </button>
          )}

          {error && (
            <p className="checkout-error" role="alert">
              Could not prepare your request. {error} Your bag is still saved. Please try again.
            </p>
          )}

          <button className="keep-exploring" onClick={handleExplore}>
            Keep exploring
          </button>
        </div>
      )}
    </Dialog>
  );
};
