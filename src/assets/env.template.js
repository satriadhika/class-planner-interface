(function(window) {
  window.env = window.env || {};

  // Environment variables
  window["env"]["apiUrl"] = "${API_URL}";
  window["env"]["assetsUrl"] = "${ASSETS_URL}";
  window["env"]["callbackUrl"] = "${CALLBACK_URL}";
  window["env"]["webSocket"] = "${WEBSOCKET}";
  window["env"]["images"] = "${IMAGES}";
})(this);
