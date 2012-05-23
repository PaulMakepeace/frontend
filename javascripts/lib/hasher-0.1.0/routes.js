Hasher.routes = [];

with (Hasher()) {
  // check for new routes on the browser bar every 100ms
  initializer(function() {
    var callback = function() {
      setTimeout(callback, 100);
      var hash = get_route();
      if (hash != Hasher.current_route) set_route(hash, { skip_updating_browser_bar: true });
    }
    callback();
  });
 
  // define a route
  //   route('#', function() {})  or  route({ '#': function(){}, '#a': function(){} })
  define('route', function(path, callback) {
    if (typeof(path) == 'string') {
      Hasher.routes.push({
        regex: (new RegExp("^" + path.replace(/:[a-z_]+/g, '([^/]+)') + '$')),
        callback: callback,
				context: this
      });
    } else {
      for (var key in path) {
        this.route(key, path[key]);
      }
    }
  });

  // return the current route as a string from browser bar
  define('get_route', function() {
    var path_bits = window.location.href.split('#');
    var r = '#' + (path_bits[1] || '');
    return r;
  });

  define('set_route', function(path, options) {
    if (!options) options = {};

    if (!options.skip_updating_browser_bar) {
      if (options.replace) {
        window.location.replace(window.location.href.split('#')[0] + path);
      } else {
        window.location.href = window.location.href.split('#')[0] + path;
      }
    }
    
    // This fixes issues with setting the route in IE not rendering all
    // content on the page. It makes the browser reload anytime the route is changed.
    if (Hasher.current_route && Hasher.current_route != path) {
      if ($.browser.msie) {
        Hasher.current_route = path;
        window.location.reload();
        return;
      }
    }
    
    Hasher.current_route = path;
    
    if (options.reload_page) {
      window.location.reload();
      return;
    }
    
    for (var i=0; i < Hasher.routes.length; i++) {
      var route = Hasher.routes[i];
      var matches = path.match(route.regex);
      if (matches) {
        if (!route.context.run_filters('before')) return;
        route.callback.apply(null, matches.slice(1));
        if (!route.context.run_filters('after')) return;
        return;
      }
    }

    alert('404 not found: ' + path);
  });
  
  define('reload_page_with_route', function(path) {
    Hasher.current_route = path;
    window.location.href = window.location.href.split('#')[0] + path;
    window.location.reload();
  });
}