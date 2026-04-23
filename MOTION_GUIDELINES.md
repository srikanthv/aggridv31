# Motion Design Guidelines

This document outlines the standardized motion patterns used across the Enterprise Grid Engine to ensure a high-performance, responsive, and professional user experience.

## 🕒 Timing Tokens

We use precise timing to differentiate between intent, action, and system changes.

| Token | Duration | Usage Context |
| :--- | :--- | :--- |
| `Hover` | **120ms** | Superficial feedback for cursor movement and focus. |
| `Click` | **120ms – 200ms** | Immediate tactile feedback for user actions. |
| `Theme` | **300ms** | Global system shifts (Dark/Light mode) and layout expansions. |

## 🛠 Utility Classes

Apply these classes to JSX elements to inherit standardized motion behaviors:

- `.motion-hover`: Applies `--motion-fast` to all properties. Best for button hover states.
- `.motion-interactive`: Applies `--motion-normal` to all properties. Best for inputs and active feedback.
- `.motion-theme`: Optimized transition for `background-color`, `color`, and `border-color` using `--motion-slow`.

## 🚦 Usage Principles

### ✅ When to Use Motion
- **Hover States**: Provide immediate visual confirmation that an element is interactive.
- **Active States**: Use subtle scale-down effects (`scale-95`) to simulate physical displacement.
- **Toggle Transitions**: Smoothly animate the appearance of dropdowns or sidebars to provide spatial context.
- **System Shifts**: Use coordinated fades during theme changes to prevent visual jarring.

### ❌ When to Avoid Motion
- **Large Data Updates**: Avoid transitioning thousands of grid rows during sorting or filtering; this causes significant frame drops.
- **Critical Paths**: Do not use slow animations for essential navigation; the app should feel "fast" first.
- **Redundant Feedback**: If an element already has a clear visual change (like a color shift), avoid layering too many simultaneous transforms.

## 🚀 Spring Animations (Framer Motion)

The application includes `motion/react` (Framer Motion) for sophisticated, spring-based UI state transitions.

### Setup
Always import `motion` from `motion/react` for optimal bundle size and React 19 compatibility.

```tsx
import { motion, AnimatePresence } from 'motion/react';
```

### Spring Presets
We use centralized presets defined in `@/lib/motionConfig` to ensure physical consistency.

| Preset | Stiffness | Damping | Usage |
| :--- | :--- | :--- | :--- |
| `fast` | 400 | 30 | Instant feedback (dropdowns, small alerts) |
| `medium` | 260 | 25 | Standard layout shifts (sidebar entrance) |
| `slow` | 180 | 22 | Large container entrances (grid reveal) |

```tsx
import { SPRING_PRESETS } from '@/lib/motionConfig';

<motion.div transition={SPRING_PRESETS.medium} />
```

### Integrated Logic
Motion components should utilize our design tokens for consistency where applicable, but generally handle complex spatial transformations (like `x`, `y`, `scale`) that CSS transitions are less suited for in dynamic React environments.

### ⏹ Buttons
```tsx
<button className="motion-hover active:scale-95 hover:bg-slate-100 px-4 py-2 rounded">
  Action Button
</button>
```

### 📊 Grid Rows (CSS)
```css
.ag-row {
  transition: background-color var(--motion-hover);
}
```

### 🏷 Custom Headers
```tsx
<div className="group motion-hover">
  <Icon className="opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-90" />
</div>
```

---
*Last Updated: 2026-04-23*
