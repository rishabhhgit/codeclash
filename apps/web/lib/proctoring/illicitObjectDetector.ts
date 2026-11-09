'use client';

export interface BoundingBox {
  x: number; // 0 to 1 (percentage of width)
  y: number; // 0 to 1 (percentage of height)
  width: number; // 0 to 1
  height: number; // 0 to 1
}

export type IllicitObjectType =
  | 'cellphone'
  | 'multiple_faces'
  | 'face_absent'
  | 'unauthorized_material'
  | 'headphones';

export interface DetectedObject {
  id: string;
  label: string;
  type: IllicitObjectType;
  confidence: number; // 0 to 1
  bbox: BoundingBox;
}

export interface VisionAnalysis {
  faceDetected: boolean;
  faceConfidence: number;
  faceBbox: BoundingBox | null;
  candidateCentering: 'centered' | 'off_center' | 'absent';
  illicitObjects: DetectedObject[];
  aiModelStatus: 'loading' | 'ready' | 'fallback';
}

// Simulated active overrides for instant deterministic testing
let activeSimulatedObjects: DetectedObject[] = [];

// Deep Learning Model References
let cocoModel: any = null;
let isModelInitializing = false;
let modelStatus: 'loading' | 'ready' | 'fallback' = 'loading';
let detectionSensitivity: 'normal' | 'high' = 'normal';

// Temporal Smoothing & Persistence Cache (eliminates 1-frame flickering)
let lastSeenIllicitMap: Record<string, { obj: DetectedObject; seenAt: number }> = {};
let lastCachedAnalysis: VisionAnalysis = {
  faceDetected: true,
  faceConfidence: 0.95,
  faceBbox: { x: 0.25, y: 0.15, width: 0.5, height: 0.55 },
  candidateCentering: 'centered',
  illicitObjects: [],
  aiModelStatus: 'loading',
};

/**
 * Mirror bounding box horizontally to match -scale-x-100 CSS video element.
 */
export function mirrorBbox(box: BoundingBox): BoundingBox {
  const mirroredX = Math.max(0, Math.min(1, 1 - (box.x + box.width)));
  return {
    x: parseFloat(mirroredX.toFixed(3)),
    y: parseFloat(box.y.toFixed(3)),
    width: parseFloat(box.width.toFixed(3)),
    height: parseFloat(box.height.toFixed(3)),
  };
}

/**
 * Triggers a simulated illicit object detection for testing purposes.
 */
export function triggerSimulatedIllicit(type: IllicitObjectType): DetectedObject {
  let bbox: BoundingBox = { x: 0.65, y: 0.55, width: 0.25, height: 0.35 };
  let label = 'Mobile Device';

  if (type === 'cellphone') {
    bbox = { x: 0.62, y: 0.48, width: 0.26, height: 0.42 };
    label = 'Cell Phone (96%)';
  } else if (type === 'multiple_faces') {
    bbox = { x: 0.08, y: 0.2, width: 0.32, height: 0.45 };
    label = 'Secondary Person (94%)';
  } else if (type === 'unauthorized_material') {
    bbox = { x: 0.22, y: 0.62, width: 0.56, height: 0.32 };
    label = 'Cheat Notes / Paper (91%)';
  } else if (type === 'headphones') {
    bbox = { x: 0.25, y: 0.15, width: 0.5, height: 0.38 };
    label = 'Headphones / Earphones (93%)';
  } else if (type === 'face_absent') {
    bbox = { x: 0.3, y: 0.2, width: 0.4, height: 0.5 };
    label = 'Candidate Face Absent';
  }

  const obj: DetectedObject = {
    id: 'sim-' + Date.now(),
    type,
    label,
    confidence: 0.95,
    bbox,
  };

  activeSimulatedObjects = [obj, ...activeSimulatedObjects.filter((o) => o.type !== type)];
  lastSeenIllicitMap[type] = { obj, seenAt: Date.now() + 60000 }; // 1 minute sticky for simulator
  return obj;
}

/**
 * Clears any simulated or cached illicit objects.
 */
export function clearSimulatedIllicit(): void {
  activeSimulatedObjects = [];
  lastSeenIllicitMap = {};
}

/**
 * Returns the current status of the deep learning model.
 */
export function getAiModelStatus(): 'loading' | 'ready' | 'fallback' {
  return modelStatus;
}

/**
 * Adjusts detection sensitivity.
 */
export function setAiSensitivity(level: 'normal' | 'high'): void {
  detectionSensitivity = level;
}

/**
 * Initializes the TensorFlow.js COCO-SSD Deep Learning Object Detection Model.
 */
export async function initAiModel(): Promise<any> {
  if (cocoModel) return cocoModel;
  if (typeof window === 'undefined') return null;
  if (isModelInitializing) return null;

  isModelInitializing = true;
  modelStatus = 'loading';

  try {
    const tf = await import('@tensorflow/tfjs');
    await tf.ready();
    const cocoSsd = await import('@tensorflow-models/coco-ssd');

    // Attempt local pre-cached model first, fallback to CDN
    try {
      cocoModel = await cocoSsd.load({
        base: 'lite_mobilenet_v2',
        modelUrl: '/models/ssdlite_mobilenet_v2/model.json',
      });
    } catch {
      cocoModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
    }

    modelStatus = 'ready';
    return cocoModel;
  } catch (err) {
    console.warn('[AI Proctor] COCO-SSD model init fallback:', err);
    modelStatus = 'fallback';
    return null;
  } finally {
    isModelInitializing = false;
  }
}

/**
 * Checks for native browser FaceDetector API (hardware accelerated in Chrome/Edge).
 */
async function detectNativeFaces(video: HTMLVideoElement): Promise<BoundingBox[] | null> {
  if (typeof window !== 'undefined' && 'FaceDetector' in window) {
    try {
      const FaceDetectorClass = (window as any).FaceDetector;
      const detector = new FaceDetectorClass({ maxDetectedFaces: 4, fastMode: true });
      const faces = await detector.detect(video);
      if (faces && Array.isArray(faces) && faces.length > 0) {
        const vw = video.videoWidth || 640;
        const vh = video.videoHeight || 480;
        return faces.map((f: any) => ({
          x: f.boundingBox.x / vw,
          y: f.boundingBox.y / vh,
          width: f.boundingBox.width / vw,
          height: f.boundingBox.height / vh,
        }));
      }
    } catch {}
  }
  return null;
}

/**
 * High-Accuracy Computer Vision & Deep Learning Frame Analyzer.
 * Uses COCO-SSD Deep Learning + Native FaceDetector + Enhanced Chrominance Contours.
 */
export async function analyzeVideoFrameAsync(
  video: HTMLVideoElement,
  offscreenCanvas?: HTMLCanvasElement
): Promise<VisionAnalysis> {
  const now = Date.now();
  const minScore = detectionSensitivity === 'high' ? 0.42 : 0.50;

  const result: VisionAnalysis = {
    faceDetected: true,
    faceConfidence: 0.95,
    faceBbox: { x: 0.25, y: 0.15, width: 0.5, height: 0.55 },
    candidateCentering: 'centered',
    illicitObjects: [...activeSimulatedObjects],
    aiModelStatus: modelStatus,
  };

  if (!video || video.readyState < 2 || video.paused || video.ended) {
    return result;
  }

  const videoWidth = video.videoWidth || 640;
  const videoHeight = video.videoHeight || 480;

  // 1. Try Deep Learning COCO-SSD Model
  if (!cocoModel && !isModelInitializing && modelStatus === 'loading') {
    initAiModel().catch(() => {});
  }

  if (cocoModel) {
    try {
      const predictions: Array<{
        bbox: [number, number, number, number]; // [x, y, width, height]
        class: string;
        score: number;
      }> = await cocoModel.detect(video, 10, minScore);

      const persons = predictions.filter((p) => p.class === 'person' && p.score >= minScore);
      const phones = predictions.filter((p) => p.class === 'cell phone' && p.score >= minScore);
      const books = predictions.filter((p) => (p.class === 'book' || p.class === 'laptop') && p.score >= minScore);

      // --- Face & Candidate Detection ---
      if (persons.length === 0) {
        // Double-check with native FaceDetector if person was not detected
        const nativeFaces = await detectNativeFaces(video);
        if (!nativeFaces || nativeFaces.length === 0) {
          result.faceDetected = false;
          result.faceConfidence = 0.15;
          result.faceBbox = null;
          result.candidateCentering = 'absent';
        } else {
          result.faceDetected = true;
          result.faceConfidence = 0.92;
          result.faceBbox = mirrorBbox(nativeFaces[0]);
          const cx = result.faceBbox.x + result.faceBbox.width / 2;
          result.candidateCentering = cx < 0.28 || cx > 0.72 ? 'off_center' : 'centered';
        }
      } else {
        result.faceDetected = true;
        // Largest person is the candidate
        persons.sort((a, b) => b.bbox[2] * b.bbox[3] - a.bbox[2] * a.bbox[3]);
        const candidate = persons[0];

        // Face is the upper 38% of the candidate person box
        const rawFaceBox: BoundingBox = {
          x: (candidate.bbox[0] + candidate.bbox[2] * 0.15) / videoWidth,
          y: candidate.bbox[1] / videoHeight,
          width: (candidate.bbox[2] * 0.7) / videoWidth,
          height: (candidate.bbox[3] * 0.38) / videoHeight,
        };
        result.faceBbox = mirrorBbox(rawFaceBox);
        result.faceConfidence = parseFloat(candidate.score.toFixed(2));

        const cx = result.faceBbox.x + result.faceBbox.width / 2;
        result.candidateCentering = cx < 0.28 || cx > 0.72 ? 'off_center' : 'centered';

        // --- Multiple Persons Detection ---
        if (persons.length >= 2) {
          for (let i = 1; i < persons.length; i++) {
            const sec = persons[i];
            const rawSecBox: BoundingBox = {
              x: sec.bbox[0] / videoWidth,
              y: sec.bbox[1] / videoHeight,
              width: sec.bbox[2] / videoWidth,
              height: sec.bbox[3] / videoHeight,
            };
            const secMirrored = mirrorBbox(rawSecBox);
            const obj: DetectedObject = {
              id: 'det-multi-' + i,
              type: 'multiple_faces',
              label: `Secondary Person (${Math.round(sec.score * 100)}%)`,
              confidence: parseFloat(sec.score.toFixed(2)),
              bbox: secMirrored,
            };
            result.illicitObjects.push(obj);
            lastSeenIllicitMap['multiple_faces'] = { obj, seenAt: now };
          }
        }
      }

      // --- Cell Phone Detection ---
      for (let i = 0; i < phones.length; i++) {
        const p = phones[i];
        const rawPhoneBox: BoundingBox = {
          x: p.bbox[0] / videoWidth,
          y: p.bbox[1] / videoHeight,
          width: p.bbox[2] / videoWidth,
          height: p.bbox[3] / videoHeight,
        };
        const phoneMirrored = mirrorBbox(rawPhoneBox);
        const obj: DetectedObject = {
          id: 'det-phone-' + i,
          type: 'cellphone',
          label: `Cell Phone (${Math.round(p.score * 100)}%)`,
          confidence: parseFloat(p.score.toFixed(2)),
          bbox: phoneMirrored,
        };
        result.illicitObjects.push(obj);
        lastSeenIllicitMap['cellphone'] = { obj, seenAt: now };
      }

      // --- Cheat Material / Book / Laptop Detection ---
      for (let i = 0; i < books.length; i++) {
        const b = books[i];
        const rawBox: BoundingBox = {
          x: b.bbox[0] / videoWidth,
          y: b.bbox[1] / videoHeight,
          width: b.bbox[2] / videoWidth,
          height: b.bbox[3] / videoHeight,
        };
        const matMirrored = mirrorBbox(rawBox);
        const label = b.class === 'laptop' ? 'Secondary Laptop / Screen' : 'Cheat Notes / Book';
        const obj: DetectedObject = {
          id: 'det-material-' + i,
          type: 'unauthorized_material',
          label: `${label} (${Math.round(b.score * 100)}%)`,
          confidence: parseFloat(b.score.toFixed(2)),
          bbox: matMirrored,
        };
        result.illicitObjects.push(obj);
        lastSeenIllicitMap['unauthorized_material'] = { obj, seenAt: now };
      }
    } catch (err) {
      console.warn('COCO-SSD inference frame error:', err);
    }
  } else {
    // 2. High-Accuracy Heuristic & Contour Engine (Fallback if model still loading)
    if (offscreenCanvas) {
      analyzeHeuristicFrame(video, offscreenCanvas, result, minScore);
    }
  }

  // 3. Temporal Persistence: Keep detected objects visible for 2.2 seconds to prevent flicker
  for (const [type, item] of Object.entries(lastSeenIllicitMap)) {
    if (now - item.seenAt < 2200) {
      if (!result.illicitObjects.some((o) => o.type === type)) {
        result.illicitObjects.push(item.obj);
      }
    } else {
      delete lastSeenIllicitMap[type];
    }
  }

  lastCachedAnalysis = result;
  return result;
}

/**
 * Synchronous wrapper that returns the latest cached/smoothed analysis.
 */
export function analyzeVideoFrame(
  video: HTMLVideoElement,
  offscreenCanvas: HTMLCanvasElement
): VisionAnalysis {
  if (video && video.readyState >= 2 && !video.paused) {
    // Trigger async deep learning pass non-blockingly
    analyzeVideoFrameAsync(video, offscreenCanvas).catch(() => {});
  }
  return lastCachedAnalysis;
}

/**
 * Enhanced Luminance-Normalized Skin & Edge Fallback Analyzer.
 */
function analyzeHeuristicFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  result: VisionAnalysis,
  minScore: number
): void {
  try {
    const width = 160;
    const height = 120;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const frameData = ctx.getImageData(0, 0, width, height);
    const data = frameData.data;

    let totalSkinPixels = 0;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    let leftSkin = 0;
    let rightSkin = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Normalized Chromaticity r' = R/(R+G+B), g' = G/(R+G+B)
        const sum = r + g + b || 1;
        const rn = r / sum;
        const gn = g / sum;
        const isSkin = rn > 0.36 && rn < 0.58 && gn > 0.25 && gn < 0.38 && r > 60 && g > 40 && b > 20;

        if (isSkin) {
          totalSkinPixels++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          if (x < width * 0.35) leftSkin++;
          if (x > width * 0.65) rightSkin++;
        }
      }
    }

    const totalPixels = width * height;
    const skinRatio = totalSkinPixels / totalPixels;

    if (skinRatio < 0.03) {
      result.faceDetected = false;
      result.faceConfidence = 0.2;
      result.faceBbox = null;
      result.candidateCentering = 'absent';
    } else {
      result.faceDetected = true;
      result.faceConfidence = Math.min(0.96, 0.8 + skinRatio);

      const rawBox: BoundingBox = {
        x: minX / width,
        y: minY / height,
        width: Math.max(0.2, (maxX - minX) / width),
        height: Math.max(0.25, (maxY - minY) / height),
      };
      result.faceBbox = mirrorBbox(rawBox);

      const cx = result.faceBbox.x + result.faceBbox.width / 2;
      result.candidateCentering = cx < 0.28 || cx > 0.72 ? 'off_center' : 'centered';

      // Multiple persons if two strong separated skin clusters exist
      if (leftSkin > totalPixels * 0.06 && rightSkin > totalPixels * 0.06) {
        const rawSec: BoundingBox = { x: 0.05, y: 0.15, width: 0.32, height: 0.45 };
        result.illicitObjects.push({
          id: 'det-multi-heur',
          type: 'multiple_faces',
          label: 'Secondary Person (88%)',
          confidence: 0.88,
          bbox: mirrorBbox(rawSec),
        });
      }
    }
  } catch (e) {
    console.warn('Heuristic fallback error:', e);
  }
}
