"use client";

import {
  useState,
  useRef,
  useCallback,
  ChangeEvent,
  DragEvent,
  FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import AnalysisResultCard, {
  type AnalysisResult,
} from "@/components/AnalysisResultCard";
import AnalysisSteps from "@/components/AnalysisSteps";
import Toast from "@/components/Toast";
import { classify } from "@/lib/classifier";
import { score } from "@/lib/scorer";
import { recommend } from "@/lib/recommender";
import { createReport } from "@/lib/reports";
import { uploadPhoto } from "@/lib/storage";
import { reverseGeocode } from "@/lib/geocoding";

// ── Constants ────────────────────────────────────────────────────────────────
const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_DESCRIPTION_CHARS = 500;
/** Placeholder used when photo upload fails */
const PHOTO_URL_PLACEHOLDER = "/placeholder-photo.jpg";

// Deterministic mock confidence per category — realistic for the demo
const CATEGORY_CONFIDENCE: Record<string, number> = {
  air_pollution:             88,
  water_pollution:           91,
  soil_pollution:            82,
  noise_pollution:           78,
  light_pollution:           75,
  visual_pollution:          72,
  thermal_pollution:         80,
  electromagnetic_pollution: 70,
  waste_pollution:           85,
  other:                     65,
};

// ── Types ────────────────────────────────────────────────────────────────────
interface FormErrors {
  photo?: string;
  location?: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

// ── Component ────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const router = useRouter();

  // Photo
  const [photo, setPhoto]           = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Description
  const [description, setDescription] = useState("");

  // Location
  const [latitude, setLatitude]   = useState("");
  const [longitude, setLongitude] = useState("");
  const [address, setAddress]     = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError]     = useState<string | null>(null);

  // Form & flow state
  const [errors, setErrors]         = useState<FormErrors>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stepsComplete, setStepsComplete] = useState(false);
  const [result, setResult]           = useState<AnalysisResult | null>(null);
  const [saveState, setSaveState]     = useState<SaveState>("idle");
  const [saveError, setSaveError]     = useState<string | null>(null);
  const [toast, setToast]             = useState<string | null>(null);
  // Holds computed analysis while steps animation plays
  const pendingResultRef = useRef<AnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef    = useRef<HTMLDivElement>(null);

  // ── File handling ───────────────────────────────────────────────────────────
  function revokePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }

  function applyFile(file: File) {
    revokePreview();
    setPreviewUrl(null);
    setPhoto(null);
    setPhotoError(null);

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setPhotoError("Only JPEG, PNG, and WebP files are accepted.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setPhotoError("File must be smaller than 10 MB.");
      return;
    }

    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, photo: undefined }));
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
  }

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) applyFile(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearPhoto() {
    revokePreview();
    setPhoto(null);
    setPreviewUrl(null);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Geolocation ─────────────────────────────────────────────────────────────
  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(
          err.code === 1
            ? "Location access denied. Please enter coordinates manually."
            : "Could not retrieve location. Please try again."
        );
        setGeoLoading(false);
      },
      { timeout: 10_000 }
    );
  }

  // ── Validation ───────────────────────────────────────────────────────────────
  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!photo) newErrors.photo = "A photo is required.";
    if (!latitude.trim() && !longitude.trim() && !address.trim()) {
      newErrors.location = "Please provide a location (coordinates or address).";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Build a human-readable location string for the DB ────────────────────────
  function buildLocationString(): string {
    const parts: string[] = [];
    if (address.trim()) parts.push(address.trim());
    if (latitude.trim() && longitude.trim()) {
      parts.push(`${latitude}, ${longitude}`);
    }
    return parts.join(" — ") || `${latitude}, ${longitude}`;
  }

  // ── Main submit handler ───────────────────────────────────────────────────────
  async function handleAnalyze(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    setSaveError(null);
    setStepsComplete(false);
    pendingResultRef.current = null;

    if (!validate()) return;

    // ── Step 1: compute analysis immediately (backend logic unchanged) ────────
    setIsAnalyzing(true);

    const { category, waste_type, raw_confidence } = classify(description);
    const urgency    = score(category, description, waste_type);
    const actions    = recommend(category, urgency, waste_type);
    // Use classifier-derived confidence; clamp to the category floor for realism
    const confidence = Math.max(CATEGORY_CONFIDENCE[category] ?? 65, raw_confidence);

    const analysisResult: AnalysisResult = { category, waste_type, confidence, urgency, actions };

    // Store result — revealed only after the steps animation finishes
    pendingResultRef.current = analysisResult;

    // isAnalyzing=true drives the AnalysisSteps component;
    // the result card appears only once onStepsComplete fires.
  }

  // Called by AnalysisSteps when all 4 steps have played through
  function onStepsComplete() {
    const computed = pendingResultRef.current;
    if (!computed) return;

    setIsAnalyzing(false);
    setStepsComplete(true);
    setResult(computed);

    // Scroll to result card
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);

    // ── Persist to Supabase (upload photo + geocode in parallel) ─────────
    setSaveState("saving");

    const lat = latitude.trim()  ? parseFloat(latitude)  : null;
    const lng = longitude.trim() ? parseFloat(longitude) : null;

    const photoPromise   = photo ? uploadPhoto(photo) : Promise.resolve({ url: PHOTO_URL_PLACEHOLDER, error: null });
    const geocodePromise = (lat != null && lng != null)
      ? reverseGeocode(lat, lng)
      : Promise.resolve({ address: null, city: null, province: null, country: null });

    Promise.all([photoPromise, geocodePromise]).then(([photoResult, geo]) => {
      createReport({
        photo_url:           photoResult.url,
        location:            buildLocationString(),
        description:         description.trim(),
        pollution_category:  computed.category,
        waste_type:          computed.waste_type,
        urgency_level:       computed.urgency,
        recommended_actions: computed.actions,
        confidence:          computed.confidence,
        latitude:            lat,
        longitude:           lng,
        geo_address:         geo.address,
        geo_city:            geo.city,
        geo_province:        geo.province,
        geo_country:         geo.country,
      }).then(({ data: saved, error: dbError }) => {
        if (dbError || !saved) {
          setSaveState("error");
          setSaveError(dbError ?? "Failed to save report. Your analysis is shown above.");
        } else {
          setSaveState("saved");
          setToast("✅ Report saved successfully! Redirecting to dashboard…");
          setTimeout(() => router.push("/dashboard"), 2200);
        }
      });
    });
  }

  // ── Reset helper ─────────────────────────────────────────────────────────────
  function resetForm() {
    clearPhoto();
    setDescription("");
    setLatitude("");
    setLongitude("");
    setAddress("");
    setResult(null);
    setErrors({});
    setSaveState("idle");
    setSaveError(null);
    setStepsComplete(false);
    pendingResultRef.current = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const locationFilled = (latitude.trim() && longitude.trim()) || address.trim();
  const isBusy         = isAnalyzing || saveState === "saving";

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Toast notification ────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast}
          variant="success"
          duration={4000}
          onDismiss={() => setToast(null)}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📷 Report Pollution
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Upload a photo of the pollution and describe what you see. Our AI
            will classify it, assess the urgency, and recommend next steps —
            instantly.
          </p>
        </div>

        <form onSubmit={handleAnalyze} noValidate className="space-y-7">

          {/* ── 1. Photo Upload ─────────────────────────────────────────────── */}
          <section aria-labelledby="photo-section-label">
            <h2
              id="photo-section-label"
              className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3"
            >
              1. Upload Photo{" "}
              <span className="text-red-500 font-normal normal-case tracking-normal">*</span>
            </h2>

            {!previewUrl ? (
              <div
                role="button"
                tabIndex={0}
                aria-label="Photo upload area. Click or drag and drop a file here."
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    fileInputRef.current?.click();
                }}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 cursor-pointer transition-colors
                  ${isDragging
                    ? "border-green-500 bg-green-50"
                    : errors.photo
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50"
                  }`}
              >
                <span className="text-4xl" aria-hidden="true">🖼️</span>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    Drag &amp; drop a photo here
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    or{" "}
                    <span className="text-green-600 font-semibold underline underline-offset-2">
                      browse to upload
                    </span>
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  JPEG, PNG, WebP &bull; Max 10 MB
                </p>
                <input
                  ref={fileInputRef}
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-required="true"
                  aria-describedby={
                    errors.photo ? "photo-error" : photoError ? "photo-type-error" : undefined
                  }
                  disabled={isBusy}
                  className="sr-only"
                  onChange={handleFileInputChange}
                />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview of selected photo"
                  className="w-full max-h-72 object-cover"
                />
                <div className="absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={clearPhoto}
                    disabled={isBusy}
                    aria-label="Remove selected photo"
                    className="bg-white/90 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-white shadow transition-colors disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent px-4 py-3">
                  <p className="text-xs text-white font-medium truncate">{photo?.name}</p>
                  <p className="text-xs text-white/70">
                    {photo ? (photo.size / 1024 / 1024).toFixed(2) : "—"} MB
                  </p>
                </div>
              </div>
            )}

            {errors.photo && (
              <p id="photo-error" role="alert" className="mt-2 text-sm text-red-600">
                {errors.photo}
              </p>
            )}
            {photoError && !errors.photo && (
              <p id="photo-type-error" role="alert" className="mt-2 text-sm text-red-600">
                {photoError}
              </p>
            )}
          </section>

          {/* ── 2. Description ──────────────────────────────────────────────── */}
          <section aria-labelledby="desc-section-label">
            <h2
              id="desc-section-label"
              className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3"
            >
              2. Pollution Description{" "}
              <span className="text-red-500 font-normal normal-case tracking-normal">*</span>
            </h2>
            <div className="relative">
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                aria-required="true"
                maxLength={MAX_DESCRIPTION_CHARS}
                value={description}
                disabled={isBusy}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you see — type of waste, smell, proximity to water or homes, etc. The description helps classify the pollution accurately."
                className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm
                           placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500
                           focus:border-green-500 resize-y disabled:opacity-60 disabled:cursor-not-allowed
                           transition-colors"
              />
              <p
                className={`mt-1 text-right text-xs ${
                  description.length >= MAX_DESCRIPTION_CHARS ? "text-red-500" : "text-gray-400"
                }`}
                aria-live="polite"
              >
                {description.length} / {MAX_DESCRIPTION_CHARS}
              </p>
            </div>
          </section>

          {/* ── 3. Location ─────────────────────────────────────────────────── */}
          <section aria-labelledby="location-section-label">
            <div className="flex items-center justify-between mb-3">
              <h2
                id="location-section-label"
                className="text-sm font-semibold text-gray-700 uppercase tracking-wide"
              >
                3. Location{" "}
                <span className="text-red-500 font-normal normal-case tracking-normal">*</span>
              </h2>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isBusy || geoLoading}
                aria-label="Use my current GPS location"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700
                           bg-green-50 border border-green-200 rounded-lg px-3 py-1.5
                           hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {geoLoading ? (
                  <>
                    <svg aria-hidden="true" className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Locating…
                  </>
                ) : (
                  <>📍 Use Current Location</>
                )}
              </button>
            </div>

            {geoError && (
              <p role="alert" className="mb-3 text-sm text-red-600">{geoError}</p>
            )}

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor="latitude" className="block text-xs font-medium text-gray-500 mb-1">
                  Latitude
                </label>
                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  min={-90}
                  max={90}
                  value={latitude}
                  disabled={isBusy}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 41.8781"
                  className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500
                             focus:border-green-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                />
              </div>
              <div>
                <label htmlFor="longitude" className="block text-xs font-medium text-gray-500 mb-1">
                  Longitude
                </label>
                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  min={-180}
                  max={180}
                  value={longitude}
                  disabled={isBusy}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. -87.6298"
                  className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500
                             focus:border-green-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-xs font-medium text-gray-500 mb-1">
                Manual Address{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={address}
                disabled={isBusy}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Riverside Park, Chicago, IL"
                aria-describedby={errors.location ? "location-error" : undefined}
                className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm
                           placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500
                           focus:border-green-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {locationFilled && !errors.location && (
              <p className="mt-2 text-xs text-green-700 font-medium">✅ Location provided</p>
            )}
            {errors.location && (
              <p id="location-error" role="alert" className="mt-2 text-sm text-red-600">
                {errors.location}
              </p>
            )}
          </section>

          {/* ── 4. Analyze Button ───────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={isBusy}
            aria-disabled={isBusy}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl
                       bg-green-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm
                       hover:bg-green-700 active:bg-green-800
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                       disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? (
              <>
                <svg aria-hidden="true" className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Analyzing…
              </>
            ) : saveState === "saving" ? (
              <>
                <svg aria-hidden="true" className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Saving report…
              </>
            ) : (
              <>🔍 Analyze Pollution</>
            )}
          </button>
        </form>

        {/* ── Analysis Steps + Result Card ─────────────────────────────── */}
        <AnimatePresence mode="wait">
          {isAnalyzing && (
            <AnalysisSteps key="steps" onComplete={onStepsComplete} />
          )}
        </AnimatePresence>

        {result && stepsComplete && (
          <div ref={resultRef}>
            <AnalysisResultCard result={result} />

            {/* Save error banner — shown only when DB write failed */}
            {saveState === "error" && saveError && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <p className="font-semibold mb-1">Could not save report</p>
                <p>{saveError}</p>
                <button
                  type="button"
                  onClick={() => {
                    // Retry the DB save with the last analysis result
                    if (!result) return;
                    setSaveState("saving");
                    setSaveError(null);

                    const lat  = latitude.trim()  ? parseFloat(latitude)  : null;
                    const lng  = longitude.trim() ? parseFloat(longitude) : null;

                    createReport({
                      photo_url:           PHOTO_URL_PLACEHOLDER,
                      location:            buildLocationString(),
                      description:         description.trim(),
                      pollution_category:  result.category,
                      waste_type:          result.waste_type,
                      urgency_level:       result.urgency,
                      recommended_actions: result.actions,
                      confidence:          result.confidence,
                      latitude:            lat,
                      longitude:           lng,
                      geo_address:         null,
                      geo_city:            null,
                      geo_province:        null,
                      geo_country:         null,
                    }).then(({ data: saved, error: dbError }) => {
                      if (dbError || !saved) {
                        setSaveState("error");
                        setSaveError(dbError ?? "Save failed. Please try again.");
                      } else {
                        setSaveState("saved");
                        setToast("✅ Report saved successfully! Redirecting to dashboard…");
                        setTimeout(() => router.push("/dashboard"), 2200);
                      }
                    });
                  }}
                  className="mt-2 text-xs font-semibold text-red-700 underline hover:text-red-900"
                >
                  Retry saving
                </button>
              </div>
            )}

            {/* Saving indicator below card */}
            {saveState === "saving" && (
              <p className="mt-3 text-center text-sm text-gray-500 animate-pulse">
                Saving your report…
              </p>
            )}

            {/* Post-result action */}
            {(saveState === "idle" || saveState === "error") && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-300
                             bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm
                             hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500
                             transition-colors"
                >
                  📷 Submit Another Report
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
