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
      'A synthetic test environment representing an older transit portal with 7 concrete steps, doorway portal, and pedestrian presence. Evaluates detection of structural step hazards.',
    expectedTier: 'Partially Accessible',
    expectedScoreRange: '45–55 / 100',
    expectedEvidence: [
      'Stairs / Steps (Identified barrier)',
      'Pedestrian presence (Context)',
      'Ramp availability (Unknown, 0 penalty)',
    ],
    barrierSummary: 'Stair barrier detected (-25 to -35 pts); Ramp availability unknown (0 pts penalty).',
    whyItMatters:
      'Demonstrates that stairs are treated as primary physical barriers while respecting the rule that an unobserved ramp is not penalized.',
    generateBlob: () =>
      createSceneFile('demo_station_stairs.jpg', (ctx, w, h) => {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#334155';
        ctx.fillRect(80, 60, w - 160, 260);

        ctx.fillStyle = '#090d16';
        ctx.fillRect(240, 120, 160, 200);

        for (let i = 0; i < 7; i++) {
          const stepY = 240 + i * 28;
          ctx.fillStyle = i % 2 === 0 ? '#64748b' : '#475569';
          ctx.fillRect(100 + i * 14, stepY, w - 200 - i * 28, 28);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(100 + i * 14, stepY, w - 200 - i * 28, 3);
        }

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(110, 220);
        ctx.lineTo(210, 420);
        ctx.moveTo(w - 110, 220);
        ctx.lineTo(w - 210, 420);
        ctx.stroke();

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
      'A synthetic test environment modeling flat pavement with roadside vehicle and pedestrian bench. Demonstrates spatial reasoning between corridor obstructions vs contextual objects.',
    expectedTier: 'Mostly Accessible',
    expectedScoreRange: '70–80 / 100',
    expectedEvidence: [
      'Bench obstacle in corridor (-10 pts)',
      'Vehicle proximity on roadway boundary (-8 to -15 pts)',
      'Step-free ground surface',
    ],
    barrierSummary: 'Vehicle in proximity; Bench obstacle; Step-free pathway.',
    whyItMatters:
      'Demonstrates that contextual objects outside the pedestrian corridor do not receive unfair accessibility penalties.',
    generateBlob: () =>
      createSceneFile('demo_commercial_sidewalk.jpg', (ctx, w, h) => {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, w, 180);
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, 180, w, 300);

        ctx.fillStyle = '#64748b';
        ctx.fillRect(60, 180, 360, 300);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(420, 180, 220, 300);

        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(415, 180, 10, 300);

        // Parked delivery vehicle on roadway
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(450, 160, 160, 120);
        ctx.fillStyle = '#0c4a6e';
        ctx.fillRect(470, 220, 40, 40);
        ctx.fillRect(550, 220, 40, 40);

        // Cafe bench on sidewalk
        ctx.fillStyle = '#b45309';
        ctx.fillRect(160, 280, 140, 50);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(170, 330, 10, 30);
        ctx.fillRect(280, 330, 10, 30);

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
      'A synthetic test environment modeling a modern medical center approach with wide smooth paving, automatic sliding doors, and zero stairs.',
    expectedTier: 'Fully Accessible',
    expectedScoreRange: '100 / 100',
    expectedEvidence: [
      'No supported barrier objects detected in visible corridor (0 pts penalty)',
      'Zero step barriers detected',
      'Wide entrance corridor visible',
    ],
    barrierSummary: 'Zero step barriers; No corridor obstacles detected in visible frame.',
    whyItMatters:
      'Shows how an unobstructed corridor retains the baseline 100-point score without fabricating unearned rewards for unobservable features.',
    generateBlob: () =>
      createSceneFile('demo_accessible_plaza.jpg', (ctx, w, h) => {
        const facadeGrad = ctx.createLinearGradient(0, 0, 0, 200);
        facadeGrad.addColorStop(0, '#0284c7');
        facadeGrad.addColorStop(1, '#0e7490');
        ctx.fillStyle = facadeGrad;
        ctx.fillRect(0, 0, w, 200);

        ctx.fillStyle = '#155e75';
        ctx.fillRect(200, 60, 240, 140);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(240, 80, 70, 120);
        ctx.fillRect(330, 80, 70, 120);

        const pathGrad = ctx.createLinearGradient(0, 200, 0, h);
        pathGrad.addColorStop(0, '#64748b');
        pathGrad.addColorStop(1, '#94a3b8');
        ctx.fillStyle = pathGrad;
        ctx.fillRect(0, 200, w, 280);

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
