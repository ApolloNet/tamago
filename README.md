# Aro

Static website generator, build with NodeJS.

## Install

`npm i -g git+ssh://git@github.com:apollonet/aro.git`

## Update

`npm update -g git+ssh://git@github.com:apollonet/aro.git`

## Init a website

`aro init "Website name"`

## Build a website

`cd website-name`

`aro build`

## Settings

Settings.json can override these settings:

- title: string
- baseurl: string, like "http://example.com"
- basepath: string, the subpath of the website, like "/blog"
- paginate: number, default to 10
- taxonomiesNames: array, defaults to ['tags']
- dateFormat: string, defaults to 'D MMMM YYYY', use [https://date-fns.org/v1.30.1/docs/format](https://date-fns.org/v1.30.1/docs/format)
- mapZoom: number, defaults to 12
- imageFormats: array of image formats

### Image formats

Rename or add formats with this array of image formats objects :

```
imageFormats: [
  {
    name: 'thumbnail',
    width: 300,
    height: 200
  },
  {
    name: 'large',
    width: 960,
    height: 480
  }
]
```

## Input folders

- assets
  - img
  - js
  - libs
  - scss
- files
- pages
- posts
- templates

## Output folders

- public
  - css
  - files
  - img
  - js
  - libs
  - pages
  - posts
  - plus a folder for each taxonomy
