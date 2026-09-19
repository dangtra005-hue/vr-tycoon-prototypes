# Unity VR Tycoon Prototype

This folder contains a Unity XR starter for a realistic immersive business tycoon.

## Minimum setup

1. Open Unity Hub and create a new 3D URP project.
2. Install `XR Plugin Management` from Package Manager.
3. Install `OpenXR` plugin.
4. Enable XR support for your target device.
5. Copy the scripts from `Assets/Scripts` into your project.

## Scene setup

Create a simple scene with:
- Ground plane
- Store or shop mesh
- Counter / desk
- Customer spawn points
- Canvas for business dashboard
- XR Origin + VR camera rig

## Included scripts

- `BusinessTycoonManager.cs` – core simulation logic
- `BusinessDashboardController.cs` – updates KPI UI
- `CustomerBehavior.cs` – moves NPC customers

## Suggested gameplay loop

- Enter a VR business space
- Walk around the store
- Use buttons or interactable objects to hire staff, buy upgrades, and restock inventory
- Watch revenue and reputation update as the business grows
- Expand with more staff, better quality, and more customer demand

## Notes

This is intentionally a prototype to help you rapidly build a realistic VR business simulator in Unity.
