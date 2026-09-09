import React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductImage } from '../../types';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [status, setStatus] = useState('Active');
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories')
      ]);

      if (prodRes.status === 401 || catRes.status === 401) {
        navigate('/admin');
        return;
      }
      
      if (!prodRes.ok) throw new Error('Failed to fetch products');
      if (!catRes.ok) throw new Error('Failed to fetch categories');
      
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      
      setProducts(prodData.products || []);
      setCategories(catData.categories || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setName('');
    setCategoryId(categories.filter(c => c.status.toLowerCase() === 'active')[0]?.id || '');
    setDescription('');
    setImage('');
    setStatus('Active');
    setCustomFields([]);
    setImages([]);
    setImages([]);
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (product: any) => {
    setEditingId(product.id);
    setName(product.name);
    setCategoryId(product.categoryId);
    setDescription(product.description);
    setImage(product.image);
    setStatus(product.status);
    setCustomFields(product.customFields || []);
    setImages(product.images || []);
    setImages(product.images || []);
    setFormError('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Product Name is required');
      return;
    }
    if (!categoryId.trim()) {
      setFormError('Category is required');
      return;
    }
    
    setFormLoading(true);
    setFormError('');
    
    try {
      const payload = {
        name,
        categoryId,
        description,
        image,
        status,
        customFields
      };

      const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');
      
      await fetchData();
      closeForm();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setFormLoading(false);
    }
  };

  const activeCategories = categories.filter(c => c.status.toLowerCase() === 'active');
  const activeProductsCount = products.filter(p => p.status.toLowerCase() === 'active').length;

  if (loading) {
    return (
      <main className="flex-grow flex flex-col relative bg-background text-foreground items-center justify-center p-6">
        <p className="font-label text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Loading Products...</p>
      </main>
    );
  }

  return (
    <main className="flex-grow flex flex-col p-6 relative bg-background text-foreground max-w-4xl mx-auto w-full">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <Link to="/admin/dashboard" className="font-label text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground mb-4 inline-block">&larr; Back to Dashboard</Link>
          <h1 className="font-display text-3xl uppercase tracking-tight mb-2 text-foreground">Products</h1>
          <p className="font-label text-[10px] uppercase tracking-widest text-muted-foreground">Total: {products.length} / Active: {activeProductsCount}</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={openAddForm} 
            className="bg-foreground text-accent-foreground px-6 py-3 font-label text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors border border-border rounded-none cursor-pointer"
          >
            + Add Product
          </button>
        )}
      </div>

      {error && (
        <div className="border border-red-500 p-4 mb-6">
          <p className="font-label text-xs text-red-500">{error}</p>
        </div>
      )}

      {isFormOpen ? (
        <div className="border border-border p-6 bg-muted">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-xl uppercase tracking-tight text-foreground">{editingId ? 'Edit Product' : 'Add Product'}</h2>
            <button onClick={closeForm} className="font-label text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground cursor-pointer">Cancel</button>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label text-[10px] font-bold tracking-[0.2em] uppercase text-foreground">Product Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="border-b border-border py-2 font-body text-sm outline-none focus:border-b-2 focus:border-border transition-all bg-transparent rounded-none text-foreground" placeholder="e.g. Ceramic Vase" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label text-[10px] font-bold tracking-[0.2em] uppercase text-foreground">Category *</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required className="border-b border-border py-2 font-body text-sm outline-none focus:border-b-2 focus:border-border transition-all bg-transparent rounded-none text-foreground">
                <option value="" disabled>Select Category</option>
                {activeCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
                {/* Always show the assigned category even if it is currently inactive to prevent breaking edit forms */}
                {editingId && categoryId && !activeCategories.find(c => c.id === categoryId) && categories.find(c => c.id === categoryId) && (
                   <option key={categoryId} value={categoryId}>{categories.find(c => c.id === categoryId)?.name} (Inactive Category)</option>
                )}
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="font-label text-[10px] font-bold tracking-[0.2em] uppercase text-foreground">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="border-b border-border py-2 font-body text-sm outline-none focus:border-b-2 focus:border-border transition-all bg-transparent rounded-none resize-none h-24 text-foreground" placeholder="Description..."></textarea>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label text-[10px] font-bold tracking-[0.2em] uppercase text-foreground">Image URL</label>
              <input type="url" value={image} onChange={e => setImage(e.target.value)} className="border-b border-border py-2 font-body text-sm outline-none focus:border-b-2 focus:border-border transition-all bg-transparent rounded-none text-foreground" placeholder="https://..." />
            </div>

            <div className="flex flex-col gap-4 border-t border-border pt-6">
              <div className="flex justify-between items-center">
                <label className="font-label text-[10px] font-bold tracking-[0.2em] uppercase text-foreground">Product Images</label>
                <button
                  type="button"
                  onClick={() => setImages([...images, { id: crypto.randomUUID(), url: '', displayOrder: images.length + 1 }])}
                  className="font-label text-[10px] font-bold tracking-[0.2em] uppercase text-foreground hover:underline cursor-pointer"
                >
                  + ADD IMAGE
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {images.map((img, index) => (
                  <div key={img.id || index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-background p-4 border border-border-light">
                    <div className="flex-1 w-full">
                      <label className="block font-label text-[8px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Image URL</label>
                      <input
                        type="text"
                        value={img.url}
                        onChange={(e) => {
                          const newImages = [...images];
                          newImages[index].url = e.target.value;
                          setImages(newImages);
                        }}
                        className="w-full border-b border-border rounded-none py-2 font-body text-sm bg-transparent focus:outline-none text-foreground"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="w-24">
                      <label className="block font-label text-[8px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Order</label>
                      <input
                        type="number"
                        value={img.displayOrder}
                        onChange={(e) => {
                          const newImages = [...images];
                          newImages[index].displayOrder = parseInt(e.target.value, 10) || 0;
                          setImages(newImages);
                        }}
                        className="w-full border-b border-border rounded-none py-2 font-body text-sm bg-transparent focus:outline-none text-foreground"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="font-label text-[10px] tracking-widest text-red-500 hover:text-red-700 uppercase mt-6 sm:mt-0 p-2 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-border pt-6">
              <h3 className="font-label text-[10px] font-bold tracking-[0.2em] uppercase text-foreground">Product Information</h3>
              
              <div className="flex flex-col gap-4">
                {customFields.map((field, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="font-label text-[8px] font-bold tracking-[0.2em] uppercase text-muted-foreground">Label</label>
                      <input type="text" value={field.name} onChange={e => {
                        const newFields = [...customFields];
                        newFields[idx].name = e.target.value;
                        setCustomFields(newFields);
                      }} className="border-b border-border py-2 font-body text-sm outline-none focus:border-b-2 focus:border-border transition-all bg-transparent rounded-none text-foreground" placeholder="e.g. Dimensions" required />
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="font-label text-[8px] font-bold tracking-[0.2em] uppercase text-muted-foreground">Value</label>
                      <input type="text" value={field.value} onChange={e => {
                        const newFields = [...customFields];
                        newFields[idx].value = e.target.value;
                        setCustomFields(newFields);
                      }} className="border-b border-border py-2 font-body text-sm outline-none focus:border-b-2 focus:border-border transition-all bg-transparent rounded-none text-foreground" placeholder="e.g. 30 x 20 x 10 cm" required />
                    </div>
                    <button type="button" onClick={() => {
                      const newFields = customFields.filter((_, i) => i !== idx);
                      setCustomFields(newFields);
                    }} className="mt-6 font-label text-[10px] uppercase tracking-widest text-red-500 hover:text-red-700 p-2 shrink-0 cursor-pointer">
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" onClick={() => {
                setCustomFields([...customFields, { name: '', value: '' }]);
              }} className="self-start border border-border px-4 py-2 font-label text-[9px] font-bold tracking-[0.2em] uppercase hover:bg-foreground hover:text-accent-foreground transition-colors text-foreground rounded-none cursor-pointer">
                + Add Information
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label text-[10px] font-bold tracking-[0.2em] uppercase text-foreground">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="border-b border-border py-2 font-body text-sm outline-none focus:border-b-2 focus:border-border transition-all bg-transparent rounded-none text-foreground">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {formError && <p className="font-label text-xs text-red-500 mt-2">{formError}</p>}

            <button type="submit" disabled={formLoading} className="mt-4 bg-foreground text-accent-foreground px-8 py-4 font-label text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors w-full disabled:opacity-50 border border-border rounded-none cursor-pointer">
              {formLoading ? 'Saving...' : (editingId ? 'Update Product' : 'Save Product')}
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {products.length === 0 ? (
            <div className="border border-border p-8 text-center bg-muted">
              <p className="font-label text-[10px] tracking-[0.2em] uppercase text-muted-foreground">No products found.</p>
            </div>
          ) : (
            products.map(product => {
              const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'Unknown Category';
              return (
                <div key={product.id} className="border border-border p-4 flex justify-between items-center bg-background hover:bg-muted transition-colors">
                  <div className="flex items-center gap-4">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-12 h-12 object-cover bg-muted border border-border-light" />
                    ) : (
                      <div className="w-12 h-12 bg-muted border border-border-light flex items-center justify-center">
                        <span className="font-label text-[8px] text-muted-foreground">NO IMG</span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-display text-lg text-foreground">{product.name}</h3>
                      <div className="flex gap-3 mt-1">
                        <span className={`font-label text-[9px] uppercase tracking-widest ${product.status.toLowerCase() === 'active' ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                          {product.status}
                        </span>
                        <span className="font-label text-[9px] uppercase tracking-widest text-muted-foreground">
                          {categoryName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => openEditForm(product)}
                    className="font-label text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-2 border border-border hover:bg-foreground hover:text-accent-foreground transition-colors text-foreground rounded-none cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </main>
  );
}
