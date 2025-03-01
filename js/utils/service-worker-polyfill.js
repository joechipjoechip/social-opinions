/**
 * Polyfill pour les Service Workers
 * Fournit des fonctionnalités manquantes dans l'environnement Service Worker
 */

// Polyfill pour fetch si nécessaire
if (typeof fetch === 'undefined') {
  self.fetch = function(url, options) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(options?.method || 'GET', url);
      
      if (options?.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }
      
      xhr.onload = function() {
        const response = {
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          headers: new Headers(),
          json: () => Promise.resolve(JSON.parse(xhr.responseText)),
          text: () => Promise.resolve(xhr.responseText)
        };
        resolve(response);
      };
      
      xhr.onerror = function() {
        reject(new Error('Network error'));
      };
      
      xhr.send(options?.body);
    });
  };
}

// Polyfill pour Promise si nécessaire
if (typeof Promise === 'undefined') {
  console.warn('Le navigateur ne supporte pas les Promises, certaines fonctionnalités peuvent ne pas fonctionner correctement.');
}

// Polyfill pour console si nécessaire
if (typeof console === 'undefined') {
  self.console = {
    log: function() {},
    error: function() {},
    warn: function() {},
    info: function() {}
  };
}

console.log('Service Worker polyfills chargés');
