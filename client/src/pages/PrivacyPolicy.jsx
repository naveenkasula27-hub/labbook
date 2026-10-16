/**
 * The privacy policy.
 *
 * Written to match what the code actually does, not what a template says.
 * If the system changes — a new tracker, a new place data is sent, an
 * automatic deletion rule — this page changes in the same commit.
 */
import LegalLayout from "./LegalLayout.jsx";

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy policy" updated="16 October 2026">
      <div className="legal-note">
        <p>
          <strong>The short version.</strong> If you booked a test, your details go to the
          lab you booked with, and to WhatsApp so the lab can message you. Nothing else.
          We do not sell anything to anyone, and the booking pages carry no advertising
          trackers at all.
        </p>
      </div>

      <p>
        LabBook is booking software for diagnostic labs, built and run by UnityWebWorks
        (Kasula Naveen Kumar, sole proprietor), Street No. 5, Manikeshnagar Colony,
        Tarnaka, Hyderabad, Telangana 500017.
      </p>

      <p>
        Two different sets of people use it, so this policy covers both: patients who book
        a test through a lab's page, and the lab staff who run the lab's dashboard.
      </p>

      <h2>If you booked a test</h2>

      <h3>What the lab asks you for</h3>
      <p>When you fill in a booking form, the form collects:</p>
      <ul>
        <li>Your name, age and gender</li>
        <li>Your mobile number</li>
        <li>Your email address, only if you choose to give one</li>
        <li>Which tests or health packages you picked</li>
        <li>The date and time slot you chose</li>
        <li>Whether you want the sample taken at the lab or at home</li>
        <li>Your address, only if you chose home collection</li>
        <li>Anything you type into the notes box</li>
      </ul>

      <p>
        Which tests you booked says something about your health. We treat it as sensitive
        and so should the lab. It is never used for advertising, never shared with anyone
        outside the list below, and it does not go to Meta, Google or any analytics service.
      </p>

      <h3>Who sees it</h3>
      <table>
        <thead>
          <tr><th>Who</th><th>What they get</th><th>Why</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>The lab you booked with</td>
            <td>Everything above</td>
            <td>They are the ones doing your test. This is the point of the booking.</td>
          </tr>
          <tr>
            <td>Meta (WhatsApp)</td>
            <td>Your mobile number and the text of the message</td>
            <td>To deliver your confirmation and your reminder. Meta handles this under its own terms.</td>
          </tr>
          <tr>
            <td>MongoDB Atlas</td>
            <td>The stored booking</td>
            <td>The database. Hosted in Mumbai, India.</td>
          </tr>
          <tr>
            <td>Vercel</td>
            <td>Traffic to the website</td>
            <td>Hosting the page you are reading.</td>
          </tr>
        </tbody>
      </table>

      <p>
        That is the whole list. Your details are not sold, rented, or handed to data
        brokers, insurers, employers, or other labs.
      </p>

      <h3>Who decides what happens to your data</h3>
      <p>
        The lab does. They chose to collect it and they decide how it is used in their
        business. UnityWebWorks provides the software and stores the data on the lab's
        behalf, and acts on their instructions. So if you want your booking changed or
        removed, the lab is the first place to ask — but you can write to us as well and
        we will deal with it.
      </p>

      <h3>Looking up your own booking</h3>
      <p>
        To see a booking you need the reference and the last four digits of the phone
        number it was made with. Guessing a reference on its own gets you nothing.
      </p>

      <h3>How long it is kept</h3>
      <p>
        Bookings are kept while the lab is using LabBook, so staff can look up a past
        visit. There is currently no automatic deletion after a fixed period. If you want
        your booking deleted, ask the lab or write to us and we will remove it, unless the
        lab has to keep it to meet a legal or medical record-keeping requirement.
      </p>

      <h3>What you can ask for</h3>
      <ul>
        <li>A copy of what is stored about you</li>
        <li>A correction, if something is wrong</li>
        <li>Deletion, subject to the point above</li>
        <li>To stop receiving WhatsApp messages about your bookings</li>
      </ul>
      <p>
        Write to hello@unitywebworks.com or message 77290 69137. Say which lab and give
        your booking reference so we can find it.
      </p>

      <h3>Children</h3>
      <p>
        Labs test children, so a booking may be in a child's name. In that case the adult
        making the booking is responsible for it, and we handle the child's details the
        same careful way as anyone else's.
      </p>

      <h2>If you run a lab</h2>
      <p>For a lab account we store:</p>
      <ul>
        <li>Your name and email address, used to sign in</li>
        <li>Your password, stored as a one-way hash — we cannot read it, and neither can anyone who steals the database</li>
        <li>When you last signed in</li>
        <li>Your lab's business details: name, phone, WhatsApp number, address, opening days, slots, tests and prices</li>
      </ul>
      <p>
        Your lab's business details and prices appear on your public booking page, because
        that is what the page is for. Your login details do not.
      </p>
      <p>
        Your dashboard login is kept in your browser's local storage so you are not asked
        to sign in on every visit. Signing out removes it.
      </p>

      <h2>Tracking, and where it is not</h2>
      <p>
        The LabBook front page at the root of this site carries the Meta advertising pixel,
        because that page is a sales page for lab owners and we run ads to it. It records
        that someone opened the page, clicked through to the demo, or tapped a WhatsApp
        button.
      </p>
      <p>
        <strong>It is not on the booking pages and not on the dashboard.</strong> This is
        deliberate. A booking page is where somebody chooses a blood test with their name
        and phone number on the screen, and sending that to an advertising network would
        mean telling Meta which medical tests a named person looked at. We do not do that,
        and we will not add it later.
      </p>
      <p>
        There are no other analytics services, no advertising cookies, and no third-party
        scripts on the booking pages.
      </p>

      <h2>Security</h2>
      <ul>
        <li>Everything is served over HTTPS</li>
        <li>Passwords are hashed with bcrypt, never stored in readable form</li>
        <li>The database sits in Mumbai and is reachable only with credentials held by UnityWebWorks</li>
        <li>Dashboard access needs a login; each lab sees only its own bookings</li>
        <li>Booking submissions are rate limited, which involves reading the sending network address at the moment of the request. It is used to count requests and is not stored with your booking.</li>
      </ul>
      <p>
        No system is perfectly secure. If something goes wrong in a way that affects you,
        we will say so rather than hope you do not notice.
      </p>

      <h2>The demo lab</h2>
      <p>
        Maheera Diagnostics is a sample lab used to show how LabBook works. It is not a
        real business. Anything booked on it is a demonstration, nothing is scheduled, and
        its data is wiped regularly. Do not put real patient details into it.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes, the date at the top changes with it. If a change is
        significant — a new place your data goes, say — labs using LabBook are told
        directly rather than left to spot it.
      </p>

      <h2>Contact</h2>
      <p>
        UnityWebWorks<br />
        Street No. 5, Manikeshnagar Colony, Tarnaka, Hyderabad, Telangana 500017<br />
        hello@unitywebworks.com · 77290 69137
      </p>
    </LegalLayout>
  );
}
