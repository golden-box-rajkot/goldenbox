import { createPortal } from 'react-dom';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X } from 'lucide-react';
import { Product } from '../types';

interface ProductSheetProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductSheet({ product, onClose }: ProductSheetProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setActiveImageIndex(0);
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [product?.id]);

  if (!product) return null;
  const images = (product.images && product.images.length > 0) ? product.images.map(img => img.url) : (product.image ? [product.image] : []);
  
  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.clientWidth;
      const index = Math.round(scrollLeft / width);
      setActiveImageIndex(index);
    }
  };

  const whatsappNumber = "9426782765";
  const productUrl = `${window.location.origin}?product=${product.id}`;
  const whatsappMessage = encodeURIComponent(`Hi, I'm interested in ${product.name}.\nLink: ${productUrl}`);

  return (
    typeof document !== 'undefined' ? createPortal(
    <div className="absolute inset-0 pointer-events-auto">
      <AnimatePresence>
      {product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-foreground/40 z-40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 100 || velocity.y > 500) {
                onClose();
              }
            }}
            className="absolute bottom-0 left-0 right-0 h-[85%] bg-background border-t border-border z-50 flex flex-col"
          >
            {/* Drag Handle & Close */}
            <div className="flex justify-between items-center p-4 border-b border-border shrink-0 relative bg-background">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-1 bg-border rounded-none opacity-30"></div>
              </div>
              <div className="w-full flex justify-end">
                <button onClick={onClose} className="p-2 hover:bg-muted text-foreground transition-colors cursor-pointer" aria-label="Close sheet">
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-grow overflow-y-auto p-5 flex flex-col hidden-scrollbar">
              <div className="w-full shrink-0 mb-4 flex flex-col gap-2">
                <div 
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="w-full h-64 bg-muted border border-border relative flex overflow-x-auto snap-x snap-mandatory hidden-scrollbar"
                >
                  {images.length > 0 ? (
                    images.map((img, idx) => (
                      <div key={idx} className="w-full h-full shrink-0 snap-center p-2 flex items-center justify-center">
                        <img src={img} alt={product.name} className="max-w-full max-h-full object-contain" />
                      </div>
                    ))
                  ) : (
                    <div className="w-full h-full shrink-0 snap-center flex items-center justify-center font-label text-[10px] text-muted-foreground uppercase tracking-[0.2em]">No Image</div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex justify-center items-center gap-1.5 h-4">
                    {images.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`w-2 h-1 transition-colors ${activeImageIndex === idx ? 'bg-foreground' : 'bg-muted-foreground/30'}`} 
                      />
                    ))}
                  </div>
                )}
              </div>

              <h2 className="font-display text-3xl uppercase tracking-tight mb-2 text-foreground">{product.name}</h2>
              <p className="font-body text-sm text-foreground/90 leading-relaxed mb-6">{product.description}</p>

              {product.customFields && product.customFields.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-label text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-4 border-b border-border pb-2">Specifications</h3>
                  <div className="flex flex-col gap-2">
                    {product.customFields.map((field, idx) => (
                      <div key={idx} className="flex justify-between items-baseline border-b border-border-light pb-2">
                        <span className="font-label text-[10px] uppercase tracking-widest text-muted-foreground">{field.name}</span>
                        <span className="font-body text-sm font-medium text-right max-w-[60%] text-foreground">{field.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="p-4 border-t border-border bg-background shrink-0">
              <a 
                href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-foreground text-accent-foreground py-4 font-label text-[11px] font-bold tracking-[0.2em] uppercase flex justify-center items-center gap-3 hover:bg-foreground/90 transition-colors border border-border rounded-none"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" /> Order / Enquire
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </div>,
    document.getElementById('sheet-root') || document.body
  ) : null
  );
}
