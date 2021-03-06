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

- assets
  - css
  - fonts
  - img
  - js
  - libs
- files
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
- `paginate`: int, number of posts per page, default to `10`
- `indexesNames`: array of indexes names, defaults to `['posts']`, see details below
- `taxonomiesNames`: array of taxonomy names, defaults to `['tags']`
- `dateFormat`: string, defaults to `D MMMM YYYY`, use [https://date-fns.org/v2.1.0/docs/format](https://date-fns.org/v2.1.0/docs/format)
- `mapZoom`: int, defaults to `12`, see below for details
- `imageFormats`: array of image formats, see below for details

### Indexes

_Indexes_ are lists of contents, ordered in antechronological order, and paginated.

Each `contentTypes` set in `indexesNames` creates a webpage listing their contents.

Also, indexes are built for each `taxonomiesNames`.

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

The templating system is [Handlebars](https://handlebarsjs.com/)

Every content type is rendered through the default template files, named like `article--[VIEW].tpl`.

It can be overriden by creating files like `article--[CONTENT-TYPE]--[VIEW].tpl`.

Example: `article--event--full.tpl` will override the template `article--full.tpl` for a new `event` content type.

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