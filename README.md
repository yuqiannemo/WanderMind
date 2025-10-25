# 🧭 WanderMind

**Claude-Powered AI Travel Route Planner**

WanderMind is an intelligent travel planning application that uses Anthropic's Claude AI to create personalized travel itineraries. Built for Calhacks, it combines natural language processing with interactive mapping to deliver a seamless trip planning experience.

![WanderMind](https://img.shields.io/badge/AI-Claude%203.5-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)

## ✨ Features

- 🤖 **AI-Powered Recommendations**: Claude analyzes your preferences and suggests personalized attractions
- 🗺️ **Interactive Map Interface**: Beautiful Google Maps-style interface using React Leaflet
- 📍 **Smart Route Optimization**: Automatically generates efficient routes with travel times
- 💬 **Natural Language Refinement**: Chat with Claude to modify your itinerary
- 📅 **Multi-Day Planning**: Organize trips across multiple days with timeline view
- 🎨 **Modern UI/UX**: Sleek, responsive design with smooth animations

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Maps**: React Leaflet + OpenStreetMap
- **Icons**: Lucide React
- **Language**: TypeScript

### Backend
- **Framework**: FastAPI (Python)
- **AI**: Anthropic Claude 3.5 Sonnet
- **Geocoding**: Geopy + Nominatim
- **API**: RESTful endpoints

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.8+
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/yuqiannemo/WanderMind.git
cd WanderMind
```

#### 2. Set up the Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

#### 3. Set up the Frontend
```bash
cd ../frontend

# Install dependencies
npm install
# or
yarn install

# Configure environment (optional)
cp .env.local.example .env.local
```

### Running the Application

#### Terminal 1 - Backend
```bash
cd backend
source venv/bin/activate
python main.py
```
The API will be available at `http://localhost:8000`

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
# or
yarn dev
```
The app will be available at `http://localhost:3000`

## 📖 Usage Guide

### 1. Onboarding
- Enter your destination city
- Select travel dates
- Choose your interests from predefined tags

### 2. Explore Attractions
- View AI-recommended attractions on the map
- Click markers to see details
- Select attractions you want to visit
- Minimum 2 attractions required for route generation

### 3. Generate Route
- Click "Generate Route" button
- Claude optimizes the order and timing
- View your itinerary in the timeline panel
- Route shows on map with numbered markers

### 4. Refine Your Route
- Open the chat panel
- Ask Claude to modify your itinerary
  - "Swap day 1 and day 2"
  - "Start later in the morning"
  - "Add more time at the museum"
- Claude updates your route in real-time

## 🔧 API Endpoints

### `POST /api/init`
Initialize a new travel session
```json
{
  "city": "Paris",
  "startDate": "2025-11-01",
  "endDate": "2025-11-03",
  "interests": ["Museums", "Food & Dining"]
}
```

### `POST /api/recommend`
Get AI-powered attraction recommendations
```json
{
  "session_id": "uuid"
}
```

### `POST /api/route`
Generate optimized route
```json
{
  "session_id": "uuid",
  "attractions": [...]
}
```

### `POST /api/refine`
Refine route based on user message
```json
{
  "session_id": "uuid",
  "message": "Make day 1 start later",
  "current_route": {...}
}
```

## 🎨 Design Philosophy

- **Minimalist & Elegant**: Clean interface inspired by Notion and Google Maps
- **Glass Morphism**: Modern frosted glass effects for panels
- **Smooth Animations**: Framer Motion for delightful interactions
- **Responsive**: Desktop-first but mobile-friendly
- **Accessible**: Semantic HTML and ARIA labels

## 🏆 Hackathon Features

Built for **Calhacks** in 24 hours, WanderMind showcases:
- ✅ Rapid prototyping with modern frameworks
- ✅ Claude AI integration for intelligent recommendations
- ✅ Complex state management with React hooks
- ✅ Real-time map interactions
- ✅ Beautiful, production-ready UI
- ✅ Full-stack TypeScript/Python implementation

## 🔮 Future Enhancements

- [ ] User authentication and saved trips
- [ ] Real-time collaboration
- [ ] Integration with booking platforms
- [ ] Weather and events data
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Budget tracking
- [ ] Restaurant reservations

## 🛠️ Tech Stack Details

### Frontend Dependencies
- `next` - React framework with App Router
- `react-leaflet` - React wrapper for Leaflet maps
- `framer-motion` - Animation library
- `lucide-react` - Icon library
- `axios` - HTTP client
- `tailwindcss` - Utility-first CSS

### Backend Dependencies
- `fastapi` - Modern Python web framework
- `anthropic` - Official Claude SDK
- `geopy` - Geocoding library
- `uvicorn` - ASGI server
- `pydantic` - Data validation

## 📝 License

MIT License - see LICENSE file for details

## 👥 Authors

Built with ❤️ for Calhacks

## 🙏 Acknowledgments

- Anthropic for Claude AI
- OpenStreetMap contributors
- Leaflet team
- Vercel for Next.js

---

**Happy Wandering! 🌍✈️**
CalHacks 12.0
