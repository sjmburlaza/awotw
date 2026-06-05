const globeInstance = {
  backgroundImageUrl: () => globeInstance,
  backgroundColor: () => globeInstance,
  globeImageUrl: () => globeInstance,
  htmlElement: () => globeInstance,
  htmlElementsData: () => globeInstance,
  htmlLat: () => globeInstance,
  htmlLng: () => globeInstance,
  htmlTransitionDuration: () => globeInstance,
  labelsData: () => globeInstance,
  onGlobeReady: () => globeInstance,
  pointAltitude: () => globeInstance,
  pointColor: () => globeInstance,
  pointOfView: () => globeInstance,
  pointLat: () => globeInstance,
  pointLng: () => globeInstance,
  pointRadius: () => globeInstance,
  pointsData: () => globeInstance,
  width: () => globeInstance,
};

export type GlobeInstance = typeof globeInstance;

export default function Globe() {
  return globeInstance;
}
