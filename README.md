# TRILYVA EDIT

A free, local-first After Effects panel focused on making keyframe easing approachable.

**Primary deliverable:** `TRILYVA-EDIT-Setup-x64.msi`

## Initial implementation target

- Dockable CEP panel for Adobe After Effects.
- Interactive cubic-Bezier Curve Studio with draggable handles.
- Built-in easing presets and editable custom curves.
- Applies temporal easing to adjacent pairs of selected keyframes on supported numeric properties.
- Local-only operation; no account, network service, or subscription.
- WiX Toolset v4 installer packaged as an MSI by GitHub Actions.

## Build the installer

The Windows GitHub Actions workflow builds an MSI on pushes to `main` and on version tags. Create a release by pushing a tag such as `v0.1.0`. The workflow publishes `TRILYVA-EDIT-Setup-x64.msi` as a workflow artifact and attaches it to the GitHub release.

## Install

Run the MSI. It installs the panel into the current Windows user's Adobe CEP extensions folder:

`%APPDATA%\Adobe\CEP\extensions\com.tamasrazim.trilyvaedit`

Restart After Effects, then open **Window → Extensions → TRILYVA EDIT** (menu grouping varies by After Effects version).

### Unsigned CEP extension mode

This initial build is not signed with an Adobe-issued CEP certificate. Some After Effects installations require CEP developer mode for unsigned panels. The optional registry file under `installer/` is supplied separately; inspect it before importing. It changes the current user's Adobe CSXS developer-mode setting.

## Curve Studio usage

1. Select a layer and expose the property containing the animation.
2. Select at least two adjacent keyframes on that property.
3. Choose a preset or drag the curve handles.
4. Press **Apply curve**.

The custom curve's endpoint slopes and horizontal handle lengths are translated into After Effects temporal velocity and influence values. It does not inject expressions.

## Current limits

- First build focuses on numeric, angle, opacity, scale, and spatial properties with numeric keyframe values.
- A selected property needs at least one adjacent pair of selected keyframes.
- Text, shape, marker, and other non-numeric keyframe values are skipped.
- Multi-bounce Elastic/Bounce motion is not represented by a single cubic Bezier curve and is not claimed as supported yet.
- The first build is a functional foundation, not a claim that every planned editing tool is finished.

## Project structure

- `extension/`: CEP panel UI and After Effects ExtendScript host code.
- `installer/`: WiX MSI definition and optional CEP developer-mode registry file.
- `.github/workflows/build-msi.yml`: Windows installer build and release workflow.

TRILYVA EDIT is a Tamasrazim project. No third-party runtime libraries are required by the panel.
