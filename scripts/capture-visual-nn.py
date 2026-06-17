#!/usr/bin/env python3
"""Visual nearest-neighbor search over screenshot embeddings.
Seed from confirmed project screenshots; find shots that LOOK similar
(no OCR/text match required). Writes NUL-separated path lists to /tmp/nn/."""
import os, glob, json
import numpy as np
import pandas as pd

H = os.path.expanduser("~")
SHOTS = f"{H}/screenshots"
os.makedirs("/tmp/nn", exist_ok=True)

df = pd.read_parquet(f"{H}/code/screenshot-embeddings/data/embeddings.parquet")
files = df["filename"].tolist()
V = np.array(df["visual_emb"].tolist(), dtype=np.float32)
V /= (np.linalg.norm(V, axis=1, keepdims=True) + 1e-9)
idx = {f: i for i, f in enumerate(files)}

def basenames_from_pathfile(p, sep="\0"):
    if not os.path.exists(p):
        return []
    return [os.path.basename(x) for x in open(p).read().split(sep) if x.strip()]

def basenames_from_lines(p):
    if not os.path.exists(p):
        return []
    return [l.strip() for l in open(p) if l.strip()]

SEEDS = {
    "connectology": basenames_from_pathfile("/tmp/audit2/connectology.paths"),
    "vulpes": basenames_from_pathfile("/tmp/audit2/vulpes.paths"),
    "electology": basenames_from_pathfile("/tmp/audit2/electology.paths"),
    "gem-viz": basenames_from_lines("/tmp/gem_fns.txt")[:10],
    "metro-savefile-doctor": basenames_from_pathfile("/tmp/audit/metro-savefile-doctor.paths"),
    "subway-builder": basenames_from_lines("/tmp/subway_fns.txt")[:10],
}

for slug, seeds in SEEDS.items():
    sidx = [idx[s] for s in seeds if s in idx]
    if not sidx:
        print(f"{slug}: no seed in index")
        continue
    q = V[sidx].mean(axis=0)
    q /= (np.linalg.norm(q) + 1e-9)
    sims = V @ q
    order = np.argsort(-sims)
    seedset = set(sidx)
    out = []
    for i in order:
        if i in seedset:
            continue
        full = os.path.join(SHOTS, files[i])
        if os.path.exists(full):
            out.append(full)
        if len(out) >= 12:
            break
    open(f"/tmp/nn/{slug}.paths", "w").write("\0".join(out))
    print(f"{slug}: {len(sidx)} seeds -> {len(out)} neighbors (top sim {sims[order[len(seedset)]]:.3f})")
