# 卵 Tamago

Static website generator, built with NodeJS.

## Install

`npm i tamago`

## Init a website

`tamago init "Website name"`

It creates the `website-name` folder with these sub-folders:

- assets
  - favicons
  - fonts
  - img
  - js
  - libs
  - scss
- files
- pages
- posts
- templates

## Build a website

`cd website-name`

`tamago build`

It creates/updates the `public` folder with these sub-folders:

- css
- files
- fonts
- img
- js
- libs
- pages
- posts
- + a folder for each taxonomy
- + favicons right here

## Settings

Settings.json can override these settings:

- `title`: string
- `baseurl`: string, like "http://example.com"
- `basepath`: string, the subpath of the website, like `/blog`, defaults to `/`
- `contentTypes`: array, defaults to `["pages", "posts"]`
- `home`: object, see below for details
- `paginate`: int, number of posts per page, default to 10
- `taxonomiesNames`: array of taxonomy names, defaults to ['tags']
- `dateFormat`: string, defaults to 'D MMMM YYYY', use [https://date-fns.org/v1.30.1/docs/format](https://date-fns.org/v1.30.1/docs/format)
- `mapZoom`: int, defaults to 12, see below for details
- `imageFormats`: array of image formats, see below for details

### Home

The `home` object defaults to the list of the 10 latest posts, like:

```
{
  "where": "indexes",
  "slug": "posts"
}
```

To display the page /pages/home.md, you can set:

```
{
  "where": "pages",
  "slug": "home"
}
```

To display the 10 latest posts with the tag sharkz:

```
{
  "where": "indexes",
  "slug": "tags-sharkz"
}
```

### Image formats

Rename or add formats with this array of image formats objects:

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

### Address field and map

If your frontmatter has an 'address' field, it outputs has a map, via the [Leaflet](https://leafletjs.com/) library.

⚠️ You must install Leaflet by yourself in the `assets/libs` folder.

## Templates

The templating system is [Mustache](https://github.com/janl/mustache.js)

### Content object

- `title`
- `body`: partial html content
- `url`
- `slug`
- each field found in the frontmatter: date, image, tags...
- `styles`: array
- `scripts`: array
- `hasImage`: bool
- `imageDerivatives`: object
- `taxonomies`: object

## Gitlab pages CI

Example of a `.gitlab-ci.yml` file:

```
image: node:latest

before_script:
  - npm install tamago

pages:
  stage: deploy
  script:
  - ./node_modules/tamago/bin/tamago.js build
  artifacts:
    paths:
    - public
  only:
  - master
```