const DevMode = {
  devMode: (window.Shopify && window.Shopify.theme && (window.Shopify.theme.role === 'development' || window.Shopify.theme.role === 'unpublished')) || window.Shopify?.designMode,
  log: window.log,

  init: function () {
    if (this.devMode) {
      if (this.log && typeof this.log.collapse === 'function') {
        this.log.collapse(this.devMode, 'Dev mode is enabled', 'success');
      }
      this.addDevStyles();
    }
  },

  addDevStyles: function () {
    const style = document.createElement('style');
    style.setAttribute('dev-mode', 'true');
    style.textContent = `
      #shopify-pc__banner,
      div:has(> .kl-private-reset-css-Xuajs1),
      #gorgias-chat-container {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    DevMode.init();
  });
} else {
  DevMode.init();
}

