# Advanced VR Tycoon Prototype

This repository contains an advanced browser-based WebXR tycoon prototype and a Unity-ready VR simulation foundation.

## Included systems

- realistic business simulation engine
- daily operational cycle with revenue, taxes, wages, inventory, and upkeep
- brand reputation and morale management
- market trend and random event modelling
- upgrade paths, hiring, pricing, marketing, and loan decisions
- performance dashboard with trend charts
- WebXR activation button for compatible headsets and browsers
- branch expansion and competitor pricing pressure

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
