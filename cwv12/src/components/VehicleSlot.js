import React, { useState, useEffect } from "react";
import { apiFetch } from "../utils";

export default function VehicleSlot({ slotId, makes, filterType, onRemove, onReady }) {
  const [make,        setMake]        = useState("");
  const [models,      setModels]      = useState([]);
  const [model,       setModel]       = useState("");
  const [modelCount,  setModelCount]  = useState(null);
  const [loadingMdls, setLoadingMdls] = useState(false);

  // Reset everything when filterType changes
  useEffect(() => {
    setMake("");
    setModel("");
    setModels([]);
    setModelCount(null);
  }, [filterType]);

  // Reset model when make changes
  useEffect(() => {
    setModel("");
    setModels([]);
    setModelCount(null);
  }, [make]);

  // Fetch models when make or filterType changes
  useEffect(() => {
    if (!make) return;
    setLoadingMdls(true);
    let url = `/api/models?make=${encodeURIComponent(make)}`;
    if (filterType && filterType !== "all") url += `&fuel_type=${filterType}`;
    apiFetch(url).then(d => {
      if (d) {
        setModels(d.models || []);
        setModelCount((d.models || []).length);
      }
      setLoadingMdls(false);
    });
  }, [make, filterType]);

  // Notify parent when model is selected
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (model) onReady(slotId, model); }, [model]);

  const filterLabel = filterType && filterType !== "all" ? filterType : null;

  return (
    <div className="vcard">
      {onRemove && (
        <button className="vcard-rm" onClick={() => onRemove(slotId)}>✕</button>
      )}
      <div className="fg">
        <label className="fl">
          Make
          {filterLabel && (
            <span style={{ marginLeft: "5px", fontSize: ".38rem", opacity: 0.6 }}>
              ({filterLabel} filter active)
            </span>
          )}
        </label>
        <select className="fs" value={make} onChange={e => setMake(e.target.value)}>
          <option value="">— Select Make —</option>
          {makes.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="fg">
        <label className="fl">
          Model
          {modelCount !== null && make && (
            <span style={{ marginLeft: "5px", fontSize: ".38rem", opacity: 0.6 }}>
              ({modelCount} available)
            </span>
          )}
        </label>
        <select
          className="fs"
          value={model}
          onChange={e => setModel(e.target.value)}
          disabled={!make || loadingMdls}
        >
          <option value="">
            {!make
              ? "← Pick make first"
              : loadingMdls
              ? "Loading models…"
              : models.length
              ? "— Select Model —"
              : `No ${filterLabel || ""} models for this make`}
          </option>
          {models.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
    </div>
  );
}
