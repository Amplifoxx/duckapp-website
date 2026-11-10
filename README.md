# Duckapp.io website

## Install this update

Copy the contents of this folder into your existing website folder, allowing matching files to be replaced. Retain your existing `.git` directory. Publish the changed HTML pages and the entire `components` folder together through your normal Git workflow.

All eight pages already include the universal header and footer. No initial build is required.

## Update the header or footer everywhere

| Change | Edit |
| --- | --- |
| Header text, duck image, navigation links | `components/header.html` |
| Header appearance | `components/header.css` |
| Footer copyright and links | `components/footer.html` |
| Footer appearance | `components/footer.css` |

Save and publish the changed component file. All eight pages fetch the same header and footer HTML when opened, so you do not need to rebuild or edit each page for routine component updates. The shared loader revalidates the component files on each page load.

The header reads “The Duck App” followed by the existing duck SVG. Its brand link returns home. Both components mark the current page's navigation link automatically. The footer year updates automatically.

## Built-in fallback and page content

Each generated page also contains a complete header and footer so navigation appears immediately and remains usable if JavaScript is disabled or a component request fails. After larger changes, run `python3 build.py` to refresh those fallback copies too.

To edit individual page content, edit the template in `src/pages/`, then run:

```sh
python3 build.py
```

Publish both the template and generated root HTML page. Keep the `{{ header }}` and `{{ footer }}` placeholders in each template.

Page-specific CSS remains in each template. Header and footer styles live only in their shared CSS files. `styles.css` is a legacy stylesheet that these pages do not currently link.

## Preview locally

From the project folder:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Use a local server rather than double-clicking the HTML: shared component URLs start at the domain root. This is compatible with the existing duckapp.io root-domain hosting.

## Optional fallback consistency check

```sh
python3 build.py --check
```

This checks that generated fallback HTML matches its source templates. If it reports differences after a component edit, run `python3 build.py` before publishing to synchronize the fallback too. Live component loading does not depend on this command.

## Preserved integrations

The published legal-document loader, confirmation and password-reset scripts, CNAME, `.nojekyll`, `.well-known/apple-app-site-association`, and original artwork remain included. The legal templates' literal whitespace entities and escaped CSS variable names have been repaired. The footer retains its existing copyright wording.

No npm packages or production server are required. Nothing in this archive publishes automatically.
