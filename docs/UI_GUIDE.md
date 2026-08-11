# ChatApp UI/UX Style Guide

This guide establishes the UI components catalog, typography rules, layout structures, and Tailwind CSS v4 design configurations.

---

## 1. Design Philosophy
- **WhatsApp Aesthetic, Modernized**: Familiar layouts with a clean, modern interface.
- **Accessibility (WCAG 2.1 AA)**: High contrast ratios, native focus outlines, and full keyboard navigation.
- **Fluid Micro-Animations**: Interactive hover states and smooth transition layers.
- **Responsive Layout**: Adapts between multi-pane desktop layouts and single-panel mobile feeds.

---

## 2. Color System (Tailwind CSS v4 Tokens)

The app uses a dark-first design system with light-mode overrides.

### Dark Theme (Default)
| Token Name | Hex Code | Applied Area |
|---|---|---|
| `--bg-primary` | `#111B21` | Main application background |
| `--bg-secondary` | `#1F2C34` | Left navigation sidebar background |
| `--bg-tertiary` | `#202C33` | Active chat room background pane |
| `--bg-input` | `#2A3942` | Input text boxes and hover highlights |
| `--bg-bubble-sent` | `#005C4B` | Sent message bubble background |
| `--bg-bubble-rcvd` | `#1F2C34` | Received message bubble background |
| `--accent-green` | `#00A884` | Primary brand color, buttons, and online badges |
| `--accent-hover` | `#06CF9C` | Interactive hover states |
| `--text-primary` | `#E9EDEF` | Title cards, input texts, and primary headers |
| `--text-secondary`| `#8696A0` | Last message previews, date stamps, and bios |
| `--border-default`| `#2A3942` | Grid dividers and borders |
| `--online-dot` | `#31C557` | Profile online indicator dots |
| `--unread-badge` | `#00A884` | Notification count pill color |

### Light Theme
| Token Name | Hex Code | Applied Area |
|---|---|---|
| `--bg-primary` | `#FFFFFF` | Main application background |
| `--bg-secondary` | `#F0F2F5` | Left navigation sidebar background |
| `--bg-tertiary` | `#EFEAE2` | Chat window workspace (subtle wallpaper overlay) |
| `--bg-input` | `#F0F2F5` | Search text inputs and message input bar |
| `--bg-bubble-sent` | `#D9FDD3` | Sent message bubble background |
| `--bg-bubble-rcvd` | `#FFFFFF` | Received message bubble background |
| `--text-primary` | `#111B21` | Main header and body texts |
| `--text-secondary`| `#667781` | Subtitles and timestamp labels |
| `--border-default`| `#E9EDEF` | Dividers and frame borders |

---

## 3. Typography & Hierarchy

The app uses the **Inter** font family (with fallbacks to `-apple-system`, `BlinkMacSystemFont`, and `sans-serif`).

| Element | CSS Properties | Applied Context |
|---|---|---|
| **Display Header** | `font-size: 28px; font-weight: 700; line-height: 1.2` | App logo branding |
| **Page Title** | `font-size: 22px; font-weight: 600; line-height: 1.3` | Active headers and settings labels |
| **Section Header**| `font-size: 18px; font-weight: 600; line-height: 1.4` | Group info listings and card titles |
| **Message Body** | `font-size: 14.2px; font-weight: 400; line-height: 1.5`| Message bubbles |
| **Meta Caption** | `font-size: 12px; font-weight: 400; line-height: 1.2` | Chat timestamps and message status ticks |
| **Micro Badge** | `font-size: 11px; font-weight: 500; line-height: 1.1` | Unread count badges |

---

## 4. Spacing, Borders & Radius Scale
- **Base Grid**: 4px scaling (4, 8, 12, 16, 20, 24, 32, 40, 48, 64px paddings).
- **Layout Panels**:
  - Sidebar Width: `380px` (fixed on desktop).
  - Main Chat Feed: Expanded full flex layout (`max-width: 900px` centered chat bubble channel).
- **Borders Radius**:
  - Cards & Actions panels: `8px` (`rounded-md`).
  - Overlay Modals: `12px` (`rounded-xl`).
  - Chat message bubbles: `20px` (`rounded-3xl` with modified edge tails).
  - Pill Badges & User Avatars: `9999px` (`rounded-full`).

---

## 5. UI Layout Maps

### Desktop Grid Layout (Width ≥ 1024px)
```
┌─────────────────────────────────────────────────────────────┐
│  Next.js Container Frame (100vh)                            │
│  ┌──────────────────┬──────────────────────────────────────┐ │
│  │ Sidebar (380px)  │ Active Chat Window (flex-1)          │ │
│  │ ┌──────────────┐ │ ┌──────────────────────────────────┐ │ │
│  │ │ User Bar     │ │ │ Active User Header               │ │ │
│  │ ├──────────────┤ │ ├──────────────────────────────────┤ │ │
│  │ │ Search Bar   │ │ │ Message Thread Log               │ │ │
│  │ ├──────────────┤ │ │                                  │ │ │
│  │ │ Active Feed  │ │ │ (react-window Virtualized List)  │ │ │
│  │ │ Chat Row 1   │ │ │                                  │ │ │
│  │ │ Chat Row 2   │ │ │                                  │ │ │
│  │ │ Chat Row 3   │ │ │                                  │ │ │
│  │ │ ...          │ │ ├──────────────────────────────────┤ │ │
│  │ └──────────────┘ │ │ Composer Message Input           │ │ │
│  └──────────────────┴─┴──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Width < 768px)
- **Single-Panel Layout**: The viewport renders either the Sidebar or the Active Chat window, but not both.
- **Navigation Transitions**: Swiping or clicking a conversation triggers a slide transition to focus on the active chat panel.
- **Header Navigation**: A back arrow button in the header closes the active chat room and slides back to display the chat list sidebar.

---

## 6. Components Catalog

### Base Elements (`src/components/ui/`)
- **Avatar**: Renders user profile pictures with fallbacks displaying user initials. Includes a bottom-right absolute indicator dot showing online status.
- **Badge**: Circular green count pill showing unread message status.
- **Button**: Interactive button with variations (`primary`, `secondary`, `ghost`, `danger`) and built-in loading spinner support.
- **Input**: Context-aware input container supporting left-aligned icons and green focus rings.
- **Modal**: Dark backdrop dialog overlay that slide up on mobile viewports.

### Chat Elements (`src/components/chat/`)
- **ChatBubble**: Rounded message bubble styled dynamically based on the author:
  - Sent messages: Align right with green backgrounds.
  - Received messages: Align left with dark-grey backgrounds.
- **ChatHeader**: Header showing the active user's details, online status, and search tools.
- **ChatInput**: Input area that auto-expands to a maximum of 5 lines before adding scrollbars. Includes emoji selection menus, attachment triggers, and voice notes recorders.
- **MessageStatus**: Displays message status icons (single check for sent, double check for delivered, double blue checks for read).
- **DateDivider**: Date headers ("Today", "Yesterday") that separate chat messages by day.
- **TypingIndicator**: A small message bubble containing three bouncing dots.

---

## 7. Transitions & Animations

- **Message Scroll**: Message logs instantly scroll to the bottom on entry with a `300ms ease-out` transition.
- **Mobile Side Panels**: Slide left/right transitions between panels on mobile screen sizes (`250ms cubic-bezier(0.4, 0, 0.2, 1)`).
- **Dropdown menus**: Fade-in and scale-up transition (`150ms ease-out`).
- **Typing indicators**: Custom bounce animations that run on a loops.
- **Pulse indicators**: Skeleton loader indicators that pulse to show background loading actions.
