const log = window.log;

function postToCart(items, successCallback, loadingCallback, failCallback) {
  if (loadingCallback) loadingCallback();
  $.post("/cart/add.js", { items })
    .done(() => successCallback ? successCallback() : (openSlideCart(), buildCart()))
    .fail(() => { failCallback && failCallback(); alert("Error adding items to the cart.") });
}


async function buildCart() {
  $.getJSON("/cart.js", async cart => {
    log.collapse(cart, "Cart Data", "success");

    const excludedProductIds = [10280370667830];
    // Filter out the excluded product when counting items
    let filteredItemCount = 0;
    let trueItemCount = 0;

    // Helper function to refetch cart HTML
    const refetchCartHtml = async () => {
      const html = await (await fetch(window.location.pathname)).text();
      const updatedCartDrawer = $(html).find('#cart-drawer-kandy');
      $('#cart-drawer-kandy').html(updatedCartDrawer.html());
    };

    // Initial HTML fetch
    await refetchCartHtml();

    // Apply localStorage state to checkbox after HTML update
    if (window.applyShippingProtectionState) window.applyShippingProtectionState();

    // Ensure updateShippingProtection fully runs before continuing
    await updateShippingProtection(cart, true);

    // Only refetch HTML if cart is now empty (shipping protection was removed)
    const latestCart = await $.getJSON("/cart.js");
    if (latestCart.item_count === 0) await refetchCartHtml();

    cart.items.forEach(item => {
      if (excludedProductIds.includes(item.product_id)) return; // Skip the excluded product
      if (item.final_line_price > 0) {
        const trueCount = parseInt(item.variant_options[0], 10) || 1;
        trueItemCount += trueCount * item.quantity;
      }
      filteredItemCount += item.quantity;

      let price = (item.line_price / 100).toFixed(2);
      let compare_price = (item.original_line_price / 100).toFixed(2);
      if (item.selling_plan_allocation) {
        log.table({
          "Compare at Price": compare_price,
          "Selling Plan Allocation Compare": item.selling_plan_allocation.compare_at_price,
        }, "Selling Plan Allocation", "info");
        if (item.selling_plan_allocation.compare_at_price * item.quantity > parseFloat(compare_price) * 100) {
          compare_price = (item.selling_plan_allocation.compare_at_price * item.quantity / 100).toFixed(2)
        }
      }

      log.table(item, "Item", "success");
      log.table({
        "Element": "Cart",
        "Final Price": item.final_price,
        "Original Price": item.original_price,
        "Compare Price": compare_price,
        "Compare Price Parsed": parseFloat(compare_price),
        "Price": price,
        "Price Parsed": parseFloat(price),
        "Saved Price": parseFloat(compare_price) - parseFloat(price),
        "Saved Percentage": (parseFloat(compare_price) - parseFloat(price)) * 100 / parseFloat(compare_price),
        "Saved Percentage Rounded": Math.round((parseFloat(compare_price) - parseFloat(price)) * 100 / parseFloat(compare_price))
      }, "Price Details", "info");

    });

    $('.cart-count-bubble').text(filteredItemCount);
    $('.cd-upsells__carousel').slick('refresh');
    if ($('.cd__timer').length) startCountdown(); // Restart Reserved Timer
    setTimeout(() => $('.cd-upsells__out').addClass('active'), 300);
    // if ($('discount-progress-bar').length) updateDiscountProgressBar(cart, currency);
  });
}

// buildCart();

// ========================== Cart Drawer Functionality ==========================
function updateCartQuantity(action, element) {
  var $cartItem = $(element).closest('.cd__item');
  $cartItem.addClass('loading');

  var quantity = parseFloat($cartItem.find('.cd__item-quantity-value').html());
  if (action === 'plus') quantity++;
  if (action === 'minus') quantity--;
  if (action === 'remove') quantity = 0;

  var data = {
    id: $cartItem.attr('data-id'),
    quantity: quantity,
  };
  log(data, 'data');

  $.post("/cart/change.js", data, null, "json")
    .done(function () { buildCart(); })
    .always(function () { $('.cd__item').removeClass('loading'); });
}

$(document).on("click", ".cd__item-quantity-plus", function () {
  updateCartQuantity('plus', this);
});
$(document).on("click", ".cd__item-quantity-minus", function () {
  updateCartQuantity('minus', this);
});
$(document).on("click", ".cd__item-remove", function () {
  updateCartQuantity('remove', this);
});

// ========================== Cart Drawer Functionality END ==========================


// ========================== Subscription Upgrade ==========================
$(document).on("click", ".cd__item-upgrade-btn", function () {
  const $btn = $(this), $cartItem = $btn.closest('.cd__item');
  if ($btn.closest('.cd__item-upgrade-wrapper').hasClass('pill-upgrade')) $btn.toggleClass('active');
  $cartItem.addClass('loading');
  $.post("/cart/change.js", { id: $btn.data("id"), selling_plan: $btn.data("plan-id") })
    .done(buildCart)
    .always(() => $cartItem.removeClass('loading'));
});

$(document).on("click", ".cd__item-upgrade-sub", async function () {
  const $btn = $(this), $cartItem = $btn.closest('.cd__item');
  $cartItem.addClass('loading');
  const removeId = $btn.data("id");
  const addId = $btn.data("upgrade-id");
  const currentQty = +$btn.data("quantity");
  const existingQty = +$btn.data("upgrade-count");
  const sellingPlan = $btn.data("plan-id");

  try {
    // Remove current variant
    await $.post("/cart/change.js", { id: removeId, quantity: 0 });

    // Calculate total quantity needed for upgrade variant
    // We want to replace the current variant quantity with upgrade variant quantity
    const totalQty = currentQty;

    // Check if the upgrade item is already in the cart
    const cart = await $.getJSON("/cart.js");
    const existing = cart.items.find(item => item.id == addId && (!item.selling_plan_allocation || item.selling_plan_allocation.selling_plan_id == sellingPlan));

    if (existing) {
      // Update existing item to have the correct total quantity
      await $.post("/cart/change.js", { id: addId, quantity: totalQty, selling_plan: sellingPlan });
    } else {
      // Add new item with the total quantity
      await $.post("/cart/add.js", { id: addId, quantity: totalQty, selling_plan: sellingPlan });
    }
    buildCart();
  } finally {
    $cartItem.removeClass('loading');
  }
});
// ========================== Subscription Upgrade END ==========================


// ========================== Cart Drawer Interactions ==========================
$('.header__icon-list a[href="/cart"][aria-controls="cart-drawer"], a[href="/cart"].header__icon, #cart-icon-bubble').click(function (evt) {
  evt.preventDefault();
  openSlideCart();
});

$('.cd__outer').click(function () {
  const target = $(event.target);
  if (!target.closest('.cd__inner').length || target.closest('.cd__nav-back').length) {
    closeSlideCart();
  }
});

$('.cd__checkout-btn').click(() => window.location.href = '/checkout');

$(document).on('mouseover', '.cd__item-remove', e => $(e.target).addClass('active'))
  .on('mouseleave', '.cd__item-remove', e => $(e.target).removeClass('active'));

// ========================== Cart Drawer Interactions END ==========================


// ========================== Shipping Protection ==========================
$(document).on("click", ".cd__ship-prot-checking", function () {
  const isDisabled = $(this).hasClass('disabled');
  $(this).toggleClass('disabled');

  // Store the new state in localStorage
  if (!isDisabled) {
    setShippingProtectionDisabled();
  } else {
    localStorage.removeItem('shippingProtectionDisabled');
  }

  $.getJSON("/cart.js", cart => {
    updateShippingProtection(cart);
  });
});

function updateShippingProtection({ items, item_count }, dontBuildCart = false) {
  return new Promise((resolve) => {
    const dataId = $('.cd__ship-prot').data('id');
    if (!dataId || item_count === 0) return void resolve();

    const shippingProtectionItem = items.find(item => item.id == dataId);
    const otherItems = items.filter(item => item.id != dataId);
    const hasOtherItems = otherItems.length > 0;
    const isChecked = !$('.cd__ship-prot-checking').hasClass('disabled');
    const enabledDefault = $('.cd__ship-prot').attr('data-protection') === 'true';

    // Check localStorage override
    const shouldBeDisabled = isShippingProtectionDisabled();

    // Determine if shipping protection should be in cart
    let shouldHaveProtection = false;

    if (shouldBeDisabled) {
      shouldHaveProtection = false;
    } else if (!hasOtherItems) {
      // Rule 3: Remove if only shipping protection
      shouldHaveProtection = false;
    } else if (isChecked || enabledDefault) {
      // Rule 4 & 2: Add if checked or enabled by default
      shouldHaveProtection = true;
    } else {
      // Rule 5: Don't add if disabled
      shouldHaveProtection = false;
    }

    // Update cart if needed
    const currentQty = shippingProtectionItem?.quantity || 0;
    const targetQty = shouldHaveProtection ? 1 : 0;

    if (currentQty !== targetQty) {
      $.post('/cart/update.js', { updates: { [dataId]: targetQty } })
        .done(() => {
          log(`${targetQty ? 'Added' : 'Removed'} Shipping-Protection`);
          if (!dontBuildCart) buildCart();
          resolve();
        }).fail(() => {
          log.collapse(`${targetQty ? 'Failed to add' : 'Failed to remove'} Shipping-Protection`, 'error');
          resolve();
        });
    } else {
      resolve();
    }
  });
}

// Reusable localStorage functions
function setShippingProtectionDisabled() {
  const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour
  localStorage.setItem('shippingProtectionDisabled', JSON.stringify({
    value: 'true',
    expiry: expiryTime
  }));
}

function isShippingProtectionDisabled() {
  const storedData = localStorage.getItem('shippingProtectionDisabled');
  if (storedData) {
    const { value, expiry } = JSON.parse(storedData);
    if (value === 'true' && Date.now() < expiry) {
      return true;
    } else {
      localStorage.removeItem('shippingProtectionDisabled');
    }
  }
  return false;
}

// Initialize shipping protection state
$(document).ready(function () {
  const dataId = $('.cd__ship-prot').data('id');
  const enabledDefault = $('.cd__ship-prot').attr('data-protection') === 'true';

  // Set initial checkbox state based on enabled_default
  if (!enabledDefault) {
    $('.cd__ship-prot-checking').addClass('disabled');
  }

  // Check localStorage override on page load
  if (isShippingProtectionDisabled()) {
    $('.cd__ship-prot-checking').addClass('disabled');
  }

  // Handle removal from cart page
  $(`a[href^="/cart/change?id=${dataId}"]`).click(() => {
    $('.cd__ship-prot-checking').addClass('disabled');
    setShippingProtectionDisabled();
    log.collapse('Removing shipping protection from cart page', 'Cart ShipProt Removed', 'warning');
  });

  // Function to apply localStorage state after HTML updates
  window.applyShippingProtectionState = function () {
    if (isShippingProtectionDisabled()) {
      $('.cd__ship-prot-checking').addClass('disabled');
    }
  };
});

// ========================== Shipping Protection END ==========================


// ========================== Discount Bar ==========================
$(document).on("click", ".discount-bar__gift-header-close", function () {
  $('discount-progress-bar-gift').hide();
});


async function updateDiscountProgressBar(cart, currency) {
  const $progressBar = $(".discount-bar__progress-bar");
  const $progressFill = $(".discount-bar__progress-fill");
  const $freeShippingStatus = $(".discount-bar__status p");
  const $giftStatus = $(".discount-bar__gift-header p");
  const currency_symbol = $('<div>').html(currency).text();
  let giftId = null;

  // Calculate total price
  let totalPrice = cart.items.reduce((sum, item) => sum + item.final_line_price, 0);
  // totalPrice = cart.items.reduce((sum, item) =>
  // (item.requires_shipping || item.handle.includes("shipping-protection")) ? sum + item.final_line_price : sum, 0);
  totalPrice -= cart.cart_level_discount_applications.reduce((sum, discount) =>
    sum + discount.total_allocated_amount, 0);

  // Initialize thresholds
  const thresholds = $(".discount-bar__threshold").map(function () {
    const id = $(this).data("id");
    if (id) giftId = id;
    return {
      value: parseFloat($(this).data("value")),
      isGift: $(this).data("type") === "gift",
      id: id,
      element: $(this)
    };
  }).get();

  // Progress bar logic
  let fillPercentage = 0;
  let freeShippingUnlocked = false;
  let giftUnlocked = false;
  let nextThreshold = null;
  const progressStep = 100 / thresholds.length;

  thresholds.forEach(threshold => threshold.element.removeClass("discount-bar__threshold--filled"));

  thresholds.forEach((threshold, index) => {
    const prevValue = thresholds[index - 1]?.value || 0;
    if (totalPrice >= threshold.value) {
      fillPercentage = (index + 1) * progressStep;
      threshold.element.addClass("discount-bar__threshold--filled");
      if (threshold.isGift) { giftUnlocked = true; giftId = threshold.id; }
      else freeShippingUnlocked = true;
    } else if (totalPrice > prevValue) {
      const range = threshold.value - prevValue;
      fillPercentage = (index * progressStep) + ((totalPrice - prevValue) / range) * progressStep;
      if (!nextThreshold) nextThreshold = threshold;
    } else if (!nextThreshold) nextThreshold = threshold;
  });

  $progressFill.css("width", `${fillPercentage}%`);

  // Update statuses
  const formatRemaining = (threshold) => currency_symbol + ((threshold.value - totalPrice) * 0.01).toFixed(2);

  $freeShippingStatus.html(freeShippingUnlocked
    ? `You've unlocked <span class="discount-bar__status-value">Free Shipping</span>!`
    : `You're ${formatRemaining(thresholds.find(t => !t.isGift))} away from <span class="discount-bar__status-value">Free Shipping</span>!`
  );

  const giftThreshold = thresholds.find(t => t.isGift);
  if (giftThreshold) {
    const giftStatusMessage = giftUnlocked ? 'Free Gift Included!' : `Add ${formatRemaining(giftThreshold)} more to unlock Free Gift`;
    $giftStatus.html(giftStatusMessage);

    const giftItem = cart.items.find(item => item.product_id === giftId);
    log.collapse(thresholds, 'thresholds');
    log.collapse({ giftThreshold, giftUnlocked, giftId, giftItem, giftStatusMessage }, 'Gift Threshold Status', 'info');

    if (giftUnlocked && !giftItem) {
      log.collapse({ giftId }, 'Gift Unlocked, opening modal', 'warning');
      $('.cd__gift-selector-modal').addClass('active').show();
    } else if (!giftUnlocked && giftItem) {
      log.collapse({ giftId, quantity: 0 }, 'Removing gift from cart', 'warning');
      postToCart([{ id: giftId, quantity: 0 }], buildCart);
    }
  }
}

$(document).on('click', '.cd__gift-selector-modal .modal-close', function () {
  $('.cd__gift-selector-modal').removeClass('active').hide();
});

$(document).on('click', '.cd__gift-selector-modal-atc', function () {
  const selectedColor = $('.cd__gift-selector-modal-selector[data-type="color"] option:selected').val();
  const selectedSize = $('.cd__gift-selector-modal-selector[data-type="size"] option:selected').val();
  const selectedId = $('.cd__gift-variant[data-color="' + selectedColor + '"][data-size="' + selectedSize + '"]').data('id') || $(this).data('id');
  log.collapse({ selectedId, selectedColor, selectedSize }, 'Selected Free Gift Variant', 'info');
  const loadingCallback = () => $('.cd__gift-selector-modal-atc').addClass('loading');
  const successCallback = () => {
    $('.cd__gift-selector-modal').removeClass('active').hide();
    $('.cd__gift-selector-modal-atc').removeClass('loading');
    buildCart();
  };
  const failCallback = () => {
    $('.cd__gift-selector-modal-atc').removeClass('loading');
    alert('Error adding gift to cart');
  };
  postToCart([{ id: selectedId, quantity: 1 }], successCallback, loadingCallback, failCallback);
});

// ========================== Discount Bar END ==========================

// ========================== Upsells ==========================
$('.cd-upsells__carousel').slick({
  autoplay: true,
  autoplaySpeed: 3000,
  infinite: true,
  slidesToShow: 4,
  slidesToScroll: 1,
  arrows: true,
  dots: false,
  prevArrow: "<button type='button' class='slick-prev pull-left'><img class='left_arrow' src='https://cdn.shopify.com/s/files/1/0679/7135/0705/files/Chevron_Left.png?v=1737122129'/></button>",
  nextArrow: "<button type='button' class='slick-next pull-right'><img class='right_arrow' src='https://cdn.shopify.com/s/files/1/0679/7135/0705/files/Chevron_Right.png?v=1737122129'/></button>",
});

$('.cd-upsells__toggle').click(function () { $('.cd-upsells__out').toggleClass('active') })

$('.cd-upsells__block-selector').change(function () {
  const currentId = $(this).val();
  const parentBlock = $(this).closest('.cd-upsells__block-wrapper');
  log(parentBlock, 'parentBlock');
  parentBlock.find('.cd-upsells__block-atc').attr('data-id', currentId);

  const currency = $('.cd__checkout-btn').attr('data-cur').replace('0,00', '').replace('0.00', '');
  const currentPrice = $(this).find('option:selected').data('price');
  parentBlock.find('.cd-upsells__block-price .pri').html(`${currency}${(currentPrice / 100).toFixed(2)}`);

  const currentComparePrice = $(this).find('option:selected').data('compare-price');
  let currentDiscount = 0;
  if (currentComparePrice) {
    currentDiscount = Math.round((currentComparePrice - currentPrice) * 100 / currentComparePrice);
    parentBlock.find('.cd-upsells__block-price s').html(currentComparePrice);
    parentBlock.find('.cd-upsells__block-price .badge').html(`${currentDiscount}% OFF`);
  }
  log.collapse({ currentId, currentPrice, currentComparePrice, currentDiscount }, 'Current Variant', 'info');
});

$(".cd-upsells__block-atc").on("click", function (evt) {
  evt.preventDefault();
  const currentId = $(this).attr("data-id");
  log(currentId, 'currentId');
  postToCart([{ id: currentId, quantity: 1 }], buildCart);
});

// ========================== Upsells END ==========================


// ========================== Cart Reserved Timer ==========================
let updateTimer;
function startCountdown() {
  // Clear any existing timer
  if (updateTimer) clearInterval(updateTimer);

  const cart_reserved_timer = $('.cd__timer').data('timer'); // in minutes
  const countDownDate = new Date(Date.now() + cart_reserved_timer * 60 * 1000);

  updateTimer = setInterval(() => {
    const distance = countDownDate - new Date();

    if (distance <= 0) {
      clearInterval(updateTimer);
      $(".cd_timer-reserved__hour, .cd_timer-reserved__min, .cd_timer-reserved__sec").text('0');
      $('.cd__timer-reserved p').text('Time is out!');
      $.post('/cart/clear.js', function () {
        buildCart();
      });
    } else {
      const [hours, minutes, seconds] = [
        Math.floor((distance / (1000 * 60 * 60)) % 24),
        Math.floor((distance / (1000 * 60)) % 60),
        Math.floor((distance / 1000) % 60),
      ];
      $(".cd_timer-reserved__hour").text(hours);
      $(".cd_timer-reserved__min").text(minutes);
      $(".cd_timer-reserved__sec").text(seconds);
    }
  }, 1000);
}

if ($('.cd__timer').length) startCountdown();

// ========================== Cart Reserved Timer END ==========================


// ========================== ATC to Cart Drawer ==========================
$(document).on("click", "buy-buttons button[type='submit']", function (e) {
  const originalText = $(this).html();
  $(this).html('Adding to Cart...');
  setTimeout(() => {
    openSlideCart();
    setTimeout(() => { $(this).html(originalText); }, 1000);
    buildCart();
  }, 1500);
});

$(document).on("click", ".kv-add-to-cart", function (e) {
  const textEl = $(this).find('.kv-add-to-cart_text'), priceEl = $(this).find('.kv-price'), text = textEl.text();
  textEl.text('Adding to Cart...'); priceEl.hide();
  const form = $(this).closest('form');
  const [variantId, sellingPlanId, quantity] = ['id', 'selling_plan', 'quantity'].map(n => form.find(`input[name="${n}"]`).val());
  const items = [{ id: variantId, quantity: quantity, selling_plan: sellingPlanId }];
  const successCallback = () => {
    openSlideCart();
    setTimeout(() => { textEl.text(text); priceEl.show(); }, 1000);
    buildCart();
  };
  log.collapse({ items }, 'Kandy Drawer ATC', 'info');
  postToCart(items, successCallback);
});

// ========================== ATC to Cart Drawer END ==========================


// ========================== Cart Drawer GLOBAL ==========================

function openSlideCart() {
  $('.cd__outer').css('display', 'flex');
  setTimeout(function () {
    $("body").addClass("Overflow_hidden");
    $("body").addClass("overflow-hidden");
    $('.cd__outer').addClass('active');
    $('.cd-upsells__carousel').slick('refresh');
  }, 100);
}

function closeSlideCart() {
  $('.cd__outer').removeClass('active');
  setTimeout(function () {
    $('.cd__outer').hide();
    $("body").removeClass("Overflow_hidden");
    $("body").removeClass("overflow-hidden");
  }, 300);
}
window.cart_open = openSlideCart;
window.cart_close = closeSlideCart;
window.cart_build = buildCart;