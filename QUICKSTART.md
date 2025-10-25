# 🚀 WanderMind Quick Start

## ⚡ 5-Minute Setup

### 1. Get Your Claude API Key
Visit: https://console.anthropic.com/
- Create account or login
- Go to API Keys
- Create new key
- Copy the key (starts with `sk-ant-`)

### 2. Clone & Setup
```bash
git clone https://github.com/yuqiannemo/WanderMind.git
cd WanderMind
./setup.sh
```

### 3. Add API Key
Edit `backend/.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 4. Run
**Terminal 1 (Backend):**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### 5. Open
http://localhost:3000

---

## 📁 Project Structure
```
WanderMind/
├── frontend/          # Next.js app
│   ├── src/
│   │   ├── app/      # Pages (/, /onboard, /map)
│   │   ├── components/ # UI components
│   │   ├── lib/      # API client
│   │   └── types/    # TypeScript definitions
│   └── package.json
├── backend/           # FastAPI app
│   ├── main.py       # All API endpoints
│   ├── requirements.txt
│   └── .env          # Your API key here!
└── README.md
```

---

## 🎯 User Flow

1. **Splash Screen** (`/`) → Auto-redirects
2. **Onboarding** (`/onboard`) → Enter city, dates, interests
3. **Map View** (`/map`) → See recommendations, select attractions
4. **Generate Route** → Click button with 2+ attractions selected
5. **View Timeline** → See optimized itinerary
6. **Chat to Refine** → Modify route with natural language

---

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `frontend/src/app/onboard/page.tsx` | Onboarding form |
| `frontend/src/app/map/page.tsx` | Main map interface |
| `frontend/src/components/MapComponent.tsx` | Leaflet map |
| `frontend/src/components/ChatPanel.tsx` | Claude chat |
| `frontend/src/components/RouteTimeline.tsx` | Itinerary view |
| `backend/main.py` | All API endpoints + Claude integration |

---

## 🐛 Troubleshooting

### Backend won't start
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend errors
```bash
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```

### Map not showing
- Check browser console for Leaflet errors
- Verify internet connection (needs tile server)
- Hard refresh: Cmd/Ctrl + Shift + R

### Claude errors
- Verify API key in `backend/.env`
- Check API key is active in Anthropic Console
- Look at backend terminal for error details

---

## 💡 Demo Tips

### Best Test Cases
1. **Paris, 3 days, Museums + Food** - Classic European trip
2. **Tokyo, 2 days, Food + Shopping** - Busy Asian city
3. **Barcelona, 4 days, Architecture + Beach** - Mix of activities

### Chat Refinement Examples
- "Start day 1 at 11 AM instead"
- "Swap day 1 and day 2"
- "Add more time at the museum"
- "Move the park to the morning"

### Showcase Features
1. ✨ AI-powered recommendations (show Claude thinking)
2. 🗺️ Interactive map (click markers, see details)
3. 🎯 Smart route generation (optimized timing)
4. 💬 Natural language refinement (chat demo)
5. 📱 Beautiful UI (show animations, glass effects)

---

## 🎨 UI Highlights

- **Glass morphism** panels
- **Gradient buttons** (blue → purple)
- **Smooth animations** with Framer Motion
- **Interactive markers** with popups
- **Timeline view** with day grouping
- **Responsive design** (desktop-first)

---

## 🔧 Tech Stack

**Frontend:** Next.js 14, TypeScript, Tailwind CSS, React Leaflet, Framer Motion
**Backend:** Python FastAPI, Anthropic Claude, Geopy
**AI:** Claude 3.5 Sonnet

---

## 📊 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/init` | POST | Create session |
| `/api/recommend` | POST | Get attractions |
| `/api/route` | POST | Generate route |
| `/api/refine` | POST | Refine route |

---

## 🎓 Learning Resources

- **Next.js Docs:** https://nextjs.org/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Claude API:** https://docs.anthropic.com
- **Leaflet:** https://leafletjs.com
- **Tailwind:** https://tailwindcss.com

---

## 📝 Notes

- Sessions stored in memory (restart = lose data)
- Geocoding has fallback coordinates
- Claude sometimes needs prompt refinement
- Rate limits apply to Claude API
- Map requires internet for tiles

---

## ⭐ Features to Highlight

1. **Natural Language Input** - Just chat with Claude
2. **Real-time Updates** - Instant route generation
3. **Smart Optimization** - Considers time, distance, interests
4. **Beautiful UX** - Modern, intuitive interface
5. **Fully Functional MVP** - Built in 24 hours!

---

**Need help? Check DEVELOPMENT.md for detailed docs!**

Built with ❤️ for Calhacks
