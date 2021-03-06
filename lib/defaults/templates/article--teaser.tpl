<article>
  {{#hasImage}}
  <img src="{{{imageDerivatives.thumbnail.src}}}" alt="{{title}}" width="{{imageDerivatives.thumbnail.width}}" height="{{imageDerivatives.thumbnail.height}}">
  {{/hasImage}}
  <h1><a href="{{{url}}}">{{title}}</a></h1>
  <p>{{date.render}}</p>
  {{#taxonomies.tags.count}}
    <ul>
    {{#taxonomies.tags.terms}}
      <li><a href="{{{url}}}">{{name}}</a></li>
    {{/taxonomies.tags.terms}}
    </ul>
  {{/taxonomies.tags.count}}
  {{{body}}}
</article>
