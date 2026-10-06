import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { asset, ui, type Locale } from './content';

type Props = {
  model: 'panel' | 'building' | 'elements';
  locale: Locale;
  amount: number;
  stage?: number;
  element?: string;
  paused: boolean;
  reset: number;
  onReady: (ready: boolean) => void;
};
export default function Scene({
  model,
  locale,
  amount,
  stage = 5,
  element = 'single',
  paused,
  reset,
  onReady,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const runtime = useRef<{
    root: THREE.Object3D;
    mixer: THREE.AnimationMixer;
    duration: number;
    apply: () => void;
  } | null>(null);
  const inputs = useRef({ amount, stage, element, paused });
  inputs.current = { amount, stage, element, paused };
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const host = container.current;
    if (!host) return;
    setStatus('loading');
    onReady(false);
    let disposed = false,
      frame = 0,
      visible = true,
      dirty = true,
      loaded = false,
      painted = false,
      displayedAmount = amount;
    let renderer: THREE.WebGLRenderer | undefined;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 150);
    const resources: THREE.Object3D[] = [];
    let controls: OrbitControls | undefined;
    let fitBounds: THREE.Box3 | undefined;
    const ready = () => {
      if (!disposed) {
        setStatus('ready');
        onReady(true);
      }
    };
    const fail = (error: unknown) => {
      if (!disposed) {
        console.error(`WATAD ${model} scene failed`, error);
        setStatus('error');
        onReady(false);
      }
    };
    const draw = () => {
      frame = 0;
      if (!disposed && visible && !document.hidden && renderer && dirty) {
        try {
          const target = inputs.current.amount;
          displayedAmount = inputs.current.paused
            ? target
            : THREE.MathUtils.lerp(displayedAmount, target, 0.18);
          if (Math.abs(displayedAmount - target) < 0.001) displayedAmount = target;
          runtime.current?.apply();
          renderer.render(scene, camera);
          if (loaded && !painted) {
            painted = true;
            ready();
          }
        } catch (error) {
          fail(error);
          return;
        }
        dirty = false;
        if (displayedAmount !== inputs.current.amount) requestRender();
      }
    };
    const requestRender = () => {
      dirty = true;
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(draw);
    };
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.45;
      renderer.domElement.setAttribute(
        'aria-label',
        locale === 'ar' ? 'نموذج توضيحي تفاعلي' : 'Interactive illustrative model',
      );
      host.appendChild(renderer.domElement);
      scene.add(new THREE.HemisphereLight(0xe3f8ff, 0x25303e, 3.4));
      const key = new THREE.DirectionalLight(0xffffff, 4);
      key.position.set(4, 7, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x70e8cc, 2);
      rim.position.set(-4, 3, -3);
      scene.add(rim);
      controls = new OrbitControls(camera, renderer.domElement);
      controlsRef.current = controls;
      controls.enableDamping = false;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.minPolarAngle = 0.15;
      controls.maxPolarAngle = Math.PI * 0.85;
      controls.addEventListener('change', requestRender);
      const resize = () => {
        if (!renderer) return;
        const { width, height } = host.getBoundingClientRect();
        if (width < 1 || height < 1) return;
        const previousAspect = camera.aspect;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        if (loaded && fitBounds && Math.abs(previousAspect - camera.aspect) > 0.05) fit();
        requestRender();
      };
      const fit = (object?: THREE.Object3D, bounds?: THREE.Box3) => {
        if (bounds) fitBounds = bounds;
        else if (object) fitBounds = new THREE.Box3().setFromObject(object);
        if (!fitBounds) return;
        const center = fitBounds.getCenter(new THREE.Vector3());
        const size = fitBounds.getSize(new THREE.Vector3()).length();
        const limitingFov = Math.min(
          THREE.MathUtils.degToRad(camera.fov),
          2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect),
        );
        const distance = ((size * 0.5) / Math.sin(limitingFov / 2)) * 1.15;
        camera.position
          .copy(center)
          .add(new THREE.Vector3(0.63, 0.5, 0.86).normalize().multiplyScalar(distance));
        camera.near = 0.01;
        camera.far = Math.max(150, distance * 8);
        camera.updateProjectionMatrix();
        controls!.target.copy(center);
        controls!.update();
        controls!.saveState();
        requestRender();
      };
      new GLTFLoader().load(
        asset(`models/${model}.glb`),
        (gltf) => {
          if (disposed) {
            gltf.scene.traverse((o) => {
              if (o instanceof THREE.Mesh) {
                o.geometry.dispose();
                const mats = Array.isArray(o.material) ? o.material : [o.material];
                mats.forEach((m) => m.dispose());
              }
            });
            return;
          }
          const root = gltf.scene;
          scene.add(root);
          resources.push(root);
          const mixer = new THREE.AnimationMixer(root);
          let duration = 0;
          const actions = gltf.animations.map((clip) => {
            duration = Math.max(duration, clip.duration);
            const a = mixer.clipAction(clip);
            a.setLoop(THREE.LoopOnce, 1);
            a.clampWhenFinished = true;
            a.play();
            return a;
          });
          let lastElement = '';
          const apply = () => {
            const p = inputs.current;
            // A clamped action pauses at its last frame. Reset it before every seek
            // so the range remains reversible after visiting either endpoint.
            actions.forEach((action) => action.reset().play());
            mixer.setTime((duration || 1) * displayedAmount);
            if (model === 'building') {
              root.traverse((o) => {
                const match = o.name.match(/^stage_(\d)_/);
                if (match) {
                  const s = Number(match[1]);
                  o.visible =
                    s <= p.stage && !(s === 1 && p.stage >= 4) && !(s === 2 && p.stage >= 4);
                }
              });
            }
            if (model === 'elements') {
              root.traverse((o) => {
                if (o.name.startsWith('element_')) o.visible = o.name === `element_${p.element}`;
              });
              if (lastElement !== p.element) {
                const obj = root.getObjectByName(`element_${p.element}`);
                if (obj) fit(obj);
                lastElement = p.element;
              }
            }
          };
          runtime.current = { root, mixer, duration, apply };
          loaded = true;
          apply();
          if (model !== 'elements') {
            // Frame the full motion envelope, including the fully lifted roof.
            const saved = displayedAmount;
            const envelope = new THREE.Box3().setFromObject(root);
            displayedAmount = 1;
            apply();
            envelope.union(new THREE.Box3().setFromObject(root));
            fit(root, envelope);
            displayedAmount = saved;
            apply();
          }
          resize();
          requestRender();
        },
        undefined,
        fail,
      );
      const ro = new ResizeObserver(resize);
      ro.observe(host);
      resize();
      const io = new IntersectionObserver(
        (entries) => {
          visible = entries[0].isIntersecting;
          if (visible) requestRender();
          else {
            cancelAnimationFrame(frame);
            frame = 0;
          }
        },
        { rootMargin: '100px' },
      );
      io.observe(host);
      document.addEventListener('visibilitychange', requestRender);
      requestRender();
      const lost = (e: Event) => {
        e.preventDefault();
        fail(new Error('WebGL context lost'));
      };
      renderer.domElement.addEventListener('webglcontextlost', lost);
      return () => {
        disposed = true;
        cancelAnimationFrame(frame);
        ro.disconnect();
        io.disconnect();
        document.removeEventListener('visibilitychange', requestRender);
        controls?.dispose();
        controlsRef.current = null;
        runtime.current?.mixer.stopAllAction();
        runtime.current = null;
        resources.forEach((root) =>
          root.traverse((o) => {
            if (o instanceof THREE.Mesh) {
              o.geometry.dispose();
              const mats = Array.isArray(o.material) ? o.material : [o.material];
              mats.forEach((m) => {
                for (const value of Object.values(m)) {
                  if (value instanceof THREE.Texture) value.dispose();
                }
                m.dispose();
              });
            }
          }),
        );
        renderer?.domElement.removeEventListener('webglcontextlost', lost);
        renderer?.dispose();
        renderer?.forceContextLoss();
        host.replaceChildren();
      };
    } catch (error) {
      fail(error);
      renderer?.dispose();
      controls?.dispose();
    }
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      host.replaceChildren();
    };
    // Model, language and explicit retry own the canvas; controls read current values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, locale, attempt]);
  useEffect(() => {
    // Schedule through the renderer's change listener without recreating its canvas.
    controlsRef.current?.dispatchEvent({ type: 'change' });
  }, [amount, stage, element, paused]);
  useEffect(() => {
    controlsRef.current?.reset();
  }, [reset]);
  return (
    <div
      className={`canvas-host ${status === 'ready' ? 'is-ready' : ''}`}
      data-shortcuts="local"
      data-scene-status={status}
    >
      <div ref={container} className="canvas-surface" />
      {status !== 'ready' && (
        <div className="scene-status" role="status">
          <div>
            {ui[status === 'error' ? 'error' : 'loading'][locale]}
            {status === 'error' && (
              <button className="pill" onClick={() => setAttempt((x) => x + 1)}>
                {locale === 'ar' ? 'إعادة المحاولة' : 'Retry model'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
