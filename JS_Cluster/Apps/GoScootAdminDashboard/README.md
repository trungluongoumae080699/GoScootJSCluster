# GoScoot Admin Dashboard

Admin dashboard for GoScoot bike/scooter rental service with real-time vehicle tracking.

## 🚀 How to Run

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

Get token: [Mapbox Account](https://account.mapbox.com/)

### 3. Start Development Server

```bash
npm run dev
```

Opens at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
src/
├── components/
│   ├── Header.tsx              # Reusable header component
│   └── Sidebar.tsx             # Navigation sidebar
├── hooks/
│   └── useMapAnimation.ts      # Map animation hook
├── App.tsx                     # Root component with routing
├── Map.tsx                     # Main map page (50 scooters + 1 bike)
├── BikeDetails.tsx             # Bike detail page
├── vehicleAnimation.ts         # Vehicle animation engine
├── BikeDetails.css             # Styles
└── main.tsx                    # Entry point
```

## 🔧 Tech Stack

- React 19 + TypeScript
- Vite
- Mapbox GL JS
- React Icons
