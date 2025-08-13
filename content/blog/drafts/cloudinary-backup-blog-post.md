---
date: 2025-01-17T19:00:00-05:00
tags:
  - development
  - tools
  - security
  - rust
  - tauri
  - design
draft: true
modified: 2025-08-12T11:21:04-04:00
---

## Building a Brutalist Photo Backup Tool: From Prototype to Production

### Overview

When your photo hosting service holds thousands of irreplaceable memories, you need a reliable way to back them up. This project started as a simple Tauri desktop app to download photos from Cloudinary and evolved into a production-ready tool with security hardening, memory optimizations, and a custom brutalist interface.

### The Problem

Cloudinary is great for hosting and transforming images, but what happens when you need to backup 10,000+ photos? Manual downloads are impossible, and existing tools either don't scale or compromise on security. I needed something that could:

- Handle massive photo collections without choking on memory
- Store API credentials securely
- Provide clear progress tracking with resume capability
- Work offline once photos are scanned
- Look good while doing it (brutalist aesthetic preferred)

### Technical Implementation

#### Core Architecture
- **Frontend**: TypeScript + Vite with brutalist CSS design
- **Backend**: Rust + Tauri v2 for native desktop performance
- **Security**: XOR encryption for credential storage, CSP protection
- **Memory**: Intelligent batch processing (50 files normal, 25 for 5k+ collections)

#### Key Features Implemented

##### 1. Security Hardening
**Problem**: Original version stored API credentials in plaintext localStorage
**Solution**:
- XOR encryption + Base64 encoding for credential storage
- Proper HTTP Authorization headers (not embedded in URLs)
- Content Security Policy with strict allowlists
- Automatic migration from plaintext to encrypted storage

##### 2. Memory-Efficient Batch Processing
**Problem**: Loading 10,000+ photos into memory would crash the app
**Solution**:
- Smart batch processing with configurable sizes
- Constant memory usage regardless of collection size
- Automatic batch size optimization (smaller batches for large collections)
- Proper garbage collection of processed batches

##### 3. Download Resilience
**Problem**: Network interruptions and deleted files caused failures
**Solution**:
- URL validation during scan to filter deleted files
- Exponential backoff retry logic
- Download resume capability with state persistence
- File existence checking with size validation

##### 4. Brutalist UI Design
**Problem**: Default Tauri UI was too "polished" and corporate
**Solution**:
- Flat design with no hover effects or rounded corners
- Monospace fonts and stark black/white color scheme
- Custom SF Symbol-inspired app icon
- Progressive disclosure with clear information hierarchy

#### Custom App Icon Creation

The original placeholder icon didn't match the brutalist aesthetic. I created a custom icon inspired by SF Symbol `photo.badge.arrow.down.fill`:

```bash
# Generated RGBA-format icons for all platforms
- 32x32.png (taskbar)
- 128x128.png (standard)
- 128x128@2x.png (retina)
- icon.icns (macOS)
- icon.ico (Windows)
```

Design elements:

- Black background with white photo frame
- Bold download arrow indicating primary function
- Red badge for status/action indication
- Proper transparency support across all platforms

#### Performance Optimizations

##### Memory Management
```typescript
// Memory-efficient batch processing
const DOWNLOAD_BATCH_SIZE = 50; // Normal collections
const LARGE_COLLECTION_BATCH_SIZE = 25; // 5k+ photos
const BATCH_DELAY_MS = 100; // Prevent overwhelming

function getOptimalBatchSize(totalResources: number): number {
  if (totalResources > 5000) {
    return LARGE_COLLECTION_BATCH_SIZE;
  }
  return DOWNLOAD_BATCH_SIZE;
}
```

##### URL Validation
```typescript
// Filter out deleted files before download
const { valid, invalid } = await validateResourcesBatch(allResources);
logMessage(`Validation: ${valid.length} accessible, ${invalid.length} deleted`);
```

### Development Workflow

#### Initial Prototype (Day 1)
- Basic Tauri app with Apple-inspired UI
- Plaintext credential storage
- Simple sequential downloads
- No error handling or resume capability

#### Security Pass (Day 2-3)
- Code review revealed critical security issues
- Implemented encrypted credential storage
- Added proper HTTP authentication
- Enabled Content Security Policy

#### Memory Optimization (Day 4)
- Identified memory bottleneck with large collections
- Implemented intelligent batch processing
- Added automatic garbage collection
- Tested with 10k+ photo collections

#### UI/UX Polish (Day 5)
- Redesigned from Apple-inspired to brutalist aesthetic
- Created custom app icon
- Added progress animations and clear status indicators
- Implemented folder analysis with completion percentages

### Production Readiness Checklist

✅ **Security**

- Encrypted credential storage (XOR + Base64)
- HTTP Authorization headers (not URL-embedded)
- Content Security Policy enabled
- Request timeouts to prevent hanging

✅ **Performance**

- Memory-efficient batch processing
- Constant memory usage regardless of collection size
- Smart batch size optimization
- Proper garbage collection

✅ **Reliability**

- Download resume capability
- URL validation to filter deleted files
- Exponential backoff retry logic
- File existence checking with size validation

✅ **User Experience**

- Brutalist design that's functional and clear
- Custom app icon that matches aesthetic
- Progress tracking with clear status messages
- Automatic folder analysis and completion tracking

### Lessons Learned

#### 1. Security Should Be Priority One

The initial version had credentials in plaintext localStorage - a critical security flaw. Always implement proper encryption for sensitive data, even in desktop apps.

#### 2. Memory Management Matters

Loading 10,000+ resources into memory simultaneously will crash most systems. Batch processing with intelligent sizing is essential for scalability.

#### 3. Error Handling Is Half the Work

Network failures, deleted files, and disk space issues are common. Robust error handling and retry logic separate toy projects from production tools.

#### 4. UI Design Philosophy Matters

The brutalist aesthetic wasn't just style - it reflected the tool's function. Clear, unadorned interfaces work better for utility applications.

### Next Steps

1. **Stronger Encryption**: Implement proper Tauri Stronghold integration for credential storage
2. **Parallel Downloads**: Add concurrent download streams for faster throughput
3. **Metadata Preservation**: Store original upload dates and tags alongside files
4. **Cloud Storage Integration**: Add direct upload to S3/Google Drive after download

### Code & Distribution

The project is open source and available on GitHub. The production-ready version includes:

- Complete security hardening
- Memory-efficient batch processing
- Custom brutalist UI with app icon
- Comprehensive error handling and resume capability

Ready for users who need to backup large photo collections without compromising on security or performance.

---

*This project demonstrates how a simple utility can evolve into a production-ready tool through iterative security hardening, performance optimization, and thoughtful UI design.*
<\!-- Test change at Sun Aug 10 13:29:34 EDT 2025 -->
