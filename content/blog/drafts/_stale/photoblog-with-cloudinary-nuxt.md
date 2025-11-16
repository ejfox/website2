---
draft: false
dek: In which we build a photography workflow that turns Finder tags into a web gallery, complete with EXIF analytics and randomized layouts that make your photos look like they were thrown on a table
inprogress: false
date: 2022-12-05T18:34:09-05:00
modified: 2025-10-25T12:49:49-04:00
tags:
  - automation
  - photography
  - nuxt
  - cloudinary
  - workflow
---

## Building a Photo Gallery That Feels Like Throwing Pictures on a Table

The best photo workflows are invisible. You take a photo, it shows up on your website automatically, and your friends can browse through your life without you having to think about it. But getting there requires some upfront automation that bridges the gap between "I just took this photo" and "it's live on the internet."

Here's how I built a photography system that starts with Mac Finder tags and ends with a web gallery that has randomized layouts, deep EXIF analytics, and keyboard navigation—all powered by Cloudinary as both CDN and CMS.

### The Three-Act Structure

The workflow breaks down into three acts:

1. **Import & Organize**: SD cards flow into `~/dump/`, get organized into `~/media/` by date and type
2. **Curate & Upload**: Use Finder's color tags (green = publish) + Automator to batch upload to Cloudinary
3. **Display & Analytics**: Nuxt gallery pulls from Cloudinary with sophisticated EXIF processing and randomized layouts

Let's walk through each piece.

### Act I: Import & Organize

Everything starts in `~/dump/`. I used to create project folders that would grow cobwebs when I inevitably moved on to the next shiny thing. Now everything flows through a single intake directory that gets regularly organized.

#### SD Card Import

When I plug in an SD card from my Fujifilm, helmet cam, or field recorder, an Automator action asks if I want to import to `~/dump/`. If yes, this script copies only the file types I care about:

```bash
#!/bin/bash

totalFiles=0
totalSize=0

handle_folder() {
    for aFile in "$1"/*; do
        if [ -d "$aFile" ]; then
            handle_folder "$aFile"
        elif ["$(echo $aFile | tr '[:upper:]("$(echo-$afile-|-tr-'[:upper:)]' '[:lower:]')" =~ \.(jpe?g|mp[34]|raf|wav)$ ]]; then
            echo "Copying file $aFile"
            newFilePath=$HOME/dump/$(basename "$aFile")
            cp "$aFile" "$newFilePath"

            totalFiles=$((totalFiles + 1))
            totalSize=$((totalSize + $(du -k "$aFile" | cut -f1)))
        fi
    done
}

mkdir -p $HOME/dump

# List all volumes and handle each (excluding system disk)
for sdcard in /Volumes/*; do
    if [ "$sdcard" != "/Volumes/Macintosh HD" ] && [ -d "$sdcard" ]; then
        echo "Handling SD Card: $sdcard"
        handle_folder "$sdcard"
    fi
done

# Convert size to GB and notify
totalSizeGB=$(echo "scale=2; $totalSize/1024/1024" | bc)
osascript -e "display notification \"Successfully copied $totalFiles files totaling $totalSizeGB GB to the dump folder\" with title \"File Operation Summary\""
```

The key insight: only copy files I actually care about (.jpg, .mp4, .raf, .wav) and give me a notification with the totals so I know it worked.

#### Organizing the Dump

When `~/dump/` gets unwieldy, I run another script that organizes everything by creation date and media type:

```bash
#!/bin/bash

shopt -s globstar nullglob

# Get creation date and format it to YYYY-MM-DD
getDate() {
    date -r "$1" +'%Y-%m-%d'
}

# Iterate recursively over all files in ~/dump/
for file in ~/dump/**/*.*; do
    if [ -f "$file" ]; then
        file_date=$(getDate "$file")
        mime_type=$(file --mime-type -b "$file" | awk -F'/' '{print $1}')
        dir_name=~/media/"$file_date"/"$mime_type"

        mkdir -p "$dir_name"
        mv "$file" "$dir_name"/
        echo "$file : moved to $dir_name" >> ~/dump/_logs.txt
    fi
done

echo "Organizing Completed $(date +"%T")" >> ~/dump/_logs.txt
```

This creates a structure like `~/media/2025-08-29/image/` that makes it easy to browse chronologically.

### Act II: Curate & Upload

Here's where Finder's built-in tagging system becomes the star. Instead of building a custom interface for selecting photos, I use what's already there: Mac's color tags.

#### The Green Tag Upload Script

I naturally developed a workflow of tagging photos yellow for "maybe" and green for "publish". Then I built an Automator action that uploads all green-tagged files in a folder to Cloudinary:

```bash
#!/bin/bash

export CLOUDINARY_URL=cloudinary://YOUR_SECRET_HERE

for folder in "$@"; do
  # Find all green tagged files
  green_files=$(mdfind -onlyin "$folder" 'kMDItemUserTags == Green')
  num_green_files=$(echo "$green_files" | wc -l)

  osascript -e "display notification \"$num_green_files green files found.\" with title \"Upload Green Media\""

  successful_uploads=0

  echo "$green_files" | while read -r file; do
    if [-n "$file"](-n-"$file") ]]; then
      upload_output=$(/opt/homebrew/bin/cld uploader upload "$file" 2>&1)

      if [ $? -eq 0 ]; then
        successful_uploads=$((successful_uploads + 1))
        osascript -e "display notification \"Uploaded $successful_uploads of $num_green_files files to Cloudinary.\" with title \"Upload Green Media\""
      else
        osascript -e "display notification \"Failed to upload $file to Cloudinary. Error: $upload_output\" with title \"Upload Green Media\""
      fi
    fi
  done
done

osascript -e "display notification \"Done uploading files.\" with title \"Upload Green Media\""
```

The beauty here: I can right-click any folder and upload all green-tagged media. No custom interfaces, just using Mac's built-in file management augmented with automation.

#### Screenshot Auto-Upload

For screenshots (which I take constantly while debugging or saving interesting web content), I have a folder action that auto-uploads anything that lands in the screenshots folder:

```bash
#!/bin/bash

export CLOUDINARY_URL=cloudinary://YOUR_SECRET_HERE

for file in "$@"; do
  if [ -f "$file" ]; then
    upload_output=$(/opt/homebrew/bin/cld uploader upload "$file" use_filename=true unique_filename=false 2>&1)

    if [ $? -eq 0 ]; then
      url=$(echo "$upload_output" | /opt/homebrew/bin/jq -r '.url' 2>/dev/null)
      if [ -n "$url" ]; then
        echo "$url" | pbcopy
        osascript -e "display notification \"Uploaded $file to Cloudinary and URL copied to clipboard: $url\" with title \"Screenshot Upload\""
      fi
    fi
  fi
done
```

Key detail: the URL gets copied to my clipboard automatically, so I can immediately paste it into Slack or wherever I need it.

### Act III: Display & Analytics

Now for the fun part: turning this stream of photos into a web gallery that feels alive. The Nuxt frontend does some clever things to make browsing photos feel more like looking through a stack of prints than scrolling through a sterile grid.

#### The Cloudinary API Endpoint

The heart of the system is a flexible Nuxt server API that can filter and fetch photos in different ways:

```ts
// server/api/cloudinary.ts
import { defineEventHandler, readBody } from 'h3'
import { v2 as cloudinary } from 'cloudinary'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const numPhotos = Math.min(Number(body.numPhotos) || 100, 500)
  const onlyPhotoblog = body.onlyPhotoblog ?? false
  const filterOutScreenshots = body.filterOutScreenshots ?? true

  // Build search expression
  let expression = 'resource_type:image'
  if (onlyPhotoblog) expression += ' AND tags=photo-blog'

  const result = await cloudinary.search
    .expression(expression)
    .sort_by('created_at', 'desc')
    .max_results(numPhotos)
    .with_field('tags,context')
    .execute()

  // Client-side screenshot filtering for complex patterns
  const isScreenshot = (resource) => {
    const tags = resource.tags || []
    const publicId = resource.public_id.toLowerCase()

    return (
      tags.includes('screenshot') ||
      publicId.includes('screenshot') ||
      publicId.startsWith('screenshots/')
    )
  }

  let filteredResources = result.resources
  if (filterOutScreenshots) {
    filteredResources = result.resources.filter(
      (resource) => !isScreenshot(resource)
    )
  }

  return filteredResources.map((resource) => ({
    public_id: resource.public_id,
    secure_url: resource.secure_url,
    created_at: resource.created_at,
    tags: resource.tags,
    width: resource.width,
    height: resource.height
  }))
})
```

#### Randomized Photo Layout

The gallery's signature feature is making photos look like they were casually thrown on a table. Each photo gets random rotation, translation, and scale:

```js
function randomizedPhotoStyle(photo) {
  const chance = new Chance()

  const maxOffsetY = 6
  const maxOffsetX = 2
  const maxAngle = 1.5

  const randomAngle = chance.integer({ min: -maxAngle, max: maxAngle })
  const randomX = chance.floating({ min: -maxOffsetX, max: maxOffsetX })
  const randomY = chance.floating({ min: -maxOffsetY, max: maxOffsetY })
  const scale = chance.floating({ min: 0.89, max: 1 })

  // 33% of the time, keep it normal
  if (chance.bool({ likelihood: 0.333 })) return {}

  return {
    transform: `translate(${randomX}px, ${randomY}px) rotate(${randomAngle}deg) scale(${scale})`
  }
}
```

#### Deep EXIF Analytics

The `/api/stats` endpoint does something special: it fetches EXIF data for every photo and builds comprehensive analytics about shooting habits:

```ts
// server/api/stats.ts
export default defineEventHandler(async (event) => {
  // Fetch all photo-blog photos
  const photos = await $fetch("/api/cloudinary", {
    method: "POST",
    body: { numPhotos: 1000, onlyPhotoblog: true }
  });

  // Get EXIF data for each photo
  const exifPromises = photos.map(photo =>
    $fetch("/api/cloudinary-exif", {
      method: "POST",
      body: { publicId: photo.public_id }
    }).catch(() => null)
  );

  const exifResults = await Promise.all(exifPromises);

  // Filter to only real photos (have camera Make/Model in EXIF)
  const photosWithExif = photos.filter((photo, index) => {
    const exif = exifResults[index]?.exifData;
    return exif?.Make && exif?.Model;
  });

  // Build gear stats
  const cameras = new Map();
  const lenses = new Map();
  const apertures = new Map();
  const shutterSpeeds = new Map();
  const isoValues = new Map();

  exifResults.forEach(result => {
    if (!result?.exifData) return;

    const exif = result.exifData;
    const hr = result.humanReadableExifData;

    // Track camera usage
    if (exif.Make && exif.Model) {
      const camera = `${exif.Make} ${exif.Model}`;
      cameras.set(camera, (cameras.get(camera) || 0) + 1);
    }

    // Track lens usage
    if (exif.LensModel) {
      lenses.set(exif.LensModel, (lenses.get(exif.LensModel) || 0) + 1);
    }

    // Track camera settings
    if (hr?.aperture) apertures.set(hr.aperture, (apertures.get(hr.aperture) || 0) + 1);
    if (hr?.exposure) shutterSpeeds.set(hr.exposure, (shutterSpeeds.get(hr.exposure) || 0) + 1);
    if (exif?.PhotographicSensitivity) isoValues.set(exif.PhotographicSensitivity, (isoValues.get(exif.PhotographicSensitivity) || 0) + 1);
  });

  return {
    stats: {
      totalPhotos: photosWithExif.length,
      photosThisYear: /* calculate */,
      photosThisMonth: /* calculate */
    },
    gearStats: {
      cameras: formatGearStats(cameras),
      lenses: formatGearStats(lenses),
      mostUsedSettings: {
        apertures: formatSettingStats(apertures),
        shutterSpeeds: formatSettingStats(shutterSpeeds),
        isoValues: formatSettingStats(isoValues)
      }
    }
  };
});
```

This creates a stats page that shows not just what photos I've taken, but deep insights into my shooting habits: which cameras I use most, favorite apertures, time of day patterns, etc.

#### Keyboard Navigation

The gallery supports arrow key navigation to flip through photos like a slideshow:

```js
function handleKeyDown(e) {
  if (e.key === 'ArrowRight' && currentIndex.value < photos.length - 1) {
    currentIndex.value++
    scrollToCurrentPhoto()
  } else if (e.key === 'ArrowLeft' && currentIndex.value > 0) {
    currentIndex.value--
    scrollToCurrentPhoto()
  }
}

function scrollToCurrentPhoto() {
  const el = photoRef.value[currentIndex.value]
  if (el) {
    const currentPhoto = photos.value[currentIndex.value]
    if (currentPhoto?.public_id) {
      window.history.replaceState(null, '', `#photo-${currentPhoto.public_id}`)
    }
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
```

### The Philosophy: Augment, Don't Replace

The key insight running through this whole system: don't rebuild what already works well.

- Mac's Finder is an excellent file browser → augment it with color tags and Automator actions
- Cloudinary is an excellent CDN → use it as both storage and CMS via their API
- Browser scroll and keyboard navigation work well → enhance them with smooth animations and hash updates

The result is a photography workflow that feels invisible when it works, and produces a web gallery that feels more human than the usual sterile grid layouts.

Every photo goes from SD card to web automatically, but with deliberate curation steps (the green tagging) that keep the quality high. And the analytics provide insights into my shooting habits that I'd never get from just scrolling through folders.

The whole system embodies "make hell fun" - turning the tedious work of photo management into a series of small, satisfying automations that compound into something powerful.

### Why This Approach Works

I'm big on using macOS built-in file management as my "CMS" for photos, rather than Lightroom or any of that proprietary bullshit. Finder as filesystem, Preview as image editor - this is how we're supposed to use computers.

The key benefits:

- **No vendor lock-in**: My photos are just flat files with standard metadata, not trapped in some proprietary catalog
- **Fast and lightweight**: No waiting for Lightroom to boot up or process thumbnails - Finder and Preview are instant
- **Future-proof**: Will work with any tool, any OS, decades from now
- **Free**: No monthly subscriptions to access my own photos
- **Scriptable**: Standard Unix tools work with everything

When you use Finder's color tags, you're using the filesystem itself as a database. When you use `mdfind` to search for green-tagged files, you're querying that database directly. No intermediary layer, no proprietary formats, no bullshit.

Preview handles 90% of what photographers actually need: crop, rotate, color correction, levels. For the other 10%, you can always open in something more specialized, but the original stays a standard file.

This is computational thinking applied to photography: build small, composable tools that work together rather than one giant monolithic application that tries to do everything. The filesystem is the database, the OS is the interface layer, Cloudinary is the CDN, and Nuxt is the presentation layer.

Each piece can be swapped out without breaking the whole system. That's how you build something that lasts.

### The Magic of Custom Features

One of the best parts about building your own photo gallery instead of using a Squarespace template or Instagram feed is the ability to add delightful, weird features that no template would ever include.

#### Randomized "Thrown on a Table" Layout

The randomized photo positioning isn't just aesthetic - it makes every visit feel slightly different. Photos get subtle random rotations, translations, and scaling that make them feel like physical prints scattered on a desk. Some photos stay perfectly aligned (33% chance), others get the treatment. It's controlled chaos that feels human.

#### Deep Photography Analytics

The `/stats` page is something you'd never get from a standard gallery template. It processes EXIF data from thousands of photos to reveal patterns:

- Which cameras and lenses you actually use (vs. what you think you use)
- Your favorite apertures and shutter speeds
- Time of day shooting patterns
- Photo streaks and seasonal trends
- Gear usage percentages down to the decimal

This kind of meta-analysis turns your photography practice into quantified self data. I can see that I shoot 67% of my photos with my 35mm lens, or that I heavily favor f/2.8 for street photography.

#### Keyboard Navigation with URL State

Arrow keys flip through photos like a slideshow, and each photo updates the browser hash so you can bookmark specific images or share direct links. The smooth scrolling and state management makes browsing feel like a native app rather than a clunky webpage.

#### Smart Screenshot Handling

Screenshots and real photos get processed differently. Screenshots auto-upload to Cloudinary with URLs copied to clipboard (perfect for Slack), while camera photos go through the green-tag curation flow. The system knows the difference through EXIF detection - if it has camera Make/Model data, it's a real photo.

#### Session Persistence

When you click into a detailed photo view and then navigate back, the gallery remembers exactly where you were scrolling. No losing your place in a long feed of photos - the system restores both scroll position and active photo state.

#### Chance.js Seeded Randomization

The photo randomization uses Chance.js with the photo's public_id as a seed, so each photo always gets the same "random" positioning. This means the layout is consistent across visits while still feeling organic and hand-placed.

#### Fade-in Intersection Observers

Photos fade in as they enter the viewport using Intersection Observer API, creating a smooth progressive loading experience. Combined with the randomized positioning, it feels like photos are materializing on the table as you scroll.

#### Mobile-First Responsive Design

The layout adapts elegantly from desktop (where you can see the random positioning clearly) to mobile (where photos stack more traditionally but keep subtle rotation). The keyboard navigation switches to touch-friendly swipe gestures.

#### Custom Typography and Spacing

Typography uses a mix of `font-fjalla` for large numbers and `font-mono` for technical details, creating a design system that feels both technical and human. The spacing is carefully tuned so photos feel like they're floating rather than trapped in a rigid grid.

These are the kinds of details that make a custom-built site feel alive compared to the sterile perfection of template galleries. Every interaction has been considered, every animation has meaning, and the whole experience reflects how I actually want to browse and share photos.

You can't get this level of customization from Squarespace or Instagram. This is what happens when you own the entire stack and can make it behave exactly how you want.
