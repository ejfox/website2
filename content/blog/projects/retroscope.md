---
title: "Retroscope"
date: 2024-12-31
github: https://github.com/ejfox/retroscope
tech: ["JavaScript", "OpenAI API", "Cloudinary API", "Batch Processing"]
---

Built a tool to automatically generate text descriptions for thousands of screenshots sitting in my Cloudinary account. It batch processes images through AI to create searchable descriptions - suddenly years of random screenshots became findable.

The simple idea: point it at your Cloudinary folder, it pulls each image, sends it to GPT-4 Vision, and saves the description back as metadata. Now I can search "that screenshot with the terminal showing the git error" and actually find it.