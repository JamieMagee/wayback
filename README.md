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
uses: JamieMagee/wayback@v2.1.0
with:
  url: jamiemagee.co.uk
```

### Advanced

```yaml
name: Save my blog
uses: JamieMagee/wayback@v2.1.0
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

**[Required]** The web page to save to the Wayback Machine.
Can include or exclude `http://`, `https://`, `www.`, etc.
Can be a single URL or a list of URLs.

### `saveErrors`

If `true`, the Wayback Machine will save web pages that return an HTTP status code in the 4xx or 5xx range.
Defaults to `true`.

### `saveOutlinks`

If `true`, the Wayback Machine will save any links to external web pages.
Defaults to `false`.

### `saveScreenshot`

If `true`, the Wayback Machine will save a screenshot of the web page.
Defaults to `false`.

## Outputs

### `wayback_url`

If the save attempt was successful, this parameter is set to the Wayback Machine URL.
If the attempt failed, it is set to an empty string.

## License

Code in this repository is licensed under the MIT license.
Details can be found in the [LICENSE](https://github.com/JamieMagee/wayback/blob/main/LICENSE) file.
