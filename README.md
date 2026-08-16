# 🌱 Agriva

Agriva is an intelligent, AI-powered agricultural planning platform designed to empower farmers with data-driven decision-making. By leveraging real-time satellite data, soil composition analysis, and advanced AI models, Agriva takes the guesswork out of farming and helps optimize crop yields, manage climate risks, and streamline budgeting.

## 🚀 Key Features
- **🌍 Interactive Map & Real-time Geocoding**: Instantly search for any field globally using the high-speed Photon API autocomplete, or select coordinates manually via an interactive map.
- **🌤️ Hyper-Local Climate & Weather Data**: Integrates with the **Open-Meteo API** to pull real-time elevation, 14-day rainfall probabilities, and 0-7cm soil moisture levels.
- **🔬 Scientific Soil Analysis**: Connects directly to the **ISRIC SoilGrids API** to determine accurate soil textures (Sand/Silt/Clay ratios), pH levels, and nitrogen content for any GPS coordinate.
- **💧 Water Source Detection**: Utilizes **OpenStreetMap's Overpass API** to scan a 5km radius for the nearest lakes, rivers, reservoirs, and springs.
- **🤖 Groq AI Advisor & Analysis Engine**: Powered by **Llama 3.3 70B** via Groq, providing lightning-fast custom crop recommendations, suitability assessments, and dynamic rotation planning based on real geographic variables.
- **💬 Conversational AI Assistant**: Ask questions and get instant agricultural advice through the integrated chat widget.

## 🛠️ Tech Stack
**Frontend:**
- React 18 & Vite
- TypeScript
- Tailwind CSS
- Leaflet (Interactive Maps)

**Backend:**
- Python 3.13
- FastAPI (High-performance API framework)
- Uvicorn (ASGI server)
- HTTPX (Async API requests)

## ⚙️ Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/Archisman18/Agriva.git
cd Agriva
```

### 2. Backend Setup
Navigate to the backend directory and set up your Python environment:
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory and add your Groq API key:
```env
GROQ_API_KEY=your_groq_api_key_here
```

Start the backend server:
```bash
uvicorn app.main:app --reload
```
*The backend will run on `http://127.0.0.1:8000`*

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
*The frontend will be accessible at `http://localhost:5173`*

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature-name`)
3. Commit changes (`git commit -m "Add feature-name"`)
4. Push your branch (`git push origin feature-name`)
5. Submit a pull request