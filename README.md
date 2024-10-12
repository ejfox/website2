# Website2

**Website2** is a custom markdown processing and publishing system built with Nuxt 3. It enables seamless integration of rich content, interactive Gists, scrollytelling, and optimized image handling, while also supporting powerful features like syntax highlighting, Mermaid diagrams, and advanced caching.

Here’s a high-level, concise guide to the most important files and directories in the **Website2** project:

---

## Project Structure Overview

This guide will help you navigate the most essential parts of the **Website2** markdown processing and publishing system. Each key directory and file is briefly explained to give you an understanding of what it does and where to find critical functionality.

---

### Root Directory

- **`nuxt.config.ts`**: The configuration file for Nuxt 3, where global settings for the app are defined, including plugins, runtime configurations, and build options.
  
- **`app.vue`**: The root component of the application, which serves as the wrapper for all other pages. If you need to apply a global layout or logic, this is where it goes.

- **`package.json`**: The project manifest file. It lists dependencies, scripts, and metadata about the project. This is also where you define npm/yarn scripts for running and building the project.

- **`helpers.js`**: A utility file that contains helper functions used across different parts of the application. This is a great place to look for shared logic.

---

### Important Directories

- **`pages/`**: This directory contains the main pages for the app, defining the routes. For example:
  - **`index.vue`**: The homepage of the site.
  - **`blog/`**: Contains individual blog pages and content for the blog section.
  - **`projects.vue`**: A dedicated page for showcasing projects.

- **`composables/`**: Holds reusable logic that can be shared across components. Key files include:
  - **`useProcessedMarkdown.ts`**: The core composable responsible for fetching and processing markdown content. 
  - **`useScraps.ts`**: Handles logic related to scrap content (a unique content type in this system).

- **`scripts/`**: Where custom Node.js scripts are stored. Examples:
  - **`processMarkdown.mjs`**: The main script that processes markdown files and converts them into HTML for display on the site.
  - **`generateShareImages.mjs`**: Generates shareable images for social media based on content.

- **`server/api/`**: Contains API endpoints for interacting with the backend. For instance:
  - **`manifest-lite.ts`**: Fetches the metadata for all blog posts.
  - **`posts/`**: Handles requests for individual blog posts based on the slug.
  - **`scraps.post.ts`**: Manages scrap content in the system.

- **`content/`**: Houses the markdown content files for the blog, scrapbook, and other sections. This is the source for the markdown processing pipeline.

- **`dist/`**: The output directory for the processed markdown files and other generated content.


---

## Features

- **Markdown Processing**: Converts markdown files into HTML with automatic enhancements.
- **Gist Embedding**: Execute and display Gists (HTML, JS, CSS, JSON) within markdown.
- **VueUse & Pinia**: Vue.js utilities and state management.
- **Scrollytelling Integration**: Trigger animations and events based on user scroll.
- **OpenAI Plugin**: Integrated plugin for AI-powered features.
- **Cloudinary Image Optimization**: Responsive images served from Cloudinary.
- **Syntax Highlighting**: Uses Shiki for beautiful code block rendering.
- **Mermaid Diagrams**: Embed diagrams in markdown files.
- **Automatic TOC Generation**: Adds table of contents based on markdown headings.
- **Custom Link and Image Processing**: Handles internal links, external links, and image transformations.
- **Caching**: Uses NodeCache to optimize image dimensions and other recurring data.


This will set up the project, including the repo and its dependencies for rapid prototyping.

---

## Dependencies

- **Nuxt 3**
- **Vue 3**
- **Node.js**
- **Cloudinary**: For image hosting and optimization.
- **Shiki**: For syntax highlighting.

---

## Development

To set up the project for development, follow these steps:

1. Install dependencies:

```bash
yarn install
```

2. Start the development server:

```bash
yarn dev
```

3. Open the project at `http://localhost:3000`.

---

## Production

To build and preview the project in production mode:

1. Build the project for production:

```bash
yarn build
```

2. Preview the production build locally:

```bash
yarn preview
```

---

## Deployment

Website2 can be deployed on Netlify or any other hosting provider that supports static site generation.

To deploy to Netlify, use the following badge to monitor the deployment status:

[![Netlify Status](https://api.netlify.com/api/v1/badges/981b9e46-6878-4ddb-a716-2713c5f3e412/deploy-status)](https://app.netlify.com/sites/ejfox-nuxt-template/deploys)

---

## Embedding Executable Gists

### Overview

**Website2** allows you to embed executable Gists directly into markdown files. These Gists can contain a combination of HTML, JS, CSS, and other file types to create interactive visualizations or complex web components.

### Basic Usage

To embed a Gist, use the following syntax in your markdown:

```markdown
[gist id="your-gist-id-here"]
```

This will fetch and render all relevant files from the Gist automatically. Supported file types include:
- `index.html`: The primary HTML file.
- `script.js`: JavaScript code for interactivity.
- `styles.css`: Optional styles for custom design.
- `data.json`: Any accompanying data for dynamic content.

### Advanced Features

- **Scrollytelling**: Integrate scrollytelling events by embedding Gists and defining scroll-triggered behaviors in your Gist's JS.
- **Custom Data Handling**: Pass custom JSON data from the Gist into your visualizations.

---

## API Endpoints

Website2 includes a few core API endpoints to interact with the content:

1. **Fetch Single Post**
   - **Endpoint**: `/api/posts/:slug`
   - **Description**: Fetches the content and metadata for a single post.
   - **Returns**: JSON object containing the post's HTML and metadata (title, date, tags).

2. **Fetch All Posts**
   - **Endpoint**: `/api/manifest-lite`
   - **Description**: Retrieves a list of all posts with basic metadata.
   - **Returns**: Array of post metadata (slug, title, date, etc.).

---

## Composables

The system provides several composables to fetch and process content:

1. **`getPostBySlug(slug)`**
   - Fetches the content and metadata of a post by its slug.
   - Example:
     ```js
     const post = await getPostBySlug('my-post-slug')
     ```

2. **`getAllPosts()`**
   - Retrieves all posts, filtered and sorted.
   - Example:
     ```js
     const posts = await getAllPosts()
     ```

3. **`getPostsWithContent(limit, offset)`**
   - Fetches a subset of posts with their full content.
   - Example:
     ```js
     const posts = await getPostsWithContent(10, 0)
     ```

4. **`getNextPrevPosts(slug)`**
   - Fetches the next and previous posts relative to the current one.
   - Example:
     ```js
     const { next, prev } = await getNextPrevPosts('current-slug')
     ```

---

## Markdown Processing

**Website2** uses a highly customized markdown processing pipeline, featuring:

- **Unified & Remark**: The core libraries used for parsing and transforming markdown into HTML.
- **Plugins**: Extends functionality with plugins such as:
  - `remarkParse`: Parses the markdown.
  - `remarkGfm`: Adds support for GitHub Flavored Markdown (tables, task lists).
  - `remarkObsidian`: Enables Obsidian-style internal linking.
  - `rehypeStringify`: Converts processed markdown into HTML.
  - `rehypePrettyCode`: Syntax highlighting using Shiki.

### Custom Features

- **Cloudinary Image Optimization**: Dynamically transforms and optimizes images via Cloudinary, ensuring responsive design and fast load times.
- **Table of Contents (TOC)**: Automatically generates a table of contents from the headings in markdown files.
- **Custom Link & Image Processing**: Special handling for internal links, external links (with icons), and Cloudinary-optimized images.

---

## Caching

Website2 uses **NodeCache** to cache data such as image dimensions and other frequently accessed resources, reducing the need for redundant API calls and improving performance.

- **TTL (Time-to-Live)**: Set to 1 day for most cached resources.
- **Auto-Save**: The cache is saved to disk on exit, ensuring persistence between sessions.

---

## Output

Processed markdown files, including their HTML and metadata, are saved in the `dist/processed` directory. Metadata includes:
- **Title**
- **Slug**
- **Date**
- **Modified Date**
- **Word Count**
- **Reading Time**
- **Image and Link Count**

These files are available through the `/api` endpoints and used to power the website's content delivery.

---

## Advanced Features

1. **Scrollytelling Integration**: Easily trigger animations or events when elements come into view, adding interactivity to your markdown content.
   
2. **Custom Data Handling in Gists**: Pass JSON or other custom data directly from a Gist into your JavaScript for dynamic visualizations.

---

## Development Notes

- The `processMarkdown.mjs` script is responsible for transforming markdown into HTML. It applies several transformations, including image optimization, code syntax highlighting, and GitHub Flavored Markdown support.
- Gist embedding is handled by the markdown processor, fetching all Gist files and rendering them interactively on the page.
- The system is highly customizable, with support for additional markdown plugins and transformations.