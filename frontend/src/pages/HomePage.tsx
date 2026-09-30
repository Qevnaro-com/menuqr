import { ArrowDown, ArrowUpRight, ChefHat, Clock3, QrCode, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import heroImage from '../assets/hero.png';
import './HomePage.css';

const services = [
  {
    number: '01',
    foodItem: '🍔',
    icon: QrCode,
    title: 'Branded QR menus',
    description: 'A scan-ready menu that feels like your restaurant, from the first tap to the last dish.',
  },
  {
    number: '02',
    foodItem: '🍕',
    icon: ChefHat,
    title: 'Menu setup & design',
    description: 'Organise dishes, prices, categories, and photos into a clear menu customers can browse.',
  },
  {
    number: '03',
    foodItem: '🍜',
    icon: Clock3,
    title: 'Quick menu updates',
    description: 'Change availability, prices, or specials in one place. Your digital menu stays current.',
  },
  {
    number: '04',
    foodItem: '🍦',
    icon: Smartphone,
    title: 'Made for every screen',
    description: 'A clean mobile-first experience, with no app download needed for your customers.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

export default function HomePage() {
  function scrollToServices() {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="home-page">
      <header className="home-nav">
        <Link className="home-brand" to="/" aria-label="MenuQR home">
          <span className="home-brand-mark"><ChefHat size={21} strokeWidth={1.9} /></span>
          <span>Menu<span>QR</span><small className="home-brand-tagline">Digital menus, made simple</small></span>
        </Link>
        <button className="home-nav-services" type="button" onClick={scrollToServices}>
          Services <ArrowDown size={14} />
        </button>
        <Link className="home-nav-admin" to="/admin/login">Restaurant admin <ArrowUpRight size={15} /></Link>
      </header>

      <section className="home-hero menu-style-hero" aria-labelledby="home-title">
        {/* Rich background for menu-style hero */}
        <div className="home-hero-bg">
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1.15 }}
            transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
            src={heroImage} 
            alt="Restaurant food background" 
            className="home-hero-bg-img" 
          />
          <div className="home-hero-bg-overlay" />
          
          <div className="home-hero-bg-pattern" aria-hidden="true" />
        </div>
        
        <div className="home-hero-content-wrapper">
          {/* Left Side: Copy */}
          <div className="home-hero-copy">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.p variants={itemVariants} className="home-eyebrow"><span /> Digital QR Menu</motion.p>
              <motion.h1 variants={itemVariants} id="home-title">Your Restaurant Menu.<br />On Their Phones.</motion.h1>
              <motion.p variants={itemVariants} className="home-hero-description">Transform your physical menu into an interactive digital experience. Guests just scan, browse, and crave what you make best.</motion.p>
              <motion.div variants={itemVariants} className="home-hero-actions">
                <Link className="home-primary-action" to="/menu/mishraa-dhaba">See a live menu <ArrowUpRight size={17} /></Link>
                <button className="home-secondary-action" type="button" onClick={scrollToServices}>Explore services</button>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Side: Phone Mockup / Visual */}
          <motion.div 
            className="home-hero-visual"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          >
            <motion.div
              className="scan-guest"
              aria-hidden="true"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.45, ease: 'easeOut' }}
            >
              <span className="scan-guest-head" />
              <span className="scan-guest-neck" />
              <span className="scan-guest-body" />
              <span className="scan-guest-arm" />
              <span className="scan-guest-phone"><Smartphone size={18} /></span>
            </motion.div>

            <motion.div
              className="scan-beam"
              aria-hidden="true"
              animate={{ opacity: [0.25, 0.9, 0.25], scaleX: [0.82, 1, 0.82] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Glowing Spotlight behind phone */}
            <motion.div 
              className="phone-spotlight"
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Phone Mockup */}
            <div className="phone-mockup">
              <div className="phone-notch"></div>
              <div className="phone-screen">
                <motion.div 
                  className="phone-scanner"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                />
                <div className="menu-header-mock">
                  <div className="menu-avatar-mock"><ChefHat size={30} color="#173b32" strokeWidth={1.8} /></div>
                </div>
                
                <div className="menu-details">
                  <h3 className="menu-business-name">MenuQR</h3>
                  <p className="menu-business-sub">Scan • Order • Enjoy</p>
                </div>

                <div className="menu-categories">
                  <span className="category-pill active">Popular</span>
                  <span className="category-pill">Burgers</span>
                  <span className="category-pill">Drinks</span>
                </div>
                
                <div className="menu-items-mock">
                  {[
                    { id: 1, name: 'Classic Burger', price: '₹199', icon: '🍔' },
                    { id: 2, name: 'Farmhouse Pizza', price: '₹299', icon: '🍕', highlight: true },
                    { id: 3, name: 'Cold Coffee', price: '₹149', icon: '🥤' }
                  ].map((item, index) => (
                    <motion.div 
                      key={item.id} 
                      className={`menu-item-mock ${item.highlight ? 'highlight-item' : ''}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + (index * 0.2) }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {item.highlight && (
                        <motion.div className="item-highlight-pulse" animate={{ opacity: [0.1, 0.5, 0.1] }} transition={{ duration: 2, repeat: Infinity }} />
                      )}
                      <div className="menu-item-info">
                        <h4>{item.name}</h4>
                        <span className="menu-item-price">{item.price}</span>
                      </div>
                      <div className="menu-item-image">{item.icon}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Table QR placard */}
            <motion.div 
              className="scan-qr-stand"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <QrCode size={40} color="#ed7046" strokeWidth={1.5} />
              <span>TABLE 04</span>
              <strong>Scan for menu</strong>
            </motion.div>

            <div className="scan-result-label"><span /> QR scanned <ArrowUpRight size={13} /></div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}
          className="home-hero-note"
        >
          <span>01 / 04</span><span>Scan. Browse. Enjoy.</span>
        </motion.div>
      </section>

      <section className="home-intro" id="services" aria-labelledby="services-title" style={{ position: 'relative' }}>
        {/* Animated Background Food Elements */}
        <div className="intro-floating-foods" aria-hidden="true">
          {['🥗', '🍔', '🌮', '🍣', '🍩'].map((emoji, idx) => (
            <motion.div
              key={idx}
              className={`intro-food intro-food-${idx}`}
              animate={{ 
                y: [0, -15, 0], 
                rotate: [0, 10, -10, 0], 
              }}
              transition={{ 
                duration: 4 + idx, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: idx * 0.5
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={containerVariants}
          className="home-intro-heading"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <motion.p variants={itemVariants} className="home-section-kicker">Made for hospitality</motion.p>
          <motion.h2 variants={itemVariants} id="services-title" style={{ fontFamily: "'DM Sans', sans-serif" }}>Your food deserves<br />a thoughtful first impression.</motion.h2>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, delay: 0.2 }}
          className="home-intro-copy"
          style={{ position: 'relative', zIndex: 1 }}
        >
          From the QR on the table to the menu on a guest’s phone, we make the experience feel effortless.
        </motion.p>
      </section>

      <section className="home-services-bento" aria-label="MenuQR services">
        {services.map(({ number, foodItem, icon: Icon, title, description }, index) => (
          <motion.article 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="home-bento-card" 
            key={number}
          >
            {/* Food Background Watermark */}
            <motion.div 
              className="bento-food-watermark"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6 + index, repeat: Infinity, ease: "easeInOut" }}
            >
              {foodItem}
            </motion.div>

            <div className="bento-card-watermark">{number}</div>
            <div className="bento-card-icon">
              <Icon size={24} strokeWidth={1.8} />
            </div>
            <div className="bento-card-content">
              <h3 style={{ fontFamily: "'DM Sans', sans-serif" }}>{title}</h3>
              <p>{description}</p>
            </div>
          </motion.article>
        ))}
      </section>

      {/* Menu Designs Showcase Section (Placeholders for uploaded designs) */}
      <section className="home-designs" aria-labelledby="designs-title">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={containerVariants}
          className="home-designs-header"
        >
          <motion.p variants={itemVariants} className="home-section-kicker">Menu Templates</motion.p>
          <motion.h2 variants={itemVariants} id="designs-title" style={{ fontFamily: "'DM Sans', sans-serif" }}>Beautiful designs for<br />your digital menu.</motion.h2>
        </motion.div>
        
        <div className="designs-grid">
          {[
            { 
              id: 1, 
              name: 'Modern Minimalist', 
              desc: 'Clean, spacious design focusing on typography.',
              image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80'
            },
            { 
              id: 2, 
              name: 'Dark Mode Elegance', 
              desc: 'Sleek dark theme perfect for fine dining.',
              image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
            },
            { 
              id: 3, 
              name: 'Vibrant Casual', 
              desc: 'Colorful and fun layout for cafes and bistros.',
              image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=600&q=80'
            }
          ].map((item, index) => (
            <motion.div 
              key={item.id}
              className="design-card-placeholder"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <div className="design-card-image" style={{ height: '420px', padding: 0 }}>
                <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="design-card-overlay">
                <div className="design-card-info-floating">
                  <h4>{item.name}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="home-cta" aria-labelledby="home-cta-title"
      >
        <div>
          <p className="home-section-kicker">MenuQR</p>
          <h2 id="home-cta-title">Let’s put your menu<br />within everyone’s reach.</h2>
        </div>
        <Link className="home-cta-link" to="/menu/mishraa-dhaba">See a live menu <ArrowUpRight size={18} /></Link>
      </motion.section>

      <footer className="home-footer">
        <Link className="home-brand home-brand-footer" to="/" aria-label="MenuQR home">
          <span className="home-brand-mark"><ChefHat size={18} strokeWidth={1.9} /></span>
          <span>Menu<span>QR</span></span>
        </Link>
        <p>Good food. A great menu. A simple scan.</p>
        <Link to="/admin/login">Restaurant admin</Link>
      </footer>
    </main>
  );
}