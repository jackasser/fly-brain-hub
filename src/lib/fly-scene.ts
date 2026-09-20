import * as THREE from 'three';

/** Original geometric illustration, not a reconstruction of biological data. */
export function mountFly(stage: HTMLElement) {
  const canvas = stage.querySelector('canvas')!;
  const view = canvas.parentElement!;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 10.8);
  scene.add(new THREE.HemisphereLight(0xe4f5ff, 0x483126, 2.6));
  const key = new THREE.DirectionalLight(0xffedd6, 3.5);
  key.position.set(-3, 5, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xb2a5ff, 2.5);
  rim.position.set(4, 1, -3);
  scene.add(rim);
  const fly = new THREE.Group();
  scene.add(fly);
  const body = new THREE.MeshStandardMaterial({ color: 0x9e6a39, roughness: 0.55, metalness: 0.16 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x392a2b, roughness: 0.7 });
  const eye = new THREE.MeshStandardMaterial({ color: 0xc83428, roughness: 0.35, metalness: 0.15, flatShading: true });
  const wing = new THREE.MeshStandardMaterial({ color: 0xcce9ef, transparent: true, opacity: 0.48, roughness: 0.25, metalness: 0.25, side: THREE.DoubleSide, depthWrite: false });
  const vein = new THREE.LineBasicMaterial({ color: 0x748fa2, transparent: true, opacity: 0.55 });
  const sphere = new THREE.SphereGeometry(1, 32, 20);
  function ellipsoid(parent: THREE.Group, material: THREE.Material, pos: number[], scale: number[]) {
    const mesh = new THREE.Mesh(sphere, material);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    parent.add(mesh);
    return mesh;
  }
  function limb(points: THREE.Vector3[], radius = 0.025) {
    const curve = new THREE.CatmullRomCurve3(points);
    fly.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, radius, 6, false), dark));
  }
  ellipsoid(fly, body, [0, 0, 0], [0.53, 0.68, 0.48]);
  ellipsoid(fly, body, [0, -0.91, -0.08], [0.54, 0.86, 0.43]);
  for (let i = 0; i < 4; i++) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.46 - i * 0.057, 0.038, 8, 40), dark);
    band.rotation.x = Math.PI / 2;
    band.scale.y = 0.8;
    band.position.set(0, -0.8 - i * 0.23, -0.08);
    fly.add(band);
  }
  ellipsoid(fly, body, [0, 0.94, 0.06], [0.58, 0.47, 0.43]);
  for (const s of [-1, 1]) {
    const eyeMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), eye);
    eyeMesh.position.set(s * 0.43, 0.99, 0.22);
    eyeMesh.scale.set(0.3, 0.39, 0.32);
    fly.add(eyeMesh);
    ellipsoid(fly, dark, [s * 0.17, 1.37, 0.34], [0.075, 0.15, 0.07]);
    limb([new THREE.Vector3(s * 0.17, 1.38, 0.32), new THREE.Vector3(s * 0.29, 1.62, 0.3), new THREE.Vector3(s * 0.44, 1.69, 0.27)], 0.012);
    for (let i = 0; i < 3; i++) {
      const y = 0.3 - i * 0.38;
      limb([new THREE.Vector3(s * 0.37, y, 0), new THREE.Vector3(s * 0.85, y + 0.38 - i * 0.28, 0.1), new THREE.Vector3(s * 1.2, y + 0.25 - i * 0.42, 0.4), new THREE.Vector3(s * 1.43, y + 0.4 - i * 0.5, 0.48)]);
    }
  }
  const wings: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const group = new THREE.Group();
    group.position.set(s * 0.25, 0.23, -0.2);
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(s * 0.8, 0.1, s * 2.4, -0.35, s * 2.25, -1.12);
    shape.bezierCurveTo(s * 2.05, -1.8, s * 0.45, -0.95, 0, 0);
    group.add(new THREE.Mesh(new THREE.ShapeGeometry(shape, 28), wing));
    for (let i = 0; i < 4; i++) {
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(s * 0.95, -0.2 - i * 0.14, 0.01), new THREE.Vector3(s * (2.17 - i * 0.29), -0.82 - i * 0.12, 0.01));
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(24)), vein));
    }
    fly.add(group);
    wings.push(group);
  }
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = true;
  let frame = 0;
  let disposed = false;
  function draw() {
    frame = 0;
    if (!visible || disposed || document.hidden) return;
    // Anchor progress to the visible model, not the much taller mobile hero.
    // Document coordinates also keep the pose reversible after a late mount.
    const rect = view.getBoundingClientRect();
    const start = Math.max(0, rect.top + window.scrollY - window.innerHeight);
    const travel = Math.max(1, Math.min(rect.height * 0.85, window.innerHeight * 0.65));
    const p = motion.matches ? 0 : THREE.MathUtils.clamp((window.scrollY - start) / travel, 0, 1);
    fly.rotation.set(-0.32 + p * 0.65, -0.45 + p * 2.1, -0.3 + p * 0.6);
    fly.position.set(p * 0.22, p * 0.2, 0);
    wings.forEach((w, i) => { w.rotation.y = (i === 0 ? 1 : -1) * (0.12 + Math.sin(p * Math.PI * 2) * 0.35); });
    renderer.render(scene, camera);
    stage.setAttribute('data-ready', '');
    stage.setAttribute('data-pose', p.toFixed(4));
  }
  function schedule() { if (!frame && !disposed) frame = requestAnimationFrame(draw); }
  const resize = new ResizeObserver(() => {
    const { width, height } = view.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    schedule();
  });
  resize.observe(view);
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); });
  visibility.observe(stage);
  window.addEventListener('scroll', schedule, { passive: true });
  motion.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', schedule);
  function dispose() {
    disposed = true;
    cancelAnimationFrame(frame);
    resize.disconnect();
    visibility.disconnect();
    window.removeEventListener('scroll', schedule);
    motion.removeEventListener('change', schedule);
    document.removeEventListener('visibilitychange', schedule);
    scene.traverse(object => { if (object instanceof THREE.Mesh || object instanceof THREE.Line) object.geometry.dispose(); });
    [body, dark, eye, wing, vein].forEach(material => material.dispose());
    renderer.dispose();
    stage.removeAttribute('data-ready');
  }
  canvas.addEventListener('webglcontextlost', dispose, { once: true });
  window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); }, { once: true });
  schedule();
}
