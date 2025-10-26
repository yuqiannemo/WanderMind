from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import anthropic
import os
import json
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv
from geopy.geocoders import Nominatim
import logging
from auth import (
    UserCreate, UserLogin, User, UserInDB, Token, TokenData,
    users_db, get_user, authenticate_user, create_access_token,
    decode_token, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
)

# Load environment variables
load_dotenv()
frontend_url = os.getenv("FRONTEND_URL", "https://wander-mind-steel.vercel.app")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="WanderMind API")

# CORS configuration - must be one of the first middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["*"],
    max_age=3600,
)

# Initialize Anthropic client
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# In-memory session storage (replace with Redis/DB for production)
sessions = {}

# In-memory trip plan storage
trip_plans = {}  # user_email -> list of saved plans

# Geocoder for location coordinates
geolocator = Nominatim(user_agent="wandermind")


# Models
class InitRequest(BaseModel):
    city: str
    startDate: str
    endDate: str
    interests: List[str]


class UserSession(BaseModel):
    sessionId: str
    city: str
    startDate: str
    endDate: str
    interests: List[str]
    cityCoordinates: Optional[List[float]] = None
    userId: Optional[str] = None


class Attraction(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    duration_hr: float
    category: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    coordinates: Optional[List[float]] = None


class RecommendRequest(BaseModel):
    session_id: str


class RecommendResponse(BaseModel):
    attractions: List[Attraction]


class RouteStop(BaseModel):
    attraction: Attraction
    order: int
    startTime: str
    endTime: str
    travelTimeToNext: Optional[int] = None
    day: int


class RouteRequest(BaseModel):
    session_id: str
    attractions: List[Attraction]


class TravelRoute(BaseModel):
    stops: List[RouteStop]
    totalDuration: float
    summary: str


class RefineRequest(BaseModel):
    session_id: str
    message: str
    current_route: TravelRoute


class SavedTripPlan(BaseModel):
    id: str
    userId: str
    city: str
    startDate: str
    endDate: str
    interests: List[str]
    route: TravelRoute
    savedAt: str
    title: Optional[str] = None


class SavePlanRequest(BaseModel):
    session_id: str
    route: TravelRoute
    title: Optional[str] = None


# Helper functions
def get_coordinates(city: str, attraction_name: str = None):
    """Get coordinates for a city or specific attraction."""
    try:
        if attraction_name:
            query = f"{attraction_name}, {city}"
        else:
            query = city
        
        location = geolocator.geocode(query, timeout=10)
        if location:
            return [location.latitude, location.longitude]
    except Exception as e:
        logger.error(f"Geocoding error for {query}: {e}")
    
    # Fallback coordinates (major cities)
    fallback_coords = {
        "paris": [48.8566, 2.3522],
        "tokyo": [35.6762, 139.6503],
        "new york": [40.7128, -74.0060],
        "london": [51.5074, -0.1278],
        "san francisco": [37.7749, -122.4194],
        "los angeles": [34.0522, -118.2437],
        "rome": [41.9028, 12.4964],
        "barcelona": [41.3851, 2.1734],
        "singapore": [1.3521, 103.8198],
        "sydney": [-33.8688, 151.2093],
        "dubai": [25.2048, 55.2708],
        "bangkok": [13.7563, 100.5018],
        "hong kong": [22.3193, 114.1694],
        "berlin": [52.5200, 13.4050],
        "amsterdam": [52.3676, 4.9041],
        "madrid": [40.4168, -3.7038],
    }
    
    city_lower = city.lower()
    for key, coords in fallback_coords.items():
        if key in city_lower:
            return coords
    
    return [48.8566, 2.3522]  # Default to Paris


def call_claude(prompt: str, system_prompt: str = None) -> str:
    """Call Claude API with the given prompt."""
    try:
        # Use claude-3-haiku-20240307 (works with free tier API keys)
        # For production, upgrade to claude-3-5-sonnet-20241022 for better results
        message = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=4096,
            system=system_prompt if system_prompt else "You are a helpful travel planning assistant.",
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text
    except Exception as e:
        logger.error(f"Claude API error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


# Authentication helper
async def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[User]:
    """Get current user from JWT token."""
    logger.info(f"get_current_user called with authorization: {authorization[:20] if authorization else 'None'}...")
    
    if not authorization:
        logger.warning("No authorization header provided")
        return None
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            logger.warning(f"Invalid auth scheme: {scheme}")
            return None
        
        token_data = decode_token(token)
        if not token_data or not token_data.email:
            logger.warning("Invalid or expired token")
            return None
        
        user = get_user(token_data.email)
        if not user:
            logger.warning(f"User not found for email: {token_data.email}")
            return None
        
        # Return User model (without password)
        logger.info(f"User authenticated: {user.email}")
        return User(
            id=user.id,
            email=user.email,
            name=user.name,
            interests=user.interests,
            created_at=user.created_at
        )
    except Exception as e:
        logger.error(f"Error in get_current_user: {e}")
        return None


# Endpoints
@app.get("/")
def read_root():
    return {"message": "WanderMind API is running"}


# Authentication endpoints
@app.post("/api/auth/signup", response_model=Token)
async def signup(user_data: UserCreate):
    """Register a new user."""
    if get_user(user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user_in_db = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "hashed_password": hashed_password,
        "interests": [],
        "created_at": datetime.utcnow().isoformat(),
    }
    
    users_db[user_data.email] = user_in_db
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data.email}, expires_delta=access_token_expires
    )
    
    user = User(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        interests=[],
        created_at=user_in_db["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user)


@app.post("/api/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user."""
    user = authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    user_data = User(
        id=user.id,
        email=user.email,
        name=user.name,
        interests=user.interests,
        created_at=user.created_at
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_data)


@app.get("/api/auth/me", response_model=User)
async def get_me(current_user: Optional[User] = Depends(get_current_user)):
    """Get current user info."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return current_user


@app.put("/api/auth/preferences")
async def update_preferences(
    interests: List[str],
    current_user: Optional[User] = Depends(get_current_user)
):
    """Update user interests/preferences."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if current_user.email in users_db:
        users_db[current_user.email]["interests"] = interests
        return {"message": "Preferences updated successfully", "interests": interests}
    
    raise HTTPException(status_code=404, detail="User not found")


@app.post("/api/init", response_model=UserSession)
async def initialize_session(
    request: InitRequest,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Initialize a new travel planning session."""
    session_id = str(uuid.uuid4())
    
    # Get city coordinates
    city_coords = get_coordinates(request.city)
    
    # Auto-save preferences if user is logged in
    user_id = None
    if current_user:
        user_id = current_user.id
        if current_user.email in users_db:
            users_db[current_user.email]["interests"] = request.interests
    
    session = {
        "sessionId": session_id,
        "city": request.city,
        "startDate": request.startDate,
        "endDate": request.endDate,
        "interests": request.interests,
        "cityCoordinates": city_coords,
        "userId": user_id,
    }
    
    sessions[session_id] = session
    logger.info(f"Created session {session_id} for {request.city}")
    
    return UserSession(**session)


@app.post("/api/recommend", response_model=RecommendResponse)
async def recommend_attractions(request: RecommendRequest):
    """Get AI-powered attraction recommendations."""
    session = sessions.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Calculate trip duration
    start = datetime.fromisoformat(session["startDate"])
    end = datetime.fromisoformat(session["endDate"])
    days = (end - start).days + 1
    
    # Create prompt for Claude
    prompt = f"""You are an expert travel planner. Generate attraction recommendations for a trip.

Location: {session['city']}
Duration: {days} days
Interests: {', '.join(session['interests'])}

Generate 8-10 diverse attractions that match the user's interests. Return ONLY a valid JSON array with this exact structure:
[
  {{
    "name": "Attraction Name",
    "description": "Brief engaging description (1-2 sentences)",
    "duration_hr": 2.5,
    "category": "Museum"
  }}
]

Categories should be one of: Museum, Historical Site, Nature & Parks, Food & Dining, Shopping, Entertainment, Architecture, Cultural Experience, Adventure, Beach

Ensure the JSON is properly formatted and parseable. Do not include any text before or after the JSON array."""

    system_prompt = "You are a travel expert who returns responses in valid JSON format only."
    
    try:
        response = call_claude(prompt, system_prompt)
        
        # Extract JSON from response
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:]
        if response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
        response = response.strip()
        
        attractions_data = json.loads(response)
        
        # Add coordinates and IDs to attractions
        attractions = []
        city_coords = session.get("cityCoordinates", [48.8566, 2.3522])
        
        for idx, attr in enumerate(attractions_data):
            # Try to get specific coordinates, fallback to city center with slight offset
            coords = get_coordinates(session['city'], attr['name'])
            if coords == city_coords and idx > 0:
                # Add small random offset to avoid overlapping markers
                import random
                coords = [
                    coords[0] + random.uniform(-0.02, 0.02),
                    coords[1] + random.uniform(-0.02, 0.02)
                ]
            
            attraction = Attraction(
                id=str(uuid.uuid4()),
                name=attr['name'],
                description=attr['description'],
                duration_hr=attr['duration_hr'],
                category=attr['category'],
                latitude=coords[0],
                longitude=coords[1],
                coordinates=coords
            )
            attractions.append(attraction)
        
        logger.info(f"Generated {len(attractions)} attractions for session {request.session_id}")
        return RecommendResponse(attractions=attractions)
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}\nResponse: {response}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")


@app.post("/api/route", response_model=TravelRoute)
async def generate_route(request: RouteRequest):
    """Generate an optimized travel route."""
    session = sessions.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if len(request.attractions) < 2:
        raise HTTPException(status_code=400, detail="At least 2 attractions required")
    
    # Calculate trip duration
    start = datetime.fromisoformat(session["startDate"])
    end = datetime.fromisoformat(session["endDate"])
    days = (end - start).days + 1
    
    # Create attraction list for prompt
    attractions_text = "\n".join([
        f"- {a.name} ({a.category}, {a.duration_hr}h)"
        for a in request.attractions
    ])
    
    prompt = f"""You are an expert travel planner. Create an optimized itinerary.

Location: {session['city']}
Duration: {days} days
Selected Attractions:
{attractions_text}

Create a logical route that:
1. Groups nearby attractions
2. Considers opening hours (assume museums 10am-6pm, outdoor sites 8am-8pm)
3. Includes realistic travel times (15-30 min between stops)
4. Balances each day (6-8 hours of activities)
5. Starts at 9:00 AM each day

Return ONLY a valid JSON object with this structure:
{{
  "stops": [
    {{
      "attraction_name": "Name",
      "order": 1,
      "day": 1,
      "startTime": "09:00",
      "endTime": "11:00",
      "travelTimeToNext": 20
    }}
  ],
  "summary": "A natural language summary of the itinerary (2-3 sentences)"
}}

Ensure order starts at 1 and increments. The last stop of each day should have travelTimeToNext: null.
Return ONLY valid JSON, no other text."""

    system_prompt = "You are a travel expert who returns responses in valid JSON format only."
    
    try:
        response = call_claude(prompt, system_prompt)
        
        # Extract JSON from response
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:]
        if response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
        response = response.strip()
        
        route_data = json.loads(response)
        
        # Match attractions and create RouteStop objects
        attraction_map = {a.name: a for a in request.attractions}
        stops = []
        
        for stop in route_data['stops']:
            attraction = attraction_map.get(stop['attraction_name'])
            if attraction:
                route_stop = RouteStop(
                    attraction=attraction,
                    order=stop['order'],
                    day=stop['day'],
                    startTime=stop['startTime'],
                    endTime=stop['endTime'],
                    travelTimeToNext=stop.get('travelTimeToNext')
                )
                stops.append(route_stop)
        
        total_duration = sum(s.attraction.duration_hr for s in stops)
        
        travel_route = TravelRoute(
            stops=stops,
            totalDuration=total_duration,
            summary=route_data.get('summary', 'Your personalized itinerary is ready!')
        )
        
        logger.info(f"Generated route with {len(stops)} stops for session {request.session_id}")
        return travel_route
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}\nResponse: {response}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")


@app.post("/api/refine", response_model=TravelRoute)
async def refine_route(request: RefineRequest):
    """Refine the route based on user feedback."""
    session = sessions.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Convert current route to text
    current_route_text = "\n".join([
        f"Day {stop.day}, Stop {stop.order}: {stop.attraction.name} ({stop.startTime}-{stop.endTime})"
        for stop in request.current_route.stops
    ])
    
    prompt = f"""You are a travel planner helping refine an itinerary.

Current Route:
{current_route_text}

User Request: {request.message}

Modify the route according to the user's request. Return ONLY a valid JSON object with this structure:
{{
  "stops": [
    {{
      "attraction_name": "Name",
      "order": 1,
      "day": 1,
      "startTime": "09:00",
      "endTime": "11:00",
      "travelTimeToNext": 20
    }}
  ],
  "summary": "A natural language summary explaining the changes made (2-3 sentences)"
}}

Return ONLY valid JSON, no other text."""

    system_prompt = "You are a travel expert who returns responses in valid JSON format only."
    
    try:
        response = call_claude(prompt, system_prompt)
        
        # Extract JSON from response
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:]
        if response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
        response = response.strip()
        
        route_data = json.loads(response)
        
        # Match attractions from current route
        attraction_map = {s.attraction.name: s.attraction for s in request.current_route.stops}
        stops = []
        
        for stop in route_data['stops']:
            attraction = attraction_map.get(stop['attraction_name'])
            if attraction:
                route_stop = RouteStop(
                    attraction=attraction,
                    order=stop['order'],
                    day=stop['day'],
                    startTime=stop['startTime'],
                    endTime=stop['endTime'],
                    travelTimeToNext=stop.get('travelTimeToNext')
                )
                stops.append(route_stop)
        
        total_duration = sum(s.attraction.duration_hr for s in stops)
        
        travel_route = TravelRoute(
            stops=stops,
            totalDuration=total_duration,
            summary=route_data.get('summary', 'Your itinerary has been updated!')
        )
        
        logger.info(f"Refined route for session {request.session_id}")
        return travel_route
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}\nResponse: {response}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")


@app.post("/api/plans/save", response_model=SavedTripPlan)
async def save_trip_plan(
    request: SavePlanRequest,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Save a trip plan to user's history."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = sessions.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    plan_id = str(uuid.uuid4())
    title = request.title or f"{session['city']} Trip - {datetime.now().strftime('%B %Y')}"
    
    saved_plan = {
        "id": plan_id,
        "userId": current_user.id,
        "city": session['city'],
        "startDate": session['startDate'],
        "endDate": session['endDate'],
        "interests": session['interests'],
        "route": request.route.dict(),
        "savedAt": datetime.utcnow().isoformat(),
        "title": title,
    }
    
    # Initialize user's plan list if it doesn't exist
    if current_user.email not in trip_plans:
        trip_plans[current_user.email] = []
    
    trip_plans[current_user.email].append(saved_plan)
    
    logger.info(f"Saved trip plan {plan_id} for user {current_user.email}")
    return SavedTripPlan(**saved_plan)


@app.get("/api/plans", response_model=List[SavedTripPlan])
async def get_user_plans(current_user: Optional[User] = Depends(get_current_user)):
    """Get all saved trip plans for the current user."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_plans = trip_plans.get(current_user.email, [])
    return [SavedTripPlan(**plan) for plan in user_plans]


@app.get("/api/plans/{plan_id}", response_model=SavedTripPlan)
async def get_plan_by_id(
    plan_id: str,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get a specific trip plan by ID."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_plans = trip_plans.get(current_user.email, [])
    for plan in user_plans:
        if plan['id'] == plan_id:
            return SavedTripPlan(**plan)
    
    raise HTTPException(status_code=404, detail="Plan not found")


@app.delete("/api/plans/{plan_id}")
async def delete_plan(
    plan_id: str,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Delete a saved trip plan."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if current_user.email not in trip_plans:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    user_plans = trip_plans[current_user.email]
    trip_plans[current_user.email] = [p for p in user_plans if p['id'] != plan_id]
    
    logger.info(f"Deleted trip plan {plan_id} for user {current_user.email}")
    return {"message": "Plan deleted successfully"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
