import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/landing.css";

import worldImg from "../assets/world.png";
import timeImg from "../assets/features/time-tracking.png";
import schedulingImg from "../assets/features/staff-scheduling.png";
import inventoryImg from "../assets/features/inventory-ops.png";
import previewStripImg from "../assets/zcor-product-preview-strip.png";

import ZcorAllRightsReserved from "../components/ZcorAllRightsReserved";

const HEADER_OFFSET = 88;

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;

  const y =
    el.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;

  window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
}

export default function LandingPage() {
  const location = useLocation();
  const navigate = useNavigate();

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

  // When coming from another route (e.g. /login) we navigate("/") with state {scrollTo:id}
  React.useEffect(() => {
    const id = location.state?.scrollTo;
    if (!id) return;

    requestAnimationFrame(() => scrollToId(id));

    // Clear state so refresh/re-render doesn't keep scrolling
    navigate(".", { replace: true, state: null });
  }, [location.state, navigate]);

  const t = testimonials[activeTestimonial];

  return (
    <div className="zcor">
      <div id="top" />

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
              ZCOR helps small businesses track time, schedule teams, manage inventory, and stay on
              top of operations—without spreadsheets.
            </p>

            <div className="zcor-hero__cta">
              <button
                type="button"
                className="zcor-btn"
                onClick={() => scrollToId("contact")}
              >
                Book a demo
              </button>

              <button
                type="button"
                className="zcor-btn zcor-btn--outline"
                onClick={() => scrollToId("features")}
              >
                See how it works
              </button>
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
          <h2 className="zcor-h2">Let ZCOR handle the busywork, so you can run the business.</h2>
          <p className="zcor-lead">
            One dashboard for scheduling, time tracking, inventory, and reporting—so your team stays
            aligned.
          </p>

          <button
            type="button"
            className="zcor-btn zcor-btn--dark"
            onClick={() => scrollToId("contact")}
          >
            Schedule a demo
          </button>
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
                Clock in/out, breaks, and approvals. Export clean timesheets and reduce payroll
                headaches.
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
                    key={`${item.title}-${item.meta}`}
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

      {/* PRODUCT PREVIEW (contained card) */}
      <section className="zcor-section zcor-section--tight" aria-label="Product preview">
        <div className="zcor-container">
          <div className="zcor-photoCard">
            <img
              className="zcor-photoImg"
              src={previewStripImg}
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
              Start with time tracking and scheduling, then add inventory and reporting when you’re
              ready.
            </p>
            <button
              type="button"
              className="zcor-btn zcor-btn--light"
              onClick={() => scrollToId("contact")}
            >
              Book a demo
            </button>
          </div>

          <div className="zcor-ctaCard zcor-ctaCard--light" aria-hidden="true">
            <div className="zcor-ctaCard__img" />
          </div>
        </div>
      </section>

      {/* CONTACT */}
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
            <button type="button" onClick={() => scrollToId("features")}>Features</button>
            <button type="button" onClick={() => scrollToId("modules")}>Modules</button>
            <button type="button" onClick={() => scrollToId("testimonials")}>Stories</button>
            <button type="button" onClick={() => scrollToId("contact")}>Book a demo</button>
          </div>

          <div className="zcor-footer__cta">
            <button
              type="button"
              className="zcor-btn zcor-btn--light"
              onClick={() => scrollToId("contact")}
            >
              Book a demo
            </button>
            <ZcorAllRightsReserved />
          </div>
        </div>
      </footer>
    </div>
  );
}
