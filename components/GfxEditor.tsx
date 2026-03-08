"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Konva from "konva";
import {
  Stage,
  Layer,
  Text,
  Image as KImage,
  Transformer,
  Rect,
  Group,
  Line,
  TextPath,
} from "react-konva";

import { cutoutPersonToPngDataUrl } from "@/lib/cutout";

import AssetLibrary, { type AssetItem } from "./AssetLibrary";
import FontPanel from "./FontPanel";
import ImagePanel, { ImageAdjustments } from "./ImagePanel";
import LayersPanel from "./LayersPanel";
import ExportButton from "./ExportButton";
import { getAuth, signOut } from "firebase/auth";
import {doc,onSnapshot,collection,addDoc,updateDoc,serverTimestamp,} from "firebase/firestore";
import { app, db } from "@/lib/firebase";
import TemplateLibrary from "./TemplateLibrary";
import { type FireTemplate } from "@/lib/templates";
import { useRouter } from "next/navigation";



/** ✅ ADD THIS RIGHT HERE (before Types) */
async function ensureFontLoaded(fontFamily: string) {
  if (!fontFamily) return;

  // (Optional) skip obvious system fonts if you want:
  // if (["Arial", "Helvetica", "Times New Roman"].includes(fontFamily)) return;

  const fonts = (document as any).fonts;
  if (!fonts?.load) return;

  await fonts.load(`24px "${fontFamily}"`);
  await fonts.ready;
}

/** ---------------- Types ---------------- */
type ProjectType = "cover" | "flyer" | "social" ;
type SizePreset = { id: string; label: string; w: number; h: number; dpiLabel?: string };

type TextItem = {
  id: string;
  kind: "text";
  x: number;
  y: number;
  rotation: number;

  text: string;

  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";

  fill: string;

  align: "left" | "center" | "right";
  letterSpacing: number;
  lineHeight: number;

  textDecoration: "none" | "underline" | "line-through";

  bgEnabled: boolean;
  bgColor: string;
  bgOpacity: number;
  bgPaddingX: number;
  bgPaddingY: number;
  bgRadius: number;

  strokeEnabled: boolean;
  strokeColor: string;
  strokeWidth: number;

  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;

  style3d: "none" | "soft" | "hard";

  curveEnabled: boolean;
  curveRadius: number;
  curveArc: number; // degrees
  curveReverse: boolean;
};

type ImageItem = {
  id: string;
  kind: "image";
  x: number;
  y: number;
  rotation: number;
  src: string;
  width: number;
  height: number;
  adj: ImageAdjustments;
};

type Item = TextItem | ImageItem;
type GuideLine = { kind: "v" | "h"; pos: number };
type MobileTab = "assets" | "text" | "adjust" | "layers" | "export" | "none";

/** ---------------- Helpers ---------------- */
function nodeIsGone(node: Konva.Node | null | undefined) {
  if (!node) return true;
  const anyNode = node as any;
  return Boolean(anyNode?.isDestroyed?.() || anyNode?._isDestroyed);
}


function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = ""; // ✅ always
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load (CORS): " + src));
    img.src = src;
    img.decoding = "async";
  });
}
function getDistance(p1: any, p2: any) {
  return Math.sqrt(
    (p2.x - p1.x) * (p2.x - p1.x) +
    (p2.y - p1.y) * (p2.y - p1.y)
  );
}

function getCenter(p1: any, p2: any) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}


function defaultAdj(): ImageAdjustments {
  return {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0,
    blur: 0,
    hdr: 0,
    texture: 0,
    clarity: 0,
  };
}

function defaultText(): TextItem {
  return {
    id: uid(),
    kind: "text",
    x: 210,
    y: 180,
    rotation: 0,
    text: "Create",
    fontFamily: "Impact",
    fontSize: 60,
    fontWeight: 800,
    fontStyle: "normal",
    fill: "#ff0000",
    align: "center",
    letterSpacing: 0,
    lineHeight: 1.15,
    textDecoration: "none",

    bgEnabled: false,
    bgColor: "#000000",
    bgOpacity: 0.45,
    bgPaddingX: 16,
    bgPaddingY: 10,
    bgRadius: 14,

    strokeEnabled: false,
    strokeColor: "#000000",
    strokeWidth: 6,

    shadowEnabled: true,
    shadowColor: "#000000",
    shadowBlur: 10,
    shadowOffsetX: 6,
    shadowOffsetY: 8,
    shadowOpacity: 0.55,

    style3d: "soft",

    curveEnabled: false,
    curveRadius: 260,
    curveArc: 180,
    curveReverse: false,
  };
}

function near(a: number, b: number, dist: number) {
  return Math.abs(a - b) <= dist;
}

function safeClientRect(node: Konva.Node) {
  try {
    return node.getClientRect({ skipStroke: false, skipShadow: false });
  } catch {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
}

function getNodeBox(node: Konva.Node) {
  const r = safeClientRect(node);
  return {
    x: r.x,
    y: r.y,
    w: r.width,
    h: r.height,
    cx: r.x + r.width / 2,
    cy: r.y + r.height / 2,
    r: r.x + r.width,
    b: r.y + r.height,
  };
}

function arcPath(radius: number, arcDeg: number, reverse: boolean) {
  const r = Math.max(10, radius);
  const a = Math.max(10, Math.min(320, arcDeg));
  const start = (-a / 2) * (Math.PI / 180);
  const end = (a / 2) * (Math.PI / 180);
  const x1 = r * Math.cos(start);
  const y1 = r * Math.sin(start);
  const x2 = r * Math.cos(end);
  const y2 = r * Math.sin(end);
  const largeArcFlag = a > 180 ? 1 : 0;
  const sweepFlag = reverse ? 0 : 1;

  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(
    2
  )} 0 ${largeArcFlag} ${sweepFlag} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/** ---------------- Presets ---------------- */
const COVER_PRESETS: SizePreset[] = [
  { id: "cov-3000", label: "3000 × 3000 (Standard)", w: 3000, h: 3000 },
  { id: "cov-2048", label: "2048 × 2048", w: 2048, h: 2048 },
  { id: "cov-1600", label: "1600 × 1600", w: 1600, h: 1600 },
];

const FLYER_PRESETS: SizePreset[] = [
  { id: "fly-1080x1350", label: "1080 × 1350 (IG Portrait)", w: 1080, h: 1350 },
  { id: "fly-1080x1080", label: "1080 × 1080 (Square)", w: 1080, h: 1080 },
  { id: "fly-1080x1920", label: "1080 × 1920 (Story)", w: 1080, h: 1920 },
  { id: "fly-letter", label: "2550 × 3300 (8.5×11 @300dpi)", w: 2550, h: 3300, dpiLabel: "Print" },
];

const SOCIAL_PRESETS: SizePreset[] = [
  { id: "ig_post", label: "Instagram Post (1080×1080)", w: 1080, h: 1080 },
  { id: "ig_story", label: "Instagram Story (1080×1920)", w: 1080, h: 1920 },
  { id: "tiktok", label: "TikTok (1080×1920)", w: 1080, h: 1920 },
  { id: "yt_thumb", label: "YouTube Thumbnail (1280×720)", w: 1280, h: 720 },
  { id: "fb_cover", label: "Facebook Cover (820×312)", w: 820, h: 312 },
  { id: "x_header", label: "X Header (1500×500)", w: 1500, h: 500 },
  { id: "linkedin_banner", label: "LinkedIn Banner (1584×396)", w: 1584, h: 396 },
];

const ALL_PRESETS: SizePreset[] = [
  ...COVER_PRESETS,
  ...FLYER_PRESETS,
  ...SOCIAL_PRESETS,
];

function openGfxDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("gfxlab-db", 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("pending")) {
        db.createObjectStore("pending");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePendingDesign(key: string, value: unknown) {
  const db = await openGfxDb();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("pending", "readwrite");
    const store = tx.objectStore("pending");

    store.put(value, key);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadPendingDesign<T = any>(key: string): Promise<T | null> {
  const db = await openGfxDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending", "readonly");
    const store = tx.objectStore("pending");
    const req = store.get(key);

    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function deletePendingDesign(key: string) {
  const db = await openGfxDb();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("pending", "readwrite");
    const store = tx.objectStore("pending");

    store.delete(key);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}


/** ---------------- Main ---------------- */
export default function GfxEditor() {
  const router = useRouter();

async function handleLogout() {
  try {
    const auth = getAuth(app);
    await signOut(auth);
    window.location.href = "/";
  } catch (err) {
    console.error("Logout failed:", err);
    alert("Could not log out.");
  }
}

  const [tab, setTab] = useState<MobileTab>("assets");
  const [cutoutLoading, setCutoutLoading] = useState(false);
  const [paid, setPaid] = useState(false);
 
  const [exporting, setExporting] = useState(false);
  const [checkoutRestoreReady, setCheckoutRestoreReady] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
const [projectName, setProjectName] = useState("Untitled Design");
const [saving, setSaving] = useState(false);
const sheetHeight =
  tab === "assets"
    ? "min(320px, 32vh)"
    : tab === "text"
    ? "min(300px, 34vh)"
    : tab === "adjust"
    ? "min(190px, 22vh)"
    : tab === "layers"
    ? "min(240px, 28vh)"
    : tab === "export"
    ? "min(180px, 20vh)"
    : "min(220px, 24vh)";


  useEffect(() => {
  const auth = getAuth(app);

  const unsubAuth = auth.onAuthStateChanged((user) => {
    console.log("AUTH USER:", user);

    if (!user) {
      setPaid(false);
      return;
    }

    const userRef = doc(db, "users", user.uid);

    const unsubDoc = onSnapshot(
      userRef,
      (snap) => {
        console.log("DOC ID:", user.uid);
        console.log("DOC EXISTS:", snap.exists());
        console.log("DOC DATA:", snap.data());

        const data = snap.data();
        setPaid(data?.pro === true);
      },
      (error) => {
        console.error("PRO LISTENER ERROR:", error);
        setPaid(false);
      }
    );

    return () => unsubDoc();
  });

  return () => unsubAuth();
}, []);


  const [projectType, setProjectType] = useState<ProjectType>("cover");
 const presets =
  projectType === "cover"
    ? COVER_PRESETS
    : projectType === "flyer"
    ? FLYER_PRESETS
    : SOCIAL_PRESETS;
  const [presetId, setPresetId] = useState<string>(presets[0].id);
function toSafeSrc(src: string) {
  if (
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("/")
  ) {
    return src;
  }

  if (src.startsWith("http://") || src.startsWith("https://")) {
    const params = new URLSearchParams({ url: src });
    return `/api/image-proxy?${params.toString()}`;
  }

  return src;
}
  async function addAssetToCanvas(asset: AssetItem) {
  try {
   const safeSrc = toSafeSrc(asset.src);
const img = await loadHtmlImage(safeSrc);


    const isBackground = asset.type === "background";

    // Everything else: fit nicely on canvas
   const targetMaxW = Math.round(view.w * 0.85);
const targetMaxH = Math.round(view.h * 0.85);

    const ratio = Math.min(targetMaxW / img.width, targetMaxH / img.height, 1);

    const w = Math.max(60, Math.round(img.width * ratio));
    const h = Math.max(60, Math.round(img.height * ratio));

    const imgItem: ImageItem = {
      id: uid(),
      kind: "image",
      x: Math.round((view.w - w) / 2),
      y: Math.round((view.h - h) / 2),
      rotation: 0,
      src: safeSrc,
      width: w,
      height: h,
      adj: defaultAdj(),
    };

    setItems((prev) => [...prev, imgItem]);
    setSelectedId(imgItem.id);
    setTab("adjust");
  } catch (e) {
    console.error(e);
    alert("Could not load that asset.");
  }
}

useEffect(() => {
  const currentPresetStillValid = presets.some((p) => p.id === presetId);
  if (currentPresetStillValid) return;

  setPresetId(presets[0].id);
}, [projectType, presets, presetId]);

const preset = useMemo(
  () => ALL_PRESETS.find((x: SizePreset) => x.id === presetId) ?? presets[0],
  [presetId, presets]
);

  const [viewportTick, setViewportTick] = useState(0);
  useEffect(() => {
    const onResize = () => setViewportTick((n) => n + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
const canvasHostRef = useRef<HTMLDivElement | null>(null);
const [hostSize, setHostSize] = useState({ w: 800, h: 600 });

useEffect(() => {
  const el = canvasHostRef.current;
  if (!el) return;

  const ro = new ResizeObserver((entries) => {
    const r = entries[0].contentRect;

    setHostSize({
      w: Math.round(r.width),
      h: Math.round(r.height),
    });
  });

  ro.observe(el);
  return () => ro.disconnect();
}, []);

useEffect(() => {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const exportStatus = params.get("export");

  if (exportStatus === "success") {
    sessionStorage.setItem("paid_export", "true");

    const cleanUrl = `${window.location.pathname}`;
    window.history.replaceState({}, "", cleanUrl);
  }
}, []);


const view = useMemo(() => {
  const padding = 0;

  // reserve space when the bottom panel is open
const panelReserve = tab !== "none" ? 150 : 0;

  const safeW = Math.max(240, hostSize.w - padding * 2);
  const safeH = Math.max(240, hostSize.h - panelReserve - padding * 2);

  const ratio = Math.min(safeW / preset.w, safeH / preset.h);

  return {
    w: Math.max(120, Math.round(preset.w * ratio)),
    h: Math.max(120, Math.round(preset.h * ratio)),
    ratio,
  };
}, [preset, hostSize, tab]);

  const [items, setItems] = useState<Item[]>([defaultText()]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  

  const [bgSrc, setBgSrc] = useState<string | null>(null);
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);

  const WATERMARK_SRC = "/logo.png";
  const watermarkEnabled = true;
  const [wmImg, setWmImg] = useState<HTMLImageElement | null>(null);
useEffect(() => {
  if (typeof window === "undefined") return;

  (async () => {
    try {
      const parsed = await loadPendingDesign<any>("gfxlab_pending_export_design");

      if (!parsed) {
        setCheckoutRestoreReady(true);
        return;
      }

      if (parsed?.items) setItems(parsed.items);
      if (typeof parsed?.bgSrc !== "undefined") setBgSrc(parsed.bgSrc);
      if (parsed?.projectType) setProjectType(parsed.projectType);
      if (parsed?.presetId) setPresetId(parsed.presetId);

      window.setTimeout(() => {
        setCheckoutRestoreReady(true);
      }, 700);
    } catch (err) {
      console.error("Could not restore pending export design:", err);
      setCheckoutRestoreReady(true);
    }
  })();
}, []);
useEffect(() => {
  if (typeof window === "undefined") return;
  if (!checkoutRestoreReady) return;

  const paidExport = sessionStorage.getItem("paid_export");
  if (paidExport !== "true") return;

const t = window.setTimeout(async () => {
  await exportPNG();
  sessionStorage.removeItem("paid_export");
  await deletePendingDesign("gfxlab_pending_export_design");
}, 1400);

  return () => window.clearTimeout(t);
}, [checkoutRestoreReady, bgImg, presetId, projectType]);



  useEffect(() => {
    let cancelled = false;
    loadHtmlImage(WATERMARK_SRC)
      .then((img) => !cancelled && setWmImg(img))
      .catch(() => !cancelled && setWmImg(null));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!bgSrc) {
      setBgImg(null);
      return;
    }
    loadHtmlImage(bgSrc)
      .then((img) => !cancelled && setBgImg(img))
      .catch(() => !cancelled && setBgImg(null));
    return () => { cancelled = true; };
  }, [bgSrc]);


  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
const [stageScale, setStageScale] = useState(1);
const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

const lastDist = useRef(0);
const lastCenter = useRef({ x: 0, y: 0 });




  // ✅ node refs by item id (most stable)
  const nodeMapRef = useRef<Record<string, Konva.Node | null>>({});
  const registerNode = useCallback((id: string, node: Konva.Node | null) => {
    if (node) nodeMapRef.current[id] = node;
    else delete nodeMapRef.current[id];
  }, []);

  /** Snapping */
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const shiftDownRef = useRef(false);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { if (e.key === "Shift") shiftDownRef.current = true; };
    const onUp = (e: KeyboardEvent) => { if (e.key === "Shift") shiftDownRef.current = false; };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId]
  );
  const selectedText = selectedItem?.kind === "text" ? selectedItem : null;
  const selectedImage = selectedItem?.kind === "image" ? selectedItem : null;

  const layers = useMemo(() => {
    return items.map((it) => {
      if (it.kind === "text") {
        const clean = it.text.replace(/\s+/g, " ").trim();
        const label = clean.length ? (clean.length > 24 ? clean.slice(0, 24) + "…" : clean) : "Text";
        return { id: it.id, kind: "text" as const, label };
      }
      return { id: it.id, kind: "image" as const, label: "Image" };
    });
  }, [items]);

  /** ✅ Transformer attach (uses nodeMapRef, not stage.findOne) */
useEffect(() => {
  const tr = trRef.current;
  if (!tr) return;

  // always clear first (prevents transformer holding dead nodes)
  tr.nodes([]);
  tr.getLayer()?.batchDraw();

  if (!selectedId) return;

  // wait one tick so React-Konva has definitely mounted the node
  const t = window.setTimeout(() => {
    const node = nodeMapRef.current[selectedId];

    // node not mounted or got removed
    if (!node) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }

    // if Konva destroyed it, don’t attach
    const anyNode = node as any;
    const gone = Boolean(anyNode?.isDestroyed?.() || anyNode?._isDestroyed);
    if (gone) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }

    tr.nodes([node]);
    tr.getLayer()?.batchDraw();
  }, 0);

  return () => window.clearTimeout(t);
}, [selectedId, items]);

  function updateItem(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((i) => (i.id === id ? ({ ...i, ...patch } as Item) : i)));
  }

  function addText() {
    const t = defaultText();
    t.text = "New Text";
    t.x = Math.round(view.w * 0.2);
    t.y = Math.round(view.h * 0.2);
    setItems((prev) => [...prev, t]);
    setSelectedId(t.id);
    setTab("text");
  }

function makeTextItem(overrides: Partial<TextItem>): TextItem {
  return {
    ...defaultText(),
    ...overrides,
    id: uid(),
    kind: "text",
  };
}

/* ---------------- STARTER TEMPLATES ---------------- */

function loadCoverTemplate() {
  setProjectType("cover");
  setPresetId("cov-3000");
  setBgSrc("/templates/cover-template.jpg");

const artist = makeTextItem({
  text: "ARTIST NAME",
  x: view.w / 2,
  y: view.h * 0.25,
  align: "center",
  fontSize: view.w * 0.09,
  fontFamily: "Impact",
  fontWeight: 900,
  fill: "#ffffff",
});

  const title = makeTextItem({
    text: "ALBUM TITLE",
  x: view.w / 2,
  y: view.h * 0.45,
  align: "center",
  fontSize: view.w * 0.15,
  fontFamily: "Impact",
  fontWeight: 900,
  fill: "#ffffff",
});
const producer = makeTextItem({
    text: "put label name here",
    x: view.w / 2,
    y: view.h * 0.04,
    align: "center",
    fontSize: view.w * 0.03,
    fontFamily: "Arial",
    fontWeight: 700,
    fill: "#ffffff",
  });

  const feature = makeTextItem({
    text: "FEAT. FEATURE ARTIST",
    x: view.w / 2,
    y: view.h * 0.65,
    align: "center",
    fontSize: view.w * 0.032,
    fontFamily: "Arial",
    fontWeight: 700,
    fill: "#ffffff",
  });

  setItems([artist, title, producer, feature]);

  setSelectedId(title.id);
  setTab("text");
}

function loadFlyerStarterTemplate() {
  setProjectType("flyer");
  setPresetId("fly-1080x1350");
  setBgSrc("/templates/flyer-template.jpg");

  const eventTitle = makeTextItem({
    text: "EVENT TITLE",
    x: view.w / 2,
    y: view.h * 0.18,
    align: "center",
    fontSize: view.w * 0.11,
    fontFamily: "Impact",
    fontWeight: 700,
    fill: "#ffffff",
  });

  const djName = makeTextItem({
    text: "DJ NAME",
    x: view.w / 2,
    y: view.h * 0.30,
    align: "center",
    fontSize: view.w * 0.15,
    fontFamily: "Impact",
    fontWeight: 700,
    fill: "#ffffff",
  });

  const dateText = makeTextItem({
    text: "FRIDAY, MARCH 22",
    x: view.w / 2,
    y: view.h * 0.50,
    align: "center",
    fontSize: view.w * 0.05,
    fontFamily: "Arial",
    fontWeight: 700,
    fill: "#d1b15a",
  });

  const timeText = makeTextItem({
    text: "10:00 PM",
    x: view.w / 2,
    y: view.h * 0.58,
    align: "center",
    fontSize: view.w * 0.045,
    fontFamily: "Arial",
    fontWeight: 700,
    fill: "#ffffff",
  });

  const addressText = makeTextItem({
    text: "123 MAIN ST, TACOMA WA",
    x: view.w / 2,
    y: view.h * 1,
    align: "center",
    fontSize: view.w * 0.04,
    fontFamily: "Arial",
    fontWeight: 700,
    fill: "#ffffff",
  });

  const priceText = makeTextItem({
    text: "$20 ENTRY",
    x: view.w / 2,
    y: view.h * 0.76,
    align: "center",
    fontSize: view.w * 0.055,
    fontFamily: "Impact",
    fontWeight: 700,
    fill: "#d1b15a",
  });

  setItems([eventTitle, djName, dateText, timeText, addressText, priceText]);
  setSelectedId(eventTitle.id);
  setTab("text");
}

function loadSocialStarterTemplate() {
  setProjectType("cover");
  setPresetId("ig-square");
  setBgSrc("/templates/social-template.jpg");

  const title = makeTextItem({
    text: "ARTIST NAME",
    x: view.w / 2,
    y: view.h * 0.20,
    align: "center",
    fontSize: view.w * 0.12,
    fontFamily: "Impact",
    fontWeight: 700,
    fill: "#ffffff",
  });

  const dropText = makeTextItem({
    text: "NEW DROP",
    x: view.w / 2,
    y: view.h * 0.35,
    align: "center",
    fontSize: view.w * 0.10,
    fontFamily: "Impact",
    fontWeight: 700,
    fill: "#d1b15a",
  });

  const outNow = makeTextItem({
    text: "OUT NOW",
    x: view.w / 2,
    y: view.h * 0.50,
    align: "center",
    fontSize: view.w * 0.14,
    fontFamily: "Impact",
    fontWeight: 700,
    fill: "#ffffff",
  });

  const streamToday = makeTextItem({
    text: "STREAM TODAY",
    x: view.w / 2,
    y: view.h * 0.68,
    align: "center",
    fontSize: view.w * 0.07,
    fontFamily: "Arial",
    fontWeight: 700,
    fill: "#d1b15a",
  });

  const platforms = makeTextItem({
    text: "SPOTIFY • APPLE MUSIC • YOUTUBE",
    x: view.w / 2,
    y: view.h * 0.82,
    align: "center",
    fontSize: view.w * 0.04,
    fontFamily: "Arial",
    fontWeight: 600,
    fill: "#ffffff",
  });

  setItems([title, dropText, outNow, streamToday, platforms]);
  setSelectedId(title.id);
  setTab("text");
}

/* ---------------- OLD TEMPLATE FUNCTIONS ---------------- */

function loadMixtapeTemplate() {
  setBgSrc("/templates/mixtape-bg.jpg");

  const artist: TextItem = {
    ...defaultText(),
    id: uid(),
    text: "ARTIST NAME",
    fontSize: 90,
    y: 120,
  };

  const title: TextItem = {
    ...defaultText(),
    id: uid(),
    text: "MIXTAPE TITLE",
    fontSize: 70,
    y: 260,
  };

  setItems([artist, title]);
}

function loadFlyerTemplate() {
  setBgSrc("/templates/flyer-bg.jpg");

  const title: TextItem = {
    ...defaultText(),
    id: uid(),
    text: "LIVE EVENT",
    fontSize: 100,
    y: 120,
  };

  const details: TextItem = {
    ...defaultText(),
    id: uid(),
    text: "FRIDAY NIGHT",
    fontSize: 60,
    y: 280,
  };

  setItems([title, details]);
}

function loadInstagramTemplate() {
  setBgSrc("/templates/social-bg.jpg");

  const headline: TextItem = {
    ...defaultText(),
    id: uid(),
    text: "NEW DROP",
    fontSize: 90,
    y: 200,
  };

  setItems([headline]);
}

function loadPodcastTemplate() {
  setBgSrc("/templates/podcast-bg.jpg");

  const title: TextItem = {
    ...defaultText(),
    id: uid(),
    text: "PODCAST NAME",
    fontSize: 90,
    y: 200,
  };

  setItems([title]);
}
function addArtistTemplate() {
const artist = makeTextItem({
  text: "ARTIST NAME",
  x: view.w / 2,
  y: view.h * 0.15,
  align: "center",
  fontSize: view.w * 0.09,
  fontFamily: "Impact",
  fontWeight: 900,
  fill: "#ffffff",
});

  const title = makeTextItem({
    text: "Album Title",
    x: Math.round(view.w * 0.16),
    y: Math.round(view.h * 0.72),
    fontSize: Math.round(view.w * 0.06),
    fontFamily: "Arial",
    fontWeight: 700,
    fill: "#d1b15a",
  });

  setItems((prev) => [...prev, artist, title]);
  setSelectedId(title.id);
  setTab("text");
}

function addFlyerTemplate() {
  const headline = makeTextItem({
    text: "LIVE TONIGHT",
    x: Math.round(view.w * 0.12),
    y: Math.round(view.h * 0.12),
    fontSize: Math.round(view.w * 0.09),
    fontFamily: "Impact",
    fontWeight: 900,
    fill: "#ffffff",
  });

  const sub = makeTextItem({
    text: "DJ KAY",
    x: Math.round(view.w * 0.2),
    y: Math.round(view.h * 0.3),
    fontSize: Math.round(view.w * 0.075),
    fontFamily: "Arial",
    fontWeight: 800,
    fill: "#d1b15a",
  });

  const details = makeTextItem({
    text: "FRIDAY • 10PM • TACOMA",
    x: Math.round(view.w * 0.14),
    y: Math.round(view.h * 0.84),
    fontSize: Math.round(view.w * 0.04),
    fontFamily: "Arial",
    fontWeight: 700,
    fill: "#ffffff",
  });

  setItems((prev) => [...prev, headline, sub, details]);
  setSelectedId(headline.id);
  setTab("text");
}

function addQuoteTemplate() {
 const quote = makeTextItem({
  text: "YOUR QUOTE HERE",
    x: Math.round(view.w * 0.1),
    y: Math.round(view.h * 0.32),
    fontSize: Math.round(view.w * 0.055),
    fontFamily: "Arial",
    fontWeight: 800,
    fill: "#ffffff",
    align: "center",
  });

  const author = makeTextItem({
    text: "- @username",
    x: Math.round(view.w * 0.28),
    y: Math.round(view.h * 0.68),
    fontSize: Math.round(view.w * 0.035),
    fontFamily: "Arial",
    fontWeight: 700,
    fill: "#d1b15a",
  });

  setItems((prev) => [...prev, quote, author]);
  setSelectedId(quote.id);
  setTab("text");
}

function addPodcastTemplate() {
  const show = makeTextItem({
    text: "PODCAST NAME",
    x: Math.round(view.w * 0.1),
    y: Math.round(view.h * 0.14),
    fontSize: Math.round(view.w * 0.075),
    fontFamily: "Impact",
    fontWeight: 900,
    fill: "#ffffff",
  });

  const episode = makeTextItem({
    text: "EPISODE 001",
    x: Math.round(view.w * 0.12),
    y: Math.round(view.h * 0.74),
    fontSize: Math.round(view.w * 0.045),
    fontFamily: "Arial",
    fontWeight: 700,
    fill: "#d1b15a",
  });

  setItems((prev) => [...prev, show, episode]);
  setSelectedId(show.id);
  setTab("text");
}
function loadTemplate(template: FireTemplate) {
  setProjectType(template.type);
  setPresetId(template.presetId);
  setBgSrc(template.bgSrc);

  const mappedItems = template.items.map((item) =>
    makeTextItem({
      text: item.text,
      x: item.x,
      y: item.y,
      align: item.align ?? "left",
      fontSize: item.fontSize,
      fontFamily: item.fontFamily,
      fontWeight: item.fontWeight,
      fill: item.fill,
    })
  );

  setItems(mappedItems);
  setSelectedId(mappedItems[0]?.id ?? null);
  setTab("text");
}
async function goToProCheckout() {
  try {
    const auth = getAuth(app);

    let user = auth.currentUser;

    if (!user) {
      await new Promise<void>((resolve) => {
        const unsub = auth.onAuthStateChanged((u) => {
          user = u;
          unsub();
          resolve();
        });
      });
    }

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const params = new URLSearchParams();
    params.set("uid", user.uid);
    if (user.email) params.set("email", user.email);

    window.location.href = `/api/stripe/checkout-pro?${params.toString()}`;
  } catch (err) {
    console.error(err);
    window.location.href = "/login";
  }
}



async function addImageFromFile(file: File) {
  const reader = new FileReader();

  reader.onload = async () => {
    try {
      const src = String(reader.result);
      const img = await loadHtmlImage(src);

      const targetMaxW = Math.round(view.w * 0.7);
      const targetMaxH = Math.round(view.h * 0.7);

      const ratio = Math.min(targetMaxW / img.width, targetMaxH / img.height, 1);

      const w = Math.max(60, Math.round(img.width * ratio));
      const h = Math.max(60, Math.round(img.height * ratio));

      const imgItem: ImageItem = {
        id: uid(),
        kind: "image",
        x: Math.round((view.w - w) / 2),
        y: Math.round((view.h - h) / 2),
        rotation: 0,
        src,
        width: w,
        height: h,
        adj: defaultAdj(),
      };

      setItems((prev) => [...prev, imgItem]);
      setSelectedId(imgItem.id);
      setTab("adjust");
    } catch (err) {
      console.error(err);
      alert("Could not load that image.");
    }
  };

  reader.readAsDataURL(file);
}
  async function setBackgroundFromFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setBgSrc(String(reader.result));
    reader.readAsDataURL(file);
  }

async function cutoutFromFileFreeAI(file: File) {
  try {
    setCutoutLoading(true);

    const pngDataUrl = await cutoutPersonToPngDataUrl(file);
    const img = await loadHtmlImage(pngDataUrl);

    const targetMaxW = Math.round(view.w * 0.7);
    const targetMaxH = Math.round(view.h * 0.7);

    const ratio = Math.min(targetMaxW / img.width, targetMaxH / img.height, 1);

    const w = Math.max(60, Math.round(img.width * ratio));
    const h = Math.max(60, Math.round(img.height * ratio));

    const imgItem: ImageItem = {
      id: uid(),
      kind: "image",
      x: Math.round((view.w - w) / 2),
      y: Math.round((view.h - h) / 2),
      rotation: 0,
      src: pngDataUrl,
      width: w,
      height: h,
      adj: defaultAdj(),
    };

    setItems((prev) => [...prev, imgItem]);
    setSelectedId(imgItem.id);
    setTab("adjust");
  } catch (err) {
    console.error(err);
    alert("Cutout failed. Try a different photo.");
  } finally {
    setCutoutLoading(false);
  }
}

  function updateSelectedText(next: Partial<TextItem>) {
    if (!selectedText) return;
    updateItem(selectedText.id, { ...selectedText, ...next });
  }

function applyGlowText() {
  if (!selectedText) return;

  updateSelectedText({
    fill: "#ffffff",
    shadowEnabled: true,
    shadowColor: "#d1b15a",
    shadowBlur: 18,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowOpacity: 1,
    strokeEnabled: false,
    style3d: "none",
  });
}

function applyNeonText() {
  if (!selectedText) return;

  updateSelectedText({
    fill: "#7df9ff",
    shadowEnabled: true,
    shadowColor: "#7df9ff",
    shadowBlur: 20,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowOpacity: 1,
    strokeEnabled: true,
    strokeColor: "#ffffff",
    strokeWidth: 2,
    style3d: "none",
  });
}

function applyGoldText() {
  if (!selectedText) return;

  updateSelectedText({
    fill: "#d1b15a",
    shadowEnabled: true,
    shadowColor: "#000000",
    shadowBlur: 8,
    shadowOffsetX: 3,
    shadowOffsetY: 4,
    shadowOpacity: 0.5,
    strokeEnabled: true,
    strokeColor: "#8a6d2f",
    strokeWidth: 2,
    style3d: "soft",
  });
}

function applyHardShadowText() {
  if (!selectedText) return;

  updateSelectedText({
    fill: "#ffffff",
    shadowEnabled: true,
    shadowColor: "#000000",
    shadowBlur: 0,
    shadowOffsetX: 8,
    shadowOffsetY: 8,
    shadowOpacity: 1,
    strokeEnabled: false,
    style3d: "hard",
  });
}

function applyCleanTitleText() {
  if (!selectedText) return;

  updateSelectedText({
    fill: "#ffffff",
    shadowEnabled: false,
    shadowColor: "#000000",
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowOpacity: 0,
    strokeEnabled: false,
    strokeColor: "#000000",
    strokeWidth: 0,
    style3d: "none",
  });
}


  function updateSelectedImage(nextAdj: ImageAdjustments) {
    if (!selectedImage) return;
    updateItem(selectedImage.id, { adj: nextAdj } as any);
  }

  function resetSelectedImageAdjustments() {
    if (!selectedImage) return;
    updateItem(selectedImage.id, { adj: defaultAdj() } as any);
  }

  function deleteSelected() {
  if (!selectedId) return;

  // clear transformer immediately
  trRef.current?.nodes([]);
  trRef.current?.getLayer()?.batchDraw();

  setItems((prev) => prev.filter((i) => i.id !== selectedId));
  setSelectedId(null);
}
function duplicateSelected() {
  if (!selectedId) return;

  const current = items.find((i) => i.id === selectedId);
  if (!current) return;

  const copy = {
    ...current,
    id: uid(),
    x: current.x + 20,
    y: current.y + 20,
  } as Item;

  setItems((prev) => [...prev, copy]);
  setSelectedId(copy.id);
}

function alignSelectedCenterX() {
  if (!selectedId) return;

  const node = nodeMapRef.current[selectedId];
  if (!node) return;

  const box = node.getClientRect();

  const newX = Math.round(view.w / 2 - box.width / 2);

  updateItem(selectedId, { x: newX });
}

function alignSelectedCenterY() {
  if (!selectedId) return;

  const current = items.find((i) => i.id === selectedId);
  if (!current) return;

  if (current.kind === "text") {
    updateItem(current.id, { y: Math.round(view.h / 2 - 30) });
  } else {
    updateItem(current.id, { y: Math.round((view.h - current.height) / 2) });
  }
}

function alignSelectedTop() {
  if (!selectedId) return;
  updateItem(selectedId, { y: 20 });
}

function alignSelectedBottom() {
  if (!selectedId) return;

  const current = items.find((i) => i.id === selectedId);
  if (!current) return;

  if (current.kind === "text") {
    updateItem(current.id, { y: Math.round(view.h - 100) });
  } else {
    updateItem(current.id, { y: Math.round(view.h - current.height - 20) });
  }
}

  function moveLayerUp(id: string) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      if (i === -1 || i === prev.length - 1) return prev;
      const next = [...prev];
      const [item] = next.splice(i, 1);
      next.splice(i + 1, 0, item);
      return next;
    });
  }

  function moveLayerDown(id: string) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      if (i <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(i, 1);
      next.splice(i - 1, 0, item);
      return next;
    });
  }

  function bringToFront(id: string) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      if (i === -1 || i === prev.length - 1) return prev;
      const next = [...prev];
      const [item] = next.splice(i, 1);
      next.push(item);
      return next;
    });
  }

  function sendToBack(id: string) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      if (i <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(i, 1);
      next.unshift(item);
      return next;
    });
  }
async function exportPNG() {
  const stage = stageRef.current;
  if (!stage) return;

  console.log("EXPORTING WITH:", {
    projectType,
    presetId,
    presetWidth: preset.w,
    presetHeight: preset.h,
  });

  setExporting(true);

  // let React hide watermark / bleed / transformer
  await new Promise((resolve) => setTimeout(resolve, 120));

  // wait for repaint
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  // save current live editor state
  const oldScaleX = stage.scaleX();
  const oldScaleY = stage.scaleY();
  const oldX = stage.x();
  const oldY = stage.y();
  const oldDraggable = stage.draggable();

  try {
    // reset stage so export is not affected by zoom or pan
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.draggable(false);
    stage.batchDraw();

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const exportWidth = preset.w;
    const exportHeight = preset.h;

    // export full stage at exact target size
    const dataUrl = stage.toDataURL({
      x: 0,
      y: 0,
      width: view.w,
      height: view.h,
      pixelRatio: exportWidth / view.w,
      mimeType: "image/png",
    });

    // final safety pass: draw into exact output canvas
    const img = await loadHtmlImage(dataUrl);

    const canvas = document.createElement("canvas");
    canvas.width = exportWidth;
    canvas.height = exportHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");

    ctx.clearRect(0, 0, exportWidth, exportHeight);
    ctx.drawImage(img, 0, 0, exportWidth, exportHeight);

    const finalDataUrl = canvas.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = finalDataUrl;
    a.download =
      projectType === "cover"
        ? "gfxlab-cover.png"
        : projectType === "flyer"
        ? "gfxlab-flyer.png"
        : "gfxlab-social.png";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error("Export failed:", err);
    alert("Export failed.");
  } finally {
    // restore editor state
    stage.scale({ x: oldScaleX, y: oldScaleY });
    stage.position({ x: oldX, y: oldY });
    stage.draggable(oldDraggable);
    stage.batchDraw();

    setTimeout(() => {
      setExporting(false);
    }, 80);
  }
}
async function saveCurrentDesignForCheckout() {
  if (typeof window === "undefined") return;

  const payload = {
    items,
    bgSrc,
    projectType,
    presetId,
  };

  await savePendingDesign("gfxlab_pending_export_design", payload);
}

async function saveProject() {
  try {
    const auth = getAuth(app);
    const user = auth.currentUser;

    if (!user) {
      alert("You must be signed in to save designs.");
      return;
    }

    setSaving(true);
console.log("SAVE USER UID:", user.uid);
console.log("CURRENT PROJECT ID:", projectId);
    const payload = {
      ownerUid: user.uid,
      name: projectName,
      projectType,
      presetId,
      bgSrc,
      items,
      updatedAt: serverTimestamp(),
    };
console.log("SAVE PAYLOAD:", payload);
   const created = await addDoc(collection(db, "projects"), {
  ...payload,
  createdAt: serverTimestamp(),
});
setProjectId(created.id);
 } catch (err: any) {
  console.error("Save project failed:", err);
  alert(err?.message || "Could not save project.");
} finally {
    setSaving(false);
  }
}


async function handleExport() {
  if (paid) {
    exportPNG();
    return;
  }

  await saveCurrentDesignForCheckout();

  const guestId =
    typeof window !== "undefined"
      ? localStorage.getItem("gfxlab_guest_id") || crypto.randomUUID()
      : "";

  if (typeof window !== "undefined" && guestId) {
    localStorage.setItem("gfxlab_guest_id", guestId);
  }

  window.location.href = `/api/stripe/checkout-export?guestId=${encodeURIComponent(
    guestId
  )}`;

}

  async function makeAiBackground() {
    const idea = window.prompt("Describe your background");
    if (!idea) return;

    try {
      const size = view.w >= view.h ? "1536x1024" : "1024x1536";
      const res = await fetch("/api/ai/background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: idea, size }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "AI failed");

      const url = data?.image || data?.dataUrl;
      if (!url) throw new Error("No image returned");
      setBgSrc(url);
    } catch (e: any) {
      alert(e?.message || "AI failed");
    }
  }

function deselect(e: any) {
  const stage = stageRef.current;
  if (!stage) return;

  if (e.target === stage) setSelectedId(null);
}

  function applySnapping(node: Konva.Node | null) {
    if (!node) return;

    if (!snapEnabled || shiftDownRef.current) {
      setGuides([]);
      return;
    }

    if (nodeIsGone(node)) {
      setGuides([]);
      return;
    }

    const SNAP = 8;
    const vb = getNodeBox(node);

    const stageW = view.w;
    const stageH = view.h;

    const vTargets: number[] = [0, stageW / 2, stageW];
    const hTargets: number[] = [0, stageH / 2, stageH];

    // ✅ include other nodes from nodeMapRef
    for (const it of items) {
      if (it.id === selectedId) continue;
      const other = nodeMapRef.current[it.id];
      if (!other || nodeIsGone(other)) continue;
      const b = getNodeBox(other);
      vTargets.push(b.x, b.cx, b.r);
      hTargets.push(b.y, b.cy, b.b);
    }

    let nx = node.x();
    let ny = node.y();
    const newGuides: GuideLine[] = [];

    const vChecks = [{ val: vb.x }, { val: vb.cx }, { val: vb.r }];
    const hChecks = [{ val: vb.y }, { val: vb.cy }, { val: vb.b }];

    let bestVDiff = Infinity;
    let bestVTarget: number | null = null;

    for (const c of vChecks) {
      for (const t of vTargets) {
        const diff = t - c.val;
        if (near(c.val, t, SNAP) && Math.abs(diff) < Math.abs(bestVDiff)) {
          bestVDiff = diff;
          bestVTarget = t;
        }
      }
    }

    let bestHDiff = Infinity;
    let bestHTarget: number | null = null;

    for (const c of hChecks) {
      for (const t of hTargets) {
        const diff = t - c.val;
        if (near(c.val, t, SNAP) && Math.abs(diff) < Math.abs(bestHDiff)) {
          bestHDiff = diff;
          bestHTarget = t;
        }
      }
    }

    if (bestVTarget != null && bestVDiff !== Infinity) {
      nx += bestVDiff;
      newGuides.push({ kind: "v", pos: bestVTarget });
    }
    if (bestHTarget != null && bestHDiff !== Infinity) {
      ny += bestHDiff;
      newGuides.push({ kind: "h", pos: bestHTarget });
    }

    node.position({ x: nx, y: ny });
    setGuides(newGuides);
  }

  function clearGuides() {
    setGuides([]);
  }

  const filePickerRef = useRef<HTMLInputElement | null>(null);

  return (
    <div style={screen}>
      {/* Header */}
   <div style={header}>
  <style jsx global>{`
    .sheetBody input,
    .sheetBody select,
    .sheetBody textarea {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      display: block;
    }

    .sheetBody > * {
      min-width: 0;
    }
  `}</style>

  <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
    <button style={iconBtn} onClick={() => window.history.back()} title="Back">
      ←
    </button>

    <img
      src="/gfxlab-icon.png"
      alt="GFXlab"
      style={{ height: 40, width: 40, objectFit: "contain", flexShrink: 0 }}
    />
  </div>

  <div
    style={{
      display: "flex",
      gap: 8,
      alignItems: "center",
      minWidth: 0,
      flexShrink: 1,
    }}
  >
    <select
      value={projectType}
      onChange={(e) => setProjectType(e.target.value as ProjectType)}
      style={miniSelect}
    >
      <option value="cover">Cover</option>
      <option value="flyer">Flyer</option>
      <option value="social">Social</option>
    </select>

    {!paid ? (
      <button
        onClick={goToProCheckout}
        style={upgradeBtn}
        title="Upgrade to Pro"
      >
        Upgrade
      </button>
    ) : (
      <div
        style={{
          height: 42,
          padding: "0 12px",
          borderRadius: 14,
          background: "#ffffff",
          color: "black",
          fontWeight: 800,
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          whiteSpace: "nowrap",
        }}
        title="Pro Member"
      >
        PRO
      </div>
    )}
  </div>

  <input
    ref={filePickerRef}
    type="file"
    accept="image/*"
    style={{ display: "none" }}
    onChange={(e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      cutoutFromFileFreeAI(f);
      e.currentTarget.value = "";
    }}
  />
</div>

      {/* Canvas */}
      <div style={canvasArea}>
        <div ref={canvasHostRef} style={canvasWrap}>
      <Stage
  ref={stageRef as any}
  width={view.w}
  height={view.h}
  scaleX={stageScale}
  scaleY={stageScale}
  x={stagePos.x}
  y={stagePos.y}
 draggable={stageScale > 1}  
  onMouseDown={deselect}
  onTouchStart={(e) => {
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      const p1 = { x: touch1.clientX, y: touch1.clientY };
      const p2 = { x: touch2.clientX, y: touch2.clientY };

      lastDist.current = getDistance(p1, p2);
      lastCenter.current = getCenter(p1, p2);
    }
  }}
  onTouchMove={(e) => {
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      const p1 = { x: touch1.clientX, y: touch1.clientY };
      const p2 = { x: touch2.clientX, y: touch2.clientY };

      const dist = getDistance(p1, p2);
      const center = getCenter(p1, p2);

      if (!lastDist.current) {
        lastDist.current = dist;
        return;
      }

      const scale = stageScale * (dist / lastDist.current);

      setStageScale(Math.max(0.3, Math.min(scale, 4)));

      lastDist.current = dist;
      lastCenter.current = center;
    }
  }}
>
            <Layer>
              {bgImg ? (
                <KImage image={bgImg} x={0} y={0} width={view.w} height={view.h} listening={false} />
              ) : (
                <Rect x={0} y={0} width={view.w} height={view.h} fill="#000000" listening={false} />
              )}
{/* BLEED GUIDE */}
{!exporting && (
  <Rect
    x={15}
    y={15}
    width={view.w - 30}
    height={view.h - 30}
    stroke="#ff3b3b"
    strokeWidth={2}
    dash={[8, 6]}
    listening={false}
  />
)}

              {guides.map((g, idx) =>
                g.kind === "v" ? (
                  <Line
                    key={`g${idx}`}
                    points={[g.pos, 0, g.pos, view.h]}
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth={1}
                    dash={[6, 6]}
                    listening={false}
                  />
                ) : (
                  <Line
                    key={`g${idx}`}
                    points={[0, g.pos, view.w, g.pos]}
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth={1}
                    dash={[6, 6]}
                    listening={false}
                  />
                )
              )}

              {items.map((it) =>
                it.kind === "text" ? (
                  <CanvasTextItem
                    key={it.id}
                    item={it}
                    onSelect={setSelectedId}
                    onUpdate={updateItem}
                    onDragMove={(node) => applySnapping(node)}
                    onDragEnd={clearGuides}
                    registerNode={registerNode}
                  />
                ) : (
                  <CanvasImageItem
                    key={it.id}
                    item={it}
                    onSelect={setSelectedId}
                    onUpdate={updateItem}
                    onDragMove={(node) => applySnapping(node)}
                    onDragEnd={clearGuides}
                    registerNode={registerNode}
                  />
                )
              )}

             {watermarkEnabled && wmImg && !exporting && (
  <KImage
                  image={wmImg}
                  listening={false}
                  opacity={0.25}
                  width={Math.max(60, Math.round(view.w * 0.75))}
                  height={Math.max(60, Math.round(view.w * 0.75))}
                  x={view.w - Math.max(60, Math.round(view.w * 0.8)) - 14}
                  y={view.h - Math.max(60, Math.round(view.w * 0.8)) - 14}
                />
              )}

              {/* ✅ FIXED TRANSFORMER JSX (single component, not split) */}
           {!exporting && (
  <Transformer
    ref={trRef}
    rotateEnabled
    enabledAnchors={[
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right"
    ]}
  />
)}

            </Layer>
          </Stage>
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div style={tabBar}>
        <TabBtn label="Assets" active={tab === "assets"} onClick={() => setTab(tab === "assets" ? "none" : "assets")} />
        <TabBtn label="Text" active={tab === "text"} onClick={() => setTab(tab === "text" ? "none" : "text")} />
        <TabBtn label="Adjust" active={tab === "adjust"} onClick={() => setTab(tab === "adjust" ? "none" : "adjust")} />
        <TabBtn label="Layers" active={tab === "layers"} onClick={() => setTab(tab === "layers" ? "none" : "layers")} />
<ExportButton
  label={paid ? "Export" : "Export $5"}
  onExport={handleExport}
buttonStyle={{
  flex: 1,
  minWidth: 0,
  height: 46,
  margin: "0 4px",
  borderRadius: 11,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(0,0,0,0.22)",
  color: "white",
  fontWeight: 900,
  fontSize: 11,
  opacity: 1,
  cursor: "pointer",
  whiteSpace: "nowrap",
}}
/>
      </div>

      {/* Slide-up Panel */}
     {tab !== "none" && (
  <div style={{ ...sheetWrapBase, height: sheetHeight }}>
          <div style={sheet}>
            <div style={sheetHandle} />
            <div style={sheetHeader}>
              <div style={{ fontWeight: 900, textTransform: "capitalize" }}>{tab}</div>
              <button style={iconBtn} onClick={() => setTab("none")} title="Close panel">
                ✕
              </button>
            </div>

            <div style={sheetBody} className="sheetBody">
             
   
{tab === "assets" && (
  <div>
    <div style={{ padding: 12, paddingBottom: 0 }}>
      <select
        value={presetId}
        onChange={(e) => setPresetId(e.target.value)}
        style={presetSelect}
      >
        {presets.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
    </div>

    <div style={{ padding: "10px 10px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button onClick={saveProject} style={btnTile}>
          {saving ? "Saving..." : "Save Design"}
        </button>

      <button onClick={handleLogout}>
  Logout
</button>
      </div>
    </div>

    <div style={assetsGrid}>
      <label style={tileBtn}>
        Upload Image
        <input
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) addImageFromFile(f);
            e.currentTarget.value = "";
          }}
        />
      </label>

      <label style={tileBtn}>
        Upload Your Own Background
        <input
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setBackgroundFromFile(f);
            e.currentTarget.value = "";
          }}
        />
      </label>

      <button style={tileBtn} onClick={makeAiBackground}>
        Create AI Background
      </button>

      <label style={tileBtn}>
        {cutoutLoading ? "Cutting out..." : "Remove Background From Photo"}
        <input
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          disabled={cutoutLoading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) cutoutFromFileFreeAI(f);
            e.currentTarget.value = "";
          }}
        />
      </label>
    </div>

    <div style={{ padding: "10px" }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>Templates</div>

     <div style={{ padding: "10px" }}>
  <div style={{ fontWeight: 900, marginBottom: 8 }}>Live Templates</div>

  <TemplateLibrary
    type={projectType}
    paid={paid}
    onPick={loadTemplate}
  />
</div>
    </div>

    <AssetLibrary onPick={addAssetToCanvas} />
  </div>
)}
             {tab === "text" && (
  <>
    <div style={row}>
  <button style={btnTile} onClick={addText}>
    + Add Text
  </button>
  <button style={btnTile} onClick={duplicateSelected} disabled={!selectedId}>
    Duplicate
  </button>
</div>

<div style={{ padding: "0 12px 12px" }}>
  <button style={dangerBtn} onClick={deleteSelected} disabled={!selectedId}>
    Delete
  </button>
</div>
{/* TEXT TEMPLATES */}
<div style={{ padding: "0 12px 12px" }}>
  <div style={{ fontWeight: 900, marginBottom: 8 }}>Text Templates</div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 8,
    }}
  >
    <button style={tileBtn} onClick={addArtistTemplate}>
      Artist + Title
    </button>

    <button style={tileBtn} onClick={addFlyerTemplate}>
      Event Flyer
    </button>

    <button style={tileBtn} onClick={addQuoteTemplate}>
      Social Quote
    </button>

    <button style={tileBtn} onClick={addPodcastTemplate}>
      Podcast Cover
    </button>
  </div>
</div>

<div style={{ padding: "0 12px 12px" }}>
  <div style={{ fontWeight: 900, marginBottom: 8 }}>Text Effects</div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
    }}
  >
    <button style={templateBtn} onClick={applyGlowText} disabled={!selectedText}>
      Glow
    </button>

    <button style={templateBtn} onClick={applyNeonText} disabled={!selectedText}>
      Neon
    </button>

    <button style={templateBtn} onClick={applyGoldText} disabled={!selectedText}>
      Gold
    </button>

    <button style={templateBtn} onClick={applyHardShadowText} disabled={!selectedText}>
      Hard Shadow
    </button>

    <button style={templateBtn} onClick={applyCleanTitleText} disabled={!selectedText}>
      Clean Title
    </button>
  </div>
</div>
                  

                  {selectedText ? (
                    <FontPanel
                      value={{
                        text: selectedText.text,
                        fontFamily: selectedText.fontFamily,
                        fontSize: selectedText.fontSize,
                        fontWeight: selectedText.fontWeight,
                        fontStyle: selectedText.fontStyle,
                        fill: selectedText.fill,
                        align: selectedText.align,
                        letterSpacing: selectedText.letterSpacing,
                        lineHeight: selectedText.lineHeight,
                        textDecoration: selectedText.textDecoration,

                        bgEnabled: selectedText.bgEnabled,
                        bgColor: selectedText.bgColor,
                        bgOpacity: selectedText.bgOpacity,
                        bgPaddingX: selectedText.bgPaddingX,
                        bgPaddingY: selectedText.bgPaddingY,
                        bgRadius: selectedText.bgRadius,

                        strokeEnabled: selectedText.strokeEnabled,
                        strokeColor: selectedText.strokeColor,
                        strokeWidth: selectedText.strokeWidth,

                        shadowEnabled: selectedText.shadowEnabled,
                        shadowColor: selectedText.shadowColor,
                        shadowBlur: selectedText.shadowBlur,
                        shadowOffsetX: selectedText.shadowOffsetX,
                        shadowOffsetY: selectedText.shadowOffsetY,
                        shadowOpacity: selectedText.shadowOpacity,

                        style3d: selectedText.style3d,

                        curveEnabled: selectedText.curveEnabled,
                        curveRadius: selectedText.curveRadius,
                        curveArc: selectedText.curveArc,
                        curveReverse: selectedText.curveReverse,
                      }}
                      onChange={updateSelectedText}
                    />
                  ) : (
                    <div style={hint}>Select a text layer to edit it.</div>
                  )}
                </>
              )}

              {tab === "adjust" && (
                <>
                  <div style={rowOne}>
                    <label style={checkRow}>
                      <input type="checkbox" checked={snapEnabled} onChange={(e) => setSnapEnabled(e.target.checked)} />
                      <span>Snap</span>
                    </label>
                    <div style={{ fontSize: 12, opacity: 0.7, padding: 12 }}>Hold Shift to drag free</div>
                  </div>

                  {selectedImage ? (
                    <ImagePanel value={selectedImage.adj} onChange={updateSelectedImage} onReset={resetSelectedImageAdjustments} />
                  ) : (
                    <div style={hint}>Select an image layer to adjust it.</div>
                  )}
                </>
              )}

              {tab === "layers" && (
                <>
                  <LayersPanel
                    layers={layers}
                    selectedId={selectedId}
                    onSelect={(id) => setSelectedId(id)}
                    onMoveUp={() => selectedId && moveLayerUp(selectedId)}
                    onMoveDown={() => selectedId && moveLayerDown(selectedId)}
                    onToFront={() => selectedId && bringToFront(selectedId)}
                    onToBack={() => selectedId && sendToBack(selectedId)}
                  />

<div style={{ padding: 10 }}>
  <div style={{ fontWeight: 900, marginBottom: 8 }}>Align</div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginBottom: 8,
    }}
  >
    <button style={btnTile} onClick={alignSelectedCenterX} disabled={!selectedId}>
      Center X
    </button>

    <button style={btnTile} onClick={alignSelectedCenterY} disabled={!selectedId}>
      Center Y
    </button>

    <button style={btnTile} onClick={alignSelectedTop} disabled={!selectedId}>
      Top
    </button>

    <button style={btnTile} onClick={alignSelectedBottom} disabled={!selectedId}>
      Bottom
    </button>
  </div>
</div>

                <div style={{ padding: 10, display: "grid", gap: 8 }}>
  <button style={btnTile} onClick={duplicateSelected} disabled={!selectedId}>
    Duplicate Selected
  </button>

  <button style={dangerBtn} onClick={deleteSelected} disabled={!selectedId}>
    Delete Selected
  </button>
</div>
                </>
              )}

              {tab === "export" && (
  <div style={{ padding: 20 }}>
    <button
      style={tileBtn}
      onClick={() => {
        const uri = stageRef.current?.toDataURL({
          pixelRatio: 3,
        });

        if (!uri) return;

        const link = document.createElement("a");
        link.download = "design.png";
        link.href = uri;
        link.click();
      }}
    >
      Export PNG
    </button>
  </div>
)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** ---------------- Components ---------------- */
function TabBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 0,
        height: 30,
        margin: "0 4px",
        borderRadius: 12,
        border: active ? "1px solid rgba(0,0,0,0.15)" : "1px solid transparent",
        background: active ? "rgba(255,255,255,0.28)" : "transparent",
        color: active ? "#d1b15a" : "white",
        fontWeight: 900,
        fontSize: 13,
        opacity: active ? 1 : 0.72,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "all 0.18s ease",
      }}
    >
      {label}
    </button>
  );
}

function CanvasTextItem({
  item,
  onSelect,
  onUpdate,
  onDragMove,
  onDragEnd,
  registerNode,
}: {
  item: TextItem;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Item>) => void;
  onDragMove: (node: Konva.Node | null) => void;
  onDragEnd: () => void;
  registerNode: (id: string, node: Konva.Node | null) => void;
}) {
  const groupRef = useRef<Konva.Group | null>(null);
  const textRef = useRef<Konva.Text | null>(null);
  const pathRef = useRef<any>(null);

  useEffect(() => {
    registerNode(item.id, groupRef.current);
    return () => registerNode(item.id, null);
  }, [item.id, registerNode]);

  useEffect(() => {
    const group = groupRef.current;
    const textNode = textRef.current;

    if (!group) return;

    if (item.curveEnabled) {
      group.offsetX(0);
      group.offsetY(0);
      group.getLayer()?.batchDraw();
      return;
    }

    if (!textNode) return;

    if (item.align === "center") {
      group.offsetX(textNode.width() / 2);
    } else if (item.align === "right") {
      group.offsetX(textNode.width());
    } else {
      group.offsetX(0);
    }

    group.getLayer()?.batchDraw();
  }, [
    item.text,
    item.fontFamily,
    item.fontSize,
    item.fontWeight,
    item.fontStyle,
    item.letterSpacing,
    item.align,
    item.curveEnabled,
  ]);

  const curveData = arcPath(item.curveRadius, item.curveArc, item.curveReverse);
  const shadowOpacity = item.shadowEnabled ? item.shadowOpacity : 0;

  return (
    <Group
      ref={groupRef as any}
      id={item.id}
      x={item.x}
      y={item.y}
      rotation={item.rotation}
      draggable
      onClick={() => onSelect(item.id)}
      onTap={() => onSelect(item.id)}
      onDragMove={(e) => onDragMove(e.target)}
      onDragEnd={(e) => {
        onUpdate(item.id, { x: e.target.x(), y: e.target.y() });
        onDragEnd();
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const nextFont = Math.max(10, Math.round(item.fontSize * scaleX));
        node.scaleX(1);
        node.scaleY(1);
        onUpdate(item.id, {
          fontSize: nextFont,
          rotation: node.rotation(),
          x: node.x(),
          y: node.y(),
        });
      }}
    >
      {item.curveEnabled ? (
        <TextPath
          ref={pathRef as any}
          data={curveData}
          text={item.text}
          fontSize={item.fontSize}
          fontFamily={item.fontFamily}
          fontStyle={item.fontStyle}
          fontWeight={item.fontWeight as any}
          fill={item.fill}
          letterSpacing={item.letterSpacing}
          textDecoration={item.textDecoration === "none" ? "" : item.textDecoration}
          stroke={item.strokeEnabled ? item.strokeColor : undefined}
          strokeWidth={item.strokeEnabled ? item.strokeWidth : 0}
          shadowColor={item.shadowEnabled ? item.shadowColor : undefined}
          shadowBlur={item.shadowEnabled ? item.shadowBlur : 0}
          shadowOffsetX={item.shadowEnabled ? item.shadowOffsetX : 0}
          shadowOffsetY={item.shadowEnabled ? item.shadowOffsetY : 0}
          shadowOpacity={shadowOpacity}
        />
      ) : (
        <Text
          ref={textRef as any}
          text={item.text}
          fontSize={item.fontSize}
          fontFamily={item.fontFamily}
          fontStyle={item.fontStyle}
          fontWeight={item.fontWeight as any}
          fill={item.fill}
          align={item.align}
          lineHeight={item.lineHeight}
          letterSpacing={item.letterSpacing}
          textDecoration={item.textDecoration === "none" ? "" : item.textDecoration}
          stroke={item.strokeEnabled ? item.strokeColor : undefined}
          strokeWidth={item.strokeEnabled ? item.strokeWidth : 0}
          shadowColor={item.shadowEnabled ? item.shadowColor : undefined}
          shadowBlur={item.shadowEnabled ? item.shadowBlur : 0}
          shadowOffsetX={item.shadowEnabled ? item.shadowOffsetX : 0}
          shadowOffsetY={item.shadowEnabled ? item.shadowOffsetY : 0}
          shadowOpacity={shadowOpacity}
        />
      )}
    </Group>
  );
}

function CanvasImageItem({
  item,
  onSelect,
  onUpdate,
  onDragMove,
  onDragEnd,
  registerNode,
}: {
  item: ImageItem;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Item>) => void;
  onDragMove: (node: Konva.Node | null) => void;
  onDragEnd: () => void;
  registerNode: (id: string, node: Konva.Node | null) => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const nodeRef = useRef<Konva.Image | null>(null);

  useEffect(() => {
    registerNode(item.id, nodeRef.current);
    return () => registerNode(item.id, null);
  }, [item.id, registerNode]);

 

  useEffect(() => {
    let cancelled = false;
    loadHtmlImage(item.src)
      .then((i) => !cancelled && setImg(i))
      .catch(() => !cancelled && setImg(null));
    return () => { cancelled = true; };
  }, [item.src]);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !img) return;

    node.cache();

    node.filters([
      Konva.Filters.Brighten,
      Konva.Filters.Contrast,
      Konva.Filters.HSL,
      Konva.Filters.Blur,
      Konva.Filters.Noise,
    ]);

    node.brightness(item.adj.brightness ?? 0);
    node.hue(item.adj.hue ?? 0);
    node.blurRadius(item.adj.blur ?? 0);

    const clarity = item.adj.clarity ?? 0;
    const baseContrast = item.adj.contrast ?? 0;
    node.contrast(baseContrast + clarity * 0.75);
    node.saturation((item.adj.saturation ?? 0) + clarity * 0.25);

    const texture = item.adj.texture ?? 0;
    node.noise(Math.max(0, texture * 0.25));

    node.getLayer()?.batchDraw();
 }, [img, item.adj, item.width, item.height]);

  return (
    <KImage
      ref={nodeRef as any}
      id={item.id}
      image={img ?? undefined}
      x={item.x}
      y={item.y}
      rotation={item.rotation}
      width={item.width}
      height={item.height}
      draggable
      onClick={() => onSelect(item.id)}
      onTap={() => onSelect(item.id)}
      onDragMove={(e) => onDragMove(e.target)}
      onDragEnd={(e) => {
        onUpdate(item.id, { x: e.target.x(), y: e.target.y() });
        onDragEnd();
      }}
      onTransformEnd={(e) => {
        const node = e.target as Konva.Image;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        const nextW = Math.max(20, Math.round(item.width * scaleX));
        const nextH = Math.max(20, Math.round(item.height * scaleY));

        node.scaleX(1);
        node.scaleY(1);

        onUpdate(item.id, {
          width: nextW,
          height: nextH,
          rotation: node.rotation(),
          x: node.x(),
          y: node.y(),
        });
      }}
    />
  );
}

/** ---------------- Styles ---------------- */
const screen: React.CSSProperties = {
  height: "100vh",
  width: "100vw",
  backgroundImage: "url('/app-bg.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  color: "#fff",
  overflow: "hidden",
};

const header: React.CSSProperties = {
  height: 64,
  padding: "0 10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  borderBottom: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0, 0, 0, 0.92)",
  position: "sticky",
  top: 0,
  zIndex: 10,
  backdropFilter: "blur(10px)",
};

const iconBtn: React.CSSProperties = {
  width: 42,
  height: 42,
  minWidth: 42,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgb(209, 177, 90)",
  color: "black",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 18,
};
const miniSelect: React.CSSProperties = {
  height: 42,
  minWidth: 96,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgb(209, 177, 90)",
  color: "black",
  padding: "0 12px",
  outline: "none",
  fontWeight: 800,
  fontSize: 16,
};
const upgradeBtn: React.CSSProperties = {
  height: 42,
  padding: "0 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "#ffffff",
  color: "black",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const canvasArea: React.CSSProperties = {
  height: "calc(100vh - 64px - 58px)",
  padding: "8px 10px 6px",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  overflow: "hidden",
};
const canvasWrap: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  paddingTop: 6,
  borderRadius: 24,
  overflow: "visible",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "#00000065",
  boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
};
const tabBar: React.CSSProperties = {
  height: 64,
  display: "flex",
  alignItems: "center",
  padding: "0 8px",
  borderTop: "1px solid rgba(255,255,255,0.08)",
  backgroundImage: "url('/gold-texture.jpg')",
  backgroundSize: "cover",
  backgroundBlendMode: "overlay",
backgroundColor: "rgba(0,0,0,0.65)",
  backgroundPosition: "center",
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 20,
  boxShadow: "0 -6px 20px rgba(0,0,0,0.35)",
};
const sheetWrapBase: React.CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 58,
  zIndex: 30,
  display: "grid",
  placeItems: "end center",
  pointerEvents: "none",
};

const sheet: React.CSSProperties = {
  pointerEvents: "auto",
  width: "min(980px, 90%)",
  height: "100%",
  background: "rgba(0, 0, 0, 0.88)",
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  border: "1px solid #d1b15a",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const sheetBody: React.CSSProperties = {
  padding: 8,
  width: "100%",
  boxSizing: "border-box",
  overflowX: "hidden",
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  flex: 1,
};
const inputFull: React.CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
};
const sheetHandle: React.CSSProperties = {
  width: 54,
  height: 5,
  borderRadius: 999,
  background: "rgb(209, 177, 90)",
  margin: "8px auto 4px",
};

const sheetHeader: React.CSSProperties = {
  padding: "8px 12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
};

const row: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  padding: 12,
};

const rowOne: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
};

const btnTile: React.CSSProperties = {
  width: "100%",
  height: 52,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "#d1b15a",
  color: "black",
  fontWeight: 900,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
};

const dangerBtn: React.CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(0,0,0,0.6)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const assetsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  gap: 8,
  padding: "6px 10px",
  alignItems: "stretch",
};

const tileBtn: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: 46,
  padding: "4px 6px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  backgroundImage: "linear-gradient(135deg,#d1b15a,#000000)",
  color: "white",
  fontWeight: 700,
  fontSize: 11,
  lineHeight: 1.1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
  boxSizing: "border-box",
};
const tileBtnWide: React.CSSProperties = {
  ...tileBtn,
  gridColumn: "1 / -1",
  height: 50,
};
const presetSelect: React.CSSProperties = {
  width: "100%",
  height: 52,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.55)",
  color: "white",
  padding: "0 14px",
  fontWeight: 900,
  fontSize: 14,
  outline: "none",
};
const FONT_OPTIONS = [
  { label: "Arial", value: "Arial" },
  { label: "Bebas Neue", value: "BebasNeue" },
];
const templateBtn: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  backgroundImage: "linear-gradient(135deg, #d1b15a, #000000)",
  color: "white",
  fontWeight: 800,
  fontSize: 12,
  lineHeight: 1.1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
};

const checkRow: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center" };
const hint: React.CSSProperties = { padding: 12, fontSize: 12, opacity: 0.75 };