import React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [status, setStatus] = useState('Active');
  const [displayOrder, setDisplayOrder] = useState('0');
  
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/categories');
      if (res.status === 401) {
        navigate('/admin');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setName('');
    setImage('');
    setStatus('Active');
    setDisplayOrder('0');
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (category: any) => {
    setEditingId(category.id);
    setName(category.name);
    setImage(category.image);
    setStatus(category.status);
    setDisplayOrder(category.displayOrder.toString());
    setFormError('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Category Name is required');
      return;
    }
    
    setFormLoading(true);
    setFormError('');
    
    try {
      const payload = {
        name,
        image,
        status,
        displayOrder: parseInt(displayOrder, 10) || 0
      };

      const url = editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save category');
      
      await fetchCategories();
      closeForm();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-grow flex flex-col relative bg-background text-foreground items-center justify-center p-6">
        <p className="font-label text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Loading Categories...</p>
      </main>
    );
  }

  return (
    <main className="flex-grow flex flex-col p-6 relative bg-background text-foreground max-w-4xl mx-auto w-full">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <Link to="/admin/dashboard" className="font-label text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground mb-4 inline-block">&larr; Back to Dashboard</Link>
          <h1 className="font-display text-3xl uppercase tracking-tight mb-2 text-foreground">Categories</h1>
          <p className="font-label text-[10px] uppercase tracking-widest text-muted-foreground">Total: {categories.length}</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={openAddForm} 
            className="bg-foreground text-accent-foreground px-6 py-3 font-label text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors border border-border rounded-none cursor-pointer"
          >
            + Add Category
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
            <h2 className="font-display text-xl uppercase tracking-tight text-foreground">{editingId ? 'Edit Category' : 'Add Category'}</h2>
            <button onClick={closeForm} className="font-label text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground cursor-pointer">Cancel</button>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label text-[10px] font-bold tracking-[0.2em] uppercase text-foreground">Category Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="border-b border-border py-2 font-body text-sm outline-none focus:border-b-2 focus:border-border transition-all bg-transparent rounded-none text-foreground" placeholder="e.g. Living Room" />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="font-label text-[10px] font-bold tracking-[0.2em] uppercase text-foreground">Image URL</label>
              <input type="url" value={image} onChange={e => setImage(e.target.value)} className="border-b border-border py-2 font-body text-sm outline-none focus:border-b-2 focus:border-border transition-all bg-transparent rounded-none text-foreground" placeholder="https://..." />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-label text-[10px] font-bold tracking-[0.2em] uppercase text-foreground">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="border-b border-border py-2 font-body text-sm outline-none focus:border-b-2 focus:border-border transition-all bg-transparent rounded-none text-foreground">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-label text-[10px] font-bold tracking-[0.2em] uppercase text-foreground">Display Order</label>
                <input type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} className="border-b border-border py-2 font-body text-sm outline-none focus:border-b-2 focus:border-border transition-all bg-transparent rounded-none text-foreground" />
              </div>
            </div>

            {formError && <p className="font-label text-xs text-red-500 mt-2">{formError}</p>}

            <button type="submit" disabled={formLoading} className="mt-4 bg-foreground text-accent-foreground px-8 py-4 font-label text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors w-full disabled:opacity-50 border border-border rounded-none cursor-pointer">
              {formLoading ? 'Saving...' : (editingId ? 'Update Category' : 'Save Category')}
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {categories.length === 0 ? (
            <div className="border border-border p-8 text-center bg-muted">
              <p className="font-label text-[10px] tracking-[0.2em] uppercase text-muted-foreground">No categories found.</p>
            </div>
          ) : (
            categories.map(category => (
              <div key={category.id} className="border border-border p-4 flex justify-between items-center bg-background hover:bg-muted transition-colors">
                <div className="flex items-center gap-4">
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="w-12 h-12 object-cover bg-muted border border-border-light" />
                  ) : (
                    <div className="w-12 h-12 bg-muted border border-border-light flex items-center justify-center">
                      <span className="font-label text-[8px] text-muted-foreground">NO IMG</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-display text-lg text-foreground">{category.name}</h3>
                    <div className="flex gap-3 mt-1">
                      <span className={`font-label text-[9px] uppercase tracking-widest ${category.status.toLowerCase() === 'active' ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                        {category.status}
                      </span>
                      <span className="font-label text-[9px] uppercase tracking-widest text-muted-foreground">
                        Order: {category.displayOrder}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => openEditForm(category)}
                  className="font-label text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-2 border border-border hover:bg-foreground hover:text-accent-foreground transition-colors text-foreground rounded-none cursor-pointer"
                >
                  Edit
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
