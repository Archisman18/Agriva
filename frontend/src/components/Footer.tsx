export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-emerald-900/30">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-leaf text-emerald-500 text-xl"></i>
            <h2 className="text-2xl font-bold text-white font-heading">Agriva</h2>
          </div>
          <p className="text-sm text-slate-400 max-w-sm">
            Empowering modern farmers with AI-driven insights, climate analysis, and sustainable agricultural tools for a better harvest.
          </p>
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-4">
          <p className="text-sm text-slate-500 mt-2">
            Designed to help you grow smarter.
          </p>
        </div>
      </div>
    </footer>
  );
}
