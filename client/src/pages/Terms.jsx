/**
 * Terms of service, written for the lab owner who is deciding whether to use
 * this. Short sentences, no clauses nobody reads, and honest about what is not
 * promised — uptime, WhatsApp delivery, medical responsibility.
 */
import LegalLayout from "./LegalLayout.jsx";

export default function Terms() {
  return (
    <LegalLayout title="Terms of service" updated="16 October 2026">
      <div className="legal-note">
        <p>
          <strong>The short version.</strong> We build your booking page, you try it free,
          and you only pay if you decide to keep it. Your patients' data stays yours. You
          can leave whenever you like and take it with you.
        </p>
      </div>

      <p>
        These terms cover LabBook, booking software for diagnostic labs, provided by
        UnityWebWorks (Kasula Naveen Kumar, sole proprietor), Hyderabad, Telangana. They
        apply between UnityWebWorks and the lab using LabBook. Patients booking a test are
        covered by the <a href="/privacy">privacy policy</a> instead.
      </p>

      <h2>1. What LabBook does</h2>
      <p>
        LabBook gives your lab a public booking page with your own tests and prices, and a
        dashboard where bookings arrive. Patients pick tests and a time slot, and you work
        through the day marking each booking confirmed, sample taken and report ready.
        WhatsApp messages are sent to the patient and to you.
      </p>

      <h2>2. Trying it before paying</h2>
      <p>
        We set your page up with your tests and prices and send you the link. You try it
        for as long as you reasonably need, show it to whoever you want, and decide. If it
        is not useful to you, that is the end of it and you owe nothing.
      </p>
      <p>
        If you keep it, we agree the fee in writing first — over WhatsApp or email is fine.
        No fee is ever charged without you agreeing to it beforehand.
      </p>

      <h2>3. What your lab is responsible for</h2>
      <ul>
        <li>
          Keeping your tests, prices and timings correct. If a price on your page is wrong,
          patients will see the wrong price.
        </li>
        <li>
          Honouring the bookings you accept, or telling the patient promptly if you cannot.
        </li>
        <li>
          Keeping your dashboard login private, and telling us if you think somebody else
          has it.
        </li>
        <li>
          Handling your patients' data lawfully. You decide why it is collected, so under
          data protection law you are the one answerable for it. We store and process it on
          your instructions.
        </li>
        <li>
          Holding whatever licences and registrations a diagnostic lab needs where you
          operate.
        </li>
      </ul>

      <h2>4. What LabBook is not</h2>
      <ul>
        <li>
          It is not a medical service. It does not diagnose anything, interpret results, or
          advise patients. It books appointments.
        </li>
        <li>
          It does not take payments. Patients pay you directly, however you normally collect.
          Prices on the page are estimates for the patient's information.
        </li>
        <li>
          It does not store test reports or results. Only the booking and its status.
        </li>
      </ul>

      <h2>5. WhatsApp messages</h2>
      <p>
        Messages are delivered through Meta's WhatsApp Business Platform. That means a few
        things worth being plain about:
      </p>
      <ul>
        <li>
          Delivery depends on Meta, not on us. We cannot guarantee a message arrives, or
          arrives at a particular time.
        </li>
        <li>
          Meta charges per message. If your volume means those charges are yours to cover,
          we agree that in writing beforehand.
        </li>
        <li>
          Meta sets the rules on what a business may send. Templates have to be approved by
          them, and they can reject or withdraw one.
        </li>
        <li>
          A patient can block your number, and then they stop receiving messages.
        </li>
      </ul>

      <h2>6. Uptime</h2>
      <p>
        We do not promise a specific uptime figure, and we would rather say so than print a
        number we cannot stand behind. LabBook runs on Vercel and MongoDB Atlas, and when
        they have an outage, so do we.
      </p>
      <p>
        What we do commit to: if your page goes down and you tell us, we treat it as urgent
        and keep you informed while we fix it.
      </p>

      <h2>7. Your data, and leaving</h2>
      <p>
        Your bookings and your lab's details are yours. If you stop using LabBook, ask and
        we will send you an export of your data. Say the word and we delete it from our
        systems, except anything we are required to keep.
      </p>
      <p>
        We do not use your patients' data for anything other than running your booking page.
        We do not sell it, and we do not use it to build anything else.
      </p>

      <h2>8. Stopping</h2>
      <p>
        You can stop using LabBook whenever you want. Tell us and we will take your page
        down.
      </p>
      <p>
        We may stop providing it if a lab uses it for something unlawful, sends messages
        that get the WhatsApp number restricted, or does not pay an agreed fee after being
        asked. In that case we give reasonable notice and your data export first, unless
        the problem is serious enough to need stopping immediately.
      </p>

      <h2>9. Liability</h2>
      <p>
        LabBook is software, and software has bugs. We fix them as fast as we can, and
        several parts of the system have automated tests specifically to stop the expensive
        kinds of mistake, such as two patients being given the same slot.
      </p>
      <p>
        What we are not able to take on is the downstream cost of something going wrong in
        your business: a missed appointment, lost revenue, or a patient who did not turn up.
        Our liability is limited to the fees you have paid us in the three months before the
        problem. Nothing here limits liability where the law does not allow it to be limited.
      </p>

      <h2>10. Changes to these terms</h2>
      <p>
        If these terms change, the date at the top changes and labs using LabBook are told
        directly. If you do not accept a change, you can stop using it and take your data.
      </p>

      <h2>11. Which law applies</h2>
      <p>
        Indian law, with the courts at Hyderabad, Telangana. If something goes wrong,
        though, call before you call a lawyer — most things are a misunderstanding that
        takes ten minutes to sort out.
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
