import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, ChefHat, UtensilsCrossed } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getClientByMenuSlug } from '../admin/clientStore';
import './MenuPage.css';

const demoMenuItems = [
  { id: 'demo-1', name: 'Paneer Tikka', description: 'Smoky paneer with house spices.', price: '₹250', category: 'Starters', type: 'veg', img: 'https://images.unsplash.com/photo-1567158763566-50794ce8b9a1?w=500&q=80' },
  { id: 'demo-2', name: 'Chicken Biryani', description: 'Slow-cooked basmati rice with aromatic spices.', price: '₹350', category: 'Main Course', type: 'non-veg', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80' },
  { id: 'demo-3', name: 'Tandoori Roti', description: 'Freshly baked in the clay oven.', price: '₹30', category: 'Main Course', type: 'veg', img: 'https://images.unsplash.com/photo-1626200419188-3caeb0064a78?w=500&q=80' },
  { id: 'demo-4', name: 'Mojito', description: 'Mint, lime, and sparkling soda.', price: '₹150', category: 'Drinks', type: 'veg', img: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=500&q=80' },
];

function App() {
  const { slug } = useParams();
  const client = slug ? getClientByMenuSlug(slug) : undefined;
  const menuItems = client
    ? (client.menuItems ?? []).filter((item) => item.available).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price ? `₹${Number(item.price).toLocaleString('en-IN')}` : '',
      pricingType: item.pricingType || 'single',
      halfPrice: item.halfPrice ? `₹${Number(item.halfPrice).toLocaleString('en-IN')}` : '',
      fullPrice: item.fullPrice ? `₹${Number(item.fullPrice).toLocaleString('en-IN')}` : '',
      regPrice: item.regPrice ? `₹${Number(item.regPrice).toLocaleString('en-IN')}` : '',
      medPrice: item.medPrice ? `₹${Number(item.medPrice).toLocaleString('en-IN')}` : '',
      largePrice: item.largePrice ? `₹${Number(item.largePrice).toLocaleString('en-IN')}` : '',
      category: item.category,
      type: item.dietType,
      img: item.image,
    }))
    : demoMenuItems.map(item => ({ ...item, pricingType: 'single', halfPrice: '', fullPrice: '', regPrice: '', medPrice: '', largePrice: '' }));
  const categories = ['All', ...new Set(menuItems.map((item) => item.category))];
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = menuItems.filter((item) => {
    const categoryMatch = activeCategory === 'All' ? true : item.category === activeCategory;
    const searchMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });
  const heroImage = client?.heroImage
    || menuItems.find((item) => item.img)?.img
    || 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1600&q=85';

  return (
    <div className="customer-menu">
      <header className="menu-topbar">
        <a className="menu-wordmark" href="#top" aria-label="MenuQR menu">
          <span className="menu-brand-icon"><ChefHat size={19} strokeWidth={2} /></span>
          <span>Menu<span className="menu-brand-accent">QR</span></span>
        </a>
        {client?.city && (
          <span className="menu-location"><MapPin size={14} />{[client.city, client.state].filter(Boolean).join(', ')}</span>
        )}
      </header>

      <main id="top" className="menu-main">
        <motion.section
          className="menu-hero"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          <div className="menu-hero-text">
            <div className="menu-hero-badge">🔥 {client?.category?.replace(/s$/, '') ?? 'HOT & DELICIOUS'}</div>
            <h1>{client?.businessName ?? 'Sharma Dhaba'}</h1>
            <p>{client?.city ? `Made with love in ${client.city}` : 'Satisfy your cravings with our best dishes!'}</p>
            <div className="menu-hero-stats">
              <span className="menu-hero-stat">🍽️ {menuItems.length} Dishes</span>
              <span className="menu-hero-stat">⭐ 4.9 Rated</span>
            </div>
          </div>
          <div className="menu-hero-visual">
            <div className="menu-hero-visual-bg"></div>
            <img className="menu-hero-image-new" src={heroImage} alt="Featured dish" />
          </div>
        </motion.section>

        <section className="menu-controls" aria-label="Find dishes">
          <div className="menu-section-heading">
            <div>
              <span className="menu-eyebrow menu-eyebrow-light">FRESH FROM OUR KITCHEN</span>
              <h2>Explore the menu</h2>
            </div>
            <span className="menu-result-count">{filteredItems.length} {filteredItems.length === 1 ? 'dish' : 'dishes'}</span>
          </div>

          <label className="menu-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Find your favourite dish"
              aria-label="Search menu items"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <div className="menu-categories" role="group" aria-label="Filter by category">
          {categories.map((cat, index) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.045 }}
              onClick={() => setActiveCategory(cat)}
              className={`menu-category ${activeCategory === cat ? 'is-active' : ''}`}
              aria-pressed={activeCategory === cat}
            >
              {cat}
            </motion.button>
          ))}
          </div>
        </section>

        <section className="menu-dishes" aria-label="Menu dishes">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => {
              const actualCategories = categories.filter(c => c !== 'All');
              const catIndex = actualCategories.indexOf(item.category);
              const palette = ['#f24e61', '#ff9f1c', '#2ec4b6', '#8338ec', '#ff006e', '#3a86ff', '#fb5607', '#06d6a0'];
              const itemColor = palette[Math.max(0, catIndex) % palette.length];

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.28 }}
                  className="menu-dish"
                  style={{ '--dish-bg': itemColor } as React.CSSProperties}
                >
                  <div className="menu-dish-info">
                    <div className="menu-dish-rating">
                      ★ 4.8
                    </div>
                    <h3 className="menu-dish-title">{item.name}</h3>
                    {item.description && <p className="menu-dish-description" title={item.description}>{item.description}</p>}
                    
                    {item.pricingType === 'single' && <div className="menu-dish-price-btn">{item.price}</div>}
                    {item.pricingType === 'half-full' && (
                      <div className="menu-dish-price-variants">
                        {item.halfPrice && <div className="menu-dish-price-btn"><span className="variant-label">Half</span> {item.halfPrice}</div>}
                        {item.fullPrice && <div className="menu-dish-price-btn"><span className="variant-label">Full</span> {item.fullPrice}</div>}
                      </div>
                    )}
                    {item.pricingType === 'sizes' && (
                      <div className="menu-dish-price-variants">
                        {item.regPrice && <div className="menu-dish-price-btn"><span className="variant-label">Reg</span> {item.regPrice}</div>}
                        {item.medPrice && <div className="menu-dish-price-btn"><span className="variant-label">Med</span> {item.medPrice}</div>}
                        {item.largePrice && <div className="menu-dish-price-btn"><span className="variant-label">Lrg</span> {item.largePrice}</div>}
                      </div>
                    )}
                  </div>
                  <div className="menu-dish-image-container">
                    <div className="menu-dish-image-wrap">
                      <img
                        src={item.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'}
                        alt={item.name}
                        className="menu-dish-image"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredItems.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="menu-empty-state">
              <UtensilsCrossed size={24} />
              <p>No dishes found. Try another search.</p>
            </motion.div>
          )}
        </section>
        <footer className="menu-footer">Prepared with care at <strong>{client?.businessName ?? 'Sharma Dhaba'}</strong></footer>
      </main>
    </div>
  );
}

export default App;
