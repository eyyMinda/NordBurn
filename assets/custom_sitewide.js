/**
 * Custom logging utility that provides styled console output when debugging is enabled.
 * Supports regular logging, collapsible groups, and table formatting with color-coded status styles.
 * Only outputs logs when DEBUG flag is true.
 */
(function (g) {
  const DEBUG = window.Shopify?.theme?.role === 'development' || window.Shopify?.theme?.role === 'unpublished',
    styles = {
      success: "background:darkgreen;color:white;padding:2px 6px;border-radius:3px",
      error: "background:darkred;color:white;padding:2px 6px;border-radius:3px",
      warning: "background:darkorange;color:white;padding:2px 6px;border-radius:3px",
      info: "background:blue;color:white;padding:2px 6px;border-radius:3px",
      filename: "background:#333;color:#bada55;padding:2px 6px;border-radius:3px;margin-left:4px"
    };

  const getCallerFile = () => {
    try {
      return (new Error().stack.split('\n').find(l => l.includes('/assets/') && !l.includes('/custom_sitewide.js')) || '')
        .match(/\/assets\/([^:?]+)\??/)?.[1] || '';
    } catch (e) { return ''; }
  };

  const log = (...args) => DEBUG && console.log(...args);

  const collapse = (type, data, title = "Log", status = "info") => {
    if (!DEBUG) return;
    const file = getCallerFile();
    console.groupCollapsed(`%c ${title}${file ? ' %c' + file : ''}`,
      styles[status] || styles.info, file ? styles.filename : '');
    type === "table" ? console.table(data) : console.log(data);
    console.groupEnd();
  };

  log.table = (data, title, status) => collapse("table", data, title, status);
  log.collapse = (data, title, status) => collapse("log", data, title, status);
  g.log = log;
})(typeof window !== "undefined" ? window : globalThis);


/**
 * Initializes and manages a Slick carousel with separate mobile and desktop configurations.
 * Ensures no unnecessary reinitialization during window resizing.
 *
 * @param {jQuery} carousel - The carousel element(s).
 * @param {Object} mobileOptions - Slick options for mobile view.
 * @param {number} breakpoint - The breakpoint to switch between mobile and desktop configurations.
 * @param {Object|null} desktopOptions - Slick options for desktop view. If null, unslick on desktop.
 */
function handleResponsiveCarousel(carousel, mobileOptions, breakpoint = 1024, desktopOptions = null) {
  let currentView = null; // Keeps track of the current view ('mobile' or 'desktop')
  breakpoint = breakpoint - 15; // 15px for the padding
  function initializeCarousel() {
    const isDesktop = $(window).width() >= breakpoint;

    if (isDesktop) {
      if (currentView !== 'desktop') {
        // Switch to desktop view
        if (carousel.hasClass('slick-slider')) carousel.slick('unslick'); // Destroy mobile Slick if initialized
        if (desktopOptions) carousel.slick(desktopOptions); // Initialize with desktop options
        currentView = 'desktop';
      }
    } else {
      if (currentView !== 'mobile') {
        // Switch to mobile view
        if (carousel.hasClass('slick-slider')) carousel.slick('unslick'); // Destroy desktop Slick if initialized
        carousel.slick(mobileOptions); // Initialize with mobile options
        currentView = 'mobile';
      }
    }
  }

  initializeCarousel();
  $(window).on('resize', function () {
    initializeCarousel();
  });
}

// Function to copy text to clipboard
function copyToClipboard(text) {
  var $tempInput = $("<input>");
  $("body").append($tempInput);
  $tempInput.val(text).select();
  document.execCommand("copy");
  $tempInput.remove();
}

function showCopyNotification() {
  const $n = $('<div class="copy-notification">Copied!</div>').appendTo('body');
  setTimeout(() => $n.css({ opacity: 1, transform: 'translateY(0)' }), 10);
  setTimeout(() => { $n.css({ opacity: 0, transform: 'translateY(20px)' }); setTimeout(() => $n.remove(), 200); }, 1500);
}

const superChat = {
  open() {
    const widget = $('#superchat-widget');
    widget.length && (widget.css('display', 'block'), window.Superchat.open());
  },
  close() {
    const widget = $('#superchat-widget');
    widget.length && (widget.css('display', 'none'), window.Superchat.hide());
  }
};


$(document).ready(function () {
  $('a[href="#"][title="Copy to Clipboard"]').on('click', function (e) {
    e.preventDefault();
    const text = $(this).data('copy') || $(this).text().trim();
    copyToClipboard(text);
    showCopyNotification();
    log.collapse({ text, parent: $(this).parent().parent() }, 'Copied to Clipboard', 'success');
  });

  // Fix SuperChat links
  $('a[href="#javascript:openSuperChat()"]').attr('href', 'javascript:superChat.open()');
  $('a[href="#javascript:closeSuperChat()"]').attr('href', 'javascript:superChat.close()');

  const icons = {
    arrow_left: 'https://cdn.shopify.com/s/files/1/0679/7135/0705/files/fe_arrow-left.png?v=1733755171',
    arrow_right: 'https://cdn.shopify.com/s/files/1/0679/7135/0705/files/fe_arrow-right.png?v=1733755171',
    chevron_left: 'https://cdn.shopify.com/s/files/1/0679/7135/0705/files/Chevron_Left.png?v=1737122129',
    chevron_right: 'https://cdn.shopify.com/s/files/1/0679/7135/0705/files/Chevron_Right.png?v=1737122129',
    chevron_left_svg: `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="20" viewBox="0 0 10 20" fill="none" style="color: black;">
                        <path d="M9.73127 17.7033C9.81711 17.7956 9.88422 17.9041 9.92876 18.0226C9.97331 18.1412 9.99441 18.2675 9.99088 18.3944C9.98735 18.5212 9.95924 18.6461 9.90816 18.7619C9.85709 18.8778 9.78405 18.9822 9.69321 19.0694C9.60237 19.1565 9.49551 19.2247 9.37873 19.2699C9.26196 19.3151 9.13755 19.3366 9.01262 19.333C8.88768 19.3294 8.76467 19.3009 8.6506 19.249C8.53653 19.1971 8.43363 19.123 8.34779 19.0307L0.260085 10.3358C0.093063 10.1565 8.23032e-07 9.91899 8.44612e-07 9.67214C8.66192e-07 9.42529 0.0930631 9.1878 0.260085 9.00842L8.34779 0.31256C8.43307 0.218306 8.53594 0.142195 8.65043 0.0886505C8.76492 0.0351036 8.88875 0.00519067 9.01472 0.000647379C9.14069 -0.00389782 9.2663 0.0170201 9.38424 0.0621804C9.50219 0.107341 9.61012 0.175845 9.70177 0.263717C9.79342 0.351588 9.86696 0.457074 9.91811 0.574046C9.96927 0.691018 9.99703 0.817145 9.99977 0.945104C10.0025 1.07306 9.9802 1.2003 9.9341 1.31942C9.88801 1.43854 9.81906 1.54718 9.73127 1.63902L2.26013 9.67214L9.73127 17.7033Z" fill="currentColor"/>
                      </svg>`,
    chevron_right_svg: `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="20" viewBox="0 0 10 20" fill="none" style="color: black;">
                          <path d="M0.268734 17.7033C0.182892 17.7956 0.115784 17.9041 0.0712384 18.0226C0.0266942 18.1412 0.00558558 18.2675 0.00911991 18.3944C0.0126533 18.5212 0.0407609 18.6461 0.0918359 18.7619C0.142911 18.8778 0.215954 18.9822 0.306794 19.0694C0.397634 19.1565 0.504494 19.2247 0.621269 19.2699C0.738045 19.3151 0.862451 19.3366 0.987384 19.333C1.11232 19.3294 1.23533 19.3009 1.3494 19.249C1.46347 19.1971 1.56637 19.123 1.65221 19.0307L9.73992 10.3358C9.90694 10.1565 10 9.91899 10 9.67214C10 9.42529 9.90694 9.1878 9.73991 9.00842L1.65221 0.31256C1.56693 0.218306 1.46406 0.142195 1.34957 0.0886505C1.23508 0.0351036 1.11125 0.00519067 0.985279 0.000647379C0.859307 -0.00389782 0.7337 0.0170201 0.615755 0.0621804C0.497812 0.107341 0.38988 0.175845 0.298231 0.263717C0.206583 0.351588 0.133044 0.457074 0.0818856 0.574046C0.0307277 0.691018 0.00297003 0.817145 0.000225367 0.945104C-0.0025193 1.07306 0.0198034 1.2003 0.0658973 1.31942C0.111992 1.43854 0.180939 1.54718 0.268732 1.63902L7.73987 9.67214L0.268734 17.7033Z" fill="currentColor"/>
                        </svg>`
  };
  const buttons = {
    prevArrowIMG: `<button type='button' aria-label='Arrow Left' class='slick-prev pull-left'><img class='left_arrow' src='${icons.chevron_left}' alt='arrow'/></button>`,
    nextArrowIMG: `<button type='button' aria-label='Arrow Right' class='slick-next pull-right'><img class='right_arrow' src='${icons.chevron_right}' alt='arrow'/></button>`,
    prevArrow: `<button type='button' aria-label='Arrow Left' class='slick-prev pull-left'>${icons.chevron_left_svg}</button>`,
    nextArrow: `<button type='button' aria-label='Arrow Right' class='slick-next pull-right'>${icons.chevron_right_svg}</button>`
  }

  const testimonials = $('.testimonials__cards');
  testimonials.slick({
    autoplay: testimonials.hasClass('slick-autoplay') ? true : false,
    infinite: true,
    slidesToShow: testimonials.hasClass('vertical') ? 4 : 2,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: '40px',
    arrows: true,
    dots: true,
    prevArrow: buttons.prevArrow,
    nextArrow: buttons.nextArrow,
    responsive: [
      ...(
        testimonials.hasClass('vertical')
          ? [
            {
              breakpoint: 1280,
              settings: {
                slidesToShow: 3,
              }
            },
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: 2,
              }
            }
          ]
          : []
      ),
      {
        breakpoint: 678,
        settings: {
          slidesToShow: 1,
          centerPadding: '30px'
        }
      }
    ]
  });

  $('.video-reviews__wrapper').slick({
    infinite: true,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: true,
    dots: true,
    variableWidth: true,
    prevArrow: buttons.prevArrow,
    nextArrow: buttons.nextArrow,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 678,
        settings: {
          slidesToShow: 1
        }
      }
    ]
  });

  const interstitialCardCarousels = $('.col-interstitial__cards.slick-progress');
  interstitialCardCarousels.each(function () {
    const $interstitialCards = $(this);
    $interstitialCards.slick({
      autoplay: $interstitialCards.hasClass('slick-autoplay') ? true : false,
      infinite: true,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: true,
      dots: true,
      variableWidth: true,
      prevArrow: buttons.prevArrow,
      nextArrow: buttons.nextArrow
    });
  })


  $('.rp-slider__products').slick({
    infinite: true,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: true,
    dots: true,
    variableWidth: false,
    prevArrow: buttons.prevArrow,
    nextArrow: buttons.nextArrow,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 3,
        }
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 460,
        settings: {
          slidesToShow: 1,
        }
      }
    ]
  });

  $('.pdp-main .pdp-main__reviews').slick({
    infinite: true,
    dots: true,
    arrows: false,
    slidesToShow: 1,
    slidesToScroll: 1
  });

  if ($('.pdp-main__images .product-images.thumbnails-mobile').length) {
    $('.pdp-main__images .product-images:not(.thumbnails-mobile, .bundle-builder)[data-images="all"]').slick({
      infinite: false,
      dots: false,
      arrows: true,
      slidesToShow: 1,
      slidesToScroll: 1,
      // asNavFor: '.product-images.thumbnails-mobile[data-images="all"]',
      prevArrow: buttons.prevArrow,
      nextArrow: buttons.nextArrow
    });
    // $('.pdp-main__images .product-images.thumbnails-mobile[data-images="all"]').slick({
    //   infinite: false,
    //   dots: false,
    //   arrows: false,
    //   focusOnSelect: true,
    //   slidesToShow: 4,
    //   slidesToScroll: 1,
    //   asNavFor: '.product-images:not(.thumbnails-mobile)[data-images="all"]',
    // });
    $('.pdp-main__images .product-images.thumbnails-mobile[data-images="all"]').each(function () {
      const container = $(this);
      let isDown = false;
      let startX;
      let scrollLeft;

      // Prevent image dragging
      container.find('img, video').attr('draggable', false);

      // Mouse events for scrolling
      container
        .on('mousedown', function (e) {
          isDown = true;
          container.addClass('grabbing');
          startX = e.pageX;
          scrollLeft = container.scrollLeft();
          e.preventDefault();
        })
        .on('touchstart', function (e) {
          isDown = true;
          container.addClass('grabbing');
          startX = e.originalEvent.touches[0].pageX;
          scrollLeft = container.scrollLeft();
        })
        .on('mouseleave mouseup', function () {
          isDown = false;
          container.removeClass('grabbing');
        })
        .on('touchend touchcancel', function () {
          isDown = false;
          container.removeClass('grabbing');
        })
        .on('mousemove', function (e) {
          if (!isDown) return;
          e.preventDefault();
          const x = e.pageX;
          const walk = (startX - x) * 1.5;
          container.scrollLeft(scrollLeft + walk);
        })
        .on('touchmove', function (e) {
          if (!isDown) return;
          const x = e.originalEvent.touches[0].pageX;
          const walk = (startX - x) * 1.5;
          container.scrollLeft(scrollLeft + walk);
          e.preventDefault(); // Prevent page scrolling while dragging thumbnails
        });

      // Click on thumbnails to navigate
      container.on('click', 'div:not(.product-image):has(> video, > img, > .product-image[data-type="video"])', function () {
        if (isDown) return; // Don't trigger click when dragging
        const index = $(this).data('index');
        $('.pdp-main__images .product-images.slick-initialized[data-images="all"]')
          .slick('slickGoTo', index);
      });
    });

  } else {
    $('.pdp-main__images .product-images:not(.bundle-builder)[data-images="all"]').slick({
      infinite: true,
      dots: true,
      arrows: false,
      slidesToShow: 1,
      slidesToScroll: 1
    });
  }

  $('.pdp-main__images .product-images[data-images="remaining"].thumb').slick({
    infinite: true,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: false,
    dots: false,
    variableWidth: false
  });

  const LPHero = $('.lp-hero__cards');
  const LPHeroOptions = {
    infinite: true,
    dots: true,
    arrows: false,
    slidesToShow: 1,
    slidesToScroll: 1,
    variableWidth: true,
    centerMode: true,
    centerPadding: '40px'
  };
  const TPReviews = $('.tp-reviews__cards');
  const TPRevewsOptions = {
    infinite: true,
    dots: false,
    arrows: true,
    prevArrow: buttons.prevArrow,
    nextArrow: buttons.nextArrow,
    slidesToShow: 1,
    slidesToScroll: 1
  };
  const TPRevewsDesktopOptions = $('.tp-reviews__cards.desktop-carousel').length ? {
    infinite: true,
    dots: false,
    arrows: true,
    prevArrow: buttons.prevArrow,
    nextArrow: buttons.nextArrow,
    slidesToShow: 2,
    slidesToScroll: 2
  } : null;
  const ProductList = $('.pr-list__products.slider');
  const ProductListOptions = {
    infinite: true,
    dots: true,
    arrows: false,
    slidesToShow: 2,
    slidesToScroll: 2,
    centerMode: true,
    centerPadding: '24px'
  };

  const BundleBuilder = $('.pdp-main__images .product-images.bundle-builder:not(.thumbnails-mobile)[data-images="all"]');
  const BundleBuilderOptions = {
    infinite: false,
    dots: false,
    arrows: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    prevArrow: buttons.prevArrow,
    nextArrow: buttons.nextArrow
  };

  handleResponsiveCarousel(LPHero, LPHeroOptions, 768);
  handleResponsiveCarousel(TPReviews, TPRevewsOptions, 1024, TPRevewsDesktopOptions);
  handleResponsiveCarousel(ProductList, ProductListOptions, 768);
  handleResponsiveCarousel(BundleBuilder, BundleBuilderOptions);


  // Video reviews --------------------------------------------------------
  $('.video-reviews__video-button.play, .video-reviews__video').click(function () {
    const $videoWrapper = $(this).is('.video-reviews__video') ? $(this) : $(this).closest('.video-reviews__video');
    const $video = $videoWrapper.find('video');

    if ($video.length) {
      if (!$video.get(0).paused) {
        $video.get(0).pause();
        $videoWrapper.removeClass('play').find('.video-reviews__video-button.pause').hide();
        $videoWrapper.find('.video-reviews__video-button.play').css('display', 'flex');
        return;
      }
      $('.video-reviews__video').each(function () {
        const $otherWrapper = $(this);
        const $otherVideo = $otherWrapper.find('video');
        if ($otherVideo.get(0) !== $video.get(0)) {
          $otherVideo.prop('muted', true).get(0).pause();
          $otherWrapper.removeClass('play').find('.video-reviews__video-button.play').css('display', 'flex');
          $otherWrapper.find('.video-reviews__video-button.pause').hide();
        }
      });

      $video.prop('muted', false).prop("volume", 0.5).get(0).play();
      $(this).is($videoWrapper) ? $videoWrapper.find('.video-reviews__video-button.play').hide() : $(this).hide();
      $videoWrapper.addClass('play').find('.video-reviews__video-button.pause').css('display', 'flex');
    }
  });
  $('.video-reviews__video-button.play').click(function (e) {
    e.stopPropagation();
  })

  // Product List for css selector too apply grid column span
  function initProductListSection() {
    const $products = $(".pr-list__products:not(.slider) .pr-item__product:not(.Desktop_only)");
    if ($products.length > 0) {
      $products.first().addClass("first-product");
      $products.last().addClass("last-product");
      if ($products.length == 4) {
        $products.eq(2).addClass("before-last-product");
      }
    }
  }

  // Why Choose
  function initWhyChooseSection() {
    const $icons = $(".why-choose__card-icon"), $title = $(".why-choose__card-title"), $text = $(".why-choose__card-text");

    const updateIcon = ($icon) => {
      $title.text($icon.data("title"));
      $text.html($icon.data("text"));
      $icons.removeClass("active").find("img").removeClass("active").attr("srcset", function () {
        return $(this).closest(".why-choose__card-icon").data("icon");
      });
      $icon.addClass("active").find("img").addClass("active").attr("srcset", $icon.data("icon-active"));
    };

    updateIcon($icons.first());
    $icons.on("click", function () { updateIcon($(this)); });
  }

  // Image Content
  function initImageContentSection() {
    $('.image-content:has(.image-content__tabs)').each(function () {
      const $imageContent = $(this);
      const $tabs = $imageContent.find('.image-content__tab');
      if (!$tabs.length) return;
      const $cards = $imageContent.find('.image-content__card');
      $tabs.removeClass('active').first().addClass('active');
      $cards.hide().first().show();

      $tabs.on('click', function () {
        const tab = $(this).data('tab');
        $tabs.removeClass('active');
        $(this).addClass('active');
        $cards.hide();
        $cards.filter(`[data-tab="${tab}"]`).show();
      });
    });
  }

  // Announcement Timer
  function AnnouncementTimer() {
    const timerWrap = $('.announcement__timer');
    if (!timerWrap.length) return;

    const timer = timerWrap.find('.timer');
    let time;

    const timerDate = timerWrap.data('timer-date');
    if (timerDate) {
      const targetTime = new Date(timerDate + "T00:00:00"); // Local midnight of the given date
      time = Math.floor((targetTime - new Date()) / 1000); // Time difference in seconds
    } else {
      time = parseInt(timerWrap.data('time'), 10);
    }

    if (time <= 0) return timerWrap.hide(); // Ensures valid countdown

    const update = () => {
      if (time < 0) return timerWrap.hide();
      timer.text([Math.floor(time / 3600), Math.floor((time % 3600) / 60), time % 60]
        .map(v => v.toString().padStart(2, '0')).join(':'));
      time--;
    };

    update();
    setInterval(update, 1000);
  }


  // Initialize section code
  if ($('.announcement__timer').length > 0) {
    AnnouncementTimer();
  }


  if ($('.pr-list').length > 0) initProductListSection();
  if ($('.why-choose').length > 0) initWhyChooseSection();
  if ($('.image-content').length > 0) initImageContentSection();


  $('.ScrollToProduct').on('click', function (e) {
    e.preventDefault();
    const offsetTop = $('#product-main').offset().top - 160;
    $('html, body').animate({
      scrollTop: offsetTop
    }, 600);
  });

  $(".accordion > .accordion-item").children(".accordion-panel").slideUp();
  $(".accordion > .accordion-item.is-active").children(".accordion-panel").slideDown();
  $(".accordion > .accordion-item").click(function () {
    $(this).siblings(".accordion-item").removeClass("is-active").children(".accordion-panel").slideUp();
    $(this).toggleClass("is-active").children(".accordion-panel").slideToggle("ease-out");
  });

  // =================== Modals ======================
  /**
   * handleModal - Binds modal open/close logic to triggers, saving/restoring scroll position.
   * @param {string} modalSelector - Selector for the modal element.
   * @param {string} triggerSelector - Selector for elements that open the modal.
   * @param {function} [triggerFunc] - Optional callback, called on open.
   * @param {boolean} [triggerFuncAtStart=false] - If true, call triggerFunc before modal opens.
   */
  function handleModal(modalSelector, triggerSelector, triggerFunc, triggerFuncAtStart = false) {
    const $modal = $(modalSelector);
    if (!$modal.length || !triggerSelector) return;
    let scrollPosition = 0;

    $(triggerSelector).on('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      if (typeof triggerFunc === 'function' && triggerFuncAtStart) triggerFunc(this);

      $modal.addClass('active').removeAttr('inert');
      $('body').addClass('no-scroll');
      $('#MainContent').css('z-index', '99999');
      if ($('.modal-wrapper.active').length > 1)
        $modal.find('.modal-overlay').css('background', '#00000005');
      if (typeof triggerFunc === 'function' && !triggerFuncAtStart) triggerFunc(this);
    });

    $modal.find('.modal-close, .modal-overlay').on('click', function () {
      $modal.removeClass('active').attr('inert', 'true');
      $modal.find('.modal-overlay').css('background', '');
      if (!$('.modal-wrapper.active').length) {
        $('body').removeClass('no-scroll');
        $('#MainContent').css('z-index', 'unset');
        setTimeout(() => window.scrollTo(0, scrollPosition), 10);
      }
    });
  }
  window.handleModal = handleModal;

  handleModal('#size-guide-modal', '.size-guide-trigger-btn'); // Size Guide Modal


  // =================== Mega Menu Open on Hover ======================
  setInterval(() => {
    const megaMenuOpened = $('.mega-menu[open]').length || $('.header__icon--menu').attr('aria-expanded') === 'true';
    const $headerGroup = $('.shopify-section-group-header-group');

    if (megaMenuOpened && !$headerGroup.hasClass('menuOpened')) {
      $headerGroup.addClass('menuOpened');
    } else if (!megaMenuOpened && $headerGroup.hasClass('menuOpened')) {
      $headerGroup.removeClass('menuOpened');
    }
  }, 50);

  // =================== Text Truncation with Read More ======================
  function initTextTruncation(selector, charLimit = 500) {
    if (!$(selector).length) return;
    $(selector).each(function () {
      const $text = $(this), originalText = $text.text().trim();

      if (originalText.length > charLimit) {
        const truncatedText = originalText.substring(0, charLimit) + '...';
        const $btn = $(`<button type="button" class="truncate-btn" aria-label="Read more">read more</button>`);

        $text.html(truncatedText + $btn.prop('outerHTML'));

        $text.on('click', '.truncate-btn', function () {
          const isExpanded = $(this).hasClass('expanded');
          const newBtn = $(`<button type="button" class="truncate-btn${!isExpanded ? ' expanded' : ''}" aria-label="${isExpanded ? 'Read more' : 'Read less'}">${isExpanded ? 'read more' : 'read less'}</button>`);

          $text.html((isExpanded ? truncatedText : originalText) + newBtn.prop('outerHTML'));
        });
      }
    });
  }

  // Initialize text truncation functionality
  initTextTruncation('.heading-text--read-more');
  initTextTruncation('.testimonials__card-text', 180);

});