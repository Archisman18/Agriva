import { useState } from 'react';

function FeatureCard({ feature }: { feature: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="col relative overflow-hidden cursor-pointer group select-none"
      onClick={() => setIsOpen(!isOpen)}
      style={{ padding: '0' }} // Reset padding so absolute positioning fills the card
    >
      {/* Background/Base content that blurs and scales */}
      <div className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-full h-full flex flex-col items-center justify-center p-6 ${
        isOpen ? 'scale-[1.15] blur-[4px] opacity-30' : 'scale-100 blur-0 opacity-100'
      }`}>
        <div className="icon">
          <i className={feature.icon}></i>
        </div>
        <h1 className="mb-0">{feature.title}</h1>
        {/* Click affordance */}
        <div className="mt-4 text-emerald-500/0 group-hover:text-emerald-500/50 transition-colors duration-300">
          <span className="text-xs font-bold uppercase tracking-widest mr-2">Click to read</span>
          <i className="fa-solid fa-hand-pointer animate-bounce"></i>
        </div>
      </div>

      {/* Pop-out Content Panel */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md px-5 pt-6 pb-5 shadow-[0_-15px_40px_rgba(0,0,0,0.1)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col items-start text-left border-t border-emerald-100 ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <h3 className="text-emerald-800 font-bold mb-1 text-lg">{feature.title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">{feature.description}</p>
        <button 
          className="w-full rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 transition-colors duration-300 hover:bg-emerald-100 font-semibold shadow-sm"
          onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

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
    {
      icon: 'fa-solid fa-robot',
      title: 'AI Chatbot',
      description:
        'Get instant, intelligent agricultural advice from our state-of-the-art AI assistant tailored to your specific field.',
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
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
