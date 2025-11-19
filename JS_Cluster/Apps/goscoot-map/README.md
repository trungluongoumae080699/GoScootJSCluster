# GoScoot Map - Animated Scooter Visualization

An interactive map application built with React, TypeScript, and Mapbox GL JS that displays animated scooters moving around Ho Chi Minh City with realistic routing and collision avoidance.

## 🚀 Features

- **Interactive Mapbox Map**: Full-featured map with zoom, pan, and navigation controls
- **50 Animated Scooters**: Realistic scooter traffic simulation across HCM City
- **Smart Routing**: Scooters follow actual roads using Mapbox Directions API
- **Collision Avoidance**: Intelligent system prevents scooters from overlapping
- **Smooth Animation**: 60 FPS animation using requestAnimationFrame
- **Responsive Design**: Works on desktop and tablet devices

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Mapbox Access Token** - [Get one free here](https://account.mapbox.com/access-tokens/)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd GoScootJSCluster/JS_Cluster/Apps/goscoot-map
```

### 2. Install Dependencies

```bash
npm install
```

Or if you prefer yarn:

```bash
yarn install
```

### 3. Configure Mapbox Token

Create a `.env` file in the project root:

```bash
# Create .env file
touch .env
```

Add your Mapbox access token to the `.env` file:

```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

**Important**: Replace `your_mapbox_token_here` with your actual Mapbox access token.

#### How to Get a Mapbox Token:

1. Go to [Mapbox Account](https://account.mapbox.com/)
2. Sign up or log in
3. Navigate to "Access Tokens"
4. Create a new token or copy your default public token
5. Paste it in your `.env` file

## 🚀 Running the Application

### Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

The application will open at `http://localhost:5173` (or another port if 5173 is busy).

### Production Build

Build the application for production:

```bash
npm run build
```

The optimized files will be in the `dist` folder.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## 📁 Project Structure

```
goscoot-map/
├── public/
│   └── scooter_type.png          # Scooter marker icon
├── src/
│   ├── Map.tsx                    # Main map component (UI & map setup)
│   ├── scooterAnimation.ts        # Scooter animation logic (50 scooters)
│   ├── main.tsx                   # React entry point
│   └── index.css                  # All application styles
├── .env                           # Environment variables (create this)
├── package.json                   # Project dependencies
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite build configuration
└── README.md                      # This file
```

**Optimized Structure:**
- ✅ Only 4 source files (minimal and clean)
- ✅ Single CSS file (no duplication)
- ✅ Separation of concerns (UI vs Animation logic)
- ✅ TypeScript for type safety
- ✅ Descriptive naming (Map.tsx instead of App.tsx)

## ⚙️ Configuration

You can customize the scooter animation by editing `src/scooterAnimation.ts`:

```typescript
// Configuration
const NUM_SCOOTERS = 50;           // Number of scooters (1-100)
const SCOOTER_SPEED = 0.00001;     // Movement speed
const COLLISION_DISTANCE = 0.002;  // Minimum distance between scooters
```

### Adjusting Scooter Count:

- **Low (10-20)**: Better performance, less traffic
- **Medium (30-50)**: Balanced performance and realism ✅ Recommended
- **High (60-100)**: More realistic but may impact performance

## 🎮 Usage

Once the application is running:

1. **Navigate the Map**: 
   - Drag to pan
   - Scroll to zoom
   - Use navigation controls in the top-right

2. **Watch Scooters**: 
   - Scooters automatically move along routes
   - They avoid colliding with each other
   - Routes update every 30 seconds

3. **Locate Yourself**:
   - Click the location button to center on your position

## 🐛 Troubleshooting

### Map Not Loading

**Problem**: Blank screen or error message

**Solutions**:
- Check that your `.env` file exists and contains a valid Mapbox token
- Verify the token format: `VITE_MAPBOX_TOKEN=pk.xxxxx`
- Restart the development server after adding the token

### Scooters Not Appearing

**Problem**: Map loads but no scooters visible

**Solutions**:
- Check browser console for errors
- Ensure `scooter_type.png` exists in the `public` folder
- Verify your internet connection (needed for Mapbox Directions API)

### Performance Issues

**Problem**: Laggy animation or slow map

**Solutions**:
- Reduce `NUM_SCOOTERS` in `scooterAnimation.ts`
- Close other browser tabs
- Try a different browser (Chrome recommended)
- Check your internet speed

### Port Already in Use

**Problem**: Error: Port 5173 is already in use

**Solution**:
```bash
# Kill the process using the port (Windows)
netstat -ano | findstr :5173
taskkill /PID <process_id> /F

# Or just use a different port
npm run dev -- --port 3000
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Mapbox GL JS** - Interactive maps
- **Mapbox Directions API** - Route generation

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_MAPBOX_TOKEN` | Your Mapbox access token | Yes |

## 🌐 Browser Support

- Chrome/Edge (latest 2 versions) ✅
- Firefox (latest 2 versions) ✅
- Safari (latest 2 versions) ✅

**Note**: Requires WebGL support for Mapbox GL JS.

## 📄 License

This project is private and not licensed for public use.

## 🤝 Contributing

This is a private project. Contact the repository owner for contribution guidelines.

## 📧 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
3. Contact the development team

---

**Happy Mapping! 🗺️🛴**
