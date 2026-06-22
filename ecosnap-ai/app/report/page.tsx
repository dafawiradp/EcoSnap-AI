"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useRouter } from "next/navigation";

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface FormErrors {
  photo?: string;
  location?: string;
}

export default function ReportPage() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const router = useRouter();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up the object URL when a new file is selected or component unmounts
  function revokePreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    // Clear previous photo state
    revokePreview();
    setPreviewUrl(null);
    setPhoto(null);
    setPhotoError(null);

    if (!file) return;

    // File type validation
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setPhotoError("Only JPEG, PNG, and WebP files are accepted");
      // Reset the file input so the user can reselect
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      setPhotoError("File must be smaller than 10 MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Valid file — set preview
    const url = URL.createObjectURL(file);
    setPhoto(file);
    setPreviewUrl(url);
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!photo) {
      newErrors.photo = "Photo is required";
    }
    if (!location.trim()) {
      newErrors.location = "Location is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("photo", photo!);
      formData.append("location", location);
      formData.append("description", description);

      const res = await fetch("/api/reports", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }

      const report = await res.json();
      router.push(`/report/${report.id}`);
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Report Pollution</h1>
      <p className="text-gray-500 text-sm mb-8">
        Upload a photo of the pollution and tell us where it is. We'll classify
        it and recommend next steps.
      </p>

      {/* Server-level error banner */}
      {serverError && (
        <div
          role="alert"
          className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* ── Photo upload ── */}
        <div>
          <label
            htmlFor="photo"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Photo <span className="text-red-500">*</span>
          </label>

          <input
            ref={fileInputRef}
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-required="true"
            aria-describedby={
              errors.photo
                ? "photo-required-error"
                : photoError
                ? "photo-type-error"
                : undefined
            }
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0 file:text-sm file:font-medium
                       file:bg-green-50 file:text-green-700 hover:file:bg-green-100
                       cursor-pointer border border-gray-300 rounded-md px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          {/* Required-field error */}
          {errors.photo && (
            <p
              id="photo-required-error"
              role="alert"
              className="mt-1 text-sm text-red-600"
            >
              {errors.photo}
            </p>
          )}

          {/* File type / size error */}
          {photoError && (
            <p
              id="photo-type-error"
              role="alert"
              className="mt-1 text-sm text-red-600"
            >
              {photoError}
            </p>
          )}

          {/* Image preview */}
          {previewUrl && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Preview of selected photo"
                className="max-h-64 rounded-md border border-gray-200 object-contain"
              />
            </div>
          )}
        </div>

        {/* ── Location ── */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Location <span className="text-red-500">*</span>
          </label>
          <input
            id="location"
            name="location"
            type="text"
            required
            aria-required="true"
            aria-describedby={errors.location ? "location-error" : undefined}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Riverside Park, Chicago"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500
                       focus:border-green-500"
          />
          {errors.location && (
            <p
              id="location-error"
              role="alert"
              className="mt-1 text-sm text-red-600"
            >
              {errors.location}
            </p>
          )}
        </div>

        {/* ── Description (optional) ── */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you see — type of waste, proximity to water or homes, etc."
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500
                       focus:border-green-500 resize-y"
          />
        </div>

        {/* ── Submit button ── */}
        <button
          type="submit"
          disabled={isLoading}
          aria-disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-green-600
                     px-4 py-2.5 text-sm font-semibold text-white shadow-sm
                     hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                     disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              {/* Spinner */}
              <svg
                aria-hidden="true"
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Submitting…
            </>
          ) : (
            "Submit Report"
          )}
        </button>
      </form>
    </div>
  );
}
