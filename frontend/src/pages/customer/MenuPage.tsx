import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, ChefHat, UtensilsCrossed, Clock3, Globe2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getClientByMenuSlug, type PublicMenuRecord } from '../admin/clientStore';
import './MenuPage.css';

function App() {
  const { slug } = useParams();
  const [menuResult, setMenuResult] = useState<{ slug: string; client?: PublicMenuRecord; error?: string }>();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const currentMenuResult = menuResult?.slug === slug ? menuResult : undefined;
  const client = currentMenuResult?.client;
  const loadError = currentMenuResult?.error ?? '';
  const isLoading = Boolean(slug) && !currentMenuResult;

  useEffect(() => {
    let isCurrent = true;
    if (!slug) {
      return;
    }
    void getClientByMenuSlug(slug).then((menu) => {
      if (!isCurrent) return;
      setMenuResult(menu
        ? { slug, client: menu }
        : { slug, error: 'This menu is unavailable. Check the link or contact the restaurant.' });
    }).catch((error: unknown) => {
      if (isCurrent) setMenuResult({ slug, error: error instanceof Error ? error.message : 'Could not load this menu.' });
    });
    return () => { isCurrent = false; };
  }, [slug]);

  const menuItems = (client?.menuItems ?? []).map((item) => ({
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
    }));
  const categories = ['All', ...new Set(menuItems.map((item) => item.category))];

  const filteredItems = menuItems.filter((item) => {
    const categoryMatch = activeCategory === 'All' ? true : item.category === activeCategory;
    const searchMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });
  const heroImage = client?.heroImage
    || menuItems.find((item) => item.img)?.img
    || '';

  if (isLoading || loadError || !client) {
    return (
      <div className="customer-menu">
        <header className="menu-topbar"><a className="menu-wordmark" href="#top" aria-label="MenuQR menu"><span className="menu-brand-icon"><ChefHat size={19} strokeWidth={2} /></span><span>Menu<span className="menu-brand-accent">QR</span></span></a></header>
        <main id="top" className="menu-main"><div className="menu-empty-state" role={loadError ? 'alert' : 'status'}>{loadError || 'Preparing this menu…'}</div></main>
      </div>
    );
  }

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
            <div className="menu-hero-badge">{client.category.replace(/s$/, '')}</div>
            <h1>{client.businessName}</h1>
            {client.city && <p>{`Made with love in ${client.city}`}</p>}
            <div className="menu-hero-stats">
              <span className="menu-hero-stat">🍽️ {menuItems.length} Dishes</span>
            </div>
          </div>
          <div className="menu-hero-visual">
            <div className="menu-hero-visual-bg"></div>
            {heroImage ? <img className="menu-hero-image-new" src={heroImage} alt="Featured dish" /> : <div className="menu-hero-image-placeholder" aria-hidden="true"><ChefHat size={54} strokeWidth={1.4} /></div>}
          </div>
        </motion.section>

        {(client.address || client.openingHours || client.services.length > 0 || client.website) && (
          <section className="menu-business-details" aria-label="Business details">
            {(client.address || client.city || client.state) && <div className="menu-business-detail"><MapPin size={16} aria-hidden="true" /><span>{[client.address, client.city, client.state].filter(Boolean).join(', ')}</span></div>}
            {client.openingHours && <div className="menu-business-detail"><Clock3 size={16} aria-hidden="true" /><span>{client.openingHours}</span></div>}
            {client.services.length > 0 && <div className="menu-business-services">{client.services.map((service) => <span key={service}>{service}</span>)}</div>}
            {client.website && <a className="menu-business-detail" href={client.website} target="_blank" rel="noreferrer"><Globe2 size={16} aria-hidden="true" /><span>Website</span></a>}
          </section>
        )}

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
                      {item.img ? <img
                        src={item.img}
                        alt={item.name}
                        className="menu-dish-image"
                        loading="lazy"
                      /> : <div className="menu-dish-image-placeholder" aria-label={`${item.name} has no image`}><UtensilsCrossed size={28} aria-hidden="true" /></div>}
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
        <footer className="menu-footer">Prepared with care at <strong>{client.businessName}</strong></footer>
      </main>
    </div>
  );
}

export default App;
