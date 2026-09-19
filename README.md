# Advanced VR Tycoon Prototype

This repository contains an advanced browser-based WebXR tycoon prototype and a Unity-ready VR simulation foundation.

## Included systems

- Realistic business simulation engine
- Daily operational cycle with revenue, taxes, wages, inventory, and upkeep
- Brand reputation and morale management
- Market trend and random event modelling
- Upgrade paths, hiring, pricing, marketing, and loan decisions
- Performance dashboard with trend charts
- WebXR activation button for compatible headsets and browsers

## WebXR prototype

Open the `webxr-tycoon` folder and serve it locally:

```bash
cd webxr-tycoon
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Unity VR starter

The `unity-vr-tycoon` folder contains a foundation for a more immersive VR version with:

- business state management
- dashboard UI update logic
- customer movement scripts
- expansion-ready architecture for advanced interaction, inventory, and HR systems

## Recommended next upgrades

- 3D product shelf and customer queue system
- actual hand interaction and object grab in XR
- staff management hierarchy and departments
- supplier contracts and financing models
- city-level expansion and competitor AI

## License
MIT
