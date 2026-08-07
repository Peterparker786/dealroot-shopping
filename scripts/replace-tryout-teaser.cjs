// Replace the full Dealroot Tryouts section in Home.jsx with a compact teaser.
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "src", "pages", "Home.jsx");
let src = fs.readFileSync(file, "utf8");

const startMarker = "      {/* Dealroot Tryouts */}";
const endMarker = "      {/* Why Shop With Us */}";

const startIdx = src.indexOf(startMarker);
const endIdx = src.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
  console.error("Markers not found — aborting.");
  process.exit(1);
}

const teaser = `      {/* Dealroot Tryouts — teaser */}
      <section className="section tryout-section tryout-teaser-section" id="tryouts">
        <div className="tryout-pills">
          <span className="tryout-pill">✦ WELCOME TO</span>
          <span className="tryout-pill tryout-pill-main">DEALROOT TESTERS COMMUNITY</span>
          <span className="tryout-pill">Buy › Share Feedback › Get Rewards</span>
        </div>

        <Link to="/tryouts" className="tryout-teaser">
          <span className="tryout-teaser-emoji">🛍️</span>
          <div className="tryout-teaser-copy">
            <b>Tryout deals</b>
            <p>New exclusive member products will appear here shortly.</p>
          </div>
          <span className="tryout-teaser-cta">Explore Tryout deals →</span>
        </Link>
      </section>

`;

src = src.slice(0, startIdx) + teaser + src.slice(endIdx);
fs.writeFileSync(file, src);
console.log("Tryouts teaser installed in Home.jsx.");
