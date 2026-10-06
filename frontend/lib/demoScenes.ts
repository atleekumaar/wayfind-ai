import { DemoScene } from './types';

function createSceneFile(
  filename: string,
  drawFn: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawFn(ctx, 640, 480);
    }
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], filename, { type: 'image/jpeg' }));
      } else {
        // Fallback dummy file
        resolve(new File([''], filename, { type: 'image/jpeg' }));
      }
    }, 'image/jpeg', 0.92);
  });
}

export const DEMO_SCENES: DemoScene[] = [
  {
    id: 'scene-stairs',
    title: 'Historic Metro Station Entrance',
    tagline: 'Multi-flight stair barrier with no observable grade transition',
    description:
      'A public transit entrance with 7 concrete steps, doorway portal, and pedestrian presence. Evaluates detection of high-severity physical step hazards.',
    expectedTier: 'Partially Accessible (45-55/100)',
    barrierSummary: 'Stair barrier detected (-25 pts); Ramp availability unknown (0 pts penalty).',
    generateBlob: () =>
      createSceneFile('demo_station_stairs.jpg', (ctx, w, h) => {
        // Sky/Background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Building Facade
        ctx.fillStyle = '#334155';
        ctx.fillRect(80, 60, w - 160, 260);

        // Entrance Portal
        ctx.fillStyle = '#090d16';
        ctx.fillRect(240, 120, 160, 200);

        // Steps Leading Up to Entrance (stair geometry)
        for (let i = 0; i < 7; i++) {
          const stepY = 240 + i * 28;
          ctx.fillStyle = i % 2 === 0 ? '#64748b' : '#475569';
          ctx.fillRect(100 + i * 14, stepY, w - 200 - i * 28, 28);
          
          // Edge highlight
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(100 + i * 14, stepY, w - 200 - i * 28, 3);
        }

        // Handrails
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(110, 220);
        ctx.lineTo(210, 420);
        ctx.moveTo(w - 110, 220);
        ctx.lineTo(w - 210, 420);
        ctx.stroke();

        // Label on canvas for realism
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('METRO TRANSIT • ENTRANCE A', 180, 95);
      }),
  },
  {
    id: 'scene-mixed',
    title: 'Urban Commercial Sidewalk',
    tagline: 'Step-free pavement with outdoor cafe bench and delivery van proximity',
    description:
      'A downtown sidewalk featuring flat pavement, roadside vehicle, and pedestrian furniture. Tests obstruction clearance evaluation.',
    expectedTier: 'Mostly Accessible (70-80/100)',
    barrierSummary: 'Vehicle in proximity (-15 pts); Bench obstacle (-10 pts); Step-free pathway.',
    generateBlob: () =>
      createSceneFile('demo_commercial_sidewalk.jpg', (ctx, w, h) => {
        // Sky & Street
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, w, 180);
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, 180, w, 300);

        // Sidewalk pavement (flat concrete)
        ctx.fillStyle = '#64748b';
        ctx.fillRect(60, 180, 360, 300);

        // Roadway on right
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(420, 180, 220, 300);

        // Curb cut / curb line
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(415, 180, 10, 300);

        // Parked delivery vehicle on roadway
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(450, 160, 160, 120);
        ctx.fillStyle = '#0c4a6e';
        ctx.fillRect(470, 220, 40, 40);
        ctx.fillRect(550, 220, 40, 40);

        // Cafe bench / chair on sidewalk
        ctx.fillStyle = '#b45309';
        ctx.fillRect(100, 280, 120, 50);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(110, 330, 10, 30);
        ctx.fillRect(200, 330, 10, 30);

        // Clean pedestrian corridor line
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('PEDESTRIAN WALKWAY • 5TH AVE', 80, 220);
      }),
  },
  {
    id: 'scene-clear',
    title: 'Accessible Hospital Plaza',
    tagline: 'Wide unobstructed grade-level pathway with wide entrance clearance',
    description:
      'A hospital approach plaza designed with expansive smooth paving, zero stair barriers, and uninhibited 48-inch clearance.',
    expectedTier: 'Fully Accessible (95-100/100)',
    barrierSummary: 'Zero step barriers; Clear path verified (+10 pts reward); Clean approach.',
    generateBlob: () =>
      createSceneFile('demo_accessible_plaza.jpg', (ctx, w, h) => {
        // Modern glass facade
        const facadeGrad = ctx.createLinearGradient(0, 0, 0, 200);
        facadeGrad.addColorStop(0, '#0284c7');
        facadeGrad.addColorStop(1, '#0e7490');
        ctx.fillStyle = facadeGrad;
        ctx.fillRect(0, 0, w, 200);

        // Automatic sliding glass doors (wide ingress)
        ctx.fillStyle = '#155e75';
        ctx.fillRect(200, 60, 240, 140);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(240, 80, 70, 120);
        ctx.fillRect(330, 80, 70, 120);

        // Smooth wide plaza walkway
        const pathGrad = ctx.createLinearGradient(0, 200, 0, h);
        pathGrad.addColorStop(0, '#64748b');
        pathGrad.addColorStop(1, '#94a3b8');
        ctx.fillStyle = pathGrad;
        ctx.fillRect(0, 200, w, 280);

        // Navigable corridor guide lines
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.moveTo(140, 200);
        ctx.lineTo(60, h);
        ctx.moveTo(500, 200);
        ctx.lineTo(580, h);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('HOSPITAL MAIN INGRESS • STEP-FREE ACCESS', 130, 40);
      }),
  },
];
