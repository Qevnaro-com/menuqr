import { ArrowDown, ArrowUpRight, ChefHat, Clock3, QrCode, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/hero.png';
import './HomePage.css';

const services = [
  {
    number: '01',
    icon: QrCode,
    title: 'Branded QR menus',
    description: 'A scan-ready menu that feels like your restaurant, from the first tap to the last dish.',
  },
  {
    number: '02',
    icon: ChefHat,
    title: 'Menu setup & design',
    description: 'Organise dishes, prices, categories, and photos into a clear menu customers can browse.',
  },
  {
    number: '03',
    icon: Clock3,
    title: 'Quick menu updates',
    description: 'Change availability, prices, or specials in one place. Your digital menu stays current.',
  },
  {
    number: '04',
    icon: Smartphone,
    title: 'Made for every screen',
    description: 'A clean mobile-first experience, with no app download needed for your customers.',
  },
];

export default function HomePage() {
  function scrollToServices() {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="home-page">
      <header className="home-nav">
        <Link className="home-brand" to="/" aria-label="MenuQR home">
          <span className="home-brand-mark"><ChefHat size={21} strokeWidth={1.9} /></span>
          <span>Menu<span>QR</span></span>
        </Link>
        <button className="home-nav-services" type="button" onClick={scrollToServices}>
          Services <ArrowDown size={14} />
        </button>
        <Link className="home-nav-admin" to="/admin/login">Restaurant admin <ArrowUpRight size={15} /></Link>
      </header>

      <section className="home-hero" aria-labelledby="home-title">
        <img className="home-hero-image" src={heroImage} alt="Freshly prepared restaurant meal" />
        <div className="home-hero-shade" aria-hidden="true" />
        <div className="home-hero-copy">
          <p className="home-eyebrow"><span /> Digital menus for restaurants, cafes & dhabas</p>
          <h1 id="home-title">A better menu.<br />One simple scan.</h1>
          <p className="home-hero-description">Give every table an easy way to explore what you make best. We bring your menu online, beautifully and simply.</p>
          <div className="home-hero-actions">
            <Link className="home-primary-action" to="/menu/mishraa-dhaba">See a live menu <ArrowUpRight size={17} /></Link>
            <button className="home-secondary-action" type="button" onClick={scrollToServices}>Explore services</button>
          </div>
        </div>
        <div className="home-hero-note"><span>01 / 04</span><span>Scan. Browse. Enjoy.</span></div>
      </section>

      <section className="home-intro" id="services" aria-labelledby="services-title">
        <div className="home-intro-heading">
          <p className="home-section-kicker">Made for hospitality</p>
          <h2 id="services-title">Your food deserves<br />a thoughtful first impression.</h2>
        </div>
        <p className="home-intro-copy">From the QR on the table to the menu on a guest’s phone, we make the experience feel effortless.</p>
      </section>

      <section className="home-services" aria-label="MenuQR services">
        {services.map(({ number, icon: Icon, title, description }) => (
          <article className="home-service" key={number}>
            <div className="home-service-top"><span>{number}</span><Icon size={20} strokeWidth={1.7} /></div>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <section className="home-cta" aria-labelledby="home-cta-title">
        <div>
          <p className="home-section-kicker">MenuQR</p>
          <h2 id="home-cta-title">Let’s put your menu<br />within everyone’s reach.</h2>
        </div>
        <Link className="home-cta-link" to="/menu/mishraa-dhaba">See a live menu <ArrowUpRight size={18} /></Link>
      </section>

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