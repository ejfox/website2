---
date: 2023-09-24T13:57:43-04:00
modified: 2025-01-01T10:30:43-05:00
tags:
  - photography
  - printing
  - metadata
draft: true
---
## Printing Photos With EXIF Data

I want my printed photos to include the technical details - camera settings, date, maybe location. Not because it looks cool, but because I forget this stuff and it's useful to remember what worked.

### The Problem

Most photo printing services strip EXIF data. You get a nice print but lose all the metadata about how you shot it.

Home printing is better but still requires manual work to get the data onto the image before printing.

### What I Want

Camera model, lens, aperture, shutter speed, ISO printed small along the bottom edge. Date in the corner. GPS coordinates if available.

Basically like the old film camera data backs but for digital photos.

### Current Options

**Lightroom**: Can add text overlays with EXIF data. Works but requires going through each photo manually.

**Command line tools**: ExifTool can extract data, ImageMagick can add text. Scriptable but ugly output without work.

**Custom scripts**: Write something that reads EXIF, formats it nicely, composites it onto the image before printing.

### What I Haven't Tried Yet

Building a simple web tool that takes a photo, reads the EXIF, and outputs a print-ready version with the metadata formatted nicely along the edge.

Could batch process entire folders. Could let you choose which fields to include. Could match the text formatting to different print sizes.

### Why Bother

When I look at old prints, I want to remember not just what I saw but how I captured it. What lens did I use for that shot? What were the light conditions? 

Physical prints with this data become a kind of analog database of photographic decisions.
