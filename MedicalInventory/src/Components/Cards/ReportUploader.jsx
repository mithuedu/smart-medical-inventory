// ReportUploader.jsx
import React, { useState, useRef, useEffect } from "react";
import { Button, Progress, message, Modal, Spin } from "antd";
import { FaUpload, FaFilePdf, FaCheck } from "react-icons/fa";

const MAX_FILE_BYTES = 6 * 1024 * 1024; // 6 MB
const DEFAULT_FIELD_NAME = "report"; // change to "file" if backend expects that

export default function ReportUploader({
  appointment,
  apiBaseUrl = "https://my-backend-ex0j.onrender.com",
  onDone,
  autoMarkComplete = false,
  authToken = null,
  withCredentials = false,
  debug = false,
}) {
  const [file, setFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  if (!appointment) return null;

  useEffect(() => {
    fetchExistingReport();
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment?.id]);

  const log = (...args) => {
    if (debug) console.log(...args);
  };

  const reset = () => {
    setFile(null);
    setFileInfo(null);
    setProgress(0);
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = null;
  };

  const handleFileChange = (e) => {
    const f = e?.target?.files?.[0];
    if (!f) return;
    log("[ReportUploader] selected file:", f);
    if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
      message.error("Only images or PDFs are allowed.");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      message.error(`File too large. Max ${Math.round(MAX_FILE_BYTES / (1024 * 1024))} MB allowed.`);
      return;
    }

    setFile(f);
    setFileInfo({ name: f.name, size: f.size, type: f.type });
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreviewUrl(null);
    }
  };

  // try GET on both endpoints so preview works
  const fetchExistingReport = async () => {
    setLoadingExisting(true);
    try {
      const endpoints = [
        `${apiBaseUrl}/api/appointments/${encodeURIComponent(appointment.id)}/report`,
      ];

      for (const url of endpoints) {
        try {
          log("[ReportUploader] GET ->", url);
          const res = await fetch(url, { method: "GET", credentials: withCredentials ? "include" : "same-origin" });
          log("[ReportUploader] GET status for", url, res.status);
          
          if (!res.ok) {
            continue; // try next endpoint
          }

          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const json = await res.json().catch(() => null);
            log("[ReportUploader] GET JSON:", json);
            if (json && json.data) {
              const d = json.data;
              const possibleUrl = d.url ? d.url : url;
              setPreviewUrl(possibleUrl);
              setFileInfo({ name: d.filename || "report", type: d.mimetype || "" });
              setLoadingExisting(false);
              return;
            } else {
              continue;
            }
          } else {
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            setPreviewUrl(blobUrl);

            const cdisp = res.headers.get("content-disposition") || "";
            let filename = "report";
            const match = /filename\*?=(?:UTF-8'')?["']?([^;"']+)/i.exec(cdisp);
            if (match && match[1]) filename = decodeURIComponent(match[1]);
            else if (appointment && appointment.id) filename = `report-${appointment.id}`;

            setFileInfo({ name: filename, size: blob.size, type: contentType });
            setLoadingExisting(false);
            return;
          }
        } catch (e) {
          log("GET attempt failed for", url, e);
          continue;
        }
      }

      // none worked
      setPreviewUrl(null);
      setFileInfo(null);
    } catch (e) {
      console.error("fetchExistingReport error:", e);
      setPreviewUrl(null);
      setFileInfo(null);
    } finally {
      setLoadingExisting(false);
    }
  };

  // Upload handler — uses XMLHttpRequest to get progress events
  const uploadReport = () => {
    if (!file) {
      message.error("No file selected");
      return;
    }
    if (uploading) {
      message.warning("Upload already in progress");
      return;
    }

    const url = `${apiBaseUrl}/api/appointments/${encodeURIComponent(appointment.id)}/report`;
    const fd = new FormData();
    fd.append(DEFAULT_FIELD_NAME, file, file.name);
    fd.append("filename", file.name);

    setUploading(true);
    setProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);

    // credentials (cookies)
    if (withCredentials) xhr.withCredentials = true;

    // Authorization header if token provided
    if (authToken) {
      // Bearer token
      xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setProgress(pct);
      }
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        setUploading(false);
        setProgress(100);
        const status = xhr.status;
        let body = xhr.responseText;
        log("Upload finished", status, body);
        if (status >= 200 && status < 300) {
          message.success("Upload successful");
          // try parse json
          let parsed = null;
          try { parsed = JSON.parse(body); } catch (e) { /* not json */ }

          // call onDone if provided: (success, parsedResponse)
          if (typeof onDone === "function") {
            try { onDone(true, parsed || { status, text: body }); } catch (e) { console.error("onDone callback failed", e); }
          }

          // Optionally refresh preview by refetching existing report
          setTimeout(fetchExistingReport, 300);
        } else {
          message.error(`Upload failed ${status}: ${body || "Server error"}`);
          if (typeof onDone === "function") {
            try { onDone(false, { status, text: body }); } catch (e) { console.error("onDone callback failed", e); }
          }
        }
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      message.error("Network error during upload");
      if (typeof onDone === "function") {
        try { onDone(false, { error: "network" }); } catch (e) { console.error("onDone callback failed", e); }
      }
    };

    xhr.send(fd);
  };

  return (
    <div>
      <div className="p-3 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id={`report-file-${appointment.id}`}
            disabled={uploading}
          />

          <label htmlFor={`report-file-${appointment.id}`} style={{ marginRight: 6 }}>
            <Button icon={<FaUpload />} onClick={() => inputRef.current && inputRef.current.click()} disabled={uploading}>
              Choose file
            </Button>
          </label>
          <div className="flex-1 text-right text-sm text-gray-500">Upload a diagnostic report (image or PDF). Max 6 MB.</div>
        </div>

        {fileInfo || previewUrl ? (
          <div className="mt-3 flex items-start gap-3">
            {previewUrl ? (
              fileInfo && fileInfo.type && fileInfo.type.startsWith("image/") ? (
                <img src={previewUrl} alt="preview" style={{ maxWidth: 160, maxHeight: 120, borderRadius: 8 }} />
              ) : fileInfo && fileInfo.type === "application/pdf" ? (
                <iframe title="pdf-preview" src={previewUrl} style={{ width: 160, height: 180, borderRadius: 8, border: "1px solid #e5e7eb" }} />
              ) : (
                <div className="w-40 h-28 flex items-center justify-center bg-white border rounded">
                  <div className="text-xs text-gray-500 text-center">
                    <div>Preview available</div>
                    <div>
                      <a href={previewUrl} target="_blank" rel="noreferrer">Open</a>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="w-40 h-28 flex items-center justify-center bg-white border rounded">
                <div className="text-xs text-gray-500 text-center">{fileInfo && fileInfo.type === "application/pdf" ? "PDF selected" : "No preview"}</div>
              </div>
            )}

            <div className="flex-1 text-xs text-gray-700">
              <div><strong>File:</strong> {fileInfo ? fileInfo.name : "—"}</div>
              <div className="mt-1 text-gray-500">
                {fileInfo && fileInfo.size ? `${Math.round(fileInfo.size / 1024)} KB • ${fileInfo.type || ""}` : (fileInfo && fileInfo.type ? fileInfo.type : "")}
              </div>

              <div className="mt-2">{uploading ? <Progress percent={progress} size="small" /> : null}</div>

              <div className="mt-2 flex gap-2">
                <Button size="small" onClick={() => inputRef.current && inputRef.current.click()} disabled={uploading}>Replace</Button>
                <Button size="small" onClick={reset} disabled={uploading}>Remove</Button>

                {/* Submit button triggers upload */}
                <Button
                  type="primary"
                  size="small"
                  onClick={uploadReport}
                  loading={uploading}
                  disabled={!file || uploading}
                >
                  {uploading ? "Uploading..." : "Submit"}
                </Button>

                {previewUrl ? <Button size="small" onClick={() => window.open(previewUrl, "_blank")} >Open</Button> : null}
              </div>
            </div>
          </div>
        ) : loadingExisting ? (
          <div className="mt-3 text-sm text-gray-500">Checking for existing report...</div>
        ) : null}
      </div>
    </div>
  );
}
