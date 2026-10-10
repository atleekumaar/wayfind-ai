import { Detection } from './types';

export interface TrackedObject {
  trackId: string;
  className: string;
  category: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  center: [number, number]; // [cx, cy]
  history: [number, number][]; // motion trail in 2D image coordinates
  firstSeenFrame: number;
  lastSeenFrame: number;
  missedFrames: number;
  corridorRelation: 'INSIDE' | 'OUTSIDE' | 'UNCERTAIN';
  evidenceStatus: 'DETECTED' | 'INFERRED' | 'UNKNOWN';
}

export interface TrackingEvent {
  id: string;
  timestamp: number;
  type: 'NEW_OBJECT' | 'DISAPPEARED' | 'CORRIDOR_ENTRY' | 'CORRIDOR_EXIT';
  trackId: string;
  className: string;
  description: string;
}

export class LightweightTemporalTracker {
  private activeTracks: Map<string, TrackedObject> = new Map();
  private nextTrackNum: number = 1;
  private currentFrameIndex: number = 0;
  private maxMissedFrames: number = 3;
  private recentEvents: TrackingEvent[] = [];

  constructor(maxMissedFrames: number = 3) {
    this.maxMissedFrames = maxMissedFrames;
  }

  public reset(): void {
    this.activeTracks.clear();
    this.nextTrackNum = 1;
    this.currentFrameIndex = 0;
    this.recentEvents = [];
  }

  public getEvents(): TrackingEvent[] {
    return [...this.recentEvents].slice(-6);
  }

  /**
   * Computes Intersection over Union (IoU) between two [x1, y1, x2, y2] boxes.
   */
  private computeIoU(b1: [number, number, number, number], b2: [number, number, number, number]): number {
    const xLeft = Math.max(b1[0], b2[0]);
    const yTop = Math.max(b1[1], b2[1]);
    const xRight = Math.min(b1[2], b2[2]);
    const yBottom = Math.min(b1[3], b2[3]);

    if (xRight < xLeft || yBottom < yTop) return 0.0;

    const intersection = (xRight - xLeft) * (yBottom - yTop);
    const area1 = (b1[2] - b1[0]) * (b1[3] - b1[1]);
    const area2 = (b2[2] - b2[0]) * (b2[3] - b2[1]);
    const union = area1 + area2 - intersection;

    return union > 0 ? intersection / union : 0.0;
  }

  /**
   * Evaluates relationship of bounding box bottom-center to an estimated navigation corridor.
   * Corridor is defined in normalized percentage coords:
   * Top horizon: 35% to 65% width at 46% height
   * Bottom base: 18% to 82% width at 98% height
   * Note: This is an uncalibrated monocular image-space heuristic, not physical ground truth.
   */
  public evaluateCorridorOverlap(bbox: [number, number, number, number], imgW: number = 640, imgH: number = 480): 'INSIDE' | 'OUTSIDE' | 'UNCERTAIN' {
    const bottomCenterX = ((bbox[0] + bbox[2]) / 2) / imgW;
    const bottomY = bbox[3] / imgH;

    // Horizon line check
    if (bottomY < 0.40) return 'UNCERTAIN';

    // Interpolate corridor lateral bounds at bottomY
    const yFrac = Math.max(0, Math.min(1, (bottomY - 0.46) / (0.98 - 0.46)));
    const corridorLeft = 0.35 - yFrac * (0.35 - 0.18);
    const corridorRight = 0.65 + yFrac * (0.82 - 0.65);

    // Lateral boundary buffer
    const buffer = 0.04;
    if (bottomCenterX >= (corridorLeft + buffer) && bottomCenterX <= (corridorRight - buffer)) {
      return 'INSIDE';
    } else if (bottomCenterX < (corridorLeft - buffer) || bottomCenterX > (corridorRight + buffer)) {
      return 'OUTSIDE';
    } else {
      return 'UNCERTAIN';
    }
  }

  /**
   * Updates tracks given newly sampled detections from the backend.
   */
  public update(detections: Detection[], imgW: number = 640, imgH: number = 480): TrackedObject[] {
    this.currentFrameIndex++;
    const matchedTrackIds = new Set<string>();

    const detItems = detections.map((det) => {
      const bbox = det.bbox;
      const cx = (bbox[0] + bbox[2]) / 2;
      const cy = (bbox[1] + bbox[3]) / 2;
      const corridorRel = this.evaluateCorridorOverlap(bbox, imgW, imgH);
      return {
        det,
        bbox,
        center: [cx, cy] as [number, number],
        corridorRel,
      };
    });

    // Match each incoming detection to the closest active track
    for (const item of detItems) {
      let bestTrackId: string | null = null;
      let bestIoU = 0.20; // IoU threshold

      for (const [trackId, track] of Array.from(this.activeTracks.entries())) {
        if (matchedTrackIds.has(trackId)) continue;
        if (track.className.toLowerCase() !== item.det.class_name.toLowerCase()) continue;

        const iou = this.computeIoU(track.bbox, item.bbox);
        if (iou > bestIoU) {
          bestIoU = iou;
          bestTrackId = trackId;
        }
      }

      // If IoU didn't match, try center Euclidean distance fallback (within 90px)
      if (!bestTrackId) {
        let bestDist = 90.0;
        for (const [trackId, track] of Array.from(this.activeTracks.entries())) {
          if (matchedTrackIds.has(trackId)) continue;
          if (track.className.toLowerCase() !== item.det.class_name.toLowerCase()) continue;

          const dx = track.center[0] - item.center[0];
          const dy = track.center[1] - item.center[1];
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bestDist) {
            bestDist = dist;
            bestTrackId = trackId;
          }
        }
      }

      if (bestTrackId) {
        // Update existing track
        matchedTrackIds.add(bestTrackId);
        const track = this.activeTracks.get(bestTrackId)!;
        const prevCorridor = track.corridorRelation;

        track.bbox = item.bbox;
        track.center = item.center;
        track.confidence = item.det.confidence;
        track.lastSeenFrame = this.currentFrameIndex;
        track.missedFrames = 0;
        track.corridorRelation = item.corridorRel;
        track.history.push(item.center);
        if (track.history.length > 8) track.history.shift();

        // Check corridor transition event
        if (prevCorridor !== item.corridorRel) {
          if (item.corridorRel === 'INSIDE') {
            this.recentEvents.push({
              id: `evt-${Date.now()}-${Math.random()}`,
              timestamp: Date.now(),
              type: 'CORRIDOR_ENTRY',
              trackId: track.trackId,
              className: track.className,
              description: `${track.className} entered estimated navigation corridor`,
            });
          } else if (prevCorridor === 'INSIDE' && item.corridorRel === 'OUTSIDE') {
            this.recentEvents.push({
              id: `evt-${Date.now()}-${Math.random()}`,
              timestamp: Date.now(),
              type: 'CORRIDOR_EXIT',
              trackId: track.trackId,
              className: track.className,
              description: `${track.className} exited estimated navigation corridor`,
            });
          }
        }
      } else {
        // Create new track
        const newId = `TRK-${this.nextTrackNum++}`;
        const newTrack: TrackedObject = {
          trackId: newId,
          className: item.det.class_name,
          category: item.det.category,
          confidence: item.det.confidence,
          bbox: item.bbox,
          center: item.center,
          history: [item.center],
          firstSeenFrame: this.currentFrameIndex,
          lastSeenFrame: this.currentFrameIndex,
          missedFrames: 0,
          corridorRelation: item.corridorRel,
          evidenceStatus: 'DETECTED',
        };
        this.activeTracks.set(newId, newTrack);
        matchedTrackIds.add(newId);

        this.recentEvents.push({
          id: `evt-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          type: 'NEW_OBJECT',
          trackId: newId,
          className: item.det.class_name,
          description: `Localized new entity: ${item.det.class_name}`,
        });
      }
    }

    // Process unmatched tracks (increment missed frames or expire)
    for (const [trackId, track] of Array.from(this.activeTracks.entries())) {
      if (!matchedTrackIds.has(trackId)) {
        track.missedFrames++;
        if (track.missedFrames > this.maxMissedFrames) {
          this.recentEvents.push({
            id: `evt-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            type: 'DISAPPEARED',
            trackId: track.trackId,
            className: track.className,
            description: `Track ${track.trackId} (${track.className}) disappeared from view`,
          });
          this.activeTracks.delete(trackId);
        }
      }
    }

    // Keep events list clean
    if (this.recentEvents.length > 25) {
      this.recentEvents = this.recentEvents.slice(-25);
    }

    return Array.from(this.activeTracks.values());
  }
}
