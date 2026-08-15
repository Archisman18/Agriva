export default function KeyFeatures() {
  const features = [
    {
      icon: 'fa-solid fa-map-location-dot',
      title: 'Interactive Maps',
      description:
        'Explore dynamic maps showing water sources, soil types, and climate zones instantly.',
    },
    {
      icon: 'fa-solid fa-tractor',
      title: 'Farming Tools',
      description:
        'Access essential tools to plan crops, budget resources, and manage agricultural needs.',
    },
    {
      icon: 'fa-solid fa-chart-simple',
      title: 'Historical Analysis',
      description:
        'Analyze past weather and soil data to make smarter farming decisions today.',
    },
  ];

  return (
    <section className="keyfeatures landing-section" id="keyfeatures">
      <div className="container">
        <div className="title">
          <h1>
            Key <span className="green">features</span>
          </h1>
        </div>
        <div className="row">
          {features.map((feature, index) => (
            <div className="col" key={index}>
              <div className="icon">
                <i className={feature.icon}></i>
              </div>
              <h1>{feature.title}</h1>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
