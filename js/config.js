(function(){
  const current = document.currentScript && document.currentScript.src
    ? new URL(document.currentScript.src)
    : new URL('js/config.js', document.baseURI);
  const rootUrl = new URL('../', current);
  function url(path=''){
    if (!path) return rootUrl.href;
    if (/^(https?:|mailto:|tel:|data:|blob:|#)/i.test(path)) return path;
    return new URL(String(path).replace(/^\/+/, ''), rootUrl).href;
  }
  window.EMLS = Object.freeze({ rootUrl: rootUrl.href, url });
})();
