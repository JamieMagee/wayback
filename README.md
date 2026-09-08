# Wayback Machine GitHub Action

[![GitHub marketplace](https://img.shields.io/badge/marketplace-wayback--machine-green?style=for-the-badge&logo=github)](https://github.com/marketplace/actions/wayback-machine)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/JamieMagee/wayback/build.yml?branch=main&style=for-the-badge)](https://github.com/JamieMagee/wayback/actions?query=workflow%3Abuild)
[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/JamieMagee/wayback?style=for-the-badge)](https://github.com/JamieMagee/wayback/releases/latest)
[![License](https://img.shields.io/github/license/JamieMagee/wayback?style=for-the-badge)](https://github.com/JamieMagee/wayback/blob/main/LICENSE)

Save pages to the [Wayback Machine](https://web.archive.org/) as part of your CI/CD pipeline. If you find this useful, please [donate to the Internet Archive](https://archive.org/donate/).

## Examples

### Basic

```yaml
name: Save my blog
uses: JamieMagee/wayback@v2
with:
  url: jamiemagee.co.uk
```

### Auto-detect from CNAME

If your repository has a `CNAME` file (e.g. for GitHub Pages), the action will
automatically use the domain from that file. No `url` input is needed.

```yaml
name: Save my site
uses: JamieMagee/wayback@v2
```

### Advanced

```yaml
name: Save my blog
uses: JamieMagee/wayback@v2
with:
  url: |-
    jamiemagee.co.uk
    katmagee.net
  saveErrors: false
  saveOutlinks: true
  saveScreenshot: true
```

## Inputs

### `url`

**[Optional]** The web page to save to the Wayback Machine.
Can include or exclude `http://`, `https://`, `www.`, etc.
Can be a single URL or a list of URLs.
If not provided, the action will attempt to detect the URL from a `CNAME` file in the repository.

### `saveErrors`

If `true`, the Wayback Machine will save web pages that return an HTTP status code in the 4xx or 5xx range.
Defaults to `true`.

### `saveOutlinks`

If `true`, the Wayback Machine will save any links to external web pages.
Defaults to `false`.

### `saveScreenshot`

If `true`, the Wayback Machine will save a screenshot of the web page.
Defaults to `false`.

### `skipFirstArchive`

If `true`, skip checking whether this is the first capture of the URL. Makes captures faster.
Defaults to `false`.

### `ifNotArchivedWithin`

Only capture the URL if the most recent existing capture is older than this value. Accepts SPN2 timedelta strings (e.g. `1d`, `3h 20m`) or plain seconds (e.g. `3600`). Supports a comma-separated pair (e.g. `1d,7d`) to apply a different value to outlinks.

### `delayBetweenRequests`

Time, in milliseconds, to wait between web requests.  Use this to work with rate-limited hosting.

## Outputs

### `wayback_url`

Wayback Machine URL of the last successful capture in the run. Empty if no capture succeeded.

### `wayback_urls`

Newline-separated list of Wayback Machine URLs for every successful capture in the run. Useful when archiving multiple URLs.

### `screenshot_url` / `screenshot_urls`

Screenshot URL (or newline-separated list) when `saveScreenshot` is `true` and the capture produced a screenshot.

## License

Code in this repository is licensed under the MIT license.
Details can be found in the [LICENSE](https://github.com/JamieMagee/wayback/blob/main/LICENSE) file.
