let htmlElementFactory: ((data: object) => HTMLElement) | undefined;
let htmlElementsByData = new WeakMap<object, HTMLElement>();

export const orbitControls = {
  autoRotate: false,
  enabled: true,
  enablePan: true,
  enableRotate: true,
  enableZoom: true,
};

const globeInstance = {
  backgroundImageUrl: () => globeInstance,
  backgroundColor: () => globeInstance,
  controls: () => orbitControls,
  globeImageUrl: () => globeInstance,
  getScreenCoords: () => ({ x: 600, y: 300 }),
  height: () => globeInstance,
  htmlElement: (factory?: (data: object) => HTMLElement) => {
    htmlElementFactory = factory;
    return globeInstance;
  },
  htmlElementsData: (data?: object[]) => {
    data?.forEach((item) => {
      if (!htmlElementsByData.has(item)) {
        const element = htmlElementFactory?.(item);

        if (element) {
          htmlElementsByData.set(item, element);
        }
      }
    });
    return globeInstance;
  },
  htmlLat: () => globeInstance,
  htmlLng: () => globeInstance,
  htmlTransitionDuration: () => globeInstance,
  labelsData: () => globeInstance,
  onGlobeReady: (callback?: () => void) => {
    Promise.resolve().then(() => callback?.());
    return globeInstance;
  },
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
  htmlElementFactory = undefined;
  htmlElementsByData = new WeakMap<object, HTMLElement>();
  orbitControls.autoRotate = false;
  orbitControls.enabled = true;
  orbitControls.enablePan = true;
  orbitControls.enableRotate = true;
  orbitControls.enableZoom = true;
  return globeInstance;
}
