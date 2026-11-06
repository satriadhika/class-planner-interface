(function(window) {
  window["env"] = window["env"] || {};

  // Environment variables
  window["env"]["apiUrl"] = "http://localhost:8080/checkout/v1/payment";
  window["env"]["assetsUrl"] = "../assets/i18n/";
  window["env"]["callbackUrl"] = "http://localhost:4200/checkout/link";
  window["env"]["webSocket"] = "http://localhost:8080/checkout/socket";
  window["env"]["images"] = "https://cdn-dev.oss-ap-southeast-5.aliyuncs.com/doku-ui-framework/doku/img/";

})(this);
