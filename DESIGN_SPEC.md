# Crypto Clicker - Design Specification

## Design Philosophy
A bold, blocky, retro-futuristic clicker game with sharp geometric shapes, monospace typography, and a cyber aesthetic. The design emphasizes tactile feedback, clear visual hierarchy, and satisfying interactions. No rounded corners - everything is sharp and geometric.

---

## Color Palette

### Primary Theme (Cyber Blue)
- **Background**: `#0a0a0f` (Deep space black)
- **Surface**: `#1a1a2e` (Dark navy)
- **Primary Accent**: `#00d4ff` (Bright cyan)
- **Secondary Accent**: `#7b2cbf` (Deep purple)
- **Success/Positive**: `#00ff88` (Bright green)
- **Warning**: `#ffaa00` (Amber)
- **Text Primary**: `#ffffff` (White)
- **Text Secondary**: `#a0a0b0` (Light gray)
- **Border**: `#2a2a3e` (Subtle border)

### Button Colors (3D Effect)
- **Button Top**: `#ff3333` (Bright red)
- **Button Base**: `#8b0000` (Dark maroon)
- **Button Highlight**: `#ff6666` (Light red for glossy effect)
- **Button Shadow**: `rgba(0, 0, 0, 0.5)` (Drop shadow)

### Alternative Themes

#### Minecraft Theme
- Background: `#2d5016` (Grass green)
- Surface: `#8b4513` (Brown)
- Primary: `#00ff00` (Lime green)
- Secondary: `#654321` (Dark brown)

#### Anime Theme
- Background: `#ff1493` (Hot pink)
- Surface: `#ff69b4` (Pink)
- Primary: `#ffff00` (Yellow)
- Secondary: `#ff00ff` (Magenta)

#### Retro Theme
- Background: `#000000` (Pure black)
- Surface: `#1a1a1a` (Dark gray)
- Primary: `#00ff00` (Lime green)
- Secondary: `#ff00ff` (Magenta)

---

## Typography

### Font Family
- **Primary**: `Geist Mono` (monospace)
- **Fallback**: `'Courier New', monospace`

### Font Sizes & Weights
- **Heading 1**: `32px`, `700` weight
- **Heading 2**: `24px`, `600` weight
- **Heading 3**: `20px`, `600` weight
- **Body Large**: `18px`, `500` weight
- **Body**: `16px`, `400` weight
- **Body Small**: `14px`, `400` weight
- **Caption**: `12px`, `400` weight

### Text Styles
- All text uses monospace font
- Numbers should be tabular for alignment
- Use uppercase for labels and buttons
- Letter spacing: `0.5px` for headings

---

## Layout Structure

### Grid System
- **Container Max Width**: Full viewport
- **Spacing Scale**: 4px base unit (4, 8, 12, 16, 24, 32, 48, 64px)
- **Layout**: Two-column split (60/40 ratio on desktop)
  - Left: Clicker area (60%)
  - Right: Store/Upgrades tabs (40%)

### Responsive Breakpoints
- **Mobile**: < 768px (single column, stacked)
- **Desktop**: ≥ 768px (two columns)

### Spacing
- **Section Padding**: 24px
- **Card Padding**: 16px
- **Gap Between Elements**: 16px
- **Gap Between Sections**: 24px

---

## Component Specifications

### 1. 3D Button Coin (Main Clicker)

**Visual Design:**
- **Shape**: Perfect circle, 200px diameter
- **Structure**: Two-layer 3D effect
  - Top layer: Bright red (#ff3333) circle
  - Bottom layer: Dark maroon (#8b0000) offset by 8px down and right
- **Glossy Highlight**: 
  - White radial gradient at top-left (30% opacity)
  - Position: 25% from top, 25% from left
  - Size: 40% of button diameter
- **Shadow**: 
  - Drop shadow: 0px 10px 30px rgba(0, 0, 0, 0.5)
  - Inner shadow on base layer for depth
- **Border**: None
- **Cursor**: pointer

**Interaction States:**
- **Hover**: 
  - Scale: 1.05
  - Brightness: 110%
  - Transition: 200ms ease
- **Active (Click)**: 
  - Transform: translateY(6px) - button "pushes down"
  - Base layer offset reduces to 2px
  - Duration: 100ms
  - Shadow reduces
- **Release**: 
  - Bounce back animation (spring effect)
  - Duration: 300ms with ease-out

**Animations:**
- Idle: Subtle floating animation (2px up/down, 3s duration, infinite)
- Click: Bounce down then spring back
- Particle burst on each click (see Particle Effect)

### 2. Particle Effect

**Trigger**: On coin click
**Particles**: 
- Count: 8-12 particles per click
- Shape: Small circles (4-8px diameter)
- Color: Matches theme primary color (#00d4ff default)
- Spawn: From click position on coin
- Movement: Radial burst outward
- Distance: 80-120px from origin
- Duration: 600ms
- Opacity: Fade from 1 to 0
- Physics: Slight gravity effect (particles arc downward)

### 3. Stats Display (Top Bar)

**Layout**: Horizontal flex, space-between
**Background**: Semi-transparent surface (#1a1a2e with 80% opacity)
**Border**: 2px solid border color (#2a2a3e)
**Padding**: 16px 24px
**Items**:
- Gems counter (large, prominent)
- Gems per second (smaller, secondary color)
- Wallet address (truncated, monospace)
- Budget display (if connected)

**Gem Counter Animation**:
- Number increments smoothly
- Scale pulse on significant increases (1.0 → 1.1 → 1.0)
- Color flash on power-up activation

### 4. Content Blocks (Store/Upgrades)

**Shape**: Sharp rectangles, NO border-radius
**Background**: Surface color (#1a1a2e)
**Border**: 2px solid border color (#2a2a3e)
**Padding**: 16px
**Shadow**: None or subtle flat shadow

**Tab Navigation**:
- Horizontal tabs at top
- Active tab: Primary accent color background
- Inactive tab: Surface color, 60% opacity
- Border: 2px solid, sharp corners
- Transition: 200ms ease

**List Items** (Upgrades/Store):
- Layout: Flex row, space-between
- Border bottom: 1px solid border color
- Padding: 12px 0
- Hover: Background lightens by 5%

### 5. Buttons (UI Buttons)

**Primary Button**:
- Background: Primary accent (#00d4ff)
- Text: Dark background color for contrast
- Padding: 12px 24px
- Border: 2px solid (same as background)
- Font: Bold, uppercase
- Hover: Brightness 110%, scale 1.02
- Active: Scale 0.98
- Disabled: 40% opacity, no hover effects

**Secondary Button**:
- Background: Transparent
- Border: 2px solid primary accent
- Text: Primary accent color
- Same padding and interactions as primary

**Purchase Button** (Store items):
- Small, compact
- Shows price in USDC
- Disabled state when insufficient budget
- Success animation on purchase (green flash)

### 6. Power-Up Indicators

**Active Power-Up Display**:
- Position: Below stats bar or floating
- Background: Success color (#00ff88) with 20% opacity
- Border: 2px solid success color
- Content: Power-up name + countdown timer
- Animation: Pulse effect during active duration

**Timer**:
- Circular progress indicator or linear bar
- Depletes over power-up duration
- Color transitions from green → yellow → red as time runs out

---

## Animations & Transitions

### Global Animation Principles
- **Duration**: 200-300ms for most interactions
- **Easing**: ease-out for entrances, ease-in for exits
- **Spring**: Use for satisfying feedback (button bounce)
- **Performance**: Use transform and opacity only (GPU accelerated)

### Specific Animations

**Coin Click Sequence**:
1. Button press down (100ms)
2. Particle burst spawns
3. Gem counter increments
4. Button springs back (300ms)
5. Floating animation resumes

**Number Increment**:
- Smooth counting animation
- Duration: 500ms
- Easing: ease-out

**Tab Switch**:
- Fade out old content (150ms)
- Fade in new content (150ms)
- Stagger: 50ms delay between

**Purchase Success**:
1. Button flashes green (200ms)
2. Item appears in inventory
3. Budget counter updates
4. Success particle effect

---

## Theme System

### Theme Structure
Each theme overrides:
- Background colors (2 levels)
- Primary and secondary accent colors
- Border colors
- Text colors (if needed for contrast)
- Font family (optional - Minecraft uses blocky font)

### Theme Switching
- Instant color transition (no animation)
- Preserve all game state
- Update all components simultaneously
- Store preference in localStorage

### Theme-Specific Adjustments

**Minecraft**:
- Font: Blocky/pixelated style
- Borders: Thicker (3px)
- Shadows: Pixelated/stepped

**Anime**:
- Gradients allowed (vibrant)
- Sparkle effects on interactions
- More saturated colors

**Retro**:
- Scanline overlay effect
- CRT screen curvature (subtle)
- Phosphor glow on text
- Limited color palette

---

## Interaction Feedback

### Click Feedback Hierarchy
1. **Visual**: Button press animation
2. **Particle**: Burst effect
3. **Numeric**: Counter increment
4. **Audio** (optional): Click sound

### Hover States
- All interactive elements have hover states
- Cursor changes to pointer
- Subtle scale or brightness change
- Transition: 200ms

### Loading States
- Spinner or pulse animation
- Disable interactions during loading
- Show loading text in monospace font

---

## Accessibility

### Contrast Ratios
- Text on background: Minimum 4.5:1
- Large text: Minimum 3:1
- Interactive elements: Clear focus states

### Focus States
- 2px solid outline in primary accent color
- Offset: 2px from element
- Visible on keyboard navigation

### Motion
- Respect prefers-reduced-motion
- Disable particle effects if requested
- Reduce animation durations by 50%

---

## Technical Implementation Notes

### CSS Architecture
- Use Tailwind CSS utility classes
- Custom animations in globals.css
- CSS variables for theme colors
- No border-radius anywhere (set to 0)

### Performance
- Use CSS transforms for animations
- Debounce rapid clicks if needed
- Optimize particle rendering
- Lazy load theme assets

### State Management
- React useState for local state
- localStorage for persistence
- Real-time updates for counters

---

## File Structure
\`\`\`
app/
  page.tsx          # Main game layout
  globals.css       # Theme variables, animations
components/
  clickable-coin.tsx    # 3D button with bounce
  particle-effect.tsx   # Click particles
  stats-bar.tsx         # Top stats display
  store-panel.tsx       # Store UI
  upgrades-panel.tsx    # Upgrades UI
\`\`\`

---

## Key Design Principles

1. **Sharp & Geometric**: No rounded corners, everything is blocky
2. **Monospace Everything**: Consistent typography throughout
3. **Tactile Feedback**: Every interaction feels satisfying
4. **High Contrast**: Clear visual hierarchy
5. **Cyber Aesthetic**: Futuristic, technical, game-like
6. **Performance First**: Smooth 60fps animations
7. **Theme Flexibility**: Easy to swap entire color schemes

---

## Example Component Code Patterns

### 3D Button CSS
\`\`\`css
.button-3d {
  position: relative;
  width: 200px;
  height: 200px;
  cursor: pointer;
  transition: transform 100ms ease;
}

.button-top {
  position: absolute;
  width: 100%;
  height: 100%;
  background: #ff3333;
  border-radius: 50%;
  box-shadow: 
    inset -10px -10px 20px rgba(0,0,0,0.3),
    0 10px 30px rgba(0,0,0,0.5);
}

.button-top::before {
  content: '';
  position: absolute;
  top: 25%;
  left: 25%;
  width: 40%;
  height: 40%;
  background: radial-gradient(circle, rgba(255,255,255,0.3), transparent);
  border-radius: 50%;
}

.button-base {
  position: absolute;
  width: 100%;
  height: 100%;
  background: #8b0000;
  border-radius: 50%;
  transform: translate(8px, 8px);
  z-index: -1;
}

.button-3d:active {
  transform: translateY(6px);
}

.button-3d:active .button-base {
  transform: translate(2px, 2px);
}
\`\`\`

### Sharp Block CSS
\`\`\`css
.content-block {
  background: #1a1a2e;
  border: 2px solid #2a2a3e;
  border-radius: 0; /* NO ROUNDING */
  padding: 16px;
  font-family: 'Geist Mono', monospace;
}
\`\`\`

---

## Design Checklist

- [ ] All elements use monospace font
- [ ] No border-radius anywhere (all sharp corners)
- [ ] 3D button has proper depth and bounce
- [ ] Particle effects spawn on click
- [ ] Color palette is consistent
- [ ] Hover states on all interactive elements
- [ ] Theme switching works correctly
- [ ] Animations are smooth (60fps)
- [ ] High contrast for readability
- [ ] Responsive layout works on mobile

---

**End of Design Specification**
