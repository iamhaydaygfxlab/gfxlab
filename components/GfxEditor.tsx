"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Konva from "konva";
import {
  Group,
  Image as KImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
  TextPath,
  Transformer,
} from "react-konva";
import { getAuth, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import { app, db } from "@/lib/firebase";
import { cutoutPersonToPngDataUrl } from "@/lib/cutout";
import AssetLibrary, { type AssetItem } from "./AssetLibrary";
import ExportButton from "./ExportButton";
import FontPanel from "./FontPanel";
import ImagePanel, { type ImageAdjustments } from "./ImagePanel";
import LayersPanel from "./LayersPanel";
import TemplateLibrary from "./TemplateLibrary";
import { type FireTemplate } from "@/lib/templates";

async function ensureFontLoaded(fontFamily: string) {
  if (!fontFamily) return;
  const fonts = (document as any).fonts;
  if (!fonts?.load) return;
  await fonts.load(`24px \"${fontFamily}\"`);
  await fonts.ready;
}

type ProjectType = "cover" | "flyer" | "social";
type MobileTab = "assets" | "text" | "adjust" | "layers" | "export" | "none";
type GuideLine = { kind: "v" | "h"; pos: number };
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
  curveArc: number;
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

type Snapshot = {
  items: Item[];
  bgSrc: string | null;
  projectType: ProjectType;
  presetId: string;
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function nodeIsGone(node: Konva.Node | null | undefined) {
  if (!node) return true;
  const anyNode = node as any;
  return Boolean(anyNode?.isDestroyed?.() || anyNode?._isDestroyed);
}

export function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load (CORS): " + src));
    img.decoding = "async";
    img.src = src;
  });
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

function makeTextItem(overrides: Partial<TextItem>): TextItem {
  return {
    ...defaultText(),
    ...overrides,
    id: uid(),
    kind: "text",
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
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${largeArcFlag} ${sweepFlag} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function getCenter(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

function getAngle(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  return (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
}

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

const ALL_PRESETS: SizePreset[] = [...COVER_PRESETS, ...FLYER_PRESETS, ...SOCIAL_PRESETS];

function openGfxDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("gfxlab-db", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("pending")) db.createObjectStore("pending");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePendingDesign(key: string, value: unknown) {
  const db = await openGfxDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("pending", "readwrite");
    tx.objectStore("pending").put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadPendingDesign<T = any>(key: string): Promise<T | null> {
  const db = await openGfxDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending", "readonly");
    const req = tx.objectStore("pending").get(key);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function deletePendingDesign(key: string) {
  const db = await openGfxDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("pending", "readwrite");
    tx.objectStore("pending").delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export default function GfxEditor() {
  const [tab, setTab] = useState<MobileTab>("assets");
  const [cutoutLoading, setCutoutLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [checkoutRestoreReady, setCheckoutRestoreReady] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Untitled Design");
  const [saving, setSaving] = useState(false);
  const [projectType, setProjectType] = useState<ProjectType>("cover");
  const presets = projectType === "cover" ? COVER_PRESETS : projectType === "flyer" ? FLYER_PRESETS : SOCIAL_PRESETS;
  const [presetId, setPresetId] = useState<string>(presets[0].id);
  const preset = useMemo(() => ALL_PRESETS.find((x) => x.id === presetId) ?? presets[0], [presetId, presets]);

  const [items, setItems] = useState<Item[]>([defaultText()]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bgSrc, setBgSrc] = useState<string | null>(null);
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);
  const [wmImg, setWmImg] = useState<HTMLImageElement | null>(null);
  const WATERMARK_SRC = "/logo.png";
  const watermarkEnabled = true;

  const [snapEnabled, setSnapEnabled] = useState(true);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const shiftDownRef = useRef(false);

  const [hostSize, setHostSize] = useState({ w: 800, h: 600 });
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const artGroupRef = useRef<Konva.Group | null>(null);
  const filePickerRef = useRef<HTMLInputElement | null>(null);
  const nodeMapRef = useRef<Record<string, Konva.Node | null>>({});
  const historyRef = useRef<Snapshot[]>([]);
  const historyIndexRef = useRef(-1);
  const restoringHistoryRef = useRef(false);

  const pinchRef = useRef<
    | {
        mode: "stage" | "node";
        startDist: number;
        startAngle: number;
        startCenter: { x: number; y: number };
        startStageScale: number;
        startStagePos: { x: number; y: number };
        startNodeScaleX: number;
        startNodeScaleY: number;
        startNodeRotation: number;
        startNodePos: { x: number; y: number };
      }
    | null
  >(null);

  const isMobile = typeof window !== "undefined" ? window.innerWidth <= 768 : false;
  const sheetHeight =
    tab === "assets"
      ? isMobile
        ? "min(420px, 48vh)"
        : "min(360px, 40vh)"
      : tab === "text"
      ? isMobile
        ? "min(420px, 48vh)"
        : "min(360px, 40vh)"
      : tab === "adjust"
      ? isMobile
        ? "min(360px, 42vh)"
        : "min(300px, 34vh)"
      : tab === "layers"
      ? isMobile
        ? "min(360px, 42vh)"
        : "min(280px, 30vh)"
      : tab === "export"
      ? "min(200px, 24vh)"
      : "min(220px, 24vh)";

  const panelReserve = tab === "none" ? 18 : isMobile ? 170 : 150;
  const workspacePadding = isMobile ? 16 : 26;
  const artboardPadding = isMobile ? 26 : 40;

  const view = useMemo(() => {
    const safeW = Math.max(260, hostSize.w - workspacePadding * 2);
    const safeH = Math.max(260, hostSize.h - workspacePadding * 2 - panelReserve);
    const ratio = Math.min((safeW - artboardPadding * 2) / preset.w, (safeH - artboardPadding * 2) / preset.h);
    const scaledRatio = Math.max(0.02, ratio);
    const w = Math.max(120, Math.round(preset.w * scaledRatio));
    const h = Math.max(120, Math.round(preset.h * scaledRatio));
    const x = Math.round((hostSize.w - w) / 2);
    const y = Math.max(workspacePadding, Math.round((hostSize.h - panelReserve - h) / 2));
    return { w, h, ratio: scaledRatio, x, y };
  }, [hostSize, panelReserve, preset, workspacePadding, artboardPadding]);

  const selectedItem = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId]);
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

  const registerNode = useCallback((id: string, node: Konva.Node | null) => {
    if (node) nodeMapRef.current[id] = node;
    else delete nodeMapRef.current[id];
  }, []);

  function snapshotNow(): Snapshot {
    return {
      items: JSON.parse(JSON.stringify(items)),
      bgSrc,
      projectType,
      presetId,
    };
  }

  function pushHistory(snapshot: Snapshot) {
    const next = historyRef.current.slice(0, historyIndexRef.current + 1);
    next.push(snapshot);
    historyRef.current = next.slice(-60);
    historyIndexRef.current = historyRef.current.length - 1;
  }

  function applySnapshot(snapshot: Snapshot) {
    restoringHistoryRef.current = true;
    setItems(snapshot.items);
    setBgSrc(snapshot.bgSrc);
    setProjectType(snapshot.projectType);
    setPresetId(snapshot.presetId);
    setSelectedId(null);
    requestAnimationFrame(() => {
      restoringHistoryRef.current = false;
    });
  }

  function undo() {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    applySnapshot(historyRef.current[historyIndexRef.current]);
  }

  function redo() {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    applySnapshot(historyRef.current[historyIndexRef.current]);
  }

  useEffect(() => {
    if (historyRef.current.length === 0) {
      pushHistory(snapshotNow());
      return;
    }
    if (restoringHistoryRef.current) return;
    pushHistory(snapshotNow());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, bgSrc, projectType, presetId]);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setPaid(false);
        return;
      }
      const userRef = doc(db, "users", user.uid);
      const unsubDoc = onSnapshot(
        userRef,
        (snap) => {
          const data = snap.data();
          setPaid(data?.pro === true);
        },
        () => setPaid(false)
      );
      return () => unsubDoc();
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const currentPresetStillValid = presets.some((p) => p.id === presetId);
    if (!currentPresetStillValid) setPresetId(presets[0].id);
  }, [presetId, presets]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") shiftDownRef.current = true;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && ((e.key.toLowerCase() === "y") || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") shiftDownRef.current = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  useEffect(() => {
    const el = canvasHostRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setHostSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setStageScale(1);
    setStagePos({ x: 0, y: 0 });
    pinchRef.current = null;
  }, [presetId, hostSize.w, hostSize.h, tab]);

  useEffect(() => {
    let cancelled = false;
    loadHtmlImage(WATERMARK_SRC)
      .then((img) => !cancelled && setWmImg(img))
      .catch(() => !cancelled && setWmImg(null));
    return () => {
      cancelled = true;
    };
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
    return () => {
      cancelled = true;
    };
  }, [bgSrc]);

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    tr.nodes([]);
    tr.getLayer()?.batchDraw();
    if (!selectedId) return;
    const t = window.setTimeout(() => {
      const node = nodeMapRef.current[selectedId];
      if (!node || nodeIsGone(node)) {
        tr.nodes([]);
        tr.getLayer()?.batchDraw();
        return;
      }
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    }, 0);
    return () => window.clearTimeout(t);
  }, [selectedId, items]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const exportStatus = params.get("export");
    if (exportStatus === "success") {
      sessionStorage.setItem("paid_export", "true");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

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
        window.setTimeout(() => setCheckoutRestoreReady(true), 700);
      } catch {
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
    }, 1200);
    return () => window.clearTimeout(t);
  }, [checkoutRestoreReady, bgImg, presetId, projectType]);

  function toSafeSrc(src: string) {
    if (src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("/")) return src;
    if (src.startsWith("http://") || src.startsWith("https://")) {
      const params = new URLSearchParams({ url: src });
      return `/api/image-proxy?${params.toString()}`;
    }
    return src;
  }

  function updateItem(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((i) => (i.id === id ? ({ ...i, ...patch } as Item) : i)));
  }

  function updateSelectedText(next: Partial<TextItem>) {
    if (!selectedText) return;
    updateItem(selectedText.id, { ...selectedText, ...next });
  }

  function updateSelectedImage(nextAdj: ImageAdjustments) {
    if (!selectedImage) return;
    updateItem(selectedImage.id, { adj: nextAdj } as Partial<Item>);
  }

  function resetSelectedImageAdjustments() {
    if (!selectedImage) return;
    updateItem(selectedImage.id, { adj: defaultAdj() } as Partial<Item>);
  }

  function addText() {
    const t = defaultText();
    t.text = "New Text";
    t.x = Math.round(preset.w * 0.2);
    t.y = Math.round(preset.h * 0.2);
    setItems((prev) => [...prev, t]);
    setSelectedId(t.id);
    setTab("text");
  }

  async function addAssetToCanvas(asset: AssetItem) {
    try {
      const safeSrc = toSafeSrc(asset.src);
      const img = await loadHtmlImage(safeSrc);
      const isBackground = asset.type === "background";
      if (isBackground) {
        setBgSrc(safeSrc);
        setSelectedId(null);
        return;
      }
      const targetMaxW = Math.round(preset.w * 0.85);
      const targetMaxH = Math.round(preset.h * 0.85);
      const ratio = Math.min(targetMaxW / img.width, targetMaxH / img.height, 1);
      const w = Math.max(60, Math.round(img.width * ratio));
      const h = Math.max(60, Math.round(img.height * ratio));
      const imgItem: ImageItem = {
        id: uid(),
        kind: "image",
        x: Math.round((preset.w - w) / 2),
        y: Math.round((preset.h - h) / 2),
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

  async function addImageFromFile(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const src = String(reader.result);
        const img = await loadHtmlImage(src);
        const targetMaxW = Math.round(preset.w * 0.7);
        const targetMaxH = Math.round(preset.h * 0.7);
        const ratio = Math.min(targetMaxW / img.width, targetMaxH / img.height, 1);
        const w = Math.max(60, Math.round(img.width * ratio));
        const h = Math.max(60, Math.round(img.height * ratio));
        const imgItem: ImageItem = {
          id: uid(),
          kind: "image",
          x: Math.round((preset.w - w) / 2),
          y: Math.round((preset.h - h) / 2),
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
      const targetMaxW = Math.round(preset.w * 0.7);
      const targetMaxH = Math.round(preset.h * 0.7);
      const ratio = Math.min(targetMaxW / img.width, targetMaxH / img.height, 1);
      const w = Math.max(60, Math.round(img.width * ratio));
      const h = Math.max(60, Math.round(img.height * ratio));
      const imgItem: ImageItem = {
        id: uid(),
        kind: "image",
        x: Math.round((preset.w - w) / 2),
        y: Math.round((preset.h - h) / 2),
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

  function deleteSelected() {
    if (!selectedId) return;
    trRef.current?.nodes([]);
    trRef.current?.getLayer()?.batchDraw();
    setItems((prev) => prev.filter((i) => i.id !== selectedId));
    setSelectedId(null);
  }

  function duplicateSelected() {
    if (!selectedId) return;
    const current = items.find((i) => i.id === selectedId);
    if (!current) return;
    const copy = { ...current, id: uid(), x: current.x + 40, y: current.y + 40 } as Item;
    setItems((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  }

  function alignSelectedCenterX() {
    if (!selectedId) return;
    const node = nodeMapRef.current[selectedId];
    if (!node) return;
    const box = node.getClientRect();
    const artLeft = view.x;
    const newX = Math.round((preset.w * view.ratio) / 2 - box.width / 2 / view.ratio);
    updateItem(selectedId, { x: Math.max(0, Math.round(newX)) });
    void artLeft;
  }

  function alignSelectedCenterY() {
    if (!selectedId) return;
    const current = items.find((i) => i.id === selectedId);
    if (!current) return;
    if (current.kind === "text") updateItem(current.id, { y: Math.round(preset.h / 2 - 30) });
    else updateItem(current.id, { y: Math.round((preset.h - current.height) / 2) });
  }

  function alignSelectedTop() {
    if (!selectedId) return;
    updateItem(selectedId, { y: 20 });
  }

  function alignSelectedBottom() {
    if (!selectedId) return;
    const current = items.find((i) => i.id === selectedId);
    if (!current) return;
    if (current.kind === "text") updateItem(current.id, { y: Math.round(preset.h - 100) });
    else updateItem(current.id, { y: Math.round(preset.h - current.height - 20) });
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

  async function saveCurrentDesignForCheckout() {
    if (typeof window === "undefined") return;
    await savePendingDesign("gfxlab_pending_export_design", {
      items,
      bgSrc,
      projectType,
      presetId,
    });
  }

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
    } catch {
      window.location.href = "/login";
    }
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
      const payload = {
        ownerUid: user.uid,
        name: projectName,
        projectType,
        presetId,
        bgSrc,
        items,
        updatedAt: serverTimestamp(),
      };
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

  async function makeAiBackground() {
    const idea = window.prompt("Describe your background");
    if (!idea) return;
    try {
      const size = preset.w >= preset.h ? "1536x1024" : "1024x1536";
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
    if (e.target === stage || e.target === artGroupRef.current) setSelectedId(null);
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

    const SNAP = 14;
    const vb = getNodeBox(node);
    const artLeft = view.x;
    const artTop = view.y;
    const stageW = view.w;
    const stageH = view.h;
    const vTargets: number[] = [artLeft, artLeft + stageW / 2, artLeft + stageW];
    const hTargets: number[] = [artTop, artTop + stageH / 2, artTop + stageH];

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

  function commitSelectedNodeTouchTransform() {
    if (!selectedId) return;
    const node = nodeMapRef.current[selectedId];
    if (!node || nodeIsGone(node)) return;
    const current = items.find((i) => i.id === selectedId);
    if (!current) return;

    if (current.kind === "image") {
      const imageNode = node as Konva.Image;
      const scaleX = imageNode.scaleX();
      const scaleY = imageNode.scaleY();
      const nextW = Math.max(20, Math.round(current.width * scaleX));
      const nextH = Math.max(20, Math.round(current.height * scaleY));
      imageNode.scaleX(1);
      imageNode.scaleY(1);
      updateItem(current.id, {
        width: nextW,
        height: nextH,
        rotation: imageNode.rotation(),
        x: imageNode.x(),
        y: imageNode.y(),
      });
    } else {
      const groupNode = node as Konva.Group;
      const uniformScale = Math.max(0.2, (groupNode.scaleX() + groupNode.scaleY()) / 2);
      const nextFont = Math.max(10, Math.round(current.fontSize * uniformScale));
      groupNode.scaleX(1);
      groupNode.scaleY(1);
      updateItem(current.id, {
        fontSize: nextFont,
        rotation: groupNode.rotation(),
        x: groupNode.x(),
        y: groupNode.y(),
      });
    }
  }

  function getStagePointFromTouch(touch: Touch) {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const rect = stage.container().getBoundingClientRect();
    return {
      x: (touch.clientX - rect.left - stagePos.x) / stageScale,
      y: (touch.clientY - rect.top - stagePos.y) / stageScale,
    };
  }

  function beginPinchGesture(e: any) {
    const t1 = e.evt.touches?.[0];
    const t2 = e.evt.touches?.[1];
    if (!t1 || !t2) return;
    const p1 = { x: t1.clientX, y: t1.clientY };
    const p2 = { x: t2.clientX, y: t2.clientY };
    const center = getCenter(p1, p2);
    const dist = getDistance(p1, p2);
    const angle = getAngle(p1, p2);
    const node = selectedId ? nodeMapRef.current[selectedId] : null;
    if (node && !nodeIsGone(node)) {
      pinchRef.current = {
        mode: "node",
        startDist: dist,
        startAngle: angle,
        startCenter: center,
        startStageScale: stageScale,
        startStagePos: stagePos,
        startNodeScaleX: node.scaleX(),
        startNodeScaleY: node.scaleY(),
        startNodeRotation: node.rotation(),
        startNodePos: { x: node.x(), y: node.y() },
      };
      return;
    }
    pinchRef.current = {
      mode: "stage",
      startDist: dist,
      startAngle: angle,
      startCenter: center,
      startStageScale: stageScale,
      startStagePos: stagePos,
      startNodeScaleX: 1,
      startNodeScaleY: 1,
      startNodeRotation: 0,
      startNodePos: { x: 0, y: 0 },
    };
  }

  function movePinchGesture(e: any) {
    const t1 = e.evt.touches?.[0];
    const t2 = e.evt.touches?.[1];
    const active = pinchRef.current;
    if (!t1 || !t2 || !active) return;
    e.evt.preventDefault();

    const p1 = { x: t1.clientX, y: t1.clientY };
    const p2 = { x: t2.clientX, y: t2.clientY };
    const center = getCenter(p1, p2);
    const dist = getDistance(p1, p2);
    const angle = getAngle(p1, p2);

    if (active.mode === "stage") {
      const nextScale = Math.max(1, Math.min(active.startStageScale * (dist / active.startDist), 4));
      const dx = center.x - active.startCenter.x;
      const dy = center.y - active.startCenter.y;
      setStageScale(nextScale);
      setStagePos({ x: active.startStagePos.x + dx, y: active.startStagePos.y + dy });
      return;
    }

    const node = selectedId ? nodeMapRef.current[selectedId] : null;
    if (!node || nodeIsGone(node)) return;
    const nextScale = Math.max(0.25, Math.min(dist / active.startDist, 6));
    const rotationDelta = angle - active.startAngle;
    node.scale({
      x: active.startNodeScaleX * nextScale,
      y: active.startNodeScaleY * nextScale,
    });
    node.rotation(active.startNodeRotation + rotationDelta);
    node.getLayer()?.batchDraw();
  }

  function endPinchGesture() {
    if (pinchRef.current?.mode === "node") commitSelectedNodeTouchTransform();
    pinchRef.current = null;
  }

  async function exportPNG() {
    const stage = stageRef.current;
    if (!stage) return;
    setExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 120));
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    const oldScaleX = stage.scaleX();
    const oldScaleY = stage.scaleY();
    const oldX = stage.x();
    const oldY = stage.y();
    const oldDraggable = stage.draggable();

    try {
      stage.scale({ x: 1, y: 1 });
      stage.position({ x: 0, y: 0 });
      stage.draggable(false);
      stage.batchDraw();
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const dataUrl = stage.toDataURL({
        x: view.x,
        y: view.y,
        width: view.w,
        height: view.h,
        pixelRatio: preset.w / view.w,
        mimeType: "image/png",
      });

      const img = await loadHtmlImage(dataUrl);
      const canvas = document.createElement("canvas");
      canvas.width = preset.w;
      canvas.height = preset.h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");
      ctx.clearRect(0, 0, preset.w, preset.h);
      ctx.drawImage(img, 0, 0, preset.w, preset.h);
      const finalDataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = finalDataUrl;
      a.download = projectType === "cover" ? "gfxlab-cover.png" : projectType === "flyer" ? "gfxlab-flyer.png" : "gfxlab-social.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed.");
    } finally {
      stage.scale({ x: oldScaleX, y: oldScaleY });
      stage.position({ x: oldX, y: oldY });
      stage.draggable(oldDraggable);
      stage.batchDraw();
      setTimeout(() => setExporting(false), 80);
    }
  }

  async function handleExport() {
    if (paid) {
      exportPNG();
      return;
    }
    await saveCurrentDesignForCheckout();
    const guestId = typeof window !== "undefined" ? localStorage.getItem("gfxlab_guest_id") || crypto.randomUUID() : "";
    if (typeof window !== "undefined" && guestId) localStorage.setItem("gfxlab_guest_id", guestId);
    window.location.href = `/api/stripe/checkout-export?guestId=${encodeURIComponent(guestId)}`;
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

  function addArtistTemplate() {
    const artist = makeTextItem({
      text: "ARTIST NAME",
      x: preset.w / 2,
      y: preset.h * 0.15,
      align: "center",
      fontSize: preset.w * 0.09,
      fontFamily: "Impact",
      fontWeight: 900,
      fill: "#ffffff",
    });
    const title = makeTextItem({
      text: "Album Title",
      x: Math.round(preset.w * 0.16),
      y: Math.round(preset.h * 0.72),
      fontSize: Math.round(preset.w * 0.06),
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
      x: Math.round(preset.w * 0.12),
      y: Math.round(preset.h * 0.12),
      fontSize: Math.round(preset.w * 0.09),
      fontFamily: "Impact",
      fontWeight: 900,
      fill: "#ffffff",
    });
    const sub = makeTextItem({
      text: "DJ KAY",
      x: Math.round(preset.w * 0.2),
      y: Math.round(preset.h * 0.3),
      fontSize: Math.round(preset.w * 0.075),
      fontFamily: "Arial",
      fontWeight: 800,
      fill: "#d1b15a",
    });
    const details = makeTextItem({
      text: "FRIDAY • 10PM • TACOMA",
      x: Math.round(preset.w * 0.14),
      y: Math.round(preset.h * 0.84),
      fontSize: Math.round(preset.w * 0.04),
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
      x: Math.round(preset.w * 0.1),
      y: Math.round(preset.h * 0.32),
      fontSize: Math.round(preset.w * 0.055),
      fontFamily: "Arial",
      fontWeight: 800,
      fill: "#ffffff",
      align: "center",
    });
    const author = makeTextItem({
      text: "- @username",
      x: Math.round(preset.w * 0.28),
      y: Math.round(preset.h * 0.68),
      fontSize: Math.round(preset.w * 0.035),
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
      x: Math.round(preset.w * 0.1),
      y: Math.round(preset.h * 0.14),
      fontSize: Math.round(preset.w * 0.075),
      fontFamily: "Impact",
      fontWeight: 900,
      fill: "#ffffff",
    });
    const episode = makeTextItem({
      text: "EPISODE 001",
      x: Math.round(preset.w * 0.12),
      y: Math.round(preset.h * 0.74),
      fontSize: Math.round(preset.w * 0.045),
      fontFamily: "Arial",
      fontWeight: 700,
      fill: "#d1b15a",
    });
    setItems((prev) => [...prev, show, episode]);
    setSelectedId(show.id);
    setTab("text");
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

  return (
    <div style={screen}>
      <div style={header}>
        <style jsx global>{`
          html, body {
            touch-action: manipulation;
          }
          .sheetBody input,
          .sheetBody select,
          .sheetBody textarea,
          .sheetBody button {
            font-size: 16px;
            box-sizing: border-box;
          }
          .sheetBody input,
          .sheetBody select,
          .sheetBody textarea {
            width: 100%;
            max-width: 100%;
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
          <img src="/gfxlab-icon.png" alt="GFXlab" style={{ height: 40, width: 40, objectFit: "contain", flexShrink: 0 }} />
          <button style={smallHeaderBtn} onClick={undo} disabled={historyIndexRef.current <= 0}>
            Undo
          </button>
          <button style={smallHeaderBtn} onClick={redo} disabled={historyIndexRef.current >= historyRef.current.length - 1}>
            Redo
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0, flexShrink: 1 }}>
          <select value={projectType} onChange={(e) => setProjectType(e.target.value as ProjectType)} style={miniSelect}>
            <option value="cover">Cover</option>
            <option value="flyer">Flyer</option>
            <option value="social">Social</option>
          </select>
          {!paid ? (
            <button onClick={goToProCheckout} style={upgradeBtn} title="Upgrade to Pro">
              Upgrade
            </button>
          ) : (
            <div style={proPill}>PRO</div>
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

      <div style={canvasArea}>
        <div ref={canvasHostRef} style={canvasWrap}>
          <Stage
            ref={stageRef as any}
            width={hostSize.w}
            height={hostSize.h}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePos.x}
            y={stagePos.y}
            draggable={stageScale > 1 && !pinchRef.current}
            onMouseDown={deselect}
            onTouchStart={(e) => {
              if (e.evt.touches.length === 2) {
                beginPinchGesture(e);
                return;
              }
              if (e.evt.touches.length === 1) deselect(e);
            }}
            onTouchMove={(e) => {
              if (e.evt.touches.length === 2) movePinchGesture(e);
            }}
            onTouchEnd={() => {
              if ((pinchRef.current && pinchRef.current.mode) || !pinchRef.current) endPinchGesture();
            }}
          >
            <Layer listening={false}>
              <Rect x={0} y={0} width={hostSize.w} height={hostSize.h} fill="#00000000" />
              <Rect
                x={view.x - artboardPadding / 2}
                y={view.y - artboardPadding / 2}
                width={view.w + artboardPadding}
                height={view.h + artboardPadding}
                cornerRadius={24}
                fill="rgba(0,0,0,0.22)"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={1}
              />
            </Layer>

            <Layer>
              <Group ref={artGroupRef as any} x={view.x} y={view.y}>
                {bgImg ? (
                  <KImage image={bgImg} x={0} y={0} width={view.w} height={view.h} listening={false} />
                ) : (
                  <Rect x={0} y={0} width={view.w} height={view.h} fill="#000000" listening={false} />
                )}

                {items.map((it) =>
                  it.kind === "text" ? (
                    <CanvasTextItem
                      key={it.id}
                      item={it}
                      ratio={view.ratio}
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
                      ratio={view.ratio}
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
              </Group>
            </Layer>

            <Layer listening={false}>
              {guides.map((g, idx) =>
                g.kind === "v" ? (
                  <Line
                    key={`g${idx}`}
                    points={[g.pos, view.y, g.pos, view.y + view.h]}
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth={1}
                    dash={[6, 6]}
                  />
                ) : (
                  <Line
                    key={`g${idx}`}
                    points={[view.x, g.pos, view.x + view.w, g.pos]}
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth={1}
                    dash={[6, 6]}
                  />
                )
              )}

              {!exporting && (
                <Rect
                  x={view.x + 15}
                  y={view.y + 15}
                  width={view.w - 30}
                  height={view.h - 30}
                  stroke="#ff3b3b"
                  strokeWidth={2}
                  dash={[8, 6]}
                />
              )}

              {!exporting && (
                <Transformer
                  ref={trRef}
                  padding={24}
                  rotateEnabled
                  ignoreStroke
                  enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 20 || newBox.height < 20) return oldBox;
                    return newBox;
                  }}
                />
              )}
            </Layer>
          </Stage>
        </div>
      </div>

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
                    <input
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Project name"
                      style={{ ...presetSelect, marginBottom: 10 }}
                    />
                    <select value={presetId} onChange={(e) => setPresetId(e.target.value)} style={presetSelect}>
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
                        {saving ? "Saving..." : projectId ? "Saved" : "Save Design"}
                      </button>
                      <button onClick={handleLogout} style={btnTile}>
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
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>Live Templates</div>
                    <TemplateLibrary type={projectType} paid={paid} onPick={loadTemplate} />
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

                  <div style={{ padding: "0 12px 12px" }}>
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>Text Templates</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                      <button style={tileBtn} onClick={addArtistTemplate}>Artist + Title</button>
                      <button style={tileBtn} onClick={addFlyerTemplate}>Event Flyer</button>
                      <button style={tileBtn} onClick={addQuoteTemplate}>Social Quote</button>
                      <button style={tileBtn} onClick={addPodcastTemplate}>Podcast Cover</button>
                    </div>
                  </div>

                  <div style={{ padding: "0 12px 12px" }}>
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>Text Effects</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <button style={templateBtn} onClick={applyGlowText} disabled={!selectedText}>Glow</button>
                      <button style={templateBtn} onClick={applyNeonText} disabled={!selectedText}>Neon</button>
                      <button style={templateBtn} onClick={applyGoldText} disabled={!selectedText}>Gold</button>
                      <button style={templateBtn} onClick={applyHardShadowText} disabled={!selectedText}>Hard Shadow</button>
                      <button style={templateBtn} onClick={applyCleanTitleText} disabled={!selectedText}>Clean Title</button>
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
                    <div style={{ fontSize: 12, opacity: 0.7, padding: 12 }}>Hold Shift to drag free. Use two fingers on the selected layer to scale/rotate.</div>
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
                  <div style={{ padding: 10, display: "grid", gap: 8 }}>
                    <button style={dangerBtn} onClick={deleteSelected} disabled={!selectedId}>
                      Delete Selected
                    </button>
                    <button style={btnTile} onClick={duplicateSelected} disabled={!selectedId}>
                      Duplicate Selected
                    </button>
                  </div>

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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <button style={btnTile} onClick={alignSelectedCenterX} disabled={!selectedId}>Center X</button>
                      <button style={btnTile} onClick={alignSelectedCenterY} disabled={!selectedId}>Center Y</button>
                      <button style={btnTile} onClick={alignSelectedTop} disabled={!selectedId}>Top</button>
                      <button style={btnTile} onClick={alignSelectedBottom} disabled={!selectedId}>Bottom</button>
                    </div>
                  </div>
                </>
              )}

              {tab === "export" && (
                <div style={{ padding: 20 }}>
                  <button style={tileBtn} onClick={exportPNG}>Export PNG</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  ratio,
  onSelect,
  onUpdate,
  onDragMove,
  onDragEnd,
  registerNode,
}: {
  item: TextItem;
  ratio: number;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Item>) => void;
  onDragMove: (node: Konva.Node | null) => void;
  onDragEnd: () => void;
  registerNode: (id: string, node: Konva.Node | null) => void;
}) {
  const groupRef = useRef<Konva.Group | null>(null);
  const textRef = useRef<Konva.Text | null>(null);

  useEffect(() => {
    registerNode(item.id, groupRef.current);
    return () => registerNode(item.id, null);
  }, [item.id, registerNode]);

  useEffect(() => {
    void ensureFontLoaded(item.fontFamily);
  }, [item.fontFamily]);

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
    if (item.align === "center") group.offsetX(textNode.width() / 2);
    else if (item.align === "right") group.offsetX(textNode.width());
    else group.offsetX(0);
    group.getLayer()?.batchDraw();
  }, [item.text, item.fontFamily, item.fontSize, item.fontWeight, item.fontStyle, item.letterSpacing, item.align, item.curveEnabled]);

  const curveData = arcPath(item.curveRadius * ratio, item.curveArc, item.curveReverse);
  const shadowOpacity = item.shadowEnabled ? item.shadowOpacity : 0;
  const scaledX = item.x * ratio;
  const scaledY = item.y * ratio;
  const scaledFont = Math.max(8, item.fontSize * ratio);

  return (
    <Group
      ref={groupRef as any}
      id={item.id}
      x={scaledX}
      y={scaledY}
      rotation={item.rotation}
      draggable
      onClick={() => onSelect(item.id)}
      onTap={() => onSelect(item.id)}
      onDragMove={(e) => onDragMove(e.target)}
      onDragEnd={(e) => {
        onUpdate(item.id, { x: e.target.x() / ratio, y: e.target.y() / ratio });
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
          x: node.x() / ratio,
          y: node.y() / ratio,
        });
      }}
    >
      {item.curveEnabled ? (
        <TextPath
          data={curveData}
          text={item.text}
          fontSize={scaledFont}
          fontFamily={item.fontFamily}
          fontStyle={item.fontStyle}
          fontWeight={item.fontWeight as any}
          fill={item.fill}
          letterSpacing={item.letterSpacing * ratio}
          textDecoration={item.textDecoration === "none" ? "" : item.textDecoration}
          stroke={item.strokeEnabled ? item.strokeColor : undefined}
          strokeWidth={item.strokeEnabled ? item.strokeWidth * ratio : 0}
          shadowColor={item.shadowEnabled ? item.shadowColor : undefined}
          shadowBlur={item.shadowEnabled ? item.shadowBlur * ratio : 0}
          shadowOffsetX={item.shadowEnabled ? item.shadowOffsetX * ratio : 0}
          shadowOffsetY={item.shadowEnabled ? item.shadowOffsetY * ratio : 0}
          shadowOpacity={shadowOpacity}
        />
      ) : (
        <Text
          ref={textRef as any}
          text={item.text}
          fontSize={scaledFont}
          fontFamily={item.fontFamily}
          fontStyle={item.fontStyle}
          fontWeight={item.fontWeight as any}
          fill={item.fill}
          align={item.align}
          lineHeight={item.lineHeight}
          letterSpacing={item.letterSpacing * ratio}
          textDecoration={item.textDecoration === "none" ? "" : item.textDecoration}
          stroke={item.strokeEnabled ? item.strokeColor : undefined}
          strokeWidth={item.strokeEnabled ? item.strokeWidth * ratio : 0}
          shadowColor={item.shadowEnabled ? item.shadowColor : undefined}
          shadowBlur={item.shadowEnabled ? item.shadowBlur * ratio : 0}
          shadowOffsetX={item.shadowEnabled ? item.shadowOffsetX * ratio : 0}
          shadowOffsetY={item.shadowEnabled ? item.shadowOffsetY * ratio : 0}
          shadowOpacity={shadowOpacity}
        />
      )}
    </Group>
  );
}

function CanvasImageItem({
  item,
  ratio,
  onSelect,
  onUpdate,
  onDragMove,
  onDragEnd,
  registerNode,
}: {
  item: ImageItem;
  ratio: number;
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
    return () => {
      cancelled = true;
    };
  }, [item.src]);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !img) return;
    node.cache();
    node.filters([Konva.Filters.Brighten, Konva.Filters.Contrast, Konva.Filters.HSL, Konva.Filters.Blur, Konva.Filters.Noise]);
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
      x={item.x * ratio}
      y={item.y * ratio}
      rotation={item.rotation}
      width={item.width * ratio}
      height={item.height * ratio}
      draggable
      onClick={() => onSelect(item.id)}
      onTap={() => onSelect(item.id)}
      onDragMove={(e) => onDragMove(e.target)}
      onDragEnd={(e) => {
        onUpdate(item.id, { x: e.target.x() / ratio, y: e.target.y() / ratio });
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
          x: node.x() / ratio,
          y: node.y() / ratio,
        });
      }}
    />
  );
}

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

const smallHeaderBtn: React.CSSProperties = {
  height: 36,
  padding: "0 10px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.14)",
  color: "white",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 12,
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

const proPill: React.CSSProperties = {
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
};

const canvasArea: React.CSSProperties = {
  height: "calc(100vh - 64px - 58px)",
  padding: "0px 10px 0px",
  paddingTop: "4px",
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
  alignItems: "center",
  borderRadius: 24,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "#00000065",
  boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
  touchAction: "none",
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
  width: "min(980px, 94%)",
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
  width: "100%",
  padding: "12px 14px",
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

const checkRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  padding: 12,
};

const hint: React.CSSProperties = {
  padding: 12,
  fontSize: 12,
  opacity: 0.75,
};