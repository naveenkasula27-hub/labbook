import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { money, prettyDate } from "../lib/api.js";

const BLANK = {
  name: "",
  age: "",
  gender: "",
  phone: "",
  email: "",
  visitType: "lab",
  address: "",
  notes: "",
  consent: false,
};

const BookingForm = forwardRef(function BookingForm(
  { lab, basket, labOnly, date, slot, availability, minDate, onDate, onSlot, onSubmit },
  ref
) {
  const [v, setV] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState("");
  const notesRef = useRef(null);

  // Lets the test list drop a search term into the notes.
  useImperativeHandle(ref, () => ({
    appendNote(text) {
      setV((p) => ({ ...p, notes: p.notes ? `${p.notes.trim()}, ${text}` : text }));
      notesRef.current?.focus();
      notesRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    },
  }));

  const set = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setV((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  function validate() {
    const e = {};
    if (!v.name.trim()) e.name = "Enter the patient's name.";
    const age = Number(v.age);
    if (v.age === "" || !Number.isInteger(age) || age < 0 || age > 120)
      e.age = "Enter an age between 0 and 120.";
    if (!v.gender) e.gender = "Choose one.";

    const digits = v.phone.replace(/\D/g, "");
    if (lab.country === "IN") {
      const local = digits.replace(/^(91|0)/, "");
      if (!/^[6-9]\d{9}$/.test(local)) e.phone = "Enter a 10 digit mobile number.";
    } else if (digits.length < 7) {
      e.phone = "Enter a valid mobile number.";
    }

    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))
      e.email = "That email does not look right.";

    if (v.visitType === "home" && !v.address.trim())
      e.address = "Enter the address for home collection.";
    if (v.visitType === "home" && labOnly.length)
      e.visitType = `These have to be done at the lab: ${labOnly.join(", ")}.`;

    if (!basket.items.length && !v.notes.trim())
      e.notes = "Pick at least one test, or write what you need here.";

    if (!v.consent) e.consent = "Tick this so the lab can contact you.";
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setServerError("");

    const e = validate();
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      document.getElementById(`f-${first}`)?.focus();
      return;
    }

    setSending(true);
    try {
      await onSubmit({
        name: v.name.trim(),
        age: Number(v.age),
        gender: v.gender,
        phone: v.phone.trim(),
        email: v.email.trim(),
        visitType: v.visitType,
        address: v.visitType === "home" ? v.address.trim() : "",
        notes: v.notes.trim(),
        consent: true,
      });
      setV(BLANK);
      setErrors({});
    } catch (err) {
      if (err.field) {
        setErrors({ [err.field]: err.message });
        document.getElementById(`f-${err.field}`)?.focus();
      } else {
        setServerError(err.message);
      }
    } finally {
      setSending(false);
    }
  }

  const Err = ({ field }) =>
    errors[field] ? (
      <p className="err" id={`e-${field}`} role="alert">
        {errors[field]}
      </p>
    ) : null;

  const cls = (field, base) => `${base}${errors[field] ? " invalid" : ""}`;
  const aria = (field) => ({
    "aria-invalid": errors[field] ? "true" : undefined,
    "aria-describedby": errors[field] ? `e-${field}` : undefined,
  });

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div className="notice notice-bad" role="alert">
          {serverError}
        </div>
      )}

      <div>
        <label className="field-label" htmlFor="f-name">Patient's full name</label>
        <input
          id="f-name"
          className={cls("name", "input")}
          value={v.name}
          onChange={set("name")}
          autoComplete="name"
          {...aria("name")}
        />
        <Err field="name" />
      </div>

      <div className="two">
        <div>
          <label className="field-label" htmlFor="f-age">Age</label>
          <input
            id="f-age"
            className={cls("age", "input")}
            value={v.age}
            onChange={set("age")}
            type="number"
            inputMode="numeric"
            min="0"
            max="120"
            {...aria("age")}
          />
          <Err field="age" />
        </div>
        <div>
          <label className="field-label" htmlFor="f-gender">Gender</label>
          <select
            id="f-gender"
            className={cls("gender", "select")}
            value={v.gender}
            onChange={set("gender")}
            {...aria("gender")}
          >
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
          <Err field="gender" />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="f-phone">Mobile number</label>
        <input
          id="f-phone"
          className={cls("phone", "input")}
          value={v.phone}
          onChange={set("phone")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={lab.country === "IN" ? "10 digits" : "With country code"}
          {...aria("phone")}
        />
        <Err field="phone" />
        <p className="muted tiny" style={{ margin: "4px 0 0" }}>
          The lab sends your confirmation to this number on WhatsApp.
        </p>
      </div>

      <div>
        <label className="field-label" htmlFor="f-email">
          Email <span className="muted">(optional)</span>
        </label>
        <input
          id="f-email"
          className={cls("email", "input")}
          value={v.email}
          onChange={set("email")}
          type="email"
          autoComplete="email"
          {...aria("email")}
        />
        <Err field="email" />
      </div>

      {lab.homeCollection && (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="field-label">Where should the sample be taken?</legend>
          <div className="radios">
            <label className="radio">
              <input
                type="radio"
                name="visitType"
                value="lab"
                checked={v.visitType === "lab"}
                onChange={set("visitType")}
              />
              At the lab
            </label>
            <label className="radio">
              <input
                id="f-visitType"
                type="radio"
                name="visitType"
                value="home"
                checked={v.visitType === "home"}
                onChange={set("visitType")}
              />
              At my home
            </label>
          </div>
          <Err field="visitType" />
          {v.visitType === "home" && lab.homeCollectionFee > 0 && (
            <p className="muted tiny" style={{ margin: "6px 0 0" }}>
              Home collection: {money(lab.homeCollectionFee, lab)}
              {lab.homeCollectionNote ? `. ${lab.homeCollectionNote}` : ""}
            </p>
          )}
        </fieldset>
      )}

      {v.visitType === "home" && (
        <div>
          <label className="field-label" htmlFor="f-address">Home address</label>
          <textarea
            id="f-address"
            className={cls("address", "textarea")}
            value={v.address}
            onChange={set("address")}
            autoComplete="street-address"
            placeholder="House number, street, village or area"
            {...aria("address")}
          />
          <Err field="address" />
        </div>
      )}

      <div>
        <label className="field-label" htmlFor="f-date">
          Date <span className="muted">(optional)</span>
        </label>
        <input
          id="f-date"
          className={cls("date", "input")}
          value={date}
          onChange={(e) => onDate(e.target.value)}
          type="date"
          min={minDate}
          {...aria("date")}
        />
        <Err field="date" />
      </div>

      {date && (
        <div>
          <span className="field-label">Time</span>
          {availability?.loading && <p className="muted small" style={{ margin: 0 }}>Checking…</p>}
          {availability?.error && (
            <p className="err" style={{ margin: 0 }}>{availability.error}</p>
          )}
          {availability?.open === false && (
            <p className="err" style={{ margin: 0 }}>
              {availability.reason || "The lab is closed on this day."}
            </p>
          )}
          {availability?.slots?.length > 0 && (
            <>
              <div className="slots">
                {availability.slots.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className="slot"
                    aria-pressed={slot === s.label}
                    disabled={s.full}
                    onClick={() => onSlot(slot === s.label ? "" : s.label)}
                  >
                    {s.label}
                    <span className="muted tiny"> {s.start}–{s.end}</span>
                    {/* A struck-through greyed button told nobody why they
                        could not pick it. Say so, and warn when a slot is
                        nearly gone, which is also a reason to book now. */}
                    {s.full ? (
                      <span className="slot-tag slot-tag-full">Full</span>
                    ) : s.left <= 2 ? (
                      <span className="slot-tag">{s.left} left</span>
                    ) : null}
                  </button>
                ))}
              </div>
              <Err field="slot" />
              <p className="muted tiny" style={{ margin: "6px 0 0" }}>
                {prettyDate(date, lab)}
              </p>
            </>
          )}
        </div>
      )}

      <div>
        <label className="field-label" htmlFor="f-notes">
          Notes <span className="muted">(optional)</span>
        </label>
        <textarea
          id="f-notes"
          ref={notesRef}
          className={cls("notes", "textarea")}
          value={v.notes}
          onChange={set("notes")}
          placeholder="Other tests, or what your doctor wrote"
          {...aria("notes")}
        />
        <Err field="notes" />
      </div>

      <div>
        <label className="check" htmlFor="f-consent">
          <input
            id="f-consent"
            type="checkbox"
            checked={v.consent}
            onChange={set("consent")}
            {...aria("consent")}
          />
          <span>
            The lab may call or send me a WhatsApp message about this booking.{" "}
            {/* Opens in a new tab on purpose: tapping this should not throw away
                a half filled form. */}
            <a href="/privacy" target="_blank" rel="noopener">
              How my details are handled
            </a>
            .
          </span>
        </label>
        <Err field="consent" />
      </div>

      <button className="btn btn-primary btn-block" type="submit" disabled={sending}>
        {sending ? "Booking…" : "Confirm booking"}
      </button>

      <p className="muted tiny" style={{ margin: 0 }}>
        Your booking is saved with {lab.name} and they will contact you to confirm.
      </p>
    </form>
  );
});

export default BookingForm;
