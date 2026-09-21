---
title: "Butt Math"
date: 2026-05-01
category: "Art"
featured: false
tech: ["SVG", "Nuxt", "Vue", "D3", "flubber"]
state: deployed
ai-involvement: ai-assisted
tags:
  - art
  - generative
  - web
---

A parametric butt-diagram engine and a scrolly data investigation into why we can't stop looking at butts, built on the same pile of real research

I thought it would be fun and interesting to do a scrolly-explainer talking about butts and why we find them fascinating, and I didn't have a better reason than that, so I went and read the actual literature. There is a shocking amount of it. Eye-tracking studies with infrared cameras. Evolutionary-psych papers on lumbar curvature. Thirty thousand years of Venus figurines. NHANES measuring the waists and hips of thousands of Americans every two years. The joke was the premise. Then I pulled the papers and the joke turned into a genuinely fascinating project, which is honestly the best way for one of these to go.

There are two halves and they grew out of the same folder. The first is a parametric SVG diagram engine — you drive sliders for width, projection, roundness, cleft depth, lift, and fullness, and it renders an anatomically plausible shape that morphs smoothly between states. The shapes aren't hand-drawn Bézier curves I nudged until they looked right, they come from real shape math: the Gielis superformula generates the contours, Flubber handles the morphing, and the plan is to calibrate the whole parameter space against actual body-scan data using Elliptic Fourier Descriptors and PCA so the sliders can only ever produce shapes that exist in real populations. SMPL, the model Hollywood uses to fit bodies, does the same trick — PCA over a couple thousand CAESAR scans. I'm being honest about the limits: real buttocks are volumetric and a 2D SVG is always a projection, so there's a cross-section view and no pretense of biomechanical accuracy.

The second half is the explainer itself — the one I originally set out to make, which used to be its own repo called **gluteal-index** before I folded it back in. It's a Pudding-style scrollytelling piece, deadpan and precise, letting the absurdity come out of the rigor instead of winking at you. It opens cold with the eye-tracking finding: in a 2024 study, sixty-seven people had infrared cameras strapped to them, and within 1.47 seconds — before conscious processing can intervene — everyone's eyes had already converged on the same spot. Then it walks through the science of why. Gluteofemoral fat is where the body stores DHA for building fetal brains, metabolically locked until the third trimester, which reframes waist-to-hip ratio as a nutritional readout rather than a preference. Lumbar curvature peaks in attractiveness at exactly 45.5 degrees, the angle furthest from spinal injury, and high heels fake it. The 0.7 WHR everybody quotes as universal turns out to be local calibration once you test outside American undergrads. And the NHANES data shows that ideal sits at roughly the 10th percentile of actual American women. The through-line I keep coming back to: your visual system is running a 30,000-year-old nutritional assessment algorithm, and it takes about 1.47 seconds.

Built with a lot of help from Claude — the research triage, the superformula math, the scrollytelling scaffold. AI-assisted throughout, and the papers and data are all real and cited in the piece.

![Scrolling the explainer — eye-tracking ballet footage, posture-analysis overlays, and the lordosis stats](https://res.cloudinary.com/ejf/video/upload/projects/butt-math/explainer-scroll.mp4)

![Explainer section: sagittal spine diagram with vertebrae, sacrum outline, and a 22.0-degree lumbar lordosis angle readout](https://res.cloudinary.com/ejf/image/upload/v1785421532/projects/butt-math/lordosis-explainer.png)

![Waist-hip ratio section: interactive measurements against the NHANES 2017-2020 WHR distribution chart](https://res.cloudinary.com/ejf/image/upload/v1785421532/projects/butt-math/whr-explainer.png)
