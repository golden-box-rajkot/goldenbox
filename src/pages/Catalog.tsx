import { useState, useEffect } from 'react';
import { Category, Product } from '../types';
import ProductSheet from '../components/ProductSheet';

export default function Catalog() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [view, setView] = useState<'landing' | 'catalog'>('landing');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch('/api/catalog');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch catalog');
        
        setCategories(data.categories || []);
        setProducts(data.products || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Filter active only
  const activeCategories = categories.sort((a, b) => a.displayOrder - b.displayOrder);
  const activeProducts = products;

  if (loading) {
    return (
      <main className="flex-grow flex flex-col relative bg-background overflow-hidden items-center justify-center">
         <p className="font-label text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Loading Collection...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-grow flex flex-col relative bg-background overflow-hidden items-center justify-center p-6 text-center">
         <p className="font-label text-[10px] tracking-[0.2em] uppercase text-red-500 mb-2">Connection Error</p>
         <p className="font-body text-sm text-foreground">{error}</p>
      </main>
    );
  }

  const handleCategoryClick = (id: string) => {
    setActiveCategoryId(id);
    setView('catalog');
  };

  const handleBackToLanding = () => {
    setView('landing');
  };

  return (
    <main className="flex-grow flex flex-col relative bg-background text-foreground overflow-hidden">
      {view === 'landing' ? (
        <div className="flex-grow flex flex-col overflow-y-auto hidden-scrollbar pb-32">
          {/* Brand Header */}
          <div className="px-6 pt-8 pb-6 shrink-0 border-b border-border">
            <h1 className="font-display text-4xl uppercase leading-[0.9] text-foreground">
              Golden<br />Box
            </h1>
            <p className="font-body text-sm mt-4 text-foreground leading-relaxed max-w-[280px]">
              A curated collection of exceptional products.
            </p>
          </div>
          
          <div className="p-6">
            {activeCategories.length === 0 ? (
              <div className="flex items-center justify-center text-center mt-12">
                <p className="font-label text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                  Collection is currently empty
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                {activeCategories.map(category => (
                  <div 
                    key={category.id} 
                    className="flex flex-col cursor-pointer group"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <div className="aspect-square bg-muted border border-border mb-3 overflow-hidden relative">
                      {category.image ? (
                        <img src={category.image} alt={category.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-label text-[8px] text-muted-foreground uppercase tracking-widest text-center px-1 leading-relaxed">No Image</div>
                      )}
                    </div>
                    <h3 className="font-label text-[10px] font-bold tracking-[0.2em] uppercase text-center group-hover:underline decoration-1 underline-offset-2 break-words text-foreground">
                      {category.name}
                    </h3>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col overflow-hidden">
          {/* Back Button Header */}
          <div className="shrink-0 border-b border-border">
            <button 
              onClick={handleBackToLanding}
              className="w-full flex items-center gap-2 p-4 font-label text-[9px] font-bold tracking-[0.2em] uppercase text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              ← BACK TO CATEGORIES
            </button>
          </div>

          <div className="flex-grow flex overflow-hidden">
            {/* Left Sidebar */}
            <nav className="w-24 shrink-0 border-r border-border overflow-y-auto hidden-scrollbar bg-background flex flex-col">
              {activeCategories.length > 0 && activeCategories.map(category => (
                <button 
                  key={category.id} 
                  onClick={() => setActiveCategoryId(category.id)}
                  className={`p-3 flex flex-col items-center justify-center min-h-[80px] gap-3 border-b border-border transition-colors cursor-pointer ${
                    activeCategoryId === category.id ? 'bg-foreground text-accent-foreground' : 'bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  {category.image ? (
                    <div className={`w-8 h-8 shrink-0 bg-muted border ${activeCategoryId === category.id ? 'border-accent-foreground' : 'border-border'}`}>
                      <img src={category.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={`w-8 h-8 shrink-0 bg-muted border ${activeCategoryId === category.id ? 'border-accent-foreground' : 'border-border'}`} />
                  )}
                  <span className="font-label text-[9px] uppercase tracking-widest text-center leading-tight break-words w-full">
                    {category.name}
                  </span>
                </button>
              ))}
            </nav>

            {/* Right Panel */}
            <div className="flex-1 overflow-y-auto p-5 scroll-smooth relative">
              {(() => {
                const selectedCategory = activeCategories.find(c => c.id === activeCategoryId);
                if (!selectedCategory) return null;
                
                const categoryProducts = activeProducts.filter(p => p.categoryId === selectedCategory.id);

                return (
                  <div className="pb-32">
                    <h2 className="font-label text-xs font-bold tracking-[0.2em] uppercase mb-6 pb-2 border-b border-border text-foreground">
                      {selectedCategory.name}
                    </h2>
                    
                    {categoryProducts.length === 0 ? (
                      <div className="flex items-center justify-center text-center mt-12">
                        <p className="font-label text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                          No products available in this category
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                        {categoryProducts.map(product => (
                          <div key={product.id} className="cursor-pointer group flex flex-col" onClick={() => setSelectedProduct(product)}>
                            <div className="aspect-square bg-muted border border-border mb-3 overflow-hidden relative">
                              {product.images && product.images.length > 0 ? (
                                <img src={product.images[0].url} alt={product.name} className="w-full h-full object-contain p-2" />
                              ) : product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-contain p-2" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-label text-[8px] text-muted-foreground uppercase tracking-widest text-center px-1 leading-relaxed">No Image</div>
                              )}
                            </div>
                            <h3 className="font-body font-bold text-sm leading-tight group-hover:underline decoration-1 underline-offset-2 truncate text-foreground">
                              {product.name}
                            </h3>
                            <p className="font-body text-xs text-muted-foreground line-clamp-1 leading-relaxed mt-1">
                              {product.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      
      <ProductSheet product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </main>
  );
}
