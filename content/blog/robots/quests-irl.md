---
date: 2024-11-07T11:50:52-05:00
modified: 2024-11-08T16:43:10-05:00
share: true
---
## QuestsIRL (MVP Scope)

### OVERVIEW:

A gamified skill development platform that generates personalized learning paths using LLMs and validates progress through natural conversation.

KEY PRINCIPLES:

1. Everything flows through the tree
2. No traditional UI elements
3. System feels alive/organic
4. Minimal but profound
5. Cyberpunk aesthetic throughout
6. Learning feels like discovery

---

CORE FEATURES:

1. RPG-Style Onboarding
   - Limited to 3 initial paths: HAM Radio, Mountaineering, Electronics
   - Character creation quiz determines starting point
   - Subtle evaluation of both interest and aptitude

2. Skill Tree Visualization
   - Horizontal band layout (inspired by Rust/Path of Exile)
   - Clear level progression
   - Prerequisites as connecting lines
   - Clean, minimal aesthetic
   - Mobile-friendly interaction

3. LLM Pipeline
   a. Generation
   b. Validation/Refinement
   c. Progress Evaluation

4. Progress Tracking
   - Clear acceptance criteria per skill
   - Natural language check-ins
   - LLM-powered completion validation
   - Honor system backup

TECH STACK:

- Frontend: Vue + D3 for visualization
- Backend: TBD
- LLM: Claude/GPT for various prompting needs

---

TRUE MVP NEEDS:

1. ONBOARDING
   - Matrix wake-up
   - 2 Kaoss pads
   - Initial tree generation
   That's it. No maze yet.

2. SKILL TREE
   - Basic visualization
   - Simple interactions
   - 3 starter paths
   Ship it. Add complexity later.

3. PROGRESS
   - Natural language check-ins
   - Basic validation
   Start simple.


CYBERPUNK SKILL DISCOVERY
------------------------
1. THE WAKE UP [30s]

   >"Ready to change your life?"_
   - Matrix-style boot sequence

   - System coming online
   - "Let's find out who you are…"

2. DIALOGUE PHASE [2min]
   Mysterious operator vibe:
   - "What keeps you up at night?"
   - "When you dream, what do you create?"
   - "In chaos, do you seek patterns or action?"
   [Subtle tree begins forming in background]

3. KAOSS PAD PHASE [1.5min]
   Two clean XY interfaces:
   PAD 1: "Tune your frequency…"
   Y: Theory ↕ Practice
   X: System ↔ Action

   PAD 2: "Align your path…"

   Y: Solo ↕ Team

   X: Learn ↔ Build

   [Tree continues evolving]

4. THE TEST [1min]
   "One last thing…"
   - Minimal maze challenge
   - Appears as "system calibration"
   - Actually validates initial reads
   - Subtle, almost an afterthought
   [Tree crystallizes based on performance]

---

LLM TOUCHPOINTS:

1. Onboarding
   - Interpret quiz responses
   - Map to skill affinities
   - Generate initial path recommendation

2. Tree Generation
   - Create structured skill tree
   - Define atomic units
   - Set prerequisites

3. Tree Refinement
   - Expert perspective review
   - Reality check
   - Difficulty curve smoothing

4. Progress Evaluation
   - Natural language check-ins
   - Evidence extraction
   - Completion validation

---

EVALUATOR PROMPT STRUCTURE:

System Context:

- You are a wise mentor figure
- Your goal is to naturally assess skill progression
- Never directly ask "did you complete X?"
- Extract evidence from natural conversation

Evaluation Criteria:

1. Technical accuracy in descriptions
2. Level of detail provided
3. Understanding of underlying principles
4. Evidence of hands-on experience
5. Ability to explain challenges/solutions

Conversation Starters:

- "Tell me about your recent practice…"
- "What challenged you today?"
- "Describe something interesting you learned…"

EVIDENCE CLASSIFICATION MATRIX:

Confidence Level | Low | Medium | High
-----------------|-----|---------|------
Technical Terms  | Used vaguely | Used correctly | Explains to others
Time Details     | General | Specific | Detailed logs
Problem-Solving  | Memorized | Understood | Novel solutions
Physical Details | Abstract | Sensory | Muscle memory
Tool Usage       | Named | Described | Compared/critiqued

1. EVIDENCE GATHERING
- Extract specific phrases
- Map to evidence types
- Assign confidence levels

2. PATTERN MATCHING
- Look for combinations of evidence
- Weight different types appropriately
- Flag inconsistent patterns

3. VALIDATION RULES
- Minimum evidence thresholds
- Required combinations
- Automatic disqualifiers

SKILL TYPE RULES:

Physical Skills (e.g., Bowline):

- Must have: time metrics, sensory details
- High confidence: muscle memory indicators
- Disqualifier: purely theoretical knowledge

Technical Skills (e.g., Radio):

- Must have: problem-solving examples, tool usage
- High confidence: teaching others
- Disqualifier: memorized procedures only

Knowledge Skills (e.g., Navigation):

- Must have: practical application, scenario handling
- High confidence: novel situation adaptation
- Disqualifier: quoted definitions only

---

ATOMIC UNIT REQUIREMENTS:

1. Time-Bounded
   - Learnable in 1-5 practice sessions
   - Clear progression metrics
   - Specific time investments

2. Observable Outcomes
   - Measurable improvements
   - Demonstrable skills
   - Tangible artifacts

3. Dependencies
   - Max 2-3 prerequisites
   - Clear skill relationships
   - No circular dependencies

4. Validation Hooks
   - Built-in evidence markers
   - Practice milestones
   - Progress indicators

UNIT STRUCTURE:

1. Core Activity (~1 hour)
   - Catchy title
   - Clear action steps
   - Specific metrics

2. Practice Plan
   - Daily/weekly breakdown
   - Progressive difficulty
   - Clear checkpoints

3. Success Criteria
   - Quantitative metrics (time, repetitions)
   - Qualitative indicators (form, understanding)
   - Variation mastery

ATOMIC UNIT VALIDATION:

Temporal:

- Core activity fits in ~1 hour
- Practice plan spans 5-7 days
- Clear daily time commitments

Measurable:

- Specific success metrics
- Observable progress steps
- Defined mastery criteria

Practical:

- Can be practiced alone
- Minimal equipment needed
- Mobile-friendly options

Progressive:

- Builds on prerequisites
- Leads to next skills
- Allows for creativity

---

FLOW:

1. Terminal Intro

   >Ready to change your life?_
   [yes] ->Matrix-style wake-up sequence
   [no] ->"Maybe you're not ready for the truth" *window closes*

2. Digital Sensei Scan
   - No boring forms
   - High-dimensional sliders
   - Probing questions that feel like tests

3. Real-time Tree Generation
   - Skills materialize as we learn more
   - Tree grows organically with answers
   - Constant refinement

QUESTIONS STYLE:

"What drives you more…" [slider]

<survival instinct ←→ technical curiosity>

"In darkness, do you…" [slider]

<trust your instincts ←→ rely on tools>

"When something breaks…" [slider]

<fix it yourself ←→ understand the system>

XY PAD QUESTIONS:

1. SURVIVAL INSTINCT
   Y axis: Technical ↕ Physical
   X axis: Planning ↔ Instinct

2. PROBLEM SOLVING
   Y axis: Theory ↕ Practice
   X axis: Deep Dive ↔ Quick Fix

3. LEARNING STYLE
   Y axis: Solo ↕ Collaborative
   X axis: Study ↔ Experience


---

GAME OPTIONS:

1. RHYTHM DOT

+ Immediate feedback

+ Tests multiple skills

- Might favor musical people

2. PATTERN COMPLETION

+ Deep insight into thinking

+ Multiple solve paths

- Could be too abstract

3. UNTANGLE

+ Shows problem-solving style

+ Satisfying to complete

- Might frustrate some users

4. MIRROR DRAW

+ Clear learning curve

+ Tests adaptation

- Could be too challenging

5. RESOURCE BALANCE

+ Rich behavioral data

+ Tests real-world skills

- Might feel like work

6. LOCK PICKING

+ Engaging metaphor

+ Tests patience/precision

- Might take too long

---

QUESTSIRL ONBOARDING FLOW
------------------------

1. MATRIX WAKE-UP SEQUENCE

   >"Ready to change your life?"_
   [yes] ->continue
   [no] ->window closes
   - Glitch effects (minimal)

   - Terminal aesthetic
   - UI elements compile in corners

2. XY KAOSS PADS (3-4 total)
   SURVIVAL INSTINCT PAD
   Y: Technical ↕ Physical
   X: Planning ↔ Instinct

   PROBLEM SOLVING PAD

   Y: Theory ↕ Practice

   X: Deep Dive ↔ Quick Fix

   LEARNING STYLE PAD

   Y: Solo ↕ Collaborative

   X: Study ↔ Experience

3. MAZE TRACER ANALYSIS
   MECHANICS:
   - Mouse/touch trace through maze
   - 10 progressive levels
   - 10-15s per level (optimal)
   - 5min total limit
   - Auto-advance on completion
   - Clean geometric aesthetic

   PROGRESSION:

   L1-L3: Basic patterns

   L4-L7: Increasing complexity

   L8-10: Master patterns

   METRICS:

   - Time per level
   - Restart frequency
   - Movement precision
   - Path choice
   - Learning curve

   PLAYER ARCHETYPES:

   Rusher: Fast, many restarts → hands-on learner

   Planner: Slow, precise → analytical

   Optimizer: Adaptive, improving → strategic

   Perfectionist: Thorough → detail-oriented

4. SKILL TREE GENERATION
   - Builds during XY pad input
   - Refines based on maze performance
   - Minimal, geometric visualization
   - Electric connections between nodes

VISUAL AESTHETIC:

- Black background
- Neon accent colors
- Minimal geometric shapes
- Subtle particle effects
- Circuit-board motifs

---

NEURAL INTERFACE
---------------

[CORE VIEW]

- Skill tree as primary interface
- Glowing nodes show progress
- Pulse effects for active skills
- Recent memory traces (activity history)

[UPGRADES]

- Skills appear as discovered protocols
- New techniques emerge through practice
- System "compiles" feedback into improvements

[TRANSMISSION]

- Direct neural feedback (ratings)
- Emergency broadcast channel (support)
- Encrypted data streams (privacy)

[OPERATOR VIEW]

- Mission control interface for admins
- Real-time neural pattern analysis
- Training protocol management

---

### QUESTSIRL MVP STRUCTURE

```

/src
├── components/
│   ├── core/
│   │   ├── TerminalBoot.vue       // Matrix wake-up
│   │   ├── KaossPad.vue           // XY input pad
│   │   └── SkillTree.vue          // Main tree viz
│   │
│   ├── tree/
│   │   ├── TreeNode.vue           // Individual nodes
│   │   ├── TreeConnection.vue     // Node connections
│   │   └── TreeControls.vue       // Zoom/pan
│   │
│   └── shared/
│       ├── GlitchText.vue         // Cyberpunk text
│       └── LoadingState.vue       // Simple spinner

├── stores/
│   ├── skillTree.js               // Tree state
│   └── userProgress.js            // Progress state

├── services/
│   ├── llm/
│   │   ├── client.js              // API wrapper
│   │   └── prompts.js             // Basic templates
│   │
│   └── treeGenerator/
│       ├── generator.js           // Tree builder
│       └── validation.js          // Basic checks

├── styles/
│   ├── _variables.scss            // Cyberpunk theme
│   └── main.scss                  // Global styles

└── utils/
    ├── d3helpers.js              // Tree viz helpers
    └── animations.js             // Basic effects
```


```
CREATE TABLE skills (
    -- Core Fields
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES skills(id),
    title TEXT NOT NULL,
    description TEXT,
    
    -- Classification
    level INTEGER NOT NULL,
    category TEXT NOT NULL,      -- 'electronics', 'radio', 'climbing'
    type TEXT NOT NULL,          -- 'technical', 'physical', 'knowledge'
    
    -- Visual/UI
    icon TEXT,                   -- icon identifier
    color TEXT,                  -- hex for node color
    position_x INTEGER,          -- for manual tree layout tweaks
    position_y INTEGER,
    
    -- Progress Tracking
    status TEXT DEFAULT 'locked',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- User Association
    user_id UUID,               -- null for template skills
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- The Good Stuff
    prerequisites JSONB,         -- array of skill IDs needed
    validation_rules JSONB,      -- what counts as "done"
    completion_data JSONB,       -- evidence of completion
    custom_data JSONB           -- for whatever weird stuff we think of later
);
```

```
// types.ts
export interface SkillNode {
    id: string;
    parent_id: string | null;
    title: string;
    description: string;
    level: number;
    category: string;    // LLM generated
    type: string;        // LLM generated
    status: string;      // simple status tracking
    position_x?: number;
    position_y?: number;
    
    // Keep it flexible for LLM
    prerequisites?: string[];
    custom_data?: Record<string, unknown>;
}

// D3 needs these
export interface SkillLink {
    source: string;
    target: string;
}

export interface D3SkillNode extends SkillNode {
    x: number;
    y: number;
}

export interface D3TreeData {
    nodes: D3SkillNode[];
    links: SkillLink[];
}

// Simple transformer
export function transformToD3Format(skills: SkillNode[]): D3TreeData {
    const nodes = skills.map(skill => ({
        ...skill,
        x: skill.position_x ?? 0,
        y: skill.position_y ?? 0
    }));

    const links = skills
        .filter(skill => skill.parent_id)
        .map(skill => ({
            source: skill.parent_id!,
            target: skill.id
        }));

    return { nodes, links };
}
```


---

## QuestsIRL Development Plan

### Overview

QuestsIRL is a gamified skill development platform that creates personalized learning paths using Large Language Models (LLMs) and validates progress through natural conversations. This development plan outlines the architecture and integration steps using **Supabase**, **Nuxt.js**, and **Cloudflare** to build and deploy the MVP.

### Architecture Components

#### 1. Frontend: Nuxt.js
- **Framework:** Utilize Nuxt.js for its Vue.js foundation, enabling server-side rendering (SSR) for improved performance and SEO.
- **Features:**
  - **User Onboarding:** Implement RPG-style initial paths to engage users from the start.
  - **Skill Tree Visualization:** Use Vue combined with D3.js and anime.js to create dynamic and animated skill trees.
  - **Progressive Web App (PWA):** Enable offline access and push notifications to enhance user experience on mobile devices.
  - **Responsive Design:** Ensure the application is fully responsive for both mobile and desktop users.

#### 2. Backend: Supabase
- **Services:**
  - **Database:** Leverage Supabase’s PostgreSQL for structured and scalable data storage.
  - **Authentication:** Use Supabase Auth to handle user sign-ups, logins, and session management securely.
  - **Real-Time Capabilities:** Enable live updates for Skill Trees and user progress tracking.
  - **Storage:** Manage user-generated content and media files efficiently.

#### 3. Hosting & Edge Computing: Cloudflare
- **Cloudflare Workers:**
  - **API Handling:** Manage API requests and serverless functions to ensure low latency and high performance.
  - **LLM Integration:** Connect with OpenAI GPT-4 for generating personalized learning paths and validating user progress.
  - **Synchronization:** Handle synchronization between client-side SQLite databases and Durable Objects to maintain data consistency.
- **Durable Objects with SQLite-in-DO:**
  - **Per-User Databases:** Assign individual SQLite databases to each user’s skill tree for zero-latency access and data isolation.
  - **Offline Support:** Enable users to interact with their skill trees offline, with seamless synchronization when back online.

#### 4. LLM Generation: OpenAI GPT-4 via Cloudflare Workers
- **Functions:**
  - **Personalized Learning Paths:** Generate customized learning plans based on user interactions and preferences.
  - **Progress Validation:** Use natural language processing to assess and validate user progress through conversations.

#### 5. Authentication: Supabase Auth
- **Features:**
  - **OAuth Integration:** Support for social logins such as Google and GitHub.
  - **Email Verification & Password Recovery:** Ensure secure account creation and easy password management.
  - **Secure Session Management:** Maintain user sessions securely across devices.

### Integration Steps

#### Phase 1: Setup and Configuration

1. **Initialize Nuxt.js Project**
   - Create a new Nuxt.js project using the Nuxt CLI.
   - Install necessary dependencies and configure environment variables for Supabase and Cloudflare integration.

2. **Set Up Supabase**
   - Create a Supabase project and obtain the necessary API keys.
   - Integrate Supabase with Nuxt.js by installing the Supabase client and setting up a plugin for initialization.

3. **Set Up Cloudflare Pages and Workers**
   - **Create Cloudflare Account:** Sign up for a Cloudflare account if you haven’t already.
   - **Install Wrangler CLI:** Install the Cloudflare Workers CLI tool to manage deployments.
   - **Initialize Cloudflare Workers:** Use Wrangler to set up Cloudflare Workers within your project.
   - **Configure Deployment:** Update the `wrangler.toml` file with your Cloudflare account details and routing patterns.
   - **Deploy Nuxt.js to Cloudflare Pages:** Build your Nuxt.js project and deploy it to Cloudflare Pages using GitHub integration.

4. **Set Up Durable Objects with SQLite-in-DO**
   - **Configure Durable Objects:** Define Durable Objects in the `wrangler.toml` file to manage per-user SQLite databases.
   - **Create Durable Object Classes:** Develop the necessary classes to handle skill tree data and ensure efficient data access.
   - **Deploy Workers:** Publish the Cloudflare Workers with Durable Objects configured.

#### Phase 2: Core Features Development

1. **User Authentication with Supabase**
   - Implement Supabase Auth within Nuxt.js to handle user sign-ups, logins, and secure session management.

2. **Skill Tree Visualization**
   - Develop the Skill Tree component using Vue.js, integrating D3.js for data-driven visualizations and anime.js for smooth animations.

3. **LLM Integration with OpenAI GPT-4**
   - Configure Cloudflare Workers to interact with OpenAI’s GPT-4 API for generating and validating personalized learning paths.

#### Phase 3: Synchronization and Storage

1. **Implement SQLite-in-DO Synchronization**
   - Set up client-side SQLite using libraries like sql.js to manage local data storage.
   - Develop synchronization mechanisms to ensure data consistency between client-side SQLite and Cloudflare Durable Objects.

2. **Enable Offline Support**
   - Configure PWA features in Nuxt.js to allow users to access and interact with their skill trees offline.
   - Ensure seamless data synchronization when users reconnect to the internet.

#### Phase 4: Testing and Optimization

1. **Automated Testing**
   - Set up a testing framework using tools like Jest and Vue Test Utils.
   - Write and execute tests for both frontend and backend components to ensure reliability and performance.

2. **Performance Optimization**
   - Optimize Cloudflare Workers for low latency by minimizing external API calls and utilizing caching mechanisms.
   - Enhance mobile performance and responsiveness through efficient coding practices and resource management.

#### Phase 5: Deployment and Monitoring

1. **CI/CD Pipeline with GitHub Actions**
   - Create a GitHub Actions workflow to automate the build and deployment process to Cloudflare Pages.
   - Ensure that deployments are triggered on pushes to the main branch for continuous integration.

2. **Monitoring and Logging**
   - Utilize Cloudflare Analytics for real-time insights into application performance and user interactions.
   - Use Supabase’s built-in monitoring tools to track database performance and health.

### Detailed Cloudflare Integration Guide

#### Step 1: Create Cloudflare Account and Set Up Wrangler CLI
- **Sign Up:** Visit Cloudflare’s website and create an account.
- **Install Wrangler:** Use npm to install the Wrangler CLI tool.
- **Login to Wrangler:** Authenticate the CLI with your Cloudflare account using the provided commands.

#### Step 2: Initialize Cloudflare Workers in Your Project
- **Initialize Worker:** Use Wrangler to set up a new Worker project within your Nuxt.js application.
- **Configure `wrangler.toml`:** Update the configuration file with your Cloudflare account ID, Workers settings, and routing patterns to manage traffic effectively.

#### Step 3: Deploy Nuxt.js to Cloudflare Pages
- **Build Project:** Run the build and generate commands to prepare your Nuxt.js project for deployment.
- **Deploy via Cloudflare Pages:** Connect your GitHub repository to Cloudflare Pages, set the build command to `npm run generate`, and specify the output directory as `dist`. Follow Cloudflare’s prompts to complete the deployment.

#### Step 4: Set Up Durable Objects with SQLite-in-DO
- **Configure Durable Objects:** Define Durable Objects in the `wrangler.toml` file to manage individual SQLite databases for each user.
- **Develop Durable Object Classes:** Create classes that handle data operations, ensuring efficient access and synchronization.
- **Deploy Workers:** Use Wrangler to publish the Workers, ensuring Durable Objects are correctly set up and accessible.
- **Durable Object Instances:** Assign a unique Durable Object instance to each user, representing their personalized skill tree. This ensures isolated and consistent state management per user.
- **State Management:** Utilize the in-memory capabilities of Durable Objects for real-time interactions, such as skill progression and user inputs.

##### **2. Persistent Storage with Embedded SQLite**

- **SQLite Integration:** Leverage the embedded SQLite database within each Durable Object to store user-specific data, including skill statuses, progression metrics, and interaction logs. This setup provides low-latency data access and simplifies data management.

- **Data Synchronization:** Implement mechanisms to synchronize in-memory state with the SQLite database, ensuring data persistence and consistency across sessions.

##### **3. Interaction with Frontend Components**

- **API Endpoints:** Expose API endpoints through Cloudflare Workers that interact with the Durable Objects. These endpoints handle requests from the Nuxt.js frontend, facilitating operations like retrieving the skill tree structure, updating progress, and validating achievements.

- **Real-Time Updates:** Utilize WebSockets or similar technologies to push real-time updates from Durable Objects to the frontend, enhancing user engagement through immediate feedback on their actions.

##### **4. Scalability and Performance Considerations**

- **Load Distribution:** Distribute Durable Object instances across Cloudflare's global network to minimize latency and optimize performance for users in different regions.

- **Resource Management:** Monitor and manage the resource utilization of Durable Objects to ensure efficient operation, especially under varying user loads.

#### Step 5: Connect Nuxt.js Frontend with Cloudflare Workers
- **API Integration:** Implement communication between the Nuxt.js frontend and Cloudflare Workers by using fetch or Axios to interact with API endpoints.
- **Data Handling:** Ensure that data fetched from Cloudflare Workers is correctly integrated into the frontend components, maintaining real-time updates and synchronization.

#### Step 6: Implement Bindings in Nuxt.js
- **Set Up Bindings for Local Development:** Use the `nitro-cloudflare-dev` module in Nuxt.js to emulate Cloudflare bindings during development.
- **Configure Bindings in Cloudflare Dashboard:** Define necessary bindings such as Durable Objects and KV namespaces within the Cloudflare dashboard to enable seamless interaction with backend services.
- **Access Bindings in Nuxt.js:** Utilize server-side code within Nuxt.js to interact with Cloudflare bindings through the provided context object, ensuring efficient data access and manipulation.

### Next Steps

1. **Kickoff Meeting:**
   - Review the development plan with the team
   - Assign specific tasks and set deadlines

2. **Development:**
   - Begin frontend and backend setup concurrently
   - Start integrating Supabase with Nuxt.js and Cloudflare Workers

3. **Integration:**
   - Connect Nuxt.js with Supabase and Cloudflare Workers
   - Implement Durable Objects for SQLite storage

4. **Testing:**
   - Implement and run automated tests
   - Conduct user testing for feedback

5. **Deployment:**
   - Deploy to staging for testing
   - Gather feedback and iterate

6. **Launch:**
   - Deploy MVP to production
   - Monitor performance and iterate based on user feedback

---

*Let's make QuestsIRL a seamless, engaging, and highly performant experience for our users. Remember, YOLO but thoughtful! *