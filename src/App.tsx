import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  type Product,
  type BagItem,
  type ShirtSize,
  ROOTS_COLLECTION,
  ALL_PRODUCTS,
  LOOKBOOK_ITEMS,
  NAV_LINKS,
  STORE_INFO,
} from './lib/catalog';
import { ProductDialog } from './components/ProductDialog';
import { BagDialog } from './components/BagDialog';
import { MenuDialog } from './components/MenuDialog';
import { CampaignDialog } from './components/CampaignDialog';
import { EditorialDialog } from './components/EditorialDialog';
import { ContactDialog } from './components/ContactDialog';
import { DesignArchive } from './components/DesignArchive';
import {
  ShoppingBag,
  Menu,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  Play,
  Pause,
  Plus,
} from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bagOpen, setBagOpen] = useState<boolean>(false);
  const [campaignOpen, setCampaignOpen] = useState<boolean>(false);
  const [lookbookIndex, setLookbookIndex] = useState<number | null>(null);
  const [contactOpen, setContactOpen] = useState<boolean>(false);
  const [videoPaused, setVideoPaused] = useState<boolean>(false);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState<boolean>(false);

  // Bag state initialized from localStorage
  const [bagItems, setBagItems] = useState<BagItem[]>(() => {
    try {
      const saved = localStorage.getItem('eg-preview-bag');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item: any) =>
            ALL_PRODUCTS.some((p) => p.id === item.id) &&
            ['S', 'M', 'L', 'XL', 'XXL'].includes(item.size) &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0 &&
            item.quantity <= 99
        );
      }
      return [];
    } catch {
      return [];
    }
  });

  // Cursor state
  const [cursor, setCursor] = useState<{ x: number; y: number; active: boolean }>({
    x: -100,
    y: -100,
    active: false,
  });

  // Scroll state
  const [scrollY, setScrollY] = useState<number>(0);

  const heroRef = useRef<HTMLElement>(null);
  const lookbookTrackRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const heroParallaxY = `${Math.min(120, scrollY * 0.2)}px`;

  const totalBagCount = bagItems.reduce((acc, curr) => acc + curr.quantity, 0);

  // Sync bag to localStorage
  useEffect(() => {
    localStorage.setItem('eg-preview-bag', JSON.stringify(bagItems));
  }, [bagItems]);

  // Handle scroll listener & loader dismiss
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 900);
    const onScroll = () => {
      setScrollY(window.scrollY);
      setScrolled(window.scrollY > 60);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Handle video autoplay
  useEffect(() => {
    if (!videoRef.current) return;
    if (videoPaused) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => setVideoPaused(true));
    }
  }, [videoPaused]);

  // Bag mutations
  const handleAddToBag = useCallback((product: Product, size: ShirtSize) => {
    setBagItems((prev) => {
      const match = prev.find((item) => item.id === product.id && item.size === size);
      if (match) {
        return prev.map((item) =>
          item === match ? { ...item, quantity: Math.min(99, item.quantity + 1) } : item
        );
      }
      return [...prev, { id: product.id, size, quantity: 1 }];
    });
  }, []);

  const handleUpdateBag = useCallback((id: string, size: ShirtSize, quantity: number) => {
    setBagItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => !(item.id === id && item.size === size));
      }
      return prev.map((item) =>
        item.id === id && item.size === size ? { ...item, quantity: Math.min(99, quantity) } : item
      );
    });
  }, []);

  return (
    <div
      className="esteem-site"
      onMouseMove={(e) => setCursor((c) => ({ ...c, x: e.clientX, y: e.clientY }))}
    >
      <a className="skip-link" href="#collection">
        Skip to collection
      </a>

      {/* Initial Loader */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.55 } }}
            aria-hidden="true"
          >
            <img src="/images/eg-logo.png" alt="" />
            <span>WEAR YOUR VISION</span>
            <div className="loader-line" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className={scrolled ? 'site-header scrolled' : 'site-header'}>
        <a href="#top" className="brand" aria-label="Esteem Gallery home">
          <img src="/images/eg-logo.png" alt="" />
          <span>
            ESTEEM
            <span>GALLERY</span>
          </span>
        </a>

        <nav aria-label="Main navigation" className="desktop-nav">
          {NAV_LINKS.map(([label, href]) => (
            <a key={label} href={href}>
              {label}
            </a>
          ))}
        </nav>

        <div className="header-right">
          <span className="header-note">STREETWEAR / LIFESTYLE</span>
          <button
            className="bag-button"
            onClick={() => setBagOpen(true)}
            aria-label={`Open bag, ${totalBagCount} items`}
          >
            <ShoppingBag size={19} strokeWidth={1.4} />
            <span>Bag</span>
            <span className="bag-count">{totalBagCount.toString().padStart(2, '0')}</span>
          </button>
          <button
            className="mobile-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={23} />
          </button>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="hero" id="top" ref={heroRef} aria-label="Esteem Gallery new collection">
          <img
            className="hero-image"
            src="/images/hero.webp"
            alt="Model wearing the Esteem Gallery Washed Black distressed drop-shoulder tee in a concrete urban setting"
            fetchPriority="high"
            style={{ transform: `translateY(${heroParallaxY})` }}
          />
          <div className="hero-shade" />

          <div className="hero-topline">
            <span>STREETWEAR FROM HARARE, ZIMBABWE.</span>
            <span>VOL. 001 — THE ROOTS COLLECTION</span>
          </div>

          <div className="hero-content">
            <motion.p
              className="eyebrow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <span className="status-dot" /> NEW PERSPECTIVES. SAME ROOTS.
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              ESTEEM{' '}
              <br />
              GALLERY
              <svg
                className="hero-star"
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="#c6b8a3"
                style={{ display: 'inline-block', verticalAlign: 'top', transform: 'translate(13px, 8px)' }}
                aria-hidden="true"
              >
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
              </svg>
            </motion.h1>

            <motion.div
              className="hero-tagline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <span>Wear Your Vision.</span>
              <p>
                More than what you wear.
                <br />
                A reflection of who you are.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <a href="#collection" className="magnetic hero-cta">
                Shop the collection <ArrowRight size={20} />
              </a>
            </motion.div>
          </div>

          <div className="hero-campaign">
            <button
              onClick={() => setCampaignOpen(true)}
              className="play-circle"
              aria-label="Watch the editorial motion study"
            >
              <Play size={19} fill="currentColor" />
            </button>
            <span>
              THE STREETS ARE
              <br />
              OUR GALLERY.
            </span>
          </div>

          <div className="hero-bottom">
            <a href="#collection">
              <ArrowDown size={16} /> SCROLL TO EXPLORE
            </a>
            <div className="hero-bottom-middle">
              <span>ART</span>
              <i />
              <span>CULTURE</span>
              <i />
              <span>LIFESTYLE</span>
            </div>
            <span className="hero-pagination">
              <b>01</b>
              <span />
              05
            </span>
          </div>
        </section>

        {/* MANIFESTO MARQUEE STRIP */}
        <div className="manifesto-strip">
          <span>BUILT FROM THE STREETS.</span>
          <span className="strip-star">✦</span>
          <span>MADE FOR YOUR VISION.</span>
          <span className="strip-star">✦</span>
          <span>EST. 2025</span>
          <span className="strip-star">✦</span>
          <span>NO LIMITS. JUST EXPRESSION.</span>
        </div>

        {/* 01 / THE ROOTS COLLECTION */}
        <section className="collection section-pad" id="collection">
          <motion.div
            className="section-head"
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div>
              <p className="eyebrow">01 / THE ROOTS COLLECTION</p>
              <h2>
                EVERYDAY FORM.
                <br />
                <span>UNCOMMON ATTITUDE.</span>
              </h2>
            </div>
            <div className="section-head-right">
              <p>
                One signature silhouette. Five perspectives.
                <br />
                Vintage-washed oversized tees. Intentionally distressed.
              </p>
              <a href="#products">
                Explore all colorways <ArrowRight size={17} />
              </a>
            </div>
          </motion.div>

          <div className="product-grid" id="products">
            {ROOTS_COLLECTION.map((product, idx) => (
              <motion.div
                key={product.id}
                className={`product-card card-${idx}`}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ duration: 0.8, delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  className={`product-image-button ${product.back ? 'has-back' : 'zoom-only'}`}
                  aria-label={`View ${product.name} Signature Distressed Tee`}
                  onClick={() => setSelectedProduct(product)}
                  onMouseEnter={() => setCursor((c) => ({ ...c, active: true }))}
                  onMouseLeave={() => setCursor((c) => ({ ...c, active: false }))}
                >
                  <span className="product-tag">
                    {idx === 0 ? 'SIGNATURE PIECE' : `COLORWAY 0${idx + 1}`}
                  </span>
                  <img
                    className="product-front"
                    loading="lazy"
                    src={`/images/${product.id}.webp`}
                    alt={`${product.name} distressed tee front`}
                  />
                  {product.back && (
                    <img
                      className="product-back"
                      loading="lazy"
                      src={product.back}
                      alt={`${product.name} supplied back view`}
                    />
                  )}
                  <span className="product-add">
                    <Plus size={19} />
                  </span>
                  <span className="image-caption">
                    {product.back ? 'FRONT / BACK' : 'HOVER TO EXPLORE'}
                  </span>
                </button>

                <div className="product-card-info">
                  <button onClick={() => setSelectedProduct(product)}>
                    <h3>{product.name}</h3>
                    <p>Signature Distressed Tee</p>
                  </button>
                  <span className="product-color-dot" style={{ background: product.color }} />
                </div>

                <div className="product-card-bottom">
                  <span>RELAXED FIT / S—XXL</span>
                  <span>Price on enquiry</span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="collection-end"
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span>NOT JUST A TEE. A WAY OF SEEING.</span>
            <a href="#story">
              Discover the vision <ArrowDown size={16} />
            </a>
          </motion.div>
        </section>

        {/* 02 / OUR STORY / ETHOS */}
        <section className="ethos" id="story">
          <div className="ethos-copy">
            <span className="floating-star star-one">✦</span>
            <span className="floating-star star-two">✦</span>
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="eyebrow">02 / THE VISION BEHIND THE THREADS</p>
              <h2>
                BIGGER VISION.
                <br />
                <span>SAME ROOTS.</span>
              </h2>
              <p className="script ethos-script">
                More than clothes,
                <br />
                it's a lifestyle.
              </p>
              <p className="ethos-description">
                Born from street culture. Built on individuality.
                <br />
                Esteem Gallery is a Harare-based streetwear label making vintage-washed,
                distressed oversized tees for the ones who wear their story, unapologetically.
              </p>
              <a href="#lookbook" className="magnetic outline-button">
                Step into our world <ArrowRight size={18} />
              </a>

              <div className="ethos-seal">
                <img src="/images/eg-logo.png" alt="Esteem Gallery crown monogram" />
                <span>
                  INDEPENDENT BY DESIGN
                  <br />
                  EST. 2025
                </span>
              </div>
            </motion.div>
          </div>

          <div className="ethos-visual">
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              autoPlay
              poster="/images/hero.webp"
              src="/videos/editorial.mp4"
              aria-label="Slow-moving editorial portrait of the Washed Black tee"
            />
            <div className="ethos-visual-shade" />
            <span className="video-top">THE ROOTS / EDITORIAL MOTION STUDY</span>
            <div className="video-bottom">
              <span>
                RAW EXPRESSION.
                <br />
                REAL PERSPECTIVE.
              </span>
              <button
                onClick={() => setVideoPaused(!videoPaused)}
                aria-label={videoPaused ? 'Play editorial' : 'Pause editorial'}
              >
                {videoPaused ? <Play size={18} /> : <Pause size={18} />}
              </button>
            </div>
          </div>
        </section>

        {/* 03 / LOOKBOOK */}
        <section className="lookbook section-pad" id="lookbook">
          <motion.div
            className="section-head"
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div>
              <p className="eyebrow">03 / OUTSIDE THE FRAME</p>
              <h2>
                THE WORLD IS
                <br />
                YOUR <span className="script heading-script">Gallery.</span>
              </h2>
            </div>
            <div className="lookbook-controls">
              <span>A STUDY IN EVERYDAY EXPRESSION</span>
              <div>
                <button
                  aria-label="Previous lookbook images"
                  onClick={() => lookbookTrackRef.current?.scrollBy({ left: -450, behavior: 'smooth' })}
                >
                  <ArrowLeft size={19} />
                </button>
                <button
                  aria-label="Next lookbook images"
                  onClick={() => lookbookTrackRef.current?.scrollBy({ left: 450, behavior: 'smooth' })}
                >
                  <ArrowRight size={19} />
                </button>
              </div>
            </div>
          </motion.div>

          <div className="lookbook-track" ref={lookbookTrackRef}>
            {LOOKBOOK_ITEMS.map((item, idx) => (
              <button
                key={item.image}
                className="editorial-card"
                onClick={() => setLookbookIndex(idx)}
                aria-label={`Open lookbook: ${item.title}`}
              >
                <div className="editorial-image">
                  <img
                    loading="lazy"
                    src={`/images/${item.image}-final.webp`}
                    alt={`Esteem Gallery oversized tee urban editorial — ${item.title}`}
                  />
                  <span className="editorial-arrow">
                    <ArrowRight size={22} />
                  </span>
                </div>
                <div className="editorial-caption">
                  <span>{item.title}</span>
                  <small>{item.number} / 04</small>
                </div>
              </button>
            ))}
          </div>

          <div className="lookbook-bottom">
            <span>THE ROOTS COLLECTION — EDITORIAL 001</span>
            <span>
              SCROLL. EXPLORE. FIND YOUR PERSPECTIVE. <ArrowRight size={16} />
            </span>
          </div>
        </section>

        {/* 04 / BEYOND THE ROOTS (Design Archive & Identity Lab) */}
        <DesignArchive onSelectProduct={setSelectedProduct} />

        {/* NEWSLETTER PREVIEW */}
        <section className="newsletter section-pad">
          <motion.div
            className="newsletter-inner"
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div>
              <p className="eyebrow">THE NEXT CHAPTER STARTS WITH YOU.</p>
              <h2>
                JOIN THE <span className="script">movement.</span>
              </h2>
              <p>New drops. Fresh perspectives. No noise.</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setNewsletterSubscribed(true);
              }}
            >
              <label className="sr-only" htmlFor="email">
                Email address
              </label>
              <div className="email-field">
                <input
                  required
                  type="email"
                  id="email"
                  aria-label="Email address"
                  placeholder="Your email address"
                  autoComplete="email"
                  onChange={() => setNewsletterSubscribed(false)}
                />
                <button aria-label="Preview newsletter signup" type="submit">
                  <ArrowRight size={24} />
                </button>
              </div>
              <p className="newsletter-note" aria-live="polite">
                {newsletterSubscribed
                  ? 'You’re early. Newsletter signup will open at launch — no email has been submitted.'
                  : 'Preview only. Newsletter signup opens with our first drop.'}
              </p>
            </form>
          </motion.div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer section-pad">
        <div className="footer-main">
          <a className="footer-brand" href="#top">
            <img src="/images/eg-logo.png" alt="Esteem Gallery" />
            <p>STREETWEAR / LIFESTYLE / YOU</p>
          </a>

          <div className="footer-links">
            <div>
              <span>EXPLORE</span>
              {NAV_LINKS.slice(1).map(([label, href]) => (
                <a key={label} href={href}>
                  {label}
                </a>
              ))}
            </div>
            <div>
              <span>CONNECT</span>
              <a href={STORE_INFO.instagram} target="_blank" rel="noopener noreferrer">
                Instagram <ArrowRight size={14} />
              </a>
              <a href={STORE_INFO.tiktok} target="_blank" rel="noopener noreferrer">
                TikTok <ArrowRight size={14} />
              </a>
              <a href={STORE_INFO.whatsappUrl} target="_blank" rel="noopener noreferrer">
                WhatsApp <ArrowRight size={14} />
              </a>
              <button onClick={() => setContactOpen(true)}>
                Contact <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="footer-contact" id="contact">
            <span className="eyebrow">PRIMARY LOCATION</span>
            <h3>{STORE_INFO.location}.</h3>
            <p>WhatsApp & calls</p>
            <a href={`tel:${STORE_INFO.phone}`}>{STORE_INFO.phoneFormatted}</a>
            <button onClick={() => setContactOpen(true)}>
              Get in touch <ArrowRight size={14} />
            </button>
          </div>

          <div className="footer-quote">
            <span className="script">Wear Your Vision.</span>
            <p>
              INDEPENDENT SPIRIT.
              <br />
              TIMELESS EXPRESSION.
            </p>
            <span className="est-badge">✦ EST. {STORE_INFO.established}</span>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} ESTEEM GALLERY</span>
          <span>BIGGER VISION. SAME ROOTS.</span>
          <a href="#top">
            BACK TO TOP <ArrowRight size={15} />
          </a>
        </div>
      </footer>

      {/* Custom Floating Cursor Label */}
      <div
        className={`custom-cursor ${cursor.active ? 'active' : ''}`}
        style={{ left: cursor.x, top: cursor.y }}
        aria-hidden="true"
      >
        {cursor.active ? 'VIEW' : ''}
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDialog
            initial={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAdd={handleAddToBag}
            onOpenBag={() => {
              setSelectedProduct(null);
              setBagOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bagOpen && (
          <BagDialog
            items={bagItems}
            onClose={() => setBagOpen(false)}
            onUpdate={handleUpdateBag}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && <MenuDialog onClose={() => setMenuOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {campaignOpen && <CampaignDialog onClose={() => setCampaignOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {lookbookIndex !== null && (
          <EditorialDialog
            index={lookbookIndex}
            onClose={() => setLookbookIndex(null)}
            onNavigate={(newIdx) => setLookbookIndex(newIdx)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contactOpen && <ContactDialog onClose={() => setContactOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
