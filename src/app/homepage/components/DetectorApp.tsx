'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import AppLogo from '@/components/ui/AppLogo';
import CameraViewport from './CameraViewport';
import StatsBar from './StatsBar';
import ControlsCard from './ControlsCard';

import InfoPanel from './InfoPanel';
import ModelInfo from './ModelInfo';
import ConsolePanel from './ConsolePanel';
import Footer from '@/components/Footer';

/* ─── TYPES ──────────────────────────────────────────────────── */
export type AppState = 'IDLE' | 'LOADING' | 'READY' | 'RUNNING' | 'STOPPED' | 'ERROR';
export type DetectorMode = 'coco' | 'pose' | 'hands' | 'face';

export interface Detection {
    bbox: [number, number, number, number];
    class: string;
    score: number;
    trackId?: number;
}

export interface TrackedObject extends Detection {
    trackId: number;
    trail: Array<{ x: number; y: number }>;
    missedFrames: number;
    firstSeen: number;
}

export interface LogEntry {
    time: string;
    type: 'info' | 'success' | 'warn' | 'error';
    msg: string;
}

export interface Stats {
    fps: number;
    count: number;
    inferenceMs: number;
    status: AppState;
    mode: DetectorMode;
}

export interface PoseData {
    keypoints: Array<{ part: string; position: { x: number; y: number }; score: number }>;
    score: number;
    poseName: string;
}

export interface GestureData {
    gesture: string;
    hand: string;
    confidence: number;
    emoji: string;
}

export interface FaceData {
    faceCount: number;
    expression: string;
    headH: string;
    headV: string;
    leftEye: string;
    rightEye: string;
}

/* ─── OBJECT INFO — ALL 80 COCO CLASSES ─────────────────────── */
export const OBJECT_INFO: Record<string, { desc: string; fact: string }> = {
    'person': { desc: 'A human being detected in the frame.', fact: 'The human eye can distinguish about 10 million different colours.' },
    'bicycle': { desc: 'A human-powered two-wheeled vehicle.', fact: 'There are more bicycles than cars in the Netherlands.' },
    'car': { desc: 'A motor vehicle designed for road travel.', fact: 'The average car has around 30,000 individual parts.' },
    'motorcycle': { desc: 'A two-wheeled motorised vehicle.', fact: 'The first motorcycle was built by Gottlieb Daimler in 1885.' },
    'airplane': { desc: 'A powered fixed-wing aircraft for air travel.', fact: 'A commercial airplane travels at about 900 km/h at cruising altitude.' },
    'bus': { desc: 'A large road vehicle for carrying passengers.', fact: 'The world\'s first motor bus service started in London in 1902.' },
    'train': { desc: 'A series of rail vehicles propelled along a track.', fact: 'The fastest train in the world reaches 603 km/h in Japan.' },
    'truck': { desc: 'A large motor vehicle for transporting goods.', fact: 'Trucks move about 70% of all freight transported in the US.' },
    'boat': { desc: 'A watercraft used for travel on water.', fact: 'The world\'s largest container ship can carry 24,000 containers.' },
    'traffic light': { desc: 'A signal device positioned at road intersections.', fact: 'The first traffic light was installed in London in 1868 — it exploded.' },
    'fire hydrant': { desc: 'A connection point for firefighters to access water.', fact: 'Fire hydrants can release up to 1,500 litres of water per minute.' },
    'stop sign': { desc: 'A regulatory road sign requiring vehicles to stop.', fact: 'Stop signs were originally yellow before switching to red in 1954.' },
    'parking meter': { desc: 'A device for collecting fees for vehicle parking.', fact: 'The first parking meter was installed in Oklahoma City in 1935.' },
    'bench': { desc: 'A long seat for multiple people, often outdoors.', fact: 'The world\'s longest bench stretches over 2 km in Mölndal, Sweden.' },
    'bird': { desc: 'A warm-blooded vertebrate with feathers and wings.', fact: 'There are approximately 10,000 known species of birds on Earth.' },
    'cat': { desc: 'A small domesticated carnivorous mammal.', fact: 'Cats spend about 70% of their lives sleeping.' },
    'dog': { desc: 'A domesticated carnivorous mammal and loyal companion.', fact: 'Dogs have a sense of smell 10,000 to 100,000 times stronger than humans.' },
    'horse': { desc: 'A large hoofed mammal used for riding and work.', fact: 'Horses can sleep both standing up and lying down.' },
    'sheep': { desc: 'A domesticated ruminant mammal raised for wool and meat.', fact: 'Sheep have rectangular pupils giving them a 270-degree field of vision.' },
    'cow': { desc: 'A large domesticated bovine animal.', fact: 'Cows have best friends and become stressed when separated from them.' },
    'elephant': { desc: 'The largest land animal, known for its trunk and tusks.', fact: 'Elephants are the only animals that cannot jump.' },
    'bear': { desc: 'A large omnivorous mammal with thick fur.', fact: 'Bears can run at speeds of up to 56 km/h.' },
    'zebra': { desc: 'An African equid with distinctive black-and-white stripes.', fact: 'No two zebras have the same stripe pattern — like fingerprints.' },
    'giraffe': { desc: 'The world\'s tallest living terrestrial animal.', fact: 'A giraffe\'s tongue is about 45 cm long and dark blue in colour.' },
    'backpack': { desc: 'A bag carried on the back with shoulder straps.', fact: 'The modern backpack was patented in 1952 by Gerry Cunningham.' },
    'umbrella': { desc: 'A collapsible canopy for protection from rain or sun.', fact: 'About 1.1 billion umbrellas are sold worldwide each year.' },
    'handbag': { desc: 'A small bag carried by hand or over the shoulder.', fact: 'The global handbag market is worth over $50 billion annually.' },
    'tie': { desc: 'A long piece of cloth worn around the neck.', fact: 'The necktie originated from Croatian mercenaries in the 17th century.' },
    'suitcase': { desc: 'A rectangular case with a handle for carrying clothes.', fact: 'Airlines lose or mishandle about 25 million bags per year globally.' },
    'frisbee': { desc: 'A plastic disc thrown and caught as a sport or game.', fact: 'The Frisbee was inspired by pie tins from the Frisbie Pie Company.' },
    'skis': { desc: 'Long flat runners attached to boots for gliding on snow.', fact: 'Skiing is one of the oldest forms of transportation, dating back 8,000 years.' },
    'snowboard': { desc: 'A board used to ride ocean waves.', fact: 'Surfing originated in Polynesia and was first documented in 1778.' },
    'tennis racket': { desc: 'A racket used to strike a ball in tennis.', fact: 'Tennis balls are covered with about 2 metres of felt.' },
    'bottle': { desc: 'A container with a narrow neck for storing liquids.', fact: 'Humans buy about 1 million plastic bottles every minute worldwide.' },
    'wine glass': { desc: 'A stemmed glass designed for drinking wine.', fact: 'The shape of a wine glass can significantly affect how wine tastes.' },
    'cup': { desc: 'A small container used for drinking beverages.', fact: 'The world drinks over 2 billion cups of coffee every day.' },
    'fork': { desc: 'A utensil with tines used for eating food.', fact: 'Forks were not widely used in Europe until the 11th century.' },
    'knife': { desc: 'A bladed tool used for cutting food.', fact: 'The oldest known knives date back 2.5 million years.' },
    'spoon': { desc: 'A utensil with a bowl-shaped head for eating liquids.', fact: 'Spoons are the oldest eating utensil, predating forks by thousands of years.' },
    'bowl': { desc: 'A round, deep dish used for food or liquid.', fact: 'The world\'s largest bowl of soup held 9,000 litres.' },
    'banana': { desc: 'A curved yellow tropical fruit.', fact: 'Bananas are slightly radioactive due to their potassium content.' },
    'apple': { desc: 'A round fruit from the Malus domestica tree.', fact: 'There are over 7,500 known varieties of apples worldwide.' },
    'sandwich': { desc: 'Food placed between two slices of bread.', fact: 'The sandwich was named after the 4th Earl of Sandwich in 1762.' },
    'orange': { desc: 'A citrus fruit with a tough bright rind.', fact: 'Oranges are a hybrid of pomelo and mandarin, not found in the wild.' },
    'broccoli': { desc: 'A green vegetable with a tree-like structure.', fact: 'Broccoli contains more protein per calorie than steak.' },
    'carrot': { desc: 'An orange root vegetable rich in beta-carotene.', fact: 'Carrots were originally purple before orange varieties were cultivated.' },
    'hot dog': { desc: 'A cooked sausage served in a sliced bun.', fact: 'Americans consume about 20 billion hot dogs per year.' },
    'pizza': { desc: 'A flat bread topped with sauce, cheese, and toppings.', fact: 'About 3 billion pizzas are sold in the US every year.' },
    'donut': { desc: 'A fried dough confection, often ring-shaped.', fact: 'The hole in a donut was invented in 1847 by Hanson Gregory.' },
    'cake': { desc: 'A sweet baked dessert, often layered with frosting.', fact: 'The world\'s tallest cake stood over 30 metres high in 1999.' },
    'chair': { desc: 'A piece of furniture designed for sitting.', fact: 'The average office worker sits for 10 hours per day.' },
    'couch': { desc: 'A long upholstered seat for multiple people.', fact: 'The word "sofa" comes from the Arabic word "suffah" meaning bench.' },
    'potted plant': { desc: 'A plant grown in a container indoors or outdoors.', fact: 'NASA found that indoor plants can remove up to 87% of air toxins.' },
    'bed': { desc: 'A piece of furniture used for sleeping and resting.', fact: 'Humans spend about one-third of their lives in bed.' },
    'dining table': { desc: 'A table used for eating meals.', fact: 'The tradition of dining tables dates back to ancient Egypt.' },
    'toilet': { desc: 'A plumbing fixture used for waste disposal.', fact: 'The average person visits the toilet 2,500 times per year.' },
    'tv': { desc: 'An electronic device for displaying video content.', fact: 'The average American watches over 4 hours of TV per day.' },
    'laptop': { desc: 'A portable personal computer.', fact: 'The first laptop weighed 5kg and cost $1,795 in 1981.' },
    'mouse': { desc: 'A handheld pointing device for computers.', fact: 'The computer mouse was invented by Douglas Engelbart in 1964.' },
    'remote': { desc: 'A handheld device for controlling electronics wirelessly.', fact: 'The first TV remote was called "Lazy Bones" and was invented in 1950.' },
    'keyboard': { desc: 'An input device with keys for typing text.', fact: 'The QWERTY layout was designed to slow typists down to prevent jams.' },
    'cell phone': { desc: 'A handheld wireless communication device.', fact: 'More people in the world have mobile phones than toilets.' },
    'microwave': { desc: 'An appliance that heats food using microwave radiation.', fact: 'The microwave was invented accidentally when radar melted a chocolate bar.' },
    'oven': { desc: 'A thermally insulated chamber for heating and cooking food.', fact: 'The first gas oven was patented in 1826 by James Sharp.' },
    'toaster': { desc: 'A small appliance for browning sliced bread.', fact: 'The pop-up toaster was invented by Charles Strite in 1921.' },
    'sink': { desc: 'A basin with a water supply for washing.', fact: 'The average person uses about 95 litres of water per day at the sink.' },
    'refrigerator': { desc: 'An appliance for keeping food cold and fresh.', fact: 'The first home refrigerator was sold in 1913 for $900 — a year\'s wages.' },
    'book': { desc: 'A written or printed work bound between covers.', fact: 'The world\'s largest library holds over 170 million items.' },
    'clock': { desc: 'A device for measuring and displaying time.', fact: 'The most accurate clock loses only 1 second every 300 million years.' },
    'vase': { desc: 'A decorative container used for holding flowers.', fact: 'The oldest known vase dates back over 9,000 years to ancient China.' },
    'scissors': { desc: 'A cutting instrument with two pivoting blades.', fact: 'Scissors have been used for over 3,000 years since ancient Egypt.' },
    'teddy bear': { desc: 'A soft toy in the form of a bear.', fact: 'The teddy bear was named after US President Theodore "Teddy" Roosevelt.' },
    'hair drier': { desc: 'An electrical device for drying hair with hot air.', fact: 'The first hair dryer was invented in 1888 by Alexandre Godefoy.' },
    'toothbrush': { desc: 'A brush used with toothpaste to clean teeth.', fact: 'The first mass-produced toothbrush was made in 1938 with nylon bristles.' },
};

/* ─── GESTURE INFO ───────────────────────────────────────────── */
export const GESTURE_INFO: Record<string, { emoji: string; meaning: string; usage: string }> = {
    'Fist': { emoji: '✊', meaning: 'A closed fist with all fingers curled inward.', usage: 'Strength, solidarity, protest, or a greeting bump.' },
    'Open Hand': { emoji: '✋', meaning: 'All five fingers extended and spread apart.', usage: 'Stop signal, greeting, high-five, or showing a number.' },
    'Thumbs Up': { emoji: '👍', meaning: 'Thumb extended upward with other fingers curled.', usage: 'Approval, agreement, positive feedback, or "good job".' },
    'Thumbs Down': { emoji: '👎', meaning: 'Thumb extended downward with other fingers curled.', usage: 'Disapproval, disagreement, or negative feedback.' },
    'Peace': { emoji: '✌️', meaning: 'The peace/victory sign with index and middle fingers extended.', usage: 'Photos, greeting, victory celebration, or peace symbol.' },
    'Call Me': { emoji: '🤙', meaning: 'Thumb and pinky extended, mimicking a phone handset.', usage: '"Call me", surfer culture, casual greeting, or hang loose.' },
    'Pointing': { emoji: '👆', meaning: 'Index finger extended upward, others curled.', usage: 'Directing attention, selecting, or emphasising a point.' },
    'Crossed Fingers': { emoji: '🤞', meaning: 'Index and middle fingers crossed over each other.', usage: 'Wishing for luck, hoping for a positive outcome.' },
};

/* ─── HUMAN FACTS ────────────────────────────────────────────── */
const HUMAN_FACTS = [
    'The human brain processes images in as little as 13 milliseconds.',
    'Humans are the only animals that blush.',
    'Your heart beats about 100,000 times every single day.',
    'The human eye can detect a single photon of light in complete darkness.',
    'Humans share 60% of their DNA with bananas.',
    'The human body contains enough iron to make a 3-inch nail.',
    'Your nose can detect over 1 trillion different scents.',
    'Humans are the only species known to cook their food.',
    'The average human produces enough saliva to fill two swimming pools in a lifetime.',
    'Your skin is the largest organ in your body, weighing about 4 kg.',
    'Humans are bioluminescent — we emit a faint glow invisible to the naked eye.',
    'The human brain generates about 23 watts of power when awake.',
    'You have about 37 trillion cells in your body.',
    'The cornea is the only part of the body with no blood supply.',
    'Humans are the only animals with chins.',
];

/* ─── FACE FACTS ─────────────────────────────────────────────── */
const FACE_FACTS = [
    'Humans can recognise over 10,000 different faces.',
    'The face has 43 muscles that create thousands of expressions.',
    'Babies can recognise faces within hours of being born.',
    'Facial recognition is processed in the fusiform face area of the brain.',
    'Humans are better at recognising faces than any AI system to date.',
    'The left side of the face is more expressive than the right.',
    'Smiling is contagious — seeing someone smile activates mirror neurons.',
    'Humans can detect micro-expressions lasting just 1/25th of a second.',
    'The eyes are the most expressive part of the human face.',
    'Identical twins have different facial recognition patterns in the brain.',
];

/* ─── CLASS COLOR PALETTE ─────────────────────────────────────── */
const CLASS_COLORS: Record<string, string> = {
    person: '#00d4ff', car: '#ff4560', bicycle: '#00ff9d', motorcycle: '#ffb800',
    airplane: '#a855f7', bus: '#f97316', train: '#ec4899', truck: '#14b8a6',
    boat: '#3b82f6', dog: '#84cc16', cat: '#f43f5e', horse: '#d97706',
    sheep: '#6366f1', cow: '#10b981', bird: '#06b6d4', bottle: '#8b5cf6',
    chair: '#64748b', sofa: '#f59e0b', couch: '#f59e0b', laptop: '#00d4ff',
    phone: '#00ff9d', 'cell phone': '#00ff9d', book: '#c084fc', clock: '#fb923c',
    keyboard: '#22d3ee', mouse: '#a3e635', tv: '#f472b6', default: '#7a8fa8',
};

export function getClassColor(cls: string): string {
    return CLASS_COLORS[cls.toLowerCase()] ?? CLASS_COLORS.default;
}

/* ─── DYNAMIC SCRIPT LOADER ──────────────────────────────────── */
function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src; s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load: ${src}`));
        document.head.appendChild(s);
    });
}

/* ─── IoU ────────────────────────────────────────────────────── */
function iou(a: Detection, b: Detection): number {
    const [ax, ay, aw, ah] = a.bbox;
    const [bx, by, bw, bh] = b.bbox;
    const ix = Math.max(0, Math.min(ax + aw, bx + bw) - Math.max(ax, bx));
    const iy = Math.max(0, Math.min(ay + ah, by + bh) - Math.max(ay, by));
    const inter = ix * iy;
    return inter / (aw * ah + bw * bh - inter);
}

/* ─── POSITION ZONE ──────────────────────────────────────────── */
function getZone(cx: number, cy: number, w: number, h: number): string {
    const col = cx < w / 3 ? 'Left' : cx < (2 * w) / 3 ? 'Centre' : 'Right';
    const row = cy < h / 3 ? 'Top' : cy < (2 * h) / 3 ? 'Centre' : 'Bottom';
    return row === 'Centre' && col === 'Centre' ? 'Centre' : `${row}-${col}`;
}

/* ─── MAIN APP ───────────────────────────────────────────────── */
export default function DetectorApp() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const clickLayerRef = useRef<HTMLDivElement>(null);
    const modelRef = useRef<unknown>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafIdRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const frameCount = useRef<number>(0);
    const fpsAccum = useRef<number>(0);
    const trackedRef = useRef<Record<number, TrackedObject>>({});
    const nextIdRef = useRef<number>(1);
    const gestureHistRef = useRef<string[]>([]);
    const humanFactIdxRef = useRef<number>(0);
    const faceFactIdxRef = useRef<number>(0);
    const factTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [appState, setAppState] = useState<AppState>('IDLE');
    const [mode, setMode] = useState<DetectorMode>('coco');
    const [facing, setFacing] = useState<'user' | 'environment'>('user');
    const [threshold, setThreshold] = useState<number>(0.40);
    const [maxDets, setMaxDets] = useState<number>(10);
    const [detections, setDetections] = useState<Detection[]>([]);
    const [classCounts, setClassCounts] = useState<Record<string, number>>({});
    const [stats, setStats] = useState<Stats>({ fps: 0, count: 0, inferenceMs: 0, status: 'IDLE', mode: 'coco' });
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [modelLoaded, setModelLoaded] = useState<boolean>(false);
    const [loadedMode, setLoadedMode] = useState<DetectorMode | null>(null);
    const [selectedObj, setSelectedObj] = useState<(TrackedObject & { zone: string; sizeLabel: string }) | null>(null);
    const [poseData, setPoseData] = useState<PoseData | null>(null);
    const [gestureData, setGestureData] = useState<GestureData | null>(null);
    const [faceData, setFaceData] = useState<FaceData | null>(null);
    const [humanFact, setHumanFact] = useState<string>(HUMAN_FACTS[0]);
    const [faceFact, setFaceFact] = useState<string>(FACE_FACTS[0]);
    const [loadingMsg, setLoadingMsg] = useState<string>('Loading…');

    const addLog = useCallback((msg: string, type: LogEntry['type'] = 'info') => {
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        setLogs(prev => [...prev.slice(-49), { time, type, msg }]);
    }, []);

    /* ─── DRAW COCO-SSD ──────────────────────────────────────── */
    const drawCoco = useCallback((tracked: Record<number, TrackedObject>, w: number, h: number) => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        canvas.width = w; canvas.height = h;
        ctx.clearRect(0, 0, w, h);

        Object.values(tracked).forEach(obj => {
            if (obj.score < threshold) return;
            const [x, y, bw, bh] = obj.bbox;
            let color = getClassColor(obj.class);
            const cx = x + bw / 2, cy = y + bh / 2;

            // Motion trail
            if (obj.trail.length > 1) {
                for (let i = 1; i < obj.trail.length; i++) {
                    const alpha = (i / obj.trail.length) * 0.6;
                    ctx.beginPath();
                    ctx.moveTo(obj.trail[i - 1].x, obj.trail[i - 1].y);
                    ctx.lineTo(obj.trail[i].x, obj.trail[i].y);
                    ctx.strokeStyle = `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }

            // Subtle fill
            ctx.fillStyle = `${color}18`;
            ctx.fillRect(x, y, bw, bh);

            // Selected highlight
            if (selectedObj?.trackId === obj.trackId) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 12;
                ctx.strokeRect(x, y, bw, bh);
                ctx.shadowBlur = 0;
            }

            // Corner L-shapes
            const cornerLen = Math.min(bw, bh) * 0.18;
            ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = 'round';
            ctx.shadowColor = color; ctx.shadowBlur = 8;
            const corners: [number, number, number, number][] = [
                [x, y, cornerLen, 0], [x, y, 0, cornerLen],
                [x + bw, y, -cornerLen, 0], [x + bw, y, 0, cornerLen],
                [x, y + bh, cornerLen, 0], [x, y + bh, 0, -cornerLen],
                [x + bw, y + bh, -cornerLen, 0], [x + bw, y + bh, 0, -cornerLen],
            ];
            corners.forEach(([sx, sy, dx, dy]) => {
                ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + dx, sy + dy); ctx.stroke();
            });
            ctx.shadowBlur = 0;

            // Label pill
            const label = `#${obj.trackId} ${obj.class}  ${Math.round(obj.score * 100)}%`;
            ctx.font = '500 11px "IBM Plex Mono", monospace';
            const metrics = ctx.measureText(label);
            const padX = 7, padY = 4, pillH = 18, pillW = metrics.width + padX * 2;
            const pillX = x, pillY = y - pillH - 4 < 0 ? y + 4 : y - pillH - 4;
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.roundRect(pillX, pillY, pillW, pillH, 4); ctx.fill();
            ctx.fillStyle = '#080b10';
            ctx.fillText(label, pillX + padX, pillY + pillH - padY);

            // Centre dot for trail
            ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.fillStyle = color; ctx.fill();
        });
    }, [threshold, selectedObj]);

    /* ─── DRAW POSE ──────────────────────────────────────────── */
    const drawPose = useCallback((poses: unknown[], w: number, h: number) => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        canvas.width = w; canvas.height = h;
        ctx.clearRect(0, 0, w, h);

        const SKELETON_PAIRS = [
            ['nose', 'leftEye'], ['nose', 'rightEye'], ['leftEye', 'leftEar'], ['rightEye', 'rightEar'],
            ['leftShoulder', 'rightShoulder'], ['leftShoulder', 'leftElbow'], ['rightShoulder', 'rightElbow'],
            ['leftElbow', 'leftWrist'], ['rightElbow', 'rightWrist'],
            ['leftShoulder', 'leftHip'], ['rightShoulder', 'rightHip'],
            ['leftHip', 'rightHip'], ['leftHip', 'leftKnee'], ['rightHip', 'rightKnee'],
            ['leftKnee', 'leftAnkle'], ['rightKnee', 'rightAnkle'],
        ];
        const SEGMENT_COLORS: Record<string, string> = {
            nose: '#00d4ff', leftEye: '#00d4ff', rightEye: '#00d4ff', leftEar: '#00d4ff', rightEar: '#00d4ff',
            leftShoulder: '#3b82f6', rightShoulder: '#3b82f6', leftHip: '#3b82f6', rightHip: '#3b82f6',
            leftElbow: '#00ff9d', rightElbow: '#00ff9d', leftWrist: '#00ff9d', rightWrist: '#00ff9d',
            leftKnee: '#ffb800', rightKnee: '#ffb800', leftAnkle: '#ffb800', rightAnkle: '#ffb800',
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        poses.forEach((pose: any) => {
            const kpMap: Record<string, { x: number; y: number; score: number }> = {};
            pose.keypoints.forEach((kp: { part: string; position: { x: number; y: number }; score: number }) => {
                kpMap[kp.part] = { x: kp.position.x, y: kp.position.y, score: kp.score };
            });

            SKELETON_PAIRS.forEach(([a, b]) => {
                const ka = kpMap[a], kb = kpMap[b];
                if (!ka || !kb || ka.score < 0.4 || kb.score < 0.4) return;
                ctx.beginPath(); ctx.moveTo(ka.x, ka.y); ctx.lineTo(kb.x, kb.y);
                ctx.strokeStyle = SEGMENT_COLORS[a] ?? '#ffffff';
                ctx.lineWidth = 2; ctx.globalAlpha = 0.7; ctx.stroke(); ctx.globalAlpha = 1;
            });

            pose.keypoints.forEach((kp: { part: string; position: { x: number; y: number }; score: number }) => {
                if (kp.score < 0.4) return;
                let color = SEGMENT_COLORS[kp.part] ?? '#ffffff';
                ctx.beginPath(); ctx.arc(kp.position.x, kp.position.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.fill();
                ctx.shadowBlur = 0;
                ctx.font = '9px "IBM Plex Mono"';
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.fillText(`${Math.round(kp.score * 100)}%`, kp.position.x + 7, kp.position.y + 3);
            });
        });
    }, []);

    /* ─── CLASSIFY POSE ──────────────────────────────────────── */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classifyPose = useCallback((pose: any): string => {
        const kp: Record<string, { x: number; y: number; score: number }> = {};
        pose.keypoints.forEach((k: { part: string; position: { x: number; y: number }; score: number }) => { kp[k.part] = { x: k.position.x, y: k.position.y, score: k.score }; });
        const has = (p: string) => kp[p] && kp[p].score > 0.4;
        if (has('leftWrist') && has('rightWrist') && has('leftShoulder') && has('rightShoulder')) {
            if (kp['leftWrist'].y < kp['leftShoulder'].y && kp['rightWrist'].y < kp['rightShoulder'].y) {
                const lDiff = Math.abs(kp['leftWrist'].y - kp['leftShoulder'].y);
                const rDiff = Math.abs(kp['rightWrist'].y - kp['rightShoulder'].y);
                if (lDiff < 40 && rDiff < 40) return 'T-Pose';
                return 'Arms Raised';
            }
        }
        if (has('leftHip') && has('leftKnee')) {
            if (Math.abs(kp['leftHip'].y - kp['leftKnee'].y) < 80) return 'Sitting';
        }
        if (has('nose') && has('leftHip') && has('rightHip')) {
            const hipMidX = (kp['leftHip'].x + kp['rightHip'].x) / 2;
            if (Math.abs(kp['nose'].x - hipMidX) > 80) return 'Leaning';
        }
        return 'Standing';
    }, []);

    /* ─── CLASSIFY GESTURE ───────────────────────────────────── */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classifyGesture = useCallback((landmarks: any[]): string => {
        const tips = [4, 8, 12, 16, 20];
        const pips = [3, 6, 10, 14, 18];
        const extended = tips.map((tip, i) => {
            if (i === 0) return landmarks[tip].y < landmarks[tip - 1].y;
            return landmarks[tip].y < landmarks[pips[i]].y;
        });
        const [thumb, index, middle, ring, pinky] = extended;
        if (!thumb && !index && !middle && !ring && !pinky) return 'Fist';
        if (thumb && index && middle && ring && pinky) return 'Open Hand';
        if (index && middle && !ring && !pinky && !thumb) return 'Peace';
        if (thumb && !index && !middle && !ring && pinky) return 'Call Me';
        if (index && !middle && !ring && !pinky) return 'Pointing';
        if (thumb && !index && !middle && !ring && !pinky) {
            return landmarks[4].y < landmarks[9].y ? 'Thumbs Up' : 'Thumbs Down';
        }
        if (index && middle && !ring && !pinky) return 'Crossed Fingers';
        return 'Open Hand';
    }, []);

    /* ─── DRAW HANDS ─────────────────────────────────────────── */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drawHands = useCallback((results: any, w: number, h: number) => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        canvas.width = w; canvas.height = h;
        ctx.clearRect(0, 0, w, h);
        if (!results.multiHandLandmarks) return;

        const CONNECTIONS = [
            [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12], [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20], [5, 9], [9, 13], [13, 17],
        ];

        results.multiHandLandmarks.forEach((landmarks: Array<{ x: number; y: number; z: number }>, idx: number) => {
            const handedness = results.multiHandedness?.[idx]?.label ?? 'Right';
            let color = handedness === 'Left' ? '#a855f7' : '#14b8a6';

            CONNECTIONS.forEach(([a, b]) => {
                const la = landmarks[a], lb = landmarks[b];
                ctx.beginPath();
                ctx.moveTo(la.x * w, la.y * h);
                ctx.lineTo(lb.x * w, lb.y * h);
                ctx.strokeStyle = `${color}99`; ctx.lineWidth = 2; ctx.stroke();
            });

            landmarks.forEach(lm => {
                ctx.beginPath(); ctx.arc(lm.x * w, lm.y * h, 4, 0, Math.PI * 2);
                ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 6; ctx.fill();
                ctx.shadowBlur = 0;
            });

            // Gesture badge
            const gesture = classifyGesture(landmarks);
            const info = GESTURE_INFO[gesture];
            const bx = landmarks[9].x * w, by = landmarks[9].y * h - 40;
            const badgeText = `${info?.emoji ?? ''} ${gesture}`;
            ctx.font = 'bold 14px "IBM Plex Mono"';
            const tw = ctx.measureText(badgeText).width;
            ctx.fillStyle = 'rgba(8,11,16,0.85)';
            ctx.beginPath(); ctx.roundRect(bx - tw / 2 - 10, by - 18, tw + 20, 26, 8); ctx.fill();
            ctx.fillStyle = color;
            ctx.fillText(badgeText, bx - tw / 2, by + 2);
        });
    }, [classifyGesture]);

    /* ─── DRAW FACE ──────────────────────────────────────────── */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drawFace = useCallback((results: any, w: number, h: number) => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        canvas.width = w; canvas.height = h;
        ctx.clearRect(0, 0, w, h);
        if (!results.multiFaceLandmarks) return;

        const EYE_L = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
        const EYE_R = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
        const LIPS = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];
        const BROWS_L = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
        const BROWS_R = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        results.multiFaceLandmarks.forEach((landmarks: any[]) => {
            // All mesh dots
            landmarks.forEach((lm, i) => {
                const isEyeL = EYE_L.includes(i), isEyeR = EYE_R.includes(i);
                const isLip = LIPS.includes(i);
                const isBrow = BROWS_L.includes(i) || BROWS_R.includes(i);
                let color = 'rgba(255,255,255,0.15)';
                if (isEyeL || isEyeR) color = '#00d4ff';
                else if (isLip) color = '#ec4899';
                else if (isBrow) color = '#ffb800';
                ctx.beginPath(); ctx.arc(lm.x * w, lm.y * h, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = color; ctx.fill();
            });
        });
    }, []);

    /* ─── ANALYZE FACE ───────────────────────────────────────── */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const analyzeFace = useCallback((results: any): FaceData => {
        const faces = results.multiFaceLandmarks ?? [];
        if (faces.length === 0) return { faceCount: 0, expression: 'None', headH: 'Forward', headV: 'Forward', leftEye: 'Open', rightEye: 'Open' };
        const lm = faces[0];
        const noseTip = lm[1], faceCentre = lm[168];
        const headH = noseTip.x < faceCentre.x - 0.03 ? 'Looking Left' : noseTip.x > faceCentre.x + 0.03 ? 'Looking Right' : 'Forward';
        const headV = noseTip.y < faceCentre.y - 0.03 ? 'Looking Up' : noseTip.y > faceCentre.y + 0.03 ? 'Looking Down' : 'Forward';
        const eyeRatioL = Math.abs(lm[159].y - lm[145].y) / (Math.abs(lm[33].x - lm[133].x) + 0.001);
        const eyeRatioR = Math.abs(lm[386].y - lm[374].y) / (Math.abs(lm[362].x - lm[263].x) + 0.001);
        const leftEye = eyeRatioL > 0.15 ? 'Open' : 'Closed';
        const rightEye = eyeRatioR > 0.15 ? 'Open' : 'Closed';
        const mouthOpen = Math.abs(lm[13].y - lm[14].y) > 0.02;
        const smiling = Math.abs(lm[61].x - lm[291].x) > 0.25;
        const expression = mouthOpen ? (smiling ? 'Surprised' : 'Mouth Open') : smiling ? 'Smiling' : 'Neutral';
        return { faceCount: faces.length, expression, headH, headV, leftEye, rightEye };
    }, []);

    /* ─── OBJECT TRACKING ────────────────────────────────────── */
    const updateTracking = useCallback((dets: Detection[], w: number, h: number): Record<number, TrackedObject> => {
        const tracked = trackedRef.current;
        const matched = new Set<number>();
        const newTracked: Record<number, TrackedObject> = {};

        dets.forEach(det => {
            let bestId = -1, bestIou = 0.35;
            Object.entries(tracked).forEach(([idStr, obj]) => {
                const id = parseInt(idStr);
                if (matched.has(id)) return;
                const score = iou(det, obj);
                if (score > bestIou) { bestIou = score; bestId = id; }
            });

            const [x, y, bw, bh] = det.bbox;
            const cx = x + bw / 2, cy = y + bh / 2;

            if (bestId >= 0) {
                const prev = tracked[bestId];
                const trail = [...prev.trail, { x: cx, y: cy }].slice(-20);
                newTracked[bestId] = { ...det, trackId: bestId, trail, missedFrames: 0, firstSeen: prev.firstSeen };
                matched.add(bestId);
            } else {
                const id = nextIdRef.current++;
                newTracked[id] = { ...det, trackId: id, trail: [{ x: cx, y: cy }], missedFrames: 0, firstSeen: Date.now() };
            }
        });

        // Keep unmatched objects for up to 15 frames
        Object.entries(tracked).forEach(([idStr, obj]) => {
            const id = parseInt(idStr);
            if (!matched.has(id)) {
                if (obj.missedFrames < 15) {
                    newTracked[id] = { ...obj, missedFrames: obj.missedFrames + 1 };
                }
            }
        });

        trackedRef.current = newTracked;
        const counts: Record<string, number> = {};
        Object.values(newTracked).forEach(o => { if (o.missedFrames === 0) counts[o.class] = (counts[o.class] ?? 0) + 1; });
        setClassCounts(counts);

        // Update selected object if still tracked
        setSelectedObj(prev => {
            if (!prev) return null;
            const still = newTracked[prev.trackId];
            if (!still || still.missedFrames > 0) return null;
            const [x2, y2, bw2, bh2] = still.bbox;
            const cx2 = x2 + bw2 / 2, cy2 = y2 + bh2 / 2;
            return { ...still, zone: getZone(cx2, cy2, w, h), sizeLabel: getSizeLabel(bw2 * bh2, w * h) };
        });

        return newTracked;
    }, []);

    function getSizeLabel(area: number, total: number): string {
        const pct = area / total;
        return pct < 0.05 ? 'Small' : pct < 0.20 ? 'Medium' : 'Large';
    }

    /* ─── INFERENCE LOOP ─────────────────────────────────────── */
    const inferenceLoop = useCallback(async (timestamp: number) => {
        const video = videoRef.current;
        if (!video || !modelRef.current) return;

        const elapsed = timestamp - lastTimeRef.current;
        frameCount.current++; fpsAccum.current += elapsed;
        if (fpsAccum.current >= 500) {
            const fps = Math.round((frameCount.current / fpsAccum.current) * 1000);
            frameCount.current = 0; fpsAccum.current = 0;
            setStats(prev => ({ ...prev, fps }));
        }
        lastTimeRef.current = timestamp;

        if (video.readyState === 4) {
            try {
                const t0 = performance.now();
                const w = video.videoWidth || 640, h = video.videoHeight || 480;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const m = modelRef.current as any;

                if (mode === 'coco') {
                    const raw = await m.detect(video, maxDets, 0.15) as Detection[];
                    const filtered = raw.filter(d => d.score >= threshold);
                    const tracked = updateTracking(filtered, w, h);
                    const ms = Math.round(performance.now() - t0);
                    setDetections(filtered);
                    setStats(prev => ({ ...prev, count: filtered.length, inferenceMs: ms, status: 'RUNNING' }));
                    drawCoco(tracked, w, h);
                } else if (mode === 'pose') {
                    const poses = await m.estimateMultiplePoses(video, { maxDetections: maxDets, scoreThreshold: threshold });
                    const ms = Math.round(performance.now() - t0);
                    setStats(prev => ({ ...prev, count: poses.length, inferenceMs: ms, status: 'RUNNING' }));
                    drawPose(poses, w, h);
                    if (poses.length > 0) {
                        const pose = poses[0];
                        const poseName = classifyPose(pose);
                        const visible = pose.keypoints.filter((k: { score: number }) => k.score > 0.4).length;
                        setPoseData({ keypoints: pose.keypoints, score: pose.score, poseName });
                        setStats(prev => ({ ...prev, count: poses.length }));
                        addLog(`Pose: ${poseName} (${visible}/17 keypoints)`, 'info');
                    } else {
                        setPoseData(null);
                    }
                }
            } catch { /* silent */ }
        }
        rafIdRef.current = requestAnimationFrame(inferenceLoop);
    }, [mode, threshold, maxDets, updateTracking, drawCoco, drawPose, classifyPose, addLog]);

    /* ─── LOAD MODEL ─────────────────────────────────────────── */
    const loadModel = useCallback(async (targetMode: DetectorMode = mode) => {
        setAppState('LOADING');
        addLog(`Loading model for mode: ${targetMode}…`, 'info');
        try {
            if (targetMode === 'coco') {
                setLoadingMsg('Loading TensorFlow.js…');
                await loadScript('https://unpkg.com/@tensorflow/tfjs@4.20.0/dist/tf.min.js');
                addLog('TF.js loaded ✓', 'success');
                setLoadingMsg('Loading COCO-SSD…');
                await loadScript('https://unpkg.com/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js');
                addLog('COCO-SSD loaded ✓', 'success');
                setLoadingMsg('Initialising model…');
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const model = await (window as any).cocoSsd.load({ base: 'lite_mobilenet_v2' });
                modelRef.current = model;
            } else if (targetMode === 'pose') {
                setLoadingMsg('Loading TensorFlow.js…');
                await loadScript('https://unpkg.com/@tensorflow/tfjs@4.20.0/dist/tf.min.js');
                setLoadingMsg('Loading PoseNet…');
                await loadScript('https://unpkg.com/@tensorflow-models/posenet@2.2.2/dist/posenet.min.js');
                addLog('PoseNet loaded ✓', 'success');
                setLoadingMsg('Initialising PoseNet…');
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const model = await (window as any).posenet.load({ architecture: 'MobileNetV1', outputStride: 16, inputResolution: { width: 640, height: 480 }, multiplier: 0.75 });
                modelRef.current = model;
            } else if (targetMode === 'hands') {
                setLoadingMsg('Loading MediaPipe Hands…');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
                addLog('MediaPipe Hands loaded ✓', 'success');
                setLoadingMsg('Initialising Hands model…');
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const hands = new (window as any).Hands({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
                hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                hands.onResults((results: any) => {
                    const video = videoRef.current;
                    if (!video) return;
                    const w = video.videoWidth || 640, h = video.videoHeight || 480;
                    drawHands(results, w, h);
                    const count = results.multiHandLandmarks?.length ?? 0;
                    setStats(prev => ({ ...prev, count, status: 'RUNNING' }));
                    if (count > 0) {
                        const lm = results.multiHandLandmarks[0];
                        const handedness = results.multiHandedness?.[0]?.label ?? 'Right';
                        const gesture = classifyGesture(lm);
                        gestureHistRef.current = [...gestureHistRef.current.slice(-4), gesture];
                        const stable = gestureHistRef.current.filter(g => g === gesture).length >= 3 ? gesture : gestureHistRef.current[gestureHistRef.current.length - 1];
                        const info = GESTURE_INFO[stable];
                        setGestureData({ gesture: stable, hand: handedness, confidence: results.multiHandedness?.[0]?.score ?? 0.9, emoji: info?.emoji ?? '' });
                    } else {
                        setGestureData(null);
                    }
                });
                modelRef.current = { _hands: hands, _type: 'hands' };
            } else if (targetMode === 'face') {
                setLoadingMsg('Loading MediaPipe Face Mesh…');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
                addLog('MediaPipe Face Mesh loaded ✓', 'success');
                setLoadingMsg('Initialising Face Mesh…');
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const faceMesh = new (window as any).FaceMesh({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });
                faceMesh.setOptions({ maxNumFaces: 4, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                faceMesh.onResults((results: any) => {
                    const video = videoRef.current;
                    if (!video) return;
                    const w = video.videoWidth || 640, h = video.videoHeight || 480;
                    drawFace(results, w, h);
                    const count = results.multiFaceLandmarks?.length ?? 0;
                    setStats(prev => ({ ...prev, count, status: 'RUNNING' }));
                    if (count > 0) {
                        setFaceData(analyzeFace(results));
                    } else {
                        setFaceData(null);
                    }
                });
                modelRef.current = { _face: faceMesh, _type: 'face' };
            }

            setModelLoaded(true);
            setLoadedMode(targetMode);
            setAppState('READY');
            addLog(`Model ready for ${targetMode} mode`, 'success');
        } catch (err: unknown) {
            setAppState('ERROR');
            const msg = err instanceof Error ? err.message : 'Unknown error';
            addLog(`Model load failed: ${msg}`, 'error');
        }
    }, [mode, addLog, drawHands, drawFace, classifyGesture, analyzeFace]);

    /* ─── START CAMERA ───────────────────────────────────────── */
    const startCamera = useCallback(async (facingMode: 'user' | 'environment') => {
        try {
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
            });
            streamRef.current = stream;
            const video = videoRef.current!;
            video.srcObject = stream;
            await video.play();
            addLog(`Camera started (${facingMode === 'user' ? 'front' : 'rear'})`, 'success');
            return true;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Camera denied';
            addLog(`Camera error: ${msg}`, 'error');
            return false;
        }
    }, [addLog]);

    /* ─── MEDIAPIPE LOOP ─────────────────────────────────────── */
    const mediapipeLoop = useCallback(async () => {
        const video = videoRef.current;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = modelRef.current as any;
        if (!video || !m || video.readyState < 2) {
            rafIdRef.current = requestAnimationFrame(mediapipeLoop);
            return;
        }
        try {
            const t0 = performance.now();
            if (m._type === 'hands' || m._type === 'face') await m._hands.send({ image: video });
            const ms = Math.round(performance.now() - t0);
            setStats(prev => ({ ...prev, inferenceMs: ms }));
        } catch { /* silent */ }
        rafIdRef.current = requestAnimationFrame(mediapipeLoop);
    }, []);

    /* ─── START DETECTION ────────────────────────────────────── */
    const handleStart = useCallback(async () => {
        if (!modelLoaded || loadedMode !== mode) {
            await loadModel(mode);
        }
        if (!modelRef.current) return;
        addLog('Requesting camera access…', 'info');
        const ok = await startCamera(facing);
        if (!ok) { setAppState('ERROR'); return; }
        setAppState('RUNNING');
        setStats(prev => ({ ...prev, status: 'RUNNING', mode }));
        lastTimeRef.current = performance.now();
        frameCount.current = 0; fpsAccum.current = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = modelRef.current as any;
        if (m._type === 'hands' || m._type === 'face') {
            rafIdRef.current = requestAnimationFrame(mediapipeLoop);
        } else {
            rafIdRef.current = requestAnimationFrame(inferenceLoop);
        }
        addLog('Detection loop started', 'success');
    }, [modelLoaded, loadedMode, mode, loadModel, facing, startCamera, inferenceLoop, mediapipeLoop, addLog]);

    /* ─── STOP DETECTION ─────────────────────────────────────── */
    const handleStop = useCallback(() => {
        cancelAnimationFrame(rafIdRef.current);
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        const canvas = canvasRef.current;
        if (canvas) { const ctx = canvas.getContext('2d'); ctx?.clearRect(0, 0, canvas.width, canvas.height); }
        setAppState('STOPPED');
        setDetections([]); setClassCounts({});
        setStats({ fps: 0, count: 0, inferenceMs: 0, status: 'STOPPED', mode });
        setPoseData(null); setGestureData(null); setFaceData(null); setSelectedObj(null);
        addLog('Detection stopped', 'warn');
    }, [mode, addLog]);

    /* ─── MODE SWITCH ────────────────────────────────────────── */
    const handleModeChange = useCallback(async (newMode: DetectorMode) => {
        if (appState === 'RUNNING') handleStop();
        setMode(newMode);
        setModelLoaded(false);
        modelRef.current = null;
        trackedRef.current = {};
        nextIdRef.current = 1;
        setDetections([]); setClassCounts({}); setPoseData(null); setGestureData(null); setFaceData(null); setSelectedObj(null);
        setStats({ fps: 0, count: 0, inferenceMs: 0, status: 'IDLE', mode: newMode });
        addLog(`Switched to ${newMode} mode`, 'info');
    }, [appState, handleStop, addLog]);

    /* ─── FLIP CAMERA ────────────────────────────────────────── */
    const handleFlipCamera = useCallback(async () => {
        const newFacing = facing === 'user' ? 'environment' : 'user';
        setFacing(newFacing);
        if (appState === 'RUNNING') {
            addLog(`Switching to ${newFacing === 'user' ? 'front' : 'rear'} camera…`, 'info');
            await startCamera(newFacing);
        }
    }, [facing, appState, startCamera, addLog]);

    /* ─── SNAPSHOT ───────────────────────────────────────────── */
    const handleSnapshot = useCallback(() => {
        const video = videoRef.current, canvas = canvasRef.current;
        if (!video || !canvas) return;
        const snap = document.createElement('canvas');
        snap.width = video.videoWidth || 640; snap.height = video.videoHeight || 480;
        const ctx = snap.getContext('2d')!;
        ctx.save(); ctx.translate(snap.width, 0); ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, snap.width, snap.height); ctx.restore();
        ctx.drawImage(canvas, 0, 0, snap.width, snap.height);
        const link = document.createElement('a');
        link.download = `detector_${Date.now()}.png`; link.href = snap.toDataURL('image/png'); link.click();
        addLog('Snapshot saved as PNG', 'success');
    }, [addLog]);

    /* ─── CANVAS CLICK ───────────────────────────────────────── */
    const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (mode !== 'coco') return;
        const rect = e.currentTarget.getBoundingClientRect();
        const scaleX = (videoRef.current?.videoWidth || 640) / rect.width;
        const scaleY = (videoRef.current?.videoHeight || 480) / rect.height;
        // Mirror the click X since canvas is scaleX(-1)
        const rawX = rect.right - e.clientX;
        const cx = rawX * scaleX, cy = (e.clientY - rect.top) * scaleY;
        const w = videoRef.current?.videoWidth || 640, h = videoRef.current?.videoHeight || 480;

        let found: TrackedObject | null = null;
        Object.values(trackedRef.current).forEach(obj => {
            if (obj.missedFrames > 0) return;
            const [x, y, bw, bh] = obj.bbox;
            if (cx >= x && cx <= x + bw && cy >= y && cy <= y + bh) {
                if (!found || obj.score > found.score) found = obj;
            }
        });

        if (found) {
            const [x, y, bw, bh] = (found as TrackedObject).bbox;
            const ocx = x + bw / 2, ocy = y + bh / 2;
            setSelectedObj({ ...(found as TrackedObject), zone: getZone(ocx, ocy, w, h), sizeLabel: getSizeLabel(bw * bh, w * h) });
        } else {
            setSelectedObj(null);
        }
    }, [mode]);

    /* ─── ROTATING FACTS ─────────────────────────────────────── */
    useEffect(() => {
        factTimerRef.current = setInterval(() => {
            humanFactIdxRef.current = (humanFactIdxRef.current + 1) % HUMAN_FACTS.length;
            setHumanFact(HUMAN_FACTS[humanFactIdxRef.current]);
            faceFactIdxRef.current = (faceFactIdxRef.current + 1) % FACE_FACTS.length;
            setFaceFact(FACE_FACTS[faceFactIdxRef.current]);
        }, 10000);
        return () => { if (factTimerRef.current) clearInterval(factTimerRef.current); };
    }, []);

    /* ─── CLEANUP ────────────────────────────────────────────── */
    useEffect(() => {
        addLog('ObjectDetector initialised — click Start to begin', 'info');
        addLog('Runs 100% client-side, no data uploaded', 'info');
        return () => {
            cancelAnimationFrame(rafIdRef.current);
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, [addLog]);

    /* ─── RE-TRIGGER LOOP ON THRESHOLD CHANGE ────────────────── */
    useEffect(() => {
        if (appState !== 'RUNNING') return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = modelRef.current as any;
        if (m?._type === 'hands' || m?._type === 'face') return;
        cancelAnimationFrame(rafIdRef.current);
        lastTimeRef.current = performance.now();
        rafIdRef.current = requestAnimationFrame(inferenceLoop);
    }, [threshold, appState, inferenceLoop]);

    /* ─── RENDER ─────────────────────────────────────────────── */
    return (
        <div
            suppressHydrationWarning
            style={{
                minHeight: '100vh',
                display: 'grid',
                gridTemplateRows: 'var(--header-h) 1fr var(--footer-h)',
                background: 'var(--bg-base)',
                fontFamily: 'var(--font-mono)',
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '0 16px',
            }}
        >
            {/* HEADER */}
            <header
                suppressHydrationWarning
                className="animate-fade-up"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: 'var(--glow-cyan)', flexShrink: 0 }}>
                        <AppLogo size={22} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: 20, letterSpacing: '-0.5px', background: 'linear-gradient(90deg, var(--text-primary), var(--accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        ObjectDetector
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusBadge state={appState} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, border: '1px solid var(--border-accent)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: 11, letterSpacing: '0.5px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)', animation: 'pulseGlow 2s ease infinite' }} />
                        {mode === 'coco' ? 'COCO-SSD' : mode === 'pose' ? 'PoseNet' : mode === 'hands' ? 'MP Hands' : 'MP Face'} · TF.js v4
                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main
                style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, padding: '16px 0', alignItems: 'start', animation: 'fadeUp 0.5s 0.1s ease both' }}
                className="responsive-main"
            >
                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                    <CameraViewport
                        videoRef={videoRef}
                        canvasRef={canvasRef}
                        clickLayerRef={clickLayerRef}
                        appState={appState}
                        mode={mode}
                        loadingMsg={loadingMsg}
                        onStart={handleStart}
                        onRetry={handleStart}
                        onLoadModel={() => loadModel(mode)}
                        onCanvasClick={handleCanvasClick}
                    />
                    <StatsBar stats={stats} />
                    <ControlsCard
                        appState={appState}
                        mode={mode}
                        facing={facing}
                        threshold={threshold}
                        maxDets={maxDets}
                        onStart={handleStart}
                        onStop={handleStop}
                        onFlip={handleFlipCamera}
                        onSnapshot={handleSnapshot}
                        onThreshold={v => { setThreshold(v); addLog(`Threshold → ${Math.round(v * 100)}%`, 'info'); }}
                        onMaxDets={v => setMaxDets(v)}
                        onModeChange={handleModeChange}
                    />
                </div>

                {/* RIGHT SIDEBAR */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <InfoPanel
                        mode={mode}
                        detections={detections}
                        classCounts={classCounts}
                        selectedObj={selectedObj}
                        poseData={poseData}
                        gestureData={gestureData}
                        faceData={faceData}
                        humanFact={humanFact}
                        faceFact={faceFact}
                        onCloseSelected={() => setSelectedObj(null)}
                        getColor={getClassColor}
                    />
                    <ModelInfo mode={mode} />
                    <ConsolePanel logs={logs} />
                </div>
            </main>

            <Footer />

            <style>{`
        @media (max-width: 768px) {
          .responsive-main { grid-template-columns: 1fr !important; }
        }
        @keyframes countPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
        </div>
    );
}

/* ─── STATUS BADGE ───────────────────────────────────────────── */
function StatusBadge({ state }: { state: AppState }) {
    const map: Record<AppState, { color: string; label: string }> = {
        IDLE: { color: 'var(--text-muted)', label: 'IDLE' },
        LOADING: { color: 'var(--accent-amber)', label: 'LOADING' },
        READY: { color: 'var(--accent-blue)', label: 'READY' },
        RUNNING: { color: 'var(--accent-green)', label: 'RUNNING' },
        STOPPED: { color: 'var(--accent-amber)', label: 'STOPPED' },
        ERROR: { color: 'var(--accent-red)', label: 'ERROR' },
    };
    const { color, label } = map[state];
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, border: `1px solid ${color}44`, background: `${color}11`, fontSize: 10, letterSpacing: '1px', color, fontWeight: 500, textTransform: 'uppercase' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, animation: state === 'RUNNING' ? 'pulseGlowGreen 1.5s ease infinite' : 'none' }} />
            {label}
        </div>
    );
}           