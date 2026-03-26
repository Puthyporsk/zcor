import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import "../styles/landing.css";

import dashboardImg from "../assets/zcor-dashboard.png";
import timeImg from "../assets/features/time-tracking.png";
import timeImg2 from "../assets/features/time-tracking2.png";
import timeImg3 from "../assets/features/time-tracking3.png";
import timeImg4 from "../assets/features/time-tracking4.png";
import schedulingImg from "../assets/features/staff-scheduling.png";
import schedulingImg2 from "../assets/features/staff-scheduling2.png";
import schedulingImg3 from "../assets/features/staff-scheduling3.png";
import inventoryImg from "../assets/features/inventory-ops.png";
import inventoryImg2 from "../assets/features/inventory-ops2.png";
import inventoryImg3 from "../assets/features/inventory-ops3.png";

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
  const [contactForm, setContactForm] = React.useState({ name: "", email: "", message: "" });
  const [contactStatus, setContactStatus] = React.useState(null); // null | "sending" | "sent"
  const [featureDialog, setFeatureDialog] = React.useState(null); // null | feature object
  const [slideIndex, setSlideIndex] = React.useState(0);

  const openFeatureDialog = (f) => {
    setSlideIndex(0);
    setFeatureDialog(f);
  };

  const features = [
    {
      title: "Time Tracking",
      images: [
        { src: timeImg, alt: "Time tracking overview" },
        { src: timeImg2, alt: "Time tracking detail view" },
        { src: timeImg3, alt: "Time tracking reports" },
        { src: timeImg4, alt: "Time tracking clock in/out" },
      ],
      short: "Clock in/out, breaks, and approvals. Export clean timesheets and reduce payroll headaches.",
      tags: ["Timesheets", "Approvals", "Reports"],
      details: [
        "One-click clock in/out with automatic break tracking",
        "Weekly timesheet view with inline editing for quick corrections",
        "Manager approval workflow — submit, review, approve, or reject",
        "Export timesheets to CSV for payroll processing",
        "Dashboard summary of hours worked this week and month",
        "Tracks billable vs. non-billable hours by project",
      ],
    },
    {
      title: "Staff Scheduling",
      images: [
        { src: schedulingImg, alt: "Staff scheduling overview" },
        { src: schedulingImg2, alt: "Staff scheduling detail view" },
        { src: schedulingImg3, alt: "Staff scheduling weekly view" },
      ],
      short: "Build schedules in minutes, prevent conflicts, and notify staff instantly.",
      tags: ["Shift Planner", "Availability", "Notifications"],
      flip: true,
      details: [
        "Simple weekly schedule builder — create shifts in seconds",
        "Assign shifts by role, task, or individual employee",
        "Automatic conflict detection — no double bookings",
        "Employees see their upcoming shifts at a glance",
        "Managers can edit or reassign shifts on the fly",
        "Leave and availability integrated into the schedule view",
      ],
    },
    {
      title: "Inventory & Operations",
      images: [
        { src: inventoryImg, alt: "Inventory management overview" },
        { src: inventoryImg2, alt: "Inventory detail view" },
        { src: inventoryImg3, alt: "Inventory stock levels" },
      ],
      short: "Track stock, low alerts, and usage. Keep ordering predictable and avoid surprises.",
      tags: ["Stock Levels", "Low Alerts", "Audit Trail"],
      details: [
        "Real-time stock level tracking across all items",
        "Low-stock alerts so you never run out during peak periods",
        "Usage history and audit trail for every inventory change",
        "Categorize items by type, location, or department",
        "Quick-add and bulk-update for fast restocking",
        "Visual dashboard showing inventory health at a glance",
      ],
    },
  ];

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
              Run your business ops in one place.
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

          <div className="zcor-hero__art">
            <div className="zcor-browserFrame">
              <div className="zcor-browserFrame__bar">
                <span className="zcor-browserFrame__dot" />
                <span className="zcor-browserFrame__dot" />
                <span className="zcor-browserFrame__dot" />
              </div>
              <img className="zcor-browserFrame__img" src={dashboardImg} alt="ZCOR dashboard" />
            </div>
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

          <div className="zcor-stats">
            <div className="zcor-stat">
              <div className="zcor-stat__number">5 min</div>
              <div className="zcor-stat__label">Average setup time</div>
            </div>
            <div className="zcor-stat">
              <div className="zcor-stat__number">4-in-1</div>
              <div className="zcor-stat__label">Tools replaced</div>
            </div>
            <div className="zcor-stat">
              <div className="zcor-stat__number">Zero</div>
              <div className="zcor-stat__label">Spreadsheets needed</div>
            </div>
          </div>
        </div>
      </section>

      {/* MODULE CARDS */}
      <section id="modules" className="zcor-section zcor-section--tight">
        <div className="zcor-container zcor-cards">
          {features.map((f) => (
            <article
              key={f.title}
              className={`zcor-card${f.flip ? " zcor-card--flip" : ""}`}
              onClick={() => openFeatureDialog(f)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && openFeatureDialog(f)}
            >
              <div className="zcor-card__media">
                <img className="zcor-featureImg" src={f.images[0].src} alt={f.images[0].alt} />
              </div>
              <div className="zcor-card__body">
                <h3 className="zcor-h3">{f.title}</h3>
                <p className="zcor-text">{f.short}</p>
                <div className="zcor-tags">
                  {f.tags.map((tag) => (
                    <span key={tag} className="zcor-tag">{tag}</span>
                  ))}
                </div>
                <span className="zcor-cardLink">Learn more &rarr;</span>
              </div>
            </article>
          ))}
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

            <div className="zcor-quote" key={activeTestimonial} aria-live="polite">
              <p className="zcor-quote__text">“{t.quote}”</p>
              <div className="zcor-quote__who">
                <div className="zcor-avatar" aria-hidden="true">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="zcor-quote__name">{t.name}</div>
                  <div className="zcor-quote__role">{t.role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="pricing" className="zcor-section">
        <div className="zcor-container zcor-center">
          <p className="zcor-kicker">Plans</p>
          <h2 className="zcor-h2">Simple pricing that grows with you</h2>
          <p className="zcor-lead">
            Start with the essentials and add modules as your team needs them. No hidden fees.
          </p>

          <div className="zcor-pricingRow">
            <div className="zcor-pricingCard">
              <div className="zcor-pricingCard__header">
                <h3 className="zcor-h4">Starter</h3>
                <div className="zcor-pricingCard__price">
                  <span className="zcor-pricingCard__amount">$4</span>
                  <span className="zcor-pricingCard__period">/user/month</span>
                </div>
              </div>
              <ul className="zcor-pricingCard__list">
                <li>Time tracking & timesheets</li>
                <li>Staff scheduling</li>
                <li>Up to 15 users</li>
                <li>Email support</li>
              </ul>
              <button
                type="button"
                className="zcor-btn zcor-btn--outline zcor-btn--full"
                onClick={() => scrollToId("contact")}
              >
                Get started
              </button>
            </div>

            <div className="zcor-pricingCard zcor-pricingCard--featured">
              <div className="zcor-pricingCard__badge">Most popular</div>
              <div className="zcor-pricingCard__header">
                <h3 className="zcor-h4">Business</h3>
                <div className="zcor-pricingCard__price">
                  <span className="zcor-pricingCard__amount">$8</span>
                  <span className="zcor-pricingCard__period">/user/month</span>
                </div>
              </div>
              <ul className="zcor-pricingCard__list">
                <li>Everything in Starter</li>
                <li>Inventory & operations</li>
                <li>Payroll & payslips</li>
                <li>Leave management</li>
                <li>Unlimited users</li>
                <li>Priority support</li>
              </ul>
              <button
                type="button"
                className="zcor-btn zcor-btn--light zcor-btn--full"
                onClick={() => scrollToId("contact")}
              >
                Book a demo
              </button>
            </div>

            <div className="zcor-pricingCard">
              <div className="zcor-pricingCard__header">
                <h3 className="zcor-h4">Enterprise</h3>
                <div className="zcor-pricingCard__price">
                  <span className="zcor-pricingCard__amount">Custom</span>
                </div>
              </div>
              <ul className="zcor-pricingCard__list">
                <li>Everything in Business</li>
                <li>Dedicated onboarding</li>
                <li>Custom integrations</li>
                <li>SLA & phone support</li>
              </ul>
              <button
                type="button"
                className="zcor-btn zcor-btn--outline zcor-btn--full"
                onClick={() => scrollToId("contact")}
              >
                Contact us
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="zcor-final">
        <div className="zcor-container zcor-center">
          <h2 className="zcor-h2" style={{ maxWidth: 720, margin: "0 auto 8px" }}>
            Move your operations out of spreadsheets.
          </h2>
          <p className="zcor-lead">
            Tell us about your team and we'll get back to you within one business day.
          </p>

          <form
            className="zcor-contactForm"
            onSubmit={async (e) => {
              e.preventDefault();
              setContactStatus("sending");
              try {
                await apiFetch("/api/contact", {
                  method: "POST",
                  body: contactForm,
                });
                setContactStatus("sent");
                setContactForm({ name: "", email: "", message: "" });
              } catch {
                setContactStatus(null);
                alert("Something went wrong. Please try again.");
              }
            }}
          >
            <div className="zcor-contactForm__row">
              <input
                type="text"
                placeholder="Your name"
                required
                className="zcor-input"
                value={contactForm.name}
                onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                type="email"
                placeholder="Work email"
                required
                className="zcor-input"
                value={contactForm.email}
                onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <textarea
              placeholder="How can we help?"
              rows={4}
              className="zcor-input zcor-input--textarea"
              value={contactForm.message}
              onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
            />
            <button
              type="submit"
              className="zcor-btn zcor-btn--dark"
              disabled={contactStatus === "sending" || contactStatus === "sent"}
            >
              {contactStatus === "sending"
                ? "Sending..."
                : contactStatus === "sent"
                ? "Message sent!"
                : "Send message"}
            </button>
          </form>
        </div>
      </section>

      {/* FEATURE DIALOG */}
      {featureDialog && (
        <div
          className="zcor-overlay"
          onClick={() => setFeatureDialog(null)}
          role="dialog"
          aria-modal="true"
          aria-label={featureDialog.title}
        >
          <div className="zcor-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="zcor-dialog__close"
              onClick={() => setFeatureDialog(null)}
              aria-label="Close"
            >
              &times;
            </button>

            <div className="zcor-dialog__imgWrap">
              <img
                key={slideIndex}
                src={featureDialog.images[slideIndex].src}
                alt={featureDialog.images[slideIndex].alt}
                className="zcor-dialog__img"
              />

              {featureDialog.images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="zcor-slide__arrow zcor-slide__arrow--prev"
                    onClick={() => setSlideIndex((i) => (i - 1 + featureDialog.images.length) % featureDialog.images.length)}
                    aria-label="Previous image"
                  >
                    &#8249;
                  </button>
                  <button
                    type="button"
                    className="zcor-slide__arrow zcor-slide__arrow--next"
                    onClick={() => setSlideIndex((i) => (i + 1) % featureDialog.images.length)}
                    aria-label="Next image"
                  >
                    &#8250;
                  </button>
                  <div className="zcor-slide__dots">
                    {featureDialog.images.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`zcor-slide__dot${i === slideIndex ? " is-active" : ""}`}
                        onClick={() => setSlideIndex(i)}
                        aria-label={`Image ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="zcor-dialog__body">
              <h2 className="zcor-h2">{featureDialog.title}</h2>
              <p className="zcor-text" style={{ marginBottom: 16 }}>{featureDialog.short}</p>

              <ul className="zcor-dialog__list">
                {featureDialog.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>

              <div className="zcor-dialog__actions">
                <button
                  type="button"
                  className="zcor-btn"
                  onClick={() => {
                    setFeatureDialog(null);
                    setTimeout(() => scrollToId("contact"), 200);
                  }}
                >
                  Book a demo
                </button>
                <button
                  type="button"
                  className="zcor-btn zcor-btn--outline"
                  onClick={() => setFeatureDialog(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <button type="button" onClick={() => scrollToId("pricing")}>Plans</button>
            <button type="button" onClick={() => scrollToId("contact")}>Contact</button>
          </div>

          <div className="zcor-footer__cta">
            <ZcorAllRightsReserved />
          </div>
        </div>
      </footer>
    </div>
  );
}
