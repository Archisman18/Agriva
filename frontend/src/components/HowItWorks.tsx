export default function HowItWorks() {
  return (
    <section className="howitworks landing-section" id="howitworks">
      <div className="container">
        <div className="title">
          <h1>
            How it <span className="green">works</span>
          </h1>
        </div>
        <div className="content">
          <ol>
            <li>
              <h2>1. Location &amp; Mapping</h2>
              <p>
                Upon loading, the app captures your real-time GPS coordinates (with optional manual
                area selection). We leverage Leaflet.js, a lightweight open-source JS library, to
                render an interactive map — then overlay high-resolution Esri tiles (via Esri‑Leaflet
                plugin), pulling imagery and GIS layers such as soil composition and water bodies from
                multiple sources (USDA, USGS, GeoEye, etc.)
              </p>
            </li>
            <li>
              <h2>2. Data Collection &amp; Inputs</h2>
              <p>
                The map interface displays nearby water sources and soil types — if users have local
                knowledge, they can add or adjust these data points manually. You'll also input your
                budget, available farming tools, and a list of desired crops.
              </p>
            </li>
            <li>
              <h2>3. AI-Powered Crop Recommendation</h2>
              <p>
                Our backend uses a machine learning model (e.g., Random Forest or a specialized
                Transformative Crop Recommendation Model) trained on historical soil, weather, and
                yield data to calculate the optimal crop(s) based on your inputs. It predicts suitable
                plants, explains selections with feature importance, and offers monthly planting
                schedules, using explainable AI techniques like SHAP or LIME for transparency
              </p>
            </li>
            <li>
              <h2>4. Weather Risk Modeling</h2>
              <p>
                To mitigate climate uncertainty, we integrate real-time weather APIs and embed an
                AI-driven weather-risk predictor, which thresholds frost, drought, and heatwave
                probabilities. This is based on multivariate LSTM forecasting tuned for agriculture.
                The tool alerts you to month-specific risks and recommends remedies like delayed
                irrigation or drought-tolerant crops.
              </p>
            </li>
            <li>
              <h2>5. Visual Plan &amp; Outputs</h2>
              <p>Finally, results are presented in:</p>
              <ul>
                <li>Map overlays showing recommended crops per location</li>
                <li>An interactive crop calendar with optimal planting months</li>
                <li>A dashboard summarizing risk levels, resource needs, and cost breakdown</li>
              </ul>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
