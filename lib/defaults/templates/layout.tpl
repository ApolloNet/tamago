<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{title}}</title>
  {{#description}}
  <meta name="description" content="{{{.}}}">
  {{/description}}
  {{#styles}}
  <link rel="stylesheet" href="{{{.}}}">
  {{/styles}}
</head>
<body class="{{classes}} wrapper">
<header>
  <h1>
    <a href="{{{site.basepath}}}index.html">{{site.title}}</a>
  </h1>
  <nav>
    <ul>
      <li><a href="{{{site.basepath}}}">Home</a></li>
      <li><a href="{{{site.basepath}}}pages/about">About</a></li>
    </ul>
  </nav>
</header>
<main>
  {{title}}
  {{{content}}}
  {{#pagination_exists}}
  <ul>
    {{#prevurl_exists}}
    <li><a href="{{prevurl}}">Previous page</a></li>
    {{/prevurl_exists}}
    {{#nexturl_exists}}
      <li><a href="{{nexturl}}">Next page</a></li>
    {{/nexturl_exists}}
  </ul>
  {{/pagination_exists}}
</main>
{{#scripts}}
<script defer src="{{{.}}}"></script>
{{/scripts}}
</body>
</html>