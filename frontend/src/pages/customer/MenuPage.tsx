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
      price: `₹${Number(item.price).toLocaleString('en-IN')}`,
      category: item.category,
      type: item.dietType,
      img: item.image,
    }))
    : demoMenuItems;
  const categories = ['All', ...new Set(menuItems.map((item) => item.category))];
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = menuItems.filter((item) => {
    const categoryMatch = activeCategory === 'All' ? true : item.category === activeCategory;
    const searchMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });
  const heroImage = menuItems.find((item) => item.img)?.img
    ?? 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1600&q=85';

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
          <img className="menu-hero-image" src={heroImage} alt="A selection of freshly prepared dishes" />
          <div className="menu-hero-shade" />
          <div className="menu-hero-content">
            <span className="menu-eyebrow">{client?.category?.replace(/s$/, '') ?? 'A LOCAL FAVOURITE'}</span>
            <h1>{client?.businessName ?? 'Sharma Dhaba'}</h1>
            <p>{client?.city ? `Made with care in ${client.city}` : 'Good food. Good company. Always.'}</p>
            <span className="menu-hero-rule" />
            <span className="menu-hero-count">{menuItems.length} dishes, made for you</span>
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
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.28 }}
                className="menu-dish"
              >
                <div className="menu-dish-image-wrap">
                  <img
                    src={item.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'}
                    alt={item.name}
                    className="menu-dish-image"
                    loading="lazy"
                  />
                </div>
                <div className="menu-dish-info">
                  <div className="menu-dish-title-row">
                    <div className={`menu-diet-mark ${item.type === 'veg' || item.type === 'vegan' ? 'is-veg' : 'is-nonveg'}`} aria-label={item.type === 'veg' || item.type === 'vegan' ? 'Vegetarian' : 'Non-vegetarian'}>
                      <span />
                    </div>
                    <h3>{item.name}</h3>
                  </div>
                  {item.description && <p className="menu-dish-description">{item.description}</p>}
                  <div className="menu-dish-footer">
                    <span className="menu-dish-category">{item.category}</span>
                    <span className="menu-dish-price">{item.price}</span>
                  </div>
                </div>
              </motion.div>
            ))}
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
