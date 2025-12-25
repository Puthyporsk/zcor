import React from "react";
import "../styles/landing.css";

import timeImg from "../assets/features/time-tracking.png";
import schedulingImg from "../assets/features/staff-scheduling.png";
import inventoryImg from "../assets/features/inventory-ops.png";
import worldImg from "../assets/world.png";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [activeTestimonial, setActiveTestimonial] = React.useState(0);

  const testimonials = [
    {
      title: "Café Owner",
      meta: "Vancouver, BC",
      quote:
        "We replaced three spreadsheets and constant text messages. Scheduling and timesheets are finally organized—and inventory is no longer a guessing game.",
      name: "Taylor M.",
      role: "Owner • 18 employees",
    },
    {
      title: "Retail Manager",
      meta: "Seattle, WA",
      quote:
        "Approving time and building schedules takes minutes now. The team always knows their shifts, and last-minute changes are way easier to handle.",
      name: "Jordan L.",
      role: "Store Manager • 24 employees",
    },
    {
      title: "Studio Founder",
      meta: "Burnaby, BC",
      quote:
        "Inventory alerts alone saved us from running out during peak weeks. ZCOR keeps everything visible without the overhead of complex tools.",
      name: "Avery K.",
      role: "Founder • 9 employees",
    },
  ];

  const t = testimonials[activeTestimonial];

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="zcor">
        {/* TOP ANCHOR */}
        <div id="top" />

        {/* NAV */}
        <header className="zcor-nav">
            <div className="zcor-container zcor-nav__inner">
            {/* Always scrolls to top */}
            <a
                className="zcor-brand"
                href="#top"
                onClick={() => {
                closeMenu();
                }}
            >
                <span className="zcor-brand__mark">Z</span>
                <span className="zcor-brand__text">ZCOR</span>
            </a>

            <button
                className="zcor-burger"
                type="button"
                aria-label="Toggle menu"
                aria-expanded={menuOpen ? "true" : "false"}
                onClick={() => setMenuOpen((v) => !v)}
            >
                <span />
                <span />
                <span />
            </button>

            <nav className={`zcor-menu ${menuOpen ? "is-open" : ""}`}>
                <a href="#features" onClick={closeMenu}>
                Features
                </a>
                <a href="#modules" onClick={closeMenu}>
                Modules
                </a>
                <a href="#testimonials" onClick={closeMenu}>
                Stories
                </a>
                <a href="#pricing" onClick={closeMenu}>
                Pricing
                </a>

                <a className="zcor-btn zcor-btn--ghost" href="#contact" onClick={closeMenu}>
                Book a demo
                </a>
            </nav>
            </div>
        </header>

        {/* HERO */}
        <section className="zcor-hero">
            <div className="zcor-container zcor-hero__inner">
            <div className="zcor-hero__copy">
                <h1 className="zcor-h1">
                Run your business ops
                <br />
                in one place.
                </h1>

                <p className="zcor-sub">
                ZCOR helps small businesses track time, schedule teams, manage inventory, and stay on top
                of operations—without spreadsheets.
                </p>

                <div className="zcor-hero__cta">
                <a className="zcor-btn" href="#contact">
                    Book a demo
                </a>
                <a className="zcor-btn zcor-btn--outline" href="#features">
                    See how it works
                </a>
                </div>

                <p className="zcor-micro">
                Built for managers, owners, and teams. Fast setup. Secure by design.
                </p>
            </div>

            <div className="zcor-hero__art" aria-hidden="true">
                <img className="zcor-hero__img" src={worldImg} alt="" />
            </div>
            </div>
        </section>

        {/* FEATURES INTRO */}
        <section id="features" className="zcor-section">
            <div className="zcor-container zcor-center">
            <p className="zcor-kicker">Features</p>
            <h2 className="zcor-h2">
                Let ZCOR handle the busywork, so you can run the business.
            </h2>
            <p className="zcor-lead">
                One dashboard for scheduling, time tracking, inventory, and reporting—so your team stays aligned.
            </p>
            <a className="zcor-btn zcor-btn--dark" href="#contact">
                Schedule a demo
            </a>
            </div>
        </section>

        {/* MODULE CARDS */}
        <section id="modules" className="zcor-section zcor-section--tight">
            <div className="zcor-container zcor-cards">
                <article className="zcor-card">
                    <div className="zcor-card__media">
                        <img className="zcor-featureImg" src={timeImg} alt="Time tracking illustration" />
                    </div>
                    <div className="zcor-card__body">
                        <h3 className="zcor-h3">Time Tracking</h3>
                        <p className="zcor-text">
                            Clock in/out, breaks, and approvals. Export clean timesheets and reduce payroll headaches.
                        </p>
                        <div className="zcor-tags">
                            <span className="zcor-tag">Timesheets</span>
                            <span className="zcor-tag">Approvals</span>
                            <span className="zcor-tag">Reports</span>
                        </div>
                    </div>
                </article>

                <article className="zcor-card zcor-card--flip">
                    <div className="zcor-card__media">
                        <img
                            className="zcor-featureImg"
                            src={schedulingImg}
                            alt="Staff scheduling illustration"
                        />
                    </div>
                    <div className="zcor-card__body">
                        <h3 className="zcor-h3">Staff Scheduling</h3>
                        <p className="zcor-text">
                            Build schedules in minutes, prevent conflicts, and notify staff instantly.
                        </p>
                        <div className="zcor-tags">
                            <span className="zcor-tag">Shift Planner</span>
                            <span className="zcor-tag">Availability</span>
                            <span className="zcor-tag">Notifications</span>
                        </div>
                    </div>
                </article>

                <article className="zcor-card">
                    <div className="zcor-card__media">
                        <img
                            className="zcor-featureImg"
                            src={inventoryImg}
                            alt="Inventory management illustration"
                        />
                    </div>
                    <div className="zcor-card__body">
                        <h3 className="zcor-h3">Inventory & Operations</h3>
                        <p className="zcor-text">
                            Track stock, low alerts, and usage. Keep ordering predictable and avoid surprises.
                        </p>
                        <div className="zcor-tags">
                            <span className="zcor-tag">Stock Levels</span>
                            <span className="zcor-tag">Low Alerts</span>
                            <span className="zcor-tag">Audit Trail</span>
                        </div>
                    </div>
                </article>
            </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" className="zcor-section">
            <div className="zcor-container">
                <h2 className="zcor-h2 zcor-center">Hear from teams who use ZCOR</h2>

                <div className="zcor-testimonials">
                    <div className="zcor-testimonials__list" role="list">
                    {testimonials.map((item, idx) => {
                        const isActive = idx === activeTestimonial;
                        return (
                        <button
                            key={item.title}
                            type="button"
                            className={`zcor-pill ${isActive ? "is-active" : ""}`}
                            onClick={() => setActiveTestimonial(idx)}
                            aria-pressed={isActive}
                        >
                            <div className="zcor-pill__title">{item.title}</div>
                            <div className="zcor-pill__meta">{item.meta}</div>
                        </button>
                        );
                    })}
                    </div>

                    <div className="zcor-quote" aria-live="polite">
                        <p className="zcor-quote__text">“{t.quote}”</p>
                        <div className="zcor-quote__who">
                            <div className="zcor-avatar" aria-hidden="true" />
                            <div>
                                <div className="zcor-quote__name">{t.name}</div>
                                <div className="zcor-quote__role">{t.role}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* IMAGE STRIP */}
        <section className="zcor-photo" aria-label="Product preview">
            <div className="zcor-container">
                <div className="zcor-photoCard">
                    <img
                        className="zcor-photoImg"
                        src={require("../assets/zcor-product-preview-strip.png")}
                        alt="ZCOR product preview"
                        loading="lazy"
                    />
                </div>
            </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="zcor-section zcor-section--tight">
            <div className="zcor-container zcor-ctaRow">
                <div className="zcor-ctaCard zcor-ctaCard--dark">
                    <h3 className="zcor-h3">A plan that fits your business</h3>
                    <p className="zcor-text">
                    Start with time tracking and scheduling, then add inventory and reporting when you’re ready.
                    </p>
                    <a className="zcor-btn zcor-btn--light" href="#contact">
                    Book a demo
                    </a>
                </div>

                <div className="zcor-ctaCard zcor-ctaCard--light" aria-hidden="true">
                    <div className="zcor-ctaCard__img" />
                </div>
            </div>
        </section>

        {/* CONTACT / FINAL CTA */}
        <section id="contact" className="zcor-final">
            <div className="zcor-container zcor-center">
                <h2 className="zcor-h2">
                    Move your operations out of spreadsheets.
                    <br />
                    Get started with ZCOR today.
                </h2>
                <a className="zcor-btn zcor-btn--dark" href="mailto:demo@zcor.app">
                    Contact our team
                </a>
            </div>
        </section>

        {/* FOOTER */}
        <footer className="zcor-footer">
            <div className="zcor-container zcor-footer__inner">
                <div className="zcor-footer__brand">
                    <div className="zcor-footer__logo">ZCOR</div>
                    <p className="zcor-footer__text">
                    Centralize time tracking, scheduling, and inventory for small businesses.
                    </p>
                </div>

                <div className="zcor-footer__links">
                    <a href="#features">Features</a>
                    <a href="#modules">Modules</a>
                    <a href="#testimonials">Stories</a>
                    <a href="#contact">Book a demo</a>
                </div>

                <div className="zcor-footer__cta">
                    <a className="zcor-btn zcor-btn--light" href="#contact">
                    Book a demo
                    </a>
                    <div className="zcor-footer__fine">
                    © {new Date().getFullYear()} ZCOR. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    </div>
  );
}
