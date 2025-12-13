# GoScoot Admin Dashboard

Admin dashboard for GoScoot bike/scooter rental service with real-time vehicle tracking.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Mapbox Access Token ([Get free token](https://account.mapbox.com/))

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd <repository-name>
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

4. **Run the development server**

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Build for Production

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

## 🛠️ Tech Stack

- React 19 + TypeScript
- Vite
- Mapbox GL JS
- React Icons
