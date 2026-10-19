# UCompute — Website Concept

An original, responsive marketing website for **UCompute**, an open-source local-first AI inference platform building toward trusted device groups and eventually decentralized compute.

Inspired by the approachable, download-first presentation of µTorrent's public website—not its logo, trademark, proprietary assets, or copy.

## Preview locally

Open `index.html` directly in a browser, or run:

```bash
cd ucompute-website
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

This is a plain HTML, CSS, and JavaScript site: no package installation or build tooling required.

## Interactions

- Responsive navigation and working mobile menu
- Interactive **Just me / My group / The network** diagram
- Copyable developer quickstart
- Anchor navigation and external repository links
- Respect for reduced-motion preferences

## Accurate product messaging

The page deliberately distinguishes **locally working development builds** from **trusted Mesh work in progress** and the **public network roadmap**. The hero desktop interface is an original **concept illustration** and not an authenticated screenshot. The Python API example needs your actual daemon port, authentication, and model identifier.

### Customize

- Update `https://github.com/div0rce/common` once the repository is renamed or a public release is published.
- Replace the get-source CTA with the signed installer URL when it exists.
- Update feature availability and performance examples to match actual verification evidence before publishing.
- Rename `Common.app` to `UCompute.app` through application metadata and packaging before linking a release.

The site is **not affiliated** with µTorrent or BitTorrent.
