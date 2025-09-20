// DoctorHomeWithImageOCR.jsx
import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FaUserCircle,
  FaCheckCircle,
  FaCalendarAlt,
  FaHeartbeat,
  FaPills,
  FaStethoscope,
  FaEnvelope,
  FaPhone,
  FaUserTag,
  FaSignOutAlt,
  FaUpload,
  FaImage,
} from "react-icons/fa";
import { Modal, Spin, Input, message, Button, Progress } from "antd";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Tesseract from "tesseract.js";
import ReportUploader from "../Cards/ReportUploader";
const { TextArea } = Input;
const MAX_FILE_BYTES = 6 * 1024 * 1024;
const LOCAL_KEY_NAME = "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";

const DoctorHome = () => {
  const userInfo = useSelector((state) => state.userinfo || {});
  const dispatch = useDispatch();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const navigate = useNavigate();
  const [isCompleteModal, setIsCompleteModal] = useState(false);
  const [completeData, setCompleteData] = useState({ prescription: "" });
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [ocrError, setOcrError] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [readingFile, setReadingFile] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportAppointment, setReportAppointment] = useState(null);
  const [imgSrcCache, setImgSrcCache] = useState({});
// near other useState calls at top of component
const [analysisLoading, setAnalysisLoading] = useState(false);
const [analysisResult, setAnalysisResult] = useState(null);
const [analysisError, setAnalysisError] = useState("");
const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
const [analysisAppointment, setAnalysisAppointment] = useState(null);

// convert blob URL or data URL or fetchable URL to data:<mime>;base64,... string
async function urlOrSrcToDataUrl(src) {
  if (!src) return null;
  // already a data URL
  if (typeof src === "string" && src.startsWith("data:")) return src;
  try {
    // fetch the resource (works for blob: URLs and remote URLs served to browser)
    const resp = await fetch(src);
    const blob = await resp.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result); // gives data:<mime>;base64,...
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("urlOrSrcToDataUrl failed:", e);
    return null;
  }
}


// call this when user clicks "Analyze Report" for an appointment
const analyzeXrayReport = async (appt) => {
  if (!appt) return;
  setAnalysisError("");
  setAnalysisResult(null);
  setAnalysisAppointment(appt);
  setIsAnalysisModalOpen(true);
  setAnalysisLoading(true);

  try {
    // try to get src from cache or compute from appointment
    const key = appt.id || appt._id || `${appt.patient_name}_${appt.appointment_date}`;
    let src = imgSrcCache[key] || (appt.xray_report ? getImageSrcFromReport(appt.xray_report) : null);

    // if src is a blob URL or server URL, convert to data URL
    let dataUrl = null;
    if (src) {
      dataUrl = await urlOrSrcToDataUrl(src);
    } else if (appt.xray_report) {
      // fallback: attempt to build data URL from raw report
      const built = getImageSrcFromReport(appt.xray_report);
      dataUrl = built && built.startsWith("data:") ? built : (built ? await urlOrSrcToDataUrl(built) : null);
    }

    if (!dataUrl) {
      setAnalysisError("Unable to load image data for this report.");
      return;
    }

    // Build a concise prompt that asks for: findings, impression, recommendations
    const prompt = `
You are an experienced radiology assistant. Analyze the X-ray image below and produce a concise structured JSON object with keys:
- findings: a short bullet list (strings)
- impression: 1-2 sentence overall impression
- recommendations: short list of recommended next steps (labs, follow-ups, referrals, urgent flags)

Provide JSON only.

Image (inline as Markdown): 
![xray](${dataUrl})

Patient / appointment context:
Patient name: ${appt.patient_name || "N/A"}
Age: ${appt.age || "Unknown"}
Department: ${appt.department || "General"}
Notes: ${appt.notes || "N/A"}
Date: ${appt.appointment_date || "N/A"}
`;

    const apiKey = getStoredKey();
    if (!apiKey) {
      setAnalysisError("No OpenAI API key found in local storage.");
      return;
    }

    const payload = { model: "gpt-4o-mini", input: prompt, temperature: 0.0 };

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("OpenAI analyze error:", res.status, txt);
      setAnalysisError(`OpenAI request failed: ${res.status}`);
      return;
    }

    const data = await res.json();
    // extract text similarly to your other handlers
    let rawText = "";
    if (data.output_text) rawText = data.output_text;
    else if (Array.isArray(data.output)) {
      for (const out of data.output) {
        if (Array.isArray(out?.content)) {
          for (const c of out.content) {
            if (c?.type === "output_text" && typeof c?.text === "string") rawText += c.text + "\n";
            else if (typeof c?.text === "string") rawText += c.text + "\n";
          }
        } else if (typeof out === "string") rawText += out + "\n";
      }
    } else if (data.output?.[0]?.content?.[0]?.text) rawText = data.output[0].content[0].text;
    if (!rawText) rawText = JSON.stringify(data, null, 2);

    // Attempt to parse JSON from response
    let parsed = null;
    try {
      const m = rawText.match(/\{[\s\S]*\}/);
      const toParse = m ? m[0] : rawText;
      parsed = JSON.parse(toParse);
    } catch (e) {
      console.warn("Failed to parse analysis JSON, falling back to plain text", e);
    }

    if (parsed && (parsed.findings || parsed.impression || parsed.recommendations)) {
      setAnalysisResult(parsed);
    } else {
      // fallback show full text
      setAnalysisResult({ raw: rawText });
    }
  } catch (err) {
    console.error("analyzeXrayReport error:", err);
    setAnalysisError("Analysis failed. See console for details.");
  } finally {
    setAnalysisLoading(false);
  }
};






  useEffect(() => {
    return () => {
      Object.values(imgSrcCache).forEach((v) => {
        if (typeof v === "string" && v.startsWith("blob:")) {
          try { URL.revokeObjectURL(v); } catch (e) { /* ignore */ }
        }
      });
    };
  }, [imgSrcCache]);

  const getStoredKey = () => {
    try {
      return localStorage.getItem(LOCAL_KEY_NAME) || "";
    } catch (e) {
      return "";
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    dispatch({ type: "LOGOUT" });
    navigate("/");
  };

  const fetchAppointments = async () => {
      try {
        const res = await fetch(
          `https://my-backend-ex0j.onrender.com/api/appointments/userbyname/${encodeURIComponent(
            userInfo.name || ""
          )}`
        );
        const data = await res.json()
        console.log(data)
        if (data.success) setAppointments(data.data);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    // revoke + remove cached image for a given appointment key
const invalidateImageCacheForAppointment = (appt) => {
  if (!appt) return;
  const key = appt.id || appt._id || `${appt.patient_name}_${appt.appointment_date}`;
  setImgSrcCache((prev) => {
    if (!prev || !prev[key]) return prev;
    const newState = { ...prev };
    const old = newState[key];
    // revoke blob URLs if present
    try {
      if (typeof old === "string" && old.startsWith("blob:")) {
        URL.revokeObjectURL(old);
      }
    } catch (e) {
      // ignore
      // console.warn("Failed to revoke object URL", e);
    }
    delete newState[key];
    return newState;
  });
};

  // near other useState calls at top of component
const [refreshKey, setRefreshKey] = useState(0);

useEffect(() => {
  if (userInfo?.name) {
    // optional: abort previous fetch if needed (see comment below)
    fetchAppointments();
  } else {
    setLoading(false);
  }
}, [userInfo?.name, refreshKey]);



  // ---------- Helper: convert xray_report to img src ----------
  // Accepts shapes like:
  //  - { data: [100,97,...], contentType: "image/jpeg" }
  //  - { data: <Uint8Array> }
  //  - ArrayBuffer / Uint8Array / [numbers]
  // Returns data:<mime>;base64,... or blob: URL
  function arrayBufferToBase64(bufferLike) {
    let uint8;
    if (bufferLike instanceof ArrayBuffer) uint8 = new Uint8Array(bufferLike);
    else if (Array.isArray(bufferLike)) uint8 = new Uint8Array(bufferLike);
    else if (bufferLike && bufferLike.data && Array.isArray(bufferLike.data)) uint8 = new Uint8Array(bufferLike.data);
    else if (bufferLike && bufferLike.data && bufferLike.data instanceof ArrayBuffer) uint8 = new Uint8Array(bufferLike.data);
    else if (bufferLike && bufferLike instanceof Uint8Array) uint8 = bufferLike;
    else return null;

    const chunkSize = 0x8000;
    let binary = "";
    for (let i = 0; i < uint8.length; i += chunkSize) {
      const sub = uint8.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, sub);
    }
    try {
      return btoa(binary);
    } catch (e) {
      return null;
    }
  }

  function getImageSrcFromReport(xray_report) {
    if (!xray_report) return null;
    const mime = xray_report.contentType || xray_report.mimetype || xray_report.type || "image/jpeg";

    // possible byte holders
    let bytes = null;
    if (xray_report.data) bytes = xray_report.data;
    else if (xray_report.buffer) bytes = xray_report.buffer;
    else bytes = xray_report;

    // if bytes is already a data URL or base64 string
    if (typeof bytes === "string") {
      // data URL
      if (bytes.startsWith("data:")) return bytes;
      // base64 (try detect)
      if (/^[A-Za-z0-9+/]+=*$/.test(bytes.slice(0, 50))) return `data:${mime};base64,${bytes}`;
    }

    try {
      const b64 = arrayBufferToBase64(bytes);
      if (b64) return `data:${mime};base64,${b64}`;
    } catch (e) {
      // continue to blob fallback
    }

    try {
      let arr;
      if (bytes instanceof ArrayBuffer) arr = new Uint8Array(bytes);
      else if (bytes instanceof Uint8Array) arr = bytes;
      else if (Array.isArray(bytes)) arr = new Uint8Array(bytes);
      else if (bytes && bytes.data && Array.isArray(bytes.data)) arr = new Uint8Array(bytes.data);
      else if (bytes && bytes.data && bytes.data instanceof ArrayBuffer) arr = new Uint8Array(bytes.data);
      else return null;

      const blob = new Blob([arr], { type: mime });
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error("Failed to convert report to image src:", err);
      return null;
    }
  }
  const handleFileChange = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      message.error("Only images or PDFs are allowed.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      message.error(`File too large. Max ${Math.round(MAX_FILE_BYTES / (1024 * 1024))} MB allowed.`);
      return;
    }

    setReadingFile(true);
    setFileInfo({ name: file.name, size: file.size, type: file.type });
    setImageFile(file);
    setOcrText("");
    setOcrError("");
    setSuggestions([]);
    setImagePreview(null);
    setImageBase64(null);
    setOcrProgress(0);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        setImagePreview(dataUrl);
        setImageBase64(dataUrl.split(",")[1] || dataUrl);
        setReadingFile(false);
      };
      reader.onerror = (err) => {
        message.error("Failed to read the image file.");
        setReadingFile(false);
      };
      reader.readAsDataURL(file);
      return;
    }
    if (file.type === "application/pdf") {
      setReadingFile(false);
      setImagePreview(null);
      setImageBase64(null);
      message.info("PDF selected. Client-side OCR may not support multi-page PDFs. Try a single-page image for best client-side results.");
      return;
    }
  };
  const fetchSuggestionsFrontend = async (apiKey, appointment) => {
    setLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const prompt = `You are an experienced doctor-helper that returns concise prescription templates.
Given these appointment details, produce 4 short prescription templates in JSON array format. Each template should have a one-line title and a short prescription body (1-6 lines). Return JSON array ONLY.

Appointment details:
Patient name: ${appointment.patient_name || "N/A"}
Age: ${appointment.age || "Unknown"}
Department: ${appointment.department || "General"}
Notes: ${appointment.notes || "N/A"}
Date: ${appointment.appointment_date || "N/A"}
Time: ${appointment.appointment_time || "N/A"}
`;

      const payload = { model: "gpt-4o-mini", input: prompt, temperature: 0.2 };

      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("OpenAI error response:", res.status, txt);
        if (res.status === 401)
          message.error("OpenAI authorization failed. Please check or rotate your API key.");
        else message.error(`OpenAI request failed: ${res.status}`);
        setLoadingSuggestions(false);
        return;
      }

      const data = await res.json();
      // extract textual output (same logic you had before)
      let rawText = "";
      if (data.output_text) rawText = data.output_text;
      if (!rawText && Array.isArray(data.output)) {
        for (const out of data.output) {
          if (Array.isArray(out?.content)) {
            for (const c of out.content) {
              if (c?.type === "output_text" && typeof c?.text === "string") rawText += c.text + "\n";
              else if (typeof c?.text === "string") rawText += c.text + "\n";
              else if (typeof c === "string") rawText += c + "\n";
            }
          } else if (typeof out === "string") rawText += out + "\n";
        }
      }
      if (!rawText && data.output?.[0]?.content?.[0]?.text) rawText = data.output[0].content[0].text;
      if (!rawText) rawText = JSON.stringify(data, null, 2);

      let parsed = null;
      try {
        const jsonMatch = rawText.match(/\[.*\]/s);
        const toParse = jsonMatch ? jsonMatch[0] : rawText;
        parsed = JSON.parse(toParse);
      } catch (e) {
        console.warn("JSON parse failed from model. Falling back to heuristics.", e);
      }

      if (Array.isArray(parsed)) {
        const normalized = parsed.slice(0, 6).map((it, idx) => ({
          id: `s_${idx}`,
          title: it.title || `Suggestion ${idx + 1}`,
          text: it.text || (typeof it === "string" ? it : JSON.stringify(it)),
        }));
        setSuggestions(normalized);
      } else {
        const chunks = rawText
          .split(/\n{2,}/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 6);
        const normalized = chunks.map((c, i) => ({ id: `s_fallback_${i}`, title: `Suggestion ${i + 1}`, text: c }));
        setSuggestions(normalized);
      }
    } catch (err) {
      console.error("fetchSuggestionsFrontend error:", err);
      message.error("Failed to fetch suggestions from OpenAI. Check console for details.");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // OCR analyze function (Complete Modal)
  const analyzeImageFrontend = async () => {
    if (!imageFile) return message.warning("Please choose an image first.");
    if (imageFile.type === "application/pdf") {
      message.info("PDF selected — client-side OCR of PDFs isn't supported in this demo. Use an image (jpg/png) instead.");
      return;
    }

    setAnalyzingImage(true);
    setOcrText("");
    setOcrError("");
    setOcrProgress(0);
    setSuggestions([]);

    try {
      const result = await Tesseract.recognize(imageFile, "eng", {
        logger: (m) => {
          if (m && typeof m.progress === "number") {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      const extracted = (result?.data?.text || "").trim();
      setOcrText(extracted);
      setOcrProgress(100);

      if (!extracted) {
        setOcrError("No readable text detected. Try a clearer photo or type manually.");
        setAnalyzingImage(false);
        return;
      }

      // Now call OpenAI (Responses API) using the OCR text + appointment details to get prescriptions
      await fetchSuggestionsFromOcr(getStoredKey(), extracted, activeAppointment);
    } catch (err) {
      console.error("Tesseract OCR error:", err);
      setOcrError("OCR failed in browser. See console for details.");
    } finally {
      setAnalyzingImage(false);
    }
  };

  // call OpenAI with extracted OCR text + appointment to produce prescriptions
  const fetchSuggestionsFromOcr = async (apiKey, extractedText, appointment) => {
    setLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const prompt = `You are an experienced medical assistant. Given the extracted text from an uploaded prescription image and appointment details, produce 4 short prescription templates.
Return a JSON array ONLY. Each item should be {"title":"...","text":"..."}.

Extracted OCR text:
"""${extractedText}"""

Appointment details:
Patient name: ${appointment?.patient_name || "N/A"}
Age: ${appointment?.age || "Unknown"}
Department: ${appointment?.department || "General"}
Notes: ${appointment?.notes || "N/A"}

Return JSON array ONLY.
`;

      const payload = { model: "gpt-4o-mini", input: prompt, temperature: 0.1 };

      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("OpenAI error response:", res.status, txt);
        if (res.status === 401)
          message.error("OpenAI authorization failed. Please check or rotate your API key.");
        else message.error(`OpenAI request failed: ${res.status}`);
        setLoadingSuggestions(false);
        return;
      }

      const data = await res.json();
      let rawText = "";
      if (data.output_text) rawText = data.output_text;
      if (!rawText && Array.isArray(data.output)) {
        for (const out of data.output) {
          if (Array.isArray(out?.content)) {
            for (const c of out.content) {
              if (c?.type === "output_text" && typeof c?.text === "string") rawText += c.text + "\n";
              else if (typeof c?.text === "string") rawText += c.text + "\n";
              else if (typeof c === "string") rawText += c + "\n";
            }
          } else if (typeof out === "string") rawText += out + "\n";
        }
      }
      if (!rawText && data.output?.[0]?.content?.[0]?.text) rawText = data.output[0].content[0].text;
      if (!rawText) rawText = JSON.stringify(data, null, 2);

      // parse JSON array from rawText
      let parsed = null;
      try {
        const jsonMatch = rawText.match(/\[([\s\S]*)\]/);
        const toParse = jsonMatch ? "[" + jsonMatch[1] + "]" : rawText;
        parsed = JSON.parse(toParse);
      } catch (e) {
        console.warn("Failed to parse suggestions JSON from model, falling back to heuristics.", e);
      }

      if (Array.isArray(parsed)) {
        const normalized = parsed.slice(0, 6).map((it, idx) => ({
          id: `ocr_s_${idx}`,
          title: it.title || `Suggestion ${idx + 1}`,
          text: it.text || (typeof it === "string" ? it : JSON.stringify(it)),
        }));
        setSuggestions(normalized);
      } else {
        // fallback: split rawText into chunks
        const chunks = rawText
          .split(/\n{2,}/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 6);
        const normalized = chunks.map((c, i) => ({ id: `ocr_f_${i}`, title: `Suggestion ${i + 1}`, text: c }));
        setSuggestions(normalized);
      }
    } catch (err) {
      console.error("fetchSuggestionsFromOcr error:", err);
      message.error("Failed to fetch suggestions from OpenAI. See console.");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const submitCompletion = async () => {
    if (!completeData.prescription) return message.warning("Please add a prescription.");
    setSubmitting(true);
    try {
      const res = await fetch(`https://my-backend-ex0j.onrender.com/api/appointments/${activeAppointment.id}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", prescription: completeData.prescription }),
      });
      const data = await res.json();
      if (data.success) {
        message.success("Appointment marked as completed");
        setAppointments((prev) =>
          prev.map((a) => (a.id === activeAppointment.id ? { ...a, status: "completed", prescription: completeData.prescription } : a))
        );
        setIsCompleteModal(false);
        setCompleteData({ prescription: "" });
        setSuggestions([]);
        setImageFile(null);
        setImagePreview(null);
        setImageBase64(null);
        setOcrText("");
        setFileInfo(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
      } else {
        message.error("Failed to mark as completed");
      }
    } catch (error) {
      console.error("Error completing appointment:", error);
      message.error("Failed to mark as completed");
    } finally {
      setSubmitting(false);
    }
  };

// add near other useEffect hooks
useEffect(() => {
  if (!appointments || appointments.length === 0) return;

  // build minimal updates only for keys not present already
  const updates = {};
  appointments.forEach((appt) => {
    const key = appt.id || appt._id || `${appt.patient_name}_${appt.appointment_date}`;
    if (!imgSrcCache[key] && appt.xray_report) {
      const src = getImageSrcFromReport(appt.xray_report);
      if (src) updates[key] = src;
    }
  });

  if (Object.keys(updates).length > 0) {
    setImgSrcCache((prev) => ({ ...prev, ...updates }));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [appointments]); // intentionally depend on appointments only


  const today = new Date().toISOString().split("T")[0];

  const todayAppointments = appointments.filter((a) => {
    try {
      const apptDate = new Date(a.appointment_date);
      const now = new Date();
      return (
        apptDate.getFullYear() === now.getFullYear() &&
        apptDate.getMonth() === now.getMonth() &&
        apptDate.getDate() === now.getDate() &&
        String(a.status || "").toLowerCase() === "pending"
      );
    } catch (e) {
      return false;
    }
  });

  const upcomingAppointments = appointments.filter((a) => (a.appointment_date || "").split("T")[0] > today);
  const completedAppointments = appointments.filter((a) => String(a.status || "").toLowerCase() === "completed");

  const graphData = React.useMemo(() => {
    const grouped = {};
    appointments.forEach((appt) => {
      const date = (appt.appointment_date || "").split("T")[0] || "unknown";
      if (!grouped[date]) grouped[date] = { date, completed: 0, pending: 0 };
      if ((appt.status || "").toLowerCase() === "completed") grouped[date].completed += 1;
      else grouped[date].pending += 1;
    });
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [appointments]);

  const completedDataForChart = React.useMemo(() => graphData.map((d) => ({ date: d.date, value: d.completed })), [graphData]);
  const pendingDataForChart = React.useMemo(() => graphData.map((d) => ({ date: d.date, value: d.pending })), [graphData]);

  // set the appointment that we're working with and open modal
  const handleMarkComplete = (appt) => {
    setActiveAppointment(appt);
    setCompleteData({ prescription: "" });
    setSuggestions([]);
    setImageFile(null);
    setImagePreview(null);
    setImageBase64(null);
    setOcrText("");
    setOcrError("");
    setFileInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
    setIsCompleteModal(true);

    try {
      const key = getStoredKey();
      if (key) {
        fetchSuggestionsFrontend(key, appt);
      }
    } catch (e) {
      console.warn("prefetch suggestions failed", e);
    }
  };

  // open separate report modal for an appointment
  const openReportModal = (appt) => {
    setReportAppointment(appt);
    setReportModalOpen(true);
  };
  const closeReportModal = () => {
    setReportAppointment(null);
    setReportModalOpen(false);
  };

  // replace/update single appointment object in appointments array
  const replaceAppointmentInState = (updated) => {
    if (!updated || !updated.id) return;
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
  };

// add near other useState calls at top of component
const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
const [viewerSrc, setViewerSrc] = useState(null);
const openImageViewer = (src) => {
  if (!src) return;
  setViewerSrc(src);
  setIsImageViewerOpen(true);
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <header className="w-full bg-white/90 backdrop-blur shadow-md flex justify-between items-center px-8 py-5 border-b">
        <h1 className="text-2xl font-bold text-indigo-700">🏥 Hospital KM</h1>
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setIsProfileOpen(true)}>
          <span className="text-gray-700 font-medium text-lg">Hello, <span className="text-indigo-600 font-semibold">Dr. {userInfo.name || "Demo"}</span></span>
          <FaUserCircle className="text-4xl text-indigo-700" />
        </div>
      </header>

      {/* Profile Modal */}
      <Modal title="Doctor Profile" open={isProfileOpen} onCancel={() => setIsProfileOpen(false)} footer={null} centered>
        <div className="space-y-4 text-gray-700">
          <p className="flex items-center gap-2"><FaUserCircle className="text-indigo-600" /> <strong>Name:</strong> Dr. {userInfo.name || "Demo"}</p>
          <p className="flex items-center gap-2"><FaEnvelope className="text-indigo-600" /> <strong>Email:</strong> {userInfo.emailid || "demo@example.com"}</p>
          <p className="flex items-center gap-2"><FaPhone className="text-indigo-600" /> <strong>Phone:</strong> {userInfo.phonenumber || "—"}</p>
          <p className="flex items-center gap-2"><FaUserTag className="text-indigo-600" /> <strong>Role:</strong> {userInfo.role || "Doctor"}</p>
          <p className="flex items-center gap-2"><FaUserTag className="text-indigo-600" /> <strong>Username:</strong> {userInfo.username || "demo"}</p>

          <div className="flex gap-2 mt-4">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"><FaSignOutAlt /> Logout</button>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal title="Appointment Details" open={isDetailsOpen} onCancel={() => setIsDetailsOpen(false)} footer={null} centered>
        {selectedAppointment ? (
          <div className="space-y-3 text-gray-700">
            <p><strong>Patient:</strong> {selectedAppointment.patient_name}</p>
            <p><strong>Email:</strong> {selectedAppointment.email}</p>
            <p><strong>Department:</strong> {selectedAppointment.department}</p>
            <p><strong>Date:</strong> {selectedAppointment.appointment_date?.split("T")[0]}</p>
            <p><strong>Time:</strong> {selectedAppointment.appointment_time}</p>
            <p><strong>Notes:</strong> {selectedAppointment.notes || "N/A"}</p>
            <p><strong>Status:</strong> <span className={`${selectedAppointment.status?.toLowerCase() === "completed" ? "text-green-600" : "text-orange-500"} font-semibold`}>{selectedAppointment.status}</span></p>
          </div>
        ) : (
          <p>No appointment selected</p>
        )}
      </Modal>

      {/* Report Modal (separate) */}
      <Modal
        title={reportAppointment ? `Add Report — ${reportAppointment.patient_name}` : "Add Report"}
        open={reportModalOpen}
        onCancel={closeReportModal}
        footer={null}
        centered
        width={720}
      >
        {reportAppointment ? (
         <ReportUploader
  appointment={reportAppointment}
  apiBaseUrl="https://my-backend-ex0j.onrender.com"
  autoMarkComplete={false}
onDone={(ok, updatedAppointment) => {
  console.log("ReportUploader.onDone called:", ok, updatedAppointment);
  if (!ok) {
    // still trigger a refresh so you can see if backend changed
    fetchAppointments();
    closeReportModal();
    message.warning("Upload finished but returned ok=false — refetching appointments anyway (check console).");
    return;
  }

  // invalidate cache, merge local update
  invalidateImageCacheForAppointment(reportAppointment || updatedAppointment);

  if (updatedAppointment && updatedAppointment.id) {
    replaceAppointmentInState(updatedAppointment);
    const key = updatedAppointment.id || updatedAppointment._id || `${updatedAppointment.patient_name}_${updatedAppointment.appointment_date}`;
    if (updatedAppointment.xray_report) {
      const src = getImageSrcFromReport(updatedAppointment.xray_report);
      if (src) setImgSrcCache((prev) => ({ ...prev, [key]: src }));
    }
  }

  // force a fresh fetch to be sure
  fetchAppointments();

  closeReportModal();
  message.success("Report uploaded.");
}}


/>


        ) : (
          <div className="text-center text-gray-500">No appointment selected</div>
        )}
      </Modal>

      {/* Image Viewer Modal */}
<Modal
  title="X-ray Report"
  open={isImageViewerOpen}
  onCancel={() => setIsImageViewerOpen(false)}
  footer={null}
  centered
  width="80%"
  bodyStyle={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 12 }}
>
  {viewerSrc ? (
    <div style={{ width: "100%", maxHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <img
        src={viewerSrc}
        alt="Full report"
        style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 8 }}
      />
    </div>
  ) : (
    <div className="text-center text-gray-500">No image available</div>
  )}
</Modal>


      {/* Complete Modal */}
      <Modal title={<span>Complete Appointment <small className="text-xs text-gray-400">(you can upload image → OCR → get suggestions)</small></span>} open={isCompleteModal} onCancel={() => setIsCompleteModal(false)} onOk={submitCompletion} okText={submitting ? <Spin size="small" /> : "Submit"} okButtonProps={{ disabled: submitting }} centered width={800}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="m-0">Prescription (or pick a suggested template)</h4>
            <div className="flex items-center gap-3">
              {loadingSuggestions ? <Spin size="small" /> : null}
              <Button size="small" onClick={() => fetchSuggestionsFrontend(LOCAL_KEY_NAME, activeAppointment)}>Refresh Suggestions</Button>
            </div>
          </div>

          {/* Image upload section (OCR) — restored */}
          <div className="p-3 border rounded-lg bg-gray-50">
            <div className="flex items-center gap-3">
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={handleFileChange} />

              <Button icon={<FaUpload />} onClick={() => { if (fileInputRef.current) fileInputRef.current.click(); }}>
                Choose Image / PDF
              </Button>

              <Button icon={<FaImage />} onClick={analyzeImageFrontend} disabled={!imageFile || analyzingImage || readingFile}>
                {analyzingImage ? <><Spin size="small" /> Analyzing</> : readingFile ? <><Spin size="small" /> Loading</> : "Analyze Image (OCR + Prescriptions)"}
              </Button>

              <div className="flex-1 text-right text-sm text-gray-500">If OCR fails, type the contents manually below.</div>
            </div>

            {fileInfo ? (
              <div className="mt-3 flex items-start gap-3">
                {imagePreview ? <img src={imagePreview} alt="preview" style={{ maxWidth: 160, maxHeight: 120, borderRadius: 8 }} /> : <div className="w-40 h-28 flex items-center justify-center bg-white border rounded"><div className="text-xs text-gray-500 text-center">{fileInfo.type === "application/pdf" ? "PDF selected" : "No preview"}</div></div>}

                <div className="flex-1 text-xs text-gray-700">
                  <div><strong>Uploaded file:</strong> {fileInfo.name}</div>
                  <div className="mt-1 text-gray-500">{Math.round(fileInfo.size / 1024)} KB • {fileInfo.type}</div>

                  <div className="mt-2">
                    {ocrText ? (<><strong>Extracted text:</strong><div className="mt-1 text-xs whitespace-pre-wrap">{ocrText}</div></>) : ocrError ? (<div className="text-red-500">{ocrError}</div>) : (<div className="text-gray-500">No OCR result yet</div>)}
                  </div>

                  {analyzingImage ? <div className="mt-2"><Progress percent={ocrProgress} size="small" /></div> : null}

                  {ocrText ? (
                    <div className="mt-2 flex gap-2">
                      <Button size="small" onClick={() => setCompleteData((p) => ({ ...p, prescription: p.prescription ? p.prescription + "\n\n" + ocrText : ocrText }))}>Use OCR text in prescription</Button>
                      <Button size="small" onClick={() => { setFileInfo(null); setImageFile(null); setImagePreview(null); setImageBase64(null); setOcrText(""); setOcrError(""); if (fileInputRef.current) fileInputRef.current.value = null; }}>Remove</Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {/* suggestions */}
          {suggestions && suggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              {suggestions.map((s) => (
                <button key={s.id} type="button" className="text-left p-2 border rounded-lg hover:shadow cursor-pointer bg-gray-50" onClick={() =>
                  setCompleteData((prev) => ({
                    ...prev,
                    prescription: prev.prescription
                      ? prev.prescription + "\n\n" + (typeof s.text === "string" ? s.text : JSON.stringify(s.text))
                      : (typeof s.text === "string" ? s.text : JSON.stringify(s.text)),
                  }))
                }
                >
                  <div className="font-semibold text-sm">{s.title}</div>
                  <div className="text-xs text-gray-600 truncate">{typeof s.text === "string" ? s.text : (s.text.body || JSON.stringify(s.text))}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500">No suggestions available. (Make sure you provided an API key and/or uploaded an image.)</div>
          )}

          <TextArea rows={6} placeholder="Enter prescription..." value={completeData.prescription} onChange={(e) => setCompleteData({ ...completeData, prescription: e.target.value })} disabled={submitting} />
        </div>
      </Modal>

      {/* Graph Modal */}
      <Modal title="Appointments Graph" open={isGraphModalOpen} onCancel={() => setIsGraphModalOpen(false)} footer={null} width={900} centered>
        {graphData.length === 0 ? (<p className="text-center text-gray-500">No appointments data available</p>) : (
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ width: "100%", height: 220, background: "white", padding: 12, borderRadius: 8 }}>
              <h4 style={{ margin: "0 0 8px 4px" }}>Completed Appointments</h4>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={completedDataForChart} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" name="Completed" stroke="#16a34a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ width: "100%", height: 220, background: "white", padding: 12, borderRadius: 8 }}>
              <h4 style={{ margin: "0 0 8px 4px" }}>Pending Appointments</h4>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={pendingDataForChart} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" name="Pending" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Modal>

      {/* Main dashboard */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-xl transition">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><FaCalendarAlt className="text-indigo-600" /> Today's Appointments</h2>
            </div>
            {loading ? <Spin /> : (
              <div className="grid gap-6 md:grid-cols-2">
                {todayAppointments.length === 0 ? <div className="text-gray-500">No appointments for today</div> : todayAppointments.map((appt) => {
                
                // lazy compute cached img src
           
                const key = appt.id || appt._id || `${appt.patient_name}_${appt.appointment_date}`;
const imgSrc = imgSrcCache[key] || (appt.xray_report ? getImageSrcFromReport(appt.xray_report) : null);


                return(
                  <div key={key} className="border border-gray-100 rounded-xl p-5 bg-gradient-to-br from-white to-indigo-50 shadow-sm hover:shadow-md transition flex flex-col">
                    <h3 className="font-semibold text-gray-800">{appt.patient_name}</h3>
                    <p className="text-sm text-gray-600">{appt.appointment_time} • {appt.department}</p>
                    <p className="text-xs text-gray-500 mb-2">{appt.notes}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-2"><FaEnvelope className="text-indigo-600" /> {appt.email}</p>
                    <div className="mt-3 flex flex-col gap-3">
                      <button onClick={() => { setActiveAppointment(appt); handleMarkComplete(appt); }} className="flex items-center justify-center gap-2 bg-green-500 text-white text-sm py-2 rounded-lg hover:bg-green-600 transition" disabled={submitting && activeAppointment?.id === appt.id}>
                        {submitting && activeAppointment?.id === appt.id ? <Spin size="small" /> : <><FaCheckCircle /> Mark Completed</>}
                      </button>

                      {/* conditional: show Add Report if none, else show thumbnail + Replace */}
                      {!appt.xray_report ? (
                        <button onClick={() => openReportModal(appt)} className="flex items-center justify-center gap-2 bg-indigo-600 text-white text-sm py-2 rounded-lg hover:bg-indigo-700 transition">
                          <FaUpload /> Add Report
                        </button>
                      ) : (
                        <div className="flex items-start gap-3">
                          {imgSrc ? (

   <button onClick={() => openImageViewer(imgSrc)} className="flex flex-1 items-center justify-center gap-2 bg-green-500 text-white text-sm py-2 rounded-lg hover:bg-green-600 transition" disabled={submitting && activeAppointment?.id === appt.id}>
                        View Report
                      </button>
) : (
  <div className="w-28 h-20 flex items-center justify-center bg-gray-100 rounded-md text-xs text-gray-500">
    Loading...
  </div>
)}


                          <div className="flex-1 flex flex-col gap-2">
                            <button
                              onClick={() => openReportModal(appt)}
                              className="flex items-center justify-center gap-2 bg-yellow-500 text-white text-sm py-2 rounded-lg hover:bg-yellow-600 transition"
                            >
                              <FaUpload /> Replace Report
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
                })}
              </div>
            )}
          </div>

          <div className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-xl transition">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2"><FaCalendarAlt className="text-indigo-600" /> Upcoming Appointments</h2>
            <ul className="space-y-3">
              {loading ? <Spin /> : upcomingAppointments.slice(0, 2).map((appt) => (
                <li key={appt.id} className="p-4 border border-gray-100 rounded-xl bg-gradient-to-r from-white to-indigo-50 flex justify-between hover:shadow-md transition">
                  <span>{appt.patient_name} - {appt.appointment_date?.split("T")[0]}, {appt.appointment_time}</span>
                  <div className="flex items-center gap-2">
                    <button className="text-indigo-600 text-sm font-medium hover:underline" onClick={() => { setSelectedAppointment(appt); setIsDetailsOpen(true); }}>Details</button>
                    <button onClick={() => openReportModal(appt)} className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">Add Report</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-xl transition">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2"><FaCheckCircle className="text-green-600" /> Recent Completed</h2>
            <ul className="space-y-3">
              {completedAppointments.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date)).slice(0, 3).map((appt) => (
                <li key={appt.id} className="p-3 border rounded-xl bg-gray-50 flex justify-between items-center hover:shadow-md transition">
                  <div>
                    <span className="font-medium">{appt.patient_name}</span>
                    <span className="ml-2 text-sm text-gray-500">{appt.appointment_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-indigo-600 text-sm font-medium hover:underline" onClick={() => { setSelectedAppointment(appt); setIsDetailsOpen(true); }}>See Details</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-xl transition">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2"><FaHeartbeat className="text-red-500" /> Health Summary</h2>
            <ul className="space-y-4 text-sm">
              <li className="flex justify-between items-center"><span className="flex items-center gap-2"><FaCalendarAlt className="text-indigo-600" /> Next Appointment</span><span className="font-semibold">{upcomingAppointments[0] ? upcomingAppointments[0].appointment_date?.split("T")[0] : "—"}</span></li>
              <li className="flex justify-between items-center"><span className="flex items-center gap-2"><FaPills className="text-indigo-600" /> Active Prescriptions</span><span className="font-semibold">0</span></li>
              <li className="flex justify-between items-center"><span className="flex items-center gap-2"><FaStethoscope className="text-indigo-600" /> Recent Checkups</span><span className="font-semibold">{completedAppointments.length}</span></li>
            </ul>
            <div className="mt-4">
              <Button type="primary" onClick={() => setIsGraphModalOpen(true)}>Show Appointments Graph</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorHome;
