# VR Tycoon Prototypes

This repository contains two related tycoon prototype projects:

- `webxr-tycoon/` – a browser-based 3D tycoon game that works with WebXR-capable browsers.
- `unity-vr-tycoon/` – Unity XR project starter scripts and architecture for a more realistic VR business tycoon experience.

## Projects

### WebXR tycoon game
A desktop and VR-ready browser prototype where the player manages a small business empire:
- Hire staff
- Buy upgrades
- Adjust pricing
- Track cash flow and reputation
- Expand operations

### Unity VR tycoon prototype
A Unity-ready foundation for a VR business simulator using XR interaction.

## Quick start

### WebXR demo
1. Open a terminal in `webxr-tycoon/`
2. Run a local static server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open `http://localhost:8000`
4. Click "Enter VR" in supported browsers

### Unity VR prototype
1. Open Unity Hub
2. Create a new 3D URP project or open this folder as a starter project
3. Install XR Plugin Management and OpenXR
4. Import the scripts from `unity-vr-tycoon/Assets/Scripts/`
5. Use the included blueprint in the `README.md` in that folder

## Business model

The simulation uses a simplified but realistic business loop:

- Customer demand depends on reputation, price, and quality
- Staff productivity affects output and service
- Revenue is generated from product sales
- Costs include hiring, utilities, upgrades, and maintenance
- Profit drives growth and expansion

## License
MIT