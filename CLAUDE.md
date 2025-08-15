# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production (runs TypeScript check first)
- `npm run lint` - Run ESLint on the codebase
- `npm run preview` - Preview production build

## Architecture Overview

This is a React-based 3D model editor built with Babylon.js for 3D rendering. The application follows a component-based architecture with shared state management.

### Core Architecture Components

**State Management:**
- `useSceneState` hook manages global scene state including assets, selection, and Babylon.js objects
- Centralized asset management with mesh mapping for 3D objects

**Layout Structure:**
- **A-Header**: Application header
- **B-SceneEditor**: Main 3D viewport with Babylon.js canvas
- **C-EditorToolbar**: Tools for grid/point cloud toggle and camera controls
- **D-SceneProperties**: Left panel for editing selected object properties
- **E-AssetList**: Right panel showing loaded assets with upload functionality

### 3D Engine Integration

**Babylon.js Scene Management:**
- Scene initialization and camera setup in `SceneEditor.tsx`
- Transform controller system for object manipulation (position, rotation, scale)
- Support for GLB and PLY file formats
- Point cloud rendering for PLY files

**File Import System:**
- Drag & drop functionality for 3D model files
- Asset processing and mesh registration
- File type validation and error handling

### Key Technical Patterns

**Component Communication:**
- Parent-child communication via props and callbacks
- Ref-based API for SceneEditor imperative methods
- Shared types defined in `src/shared/types/index.ts`

**Asset Lifecycle:**
- Asset creation → Scene registration → State management → Cleanup
- Mesh-to-asset ID mapping for 3D object tracking
- Property synchronization between UI and 3D scene

### Upload System

The application includes functionality to upload GLB files to a server endpoint:
- Server upload via `uploadGLBFilesToServer` function
- Progress tracking with real-time updates
- Environment variable configuration via `VITE_UPLOAD_URL`

### File Structure Patterns

Components are organized alphabetically (A-Header, B-SceneEditor, etc.) with utilities in `utils/` subdirectories. Shared code lives in `src/shared/` with hooks, types, and utilities.

### Transform System

The transform system uses a controller pattern:
- `TransformController` manages object manipulation
- `ObjectTransformManager` handles the actual transformations
- Keyboard shortcuts for transform mode switching
- Property panel integration for numeric input