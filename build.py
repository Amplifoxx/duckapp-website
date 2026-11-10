#!/usr/bin/env python3
"""Generate the static website from page templates and shared components.

Run python3 build.py before publishing. No dependencies or server required.
Run python3 build.py --check to check that generated pages are up to date.
"""
from datetime import date
from pathlib import Path
import argparse
import re
import sys

ROOT = Path(__file__).resolve().parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    header_template = (ROOT / 'components/header.html').read_text(encoding='utf-8')
    footer_template = (ROOT / 'components/footer.html').read_text(encoding='utf-8')
    footer_template = footer_template.replace('{{ year }}', str(date.today().year))
    stale = []
    pages = sorted((ROOT / 'src/pages').glob('*.html'))
    if not pages:
        raise ValueError('No page templates found in src/pages')
    for template in pages:
        source = template.read_text(encoding='utf-8')
        if source.count('{{ footer }}') != 1 or source.count('{{ header }}') != 1:
            raise ValueError(f'{template.name}: expected one header and one footer include')
        footer = footer_template.replace(
            f'href="/{template.name}"',
            f'href="/{template.name}" aria-current="page"',
        )
        header = header_template.replace(
            f'href="/{template.name}"',
            f'href="/{template.name}" aria-current="page"',
        )
        output = source.replace('{{ footer }}', footer.rstrip()).replace('{{ header }}', header.rstrip())
        if re.search(r'\{\{.*?\}\}', output):
            raise ValueError(f'{template.name}: unresolved template token')
        target = ROOT / template.name
        if args.check:
            if not target.exists() or target.read_text(encoding='utf-8') != output:
                stale.append(template.name)
        else:
            target.write_text(output, encoding='utf-8')
    if stale:
        print('Run python3 build.py to update: ' + ', '.join(stale), file=sys.stderr)
        return 1
    print(f'{"Checked" if args.check else "Built"} {len(pages)} pages.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
