---
name: Be Fit
description: Shared training log for daily check-ins and a clear group ledger
colors:
  "canvas": "#F7F8F4"
  "surface": "#FFFFFF"
  "inset": "#EEF1E9"
  "divider": "#E3E7DE"
  "ink": "#202C25"
  "muted": "#647064"
  "action": "#276248"
  "action-tint": "#E7EFE4"
  "penalty": "#A14F30"
  "penalty-tint": "#FBEEE5"
  "sidebar": "#F0F2EB"
  "nav-selected": "#E0E9DA"
  "avatar": "#DFE8D7"
  "avatar-ink": "#4F6246"
  "avatar-alternate": "#F0E5D8"
  "done-border": "#BAD0B1"
  "missed-border": "#E8C7B6"
  "input-border": "#D9DFD3"
  "dues-divider": "#EDDACB"
  "text-selection": "#D7E8CB"
typography:
  "headline":
    fontSize: "32px"
    fontWeight: 600
    lineHeight: "40px"
    letterSpacing: "-0.9px"
    fontFamily: "system-ui, sans-serif"
  "headline-mobile":
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "31px"
    fontFamily: "system-ui, sans-serif"
  "section":
    fontSize: "17px"
    fontWeight: 600
    letterSpacing: "-0.3px"
    fontFamily: "system-ui, sans-serif"
  "challenge-title":
    fontSize: "20px"
    fontWeight: 600
    letterSpacing: "-0.5px"
    fontFamily: "system-ui, sans-serif"
  "goal-title":
    fontSize: "15px"
    fontWeight: 600
    lineHeight: "23px"
    fontFamily: "system-ui, sans-serif"
  "body":
    fontSize: "14px"
    lineHeight: "23px"
    fontFamily: "system-ui, sans-serif"
  "label":
    fontSize: "13px"
    fontWeight: 600
    lineHeight: "20px"
    fontFamily: "system-ui, sans-serif"
  "caption":
    fontSize: "12px"
    lineHeight: "19px"
    fontFamily: "system-ui, sans-serif"
  "rule":
    fontSize: "11px"
    lineHeight: "16px"
    fontFamily: "system-ui, sans-serif"
  "button":
    fontSize: "13px"
    fontWeight: 600
    fontFamily: "system-ui, sans-serif"
  "dues":
    fontSize: "40px"
    fontWeight: 500
    letterSpacing: "-1px"
    fontFamily: "system-ui, sans-serif"
  "ledger":
    fontSize: "34px"
    fontWeight: 500
    letterSpacing: "-0.8px"
    fontFamily: "system-ui, sans-serif"
  "progress":
    fontSize: "26px"
    fontWeight: 500
    fontFamily: "system-ui, sans-serif"
rounded:
  "panel": "12px"
  "control": "8px"
  "check-choice": "7px"
  "date": "9px"
  "goal-icon": "10px"
  "status": "20px"
  "progress": "4px"
spacing:
  "4": "4px"
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "20": "20px"
  "22": "22px"
  "24": "24px"
  "28": "28px"
  "32": "32px"
  "40": "40px"
  "48": "48px"
components:
  "button-primary":
    backgroundColor: "{colors.action}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "11px 18px"
  "button-secondary":
    backgroundColor: "{colors.action-tint}"
    textColor: "{colors.action}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "11px 18px"
  "input":
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 13px"
  "panel":
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "24px"
  "badge":
    backgroundColor: "{colors.action-tint}"
    textColor: "{colors.action}"
    rounded: "{rounded.status}"
    padding: "5px 10px"
  "nav-selected":
    backgroundColor: "{colors.nav-selected}"
    textColor: "{colors.action}"
    rounded: "{rounded.control}"
    padding: "0 14px"
  "goal-done":
    backgroundColor: "{colors.action-tint}"
    textColor: "{colors.action}"
    rounded: "{rounded.check-choice}"
  "goal-missed":
    backgroundColor: "{colors.penalty-tint}"
    textColor: "{colors.penalty}"
    rounded: "{rounded.check-choice}"
---

# Design System: Be Fit

## Overview

**Creative North Star: "Shared training log"**

A quiet, warm workspace makes a daily checklist and shared accountability ledger easy to scan. Forest green marks action and completion; terracotta explains fines and misses. Compact operational typography and simple bordered surfaces keep the task close.

**Key Characteristics:**
- Fast, reversible daily check-ins.
- Explicit states and traceable money.
- Shared React Native primitives, with Expo web as the shipping target.

## Colors

### Primary
Forest action green drives primary actions, selected dates, completion and positive balances. Its pale tint supports secondary buttons, success messages and Done choices.

### Secondary
Terracotta penalty ink and its peach tint distinguish Missed choices, outstanding dues and errors. Penalty information always includes an explanatory label.

### Neutral
Warm canvas, white panels and inset green-gray surfaces establish hierarchy. Dark ink carries primary text; muted ink carries descriptions, captions and rules. The sidebar, selected navigation, avatar and state-border tokens record the additional source colors. The frontmatter is normative.

**The Labeled State Rule.** Every goal choice retains its Done or Missed label; an unset choice remains Pending. Color supports the label.

## Typography

React Native's default system sans is used without an installed text font; the portable frontmatter describes its web equivalent. This is operational application typography, not a separate display-face system.

Page headlines use the headline role and the compact headline-mobile role on Today. Section headings, challenge titles, goal titles, body, labels, captions and fine rules each use the roles above. Button text is semibold. Navigation uses medium body-size text on desktop and compact rule-size text on mobile; selected navigation becomes bold. Dues, ledger totals and progress percentages use tabular numerals. Mobile ledger totals reduce to 25px; fine previews use 16px semibold text. The prior provisional 13/15/17/21/28/36 ramp did not match implementation and is superseded.

## Layout

At widths of 760px and above, a persistent sidebar (224px) holds Today, Challenges, Progress and Ledger. Below 760px it becomes labeled bottom navigation with a compact top bar. Account opens a dedicated page. Content is centered and capped at 1240px, with desktop outer padding (40px) and mobile padding (20px); mobile scrolling reserves 110px below content for navigation.

Below 1140px, split content becomes a column. Wider Today places the checklist beside a group overview (296px wide), with a gap (24px). Mobile Today starts with a compact greeting, challenge summary and seven-day strip; the first complete goal and its two actions are kept above bottom navigation at the reviewed mobile viewport. The summary's secondary footer is hidden on mobile. This is the current Today composition, not a required template for every screen.

Reusable spacing is recorded above; implementation also uses local optical adjustments. Panel padding is usually 24px, group panels 22px, mobile checklist headings 16px and the compact mobile challenge summary 12px. Forms stack on mobile. The date strip scrolls horizontally when needed, with date targets at least 44px wide and 64px tall.

## Elevation & Depth

White panels, inset fills and thin dividing lines create a flat workspace. There are no shipped shadows or decorative entrance animations. Buttons change opacity immediately on hover or press; navigation uses a pale hover fill.

**The Flat Surface Rule.** Use borders and tonal backgrounds to separate surfaces; no shadows are shipped.

## Shapes

Panels and challenge cards use the panel radius; standard controls use the control radius. Goal choices have the smaller check-choice radius and selected dates the date radius. Compact badges and circular avatars use rounded silhouettes. Borders are generally 1px. Progress tracks are shallow, clipped and rounded.

## Components

Primary buttons pair action green with white semibold text; secondary buttons use the action tint and green text. Both retain a minimum height (44px). Disabled buttons use opacity (0.45); hover or press uses opacity (0.8). Web keyboard focus is a green outline (3px) with an offset (3px).

Inputs have a white background, input-border stroke, control radius, body-size text and minimum height (46px), with persistent text labels. Error messages use penalty colors and alert semantics; saved feedback uses a polite live region.

Navigation has explicit labels and selected state, a muted default and green bold active text. Desktop targets are at least 48px tall; mobile items at least 54px tall. Badges are informational status markers rather than buttons.

Goal rows pair one Ionicons icon with the title, rule, penalty and two explicit actions. Done uses action tint and done-border; Missed uses penalty tint and missed-border. Pending is text, never an implied fine. Hover changes the choice border to action green. The daily fine preview updates from unsaved choices; Save check-in persists the day's decisions, and Discard restores saved values. Date changes are blocked while edits remain unsaved. Locked dates explain the editing window.

Dues panels use penalty tint, a tabular amount and a ledger action. Ledger records explain fines and label payments as self-reported, manually recorded and unverified; the payment form says no money is transferred. Local demo badges and device-storage notices remain visible. Shared accounts are labeled separately.

The shipped visual asset set is Ionicons through the Expo icon font, plus initials avatars. No generated photography or raster illustration is shipped. Shared UI stays in React Native primitives. Local source documentation establishes no hosted Supabase or native-device verification claim.

## Do's and Don'ts

### Do:
- Do keep check-in controls early on mobile and interactive targets at least 44px.
- Do retain text labels, selected semantics and visible keyboard focus alongside color.
- Do label synthetic demo data and manually recorded, unverified payments explicitly.

### Don't:
- Don't add decorative gradients, glass or stock fitness photography.
- Don't imply a payment transfers money or has been verified.
- Don't mix local demo records with authenticated shared data.
