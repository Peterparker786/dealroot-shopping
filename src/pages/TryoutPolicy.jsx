import { Link } from "react-router-dom";
import { FiCheckCircle, FiArrowLeft } from "react-icons/fi";

const SECTIONS = [
  {
    title: "1. Program Overview",
    body: "Dealroot Tryouts is our exclusive member community where approved members test new products at special member prices before everyone else. Members buy, share honest feedback, and earn rewards on their Tryout deals.",
  },
  {
    title: "2. Eligibility & Application",
    body: "You must have a registered DealRoot account to apply. Applications are reviewed manually by our team, and approval is not guaranteed. Membership is personal and non-transferable — sharing accounts or buying on behalf of non-members is not allowed.",
  },
  {
    title: "3. First-Time Users Only",
    body: "This Tryout program is for new users or first-time users only. If you have already tried this program before on any other platform (Freekamaal, Trybox, OPA, etc.), kindly do not join. DealRoot will not be responsible for your refund process or cashback issues in such cases.",
  },
  {
    title: "4. Member Deals & Pricing",
    body: "Tryout products are exclusive to approved members and stay separate from our regular store catalogue. Member prices and deals may change at any time and are subject to stock availability.",
  },
  {
    title: "5. Cashback & Rewards",
    body: "Cashback is added to your Tryout dashboard by our team after eligible purchases. Available cashback can be moved to pending, and once approved it becomes received. Cashback is not guaranteed and is awarded at DealRoot's discretion.",
  },
  {
    title: "6. Shipping & Refunds",
    body: "Standard shipping charges apply to Tryout orders. Shipping fees are non-refundable. Return or refund requests for Tryout products can be filed within 7 days of placing your order, following the same return policy as regular orders.",
  },
  {
    title: "7. Reviews & Conduct",
    body: "Members are encouraged to share honest reviews. Fake, paid or misleading reviews are strictly prohibited and may lead to loss of membership. DealRoot may feature your reviews on product pages.",
  },
  {
    title: "8. Termination",
    body: "DealRoot reserves the right to withdraw or disqualify Tryout membership at any time — for misuse, misleading reviews, violation of these terms, or any other reason at our discretion.",
  },
  {
    title: "9. Changes to the Program",
    body: "DealRoot may modify, pause or discontinue the Tryouts program or any of its benefits at any time without prior notice. Changes will be reflected on this page.",
  },
];

export default function TryoutPolicy() {
  return (
    <div className="tryout-policy-page">
      <div className="tryout-policy-head">
        <span className="eyebrow blue">DEALROOT TRYOUTS</span>
        <h1>Terms &amp; Conditions</h1>
        <p>
          Please read these terms carefully before applying for the Dealroot
          Tryouts program. By applying, you agree to the following rules.
        </p>
      </div>

      <div className="tryout-policy-card">
        {SECTIONS.map((section) => (
          <section className="tryout-policy-section" key={section.title}>
            <FiCheckCircle className="tryout-policy-icon" />
            <div>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </div>
          </section>
        ))}
      </div>

      <div className="tryout-policy-contact">
        <p>
          For any questions about the Tryouts program, contact us at{" "}
          <a href="mailto:dealroot.store@gmail.com">dealroot.store@gmail.com</a>{" "}
          or Telegram{" "}
          <a
            href="https://t.me/Tom_andrew72"
            target="_blank"
            rel="noreferrer"
          >
            @Tom_andrew72
          </a>
          .
        </p>
        <Link to="/tryouts" className="tryout-policy-back">
          <FiArrowLeft /> Back to Tryouts
        </Link>
      </div>
    </div>
  );
}
