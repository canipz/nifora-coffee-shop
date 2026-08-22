document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // HELPER & UTILS
    // ==========================================
    function addClickAnimation(element) {
        if (!element) return;
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            element.style.transform = '';
        }, 150);
    }

    // Fungsi Pengaman XSS (HTML Escaping)
    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    // Fungsi Notifikasi Pop-up (Toast Notification)
    let toastTimeout = null;
    function showToast(message) {
        let toast = document.getElementById('toast-notification');
        
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.style.cssText = `
                position: fixed;
                bottom: 30px;
                right: 20px;
                background-color: #10b981;
                color: #ffffff;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                font-size: 14px;
                font-weight: 600;
                z-index: 9999;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s ease;
                pointer-events: none;
            `;
            document.body.appendChild(toast);
        }

        if (toastTimeout) clearTimeout(toastTimeout);

        toast.innerHTML = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';

        toastTimeout = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
        }, 2500);
    }

  // ==========================================
// 0. FITUR KONTROL MODE & TOMBOL KERANJANG DI KANAN BAWAH
// ==========================================
const tabFullMenu = document.getElementById('tab-full-menu');
const tabOrderOnline = document.getElementById('tab-order-online');
const menuPageTitle = document.getElementById('menu-page-title');
const menuPageDesc = document.getElementById('menu-page-desc');

// Fungsi pembantu untuk mengambil elemen floating cart secara dinamis
function getFloatingCartBtn() {
    return document.getElementById('floating-cart-btn');
}

if (tabFullMenu && tabOrderOnline) {
    // Mode 1: Full Menu (Sembunyikan Tombol Keranjang Melayang)
    tabFullMenu.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        document.body.classList.remove('can-order');
        tabFullMenu.classList.add('active');
        tabOrderOnline.classList.remove('active');

        if (menuPageTitle) menuPageTitle.innerText = "Full Menu";
        if (menuPageDesc) menuPageDesc.innerText = "Nikmati pilihan sajian racikan kopi khas, minuman segar, dan hidangan pendamping.";
        
        const btn = getFloatingCartBtn();
        if (btn) btn.style.display = 'none';
    });

    // Mode 2: Order Online (Tampilkan Tombol Keranjang Melayang)
    tabOrderOnline.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        document.body.classList.add('can-order');
        tabOrderOnline.classList.add('active');
        tabFullMenu.classList.remove('active');

        if (menuPageTitle) menuPageTitle.innerText = "Order Online";
        if (menuPageDesc) menuPageDesc.innerText = "Pilih menu kesukaanmu, masukkan keranjang, dan pesan langsung via WhatsApp!";

        const btn = getFloatingCartBtn();
        if (btn) {
            btn.style.display = 'flex';
            if (typeof addClickAnimation === 'function') {
                addClickAnimation(btn);
            }
        }
    });
}

// Cek URL Parameter (misal: menu.html?mode=order) saat pertama kali dimuat
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'order' && tabOrderOnline) {
        tabOrderOnline.click();
    } else if (tabFullMenu) {
        // Eksekusi klik default ke Full Menu jika tidak ada parameter order
        tabFullMenu.click();
    }
});

    // ==========================================
    // 1. FITUR FILTER KATEGORI MENU & SEARCH BAR
    // ==========================================
    const categoryBtns = document.querySelectorAll('.category-btn');
    const menuCards = document.querySelectorAll('.card');
    const searchInput = document.getElementById('menu-search-input');

    let currentCategory = 'all';

    function filterMenu() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

        menuCards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            const titleText = card.querySelector('h3') ? card.querySelector('h3').innerText.toLowerCase() : '';
            const descText = card.querySelector('p') ? card.querySelector('p').innerText.toLowerCase() : '';

            const matchesCategory = (currentCategory === 'all' || cardCategory === currentCategory);
            const matchesSearch = titleText.includes(query) || descText.includes(query);

            if (matchesCategory && matchesSearch) {
                card.style.display = '';
                card.style.opacity = '1';
            } else {
                card.style.opacity = '0';
                card.style.display = 'none';
            }
        });
    }

    if (categoryBtns.length > 0) {
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                addClickAnimation(btn);

                currentCategory = btn.getAttribute('data-category') || 'all';
                filterMenu();
            });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterMenu);
    }

    // ==========================================
    // 2. FITUR POP-UP MODAL DETAIL MENU (OTOMATIS GAMBAR PLACEHOLDER)
    // ==========================================
    const menuDetailModal = document.getElementById('menu-detail-modal');
    const closeDetailBtn = document.getElementById('close-detail-modal'); 
    const modalMenuName = document.getElementById('modal-menu-name');
    const modalMenuPrice = document.getElementById('modal-menu-price');
    const modalMenuDesc = document.getElementById('modal-menu-desc');
    const modalAddToCartBtn = document.getElementById('modal-add-cart-btn');
    const modalMenuImg = document.getElementById('modal-menu-img'); 

    let currentSelectedMenu = { name: '', price: 0 };

    document.addEventListener('click', (e) => {
        const target = e.target;
        const btnDetail = target.closest('.btn-detail, .btn-secondary, [data-action="detail"]');
        const isDetailText = target.innerText && target.innerText.toLowerCase().trim() === 'detail';

        if (btnDetail || (isDetailText && target.closest('.card'))) {
            e.preventDefault();
            e.stopPropagation();

            const cardParent = target.closest('.card');

            if (cardParent && menuDetailModal) {
                // 1. Ambil nama menu
                const name = cardParent.getAttribute('data-name') || 
                             (cardParent.querySelector('h3') ? cardParent.querySelector('h3').innerText : 'Menu');
                
                // 2. Ambil harga menu
                const rawPrice = cardParent.getAttribute('data-price');
                let price = 0;
                let priceText = 'Rp 0';

                if (rawPrice) {
                    price = parseInt(rawPrice, 10);
                    priceText = `Rp ${price.toLocaleString('id-ID')}`;
                } else {
                    const priceElem = cardParent.querySelector('.price');
                    priceText = priceElem ? priceElem.innerText : 'Rp 0';
                    price = parseInt(priceText.replace(/[^0-9]/g, ''), 10) || 0;
                }

                // 3. Ambil deskripsi menu
                const descElem = cardParent.querySelector('.desc') || cardParent.querySelector('p');
                const desc = descElem ? descElem.innerText : 'Nikmati sajian spesial khas dari kami.';

                // 4. GENERATE GAMBAR OTOMATIS JIKA FOTO BELUM ADA
                if (modalMenuImg) {
                    const cardImg = cardParent.querySelector('img');
                    const imageWrapper = modalMenuImg.closest('.modal-image-wrapper') || modalMenuImg;
                    const imgSrc = cardImg ? cardImg.getAttribute('src') : null;

                    // Buat url gambar placeholder otomatis berlatar cokelat kopi dengan teks nama menu
                    const fallbackImgSrc = `https://placehold.co/600x400/4a2c2a/ffffff?text=${encodeURIComponent(name)}`;

                    if (imgSrc && imgSrc.trim() !== '' && !imgSrc.includes('undefined')) {
                        modalMenuImg.src = imgSrc;
                    } else {
                        modalMenuImg.src = fallbackImgSrc;
                    }

                    // Jika gambar gagal dimuat (misal file 404), otomatis ubah ke gambar placeholder
                    modalMenuImg.onerror = function() {
                        this.src = fallbackImgSrc;
                    };

                    modalMenuImg.alt = name;
                    modalMenuImg.style.display = 'block';
                    if (imageWrapper !== modalMenuImg) imageWrapper.style.display = 'block';
                }

                currentSelectedMenu = { name, price };

                if (modalMenuName) modalMenuName.innerText = name;
                if (modalMenuPrice) modalMenuPrice.innerText = priceText;
                if (modalMenuDesc) modalMenuDesc.innerText = desc;

                // Tampilkan Modal
                menuDetailModal.classList.add('show');
                menuDetailModal.style.display = 'flex';
            }
        }
    });

    // Tutup Modal via Tombol Silang (X)
    if (closeDetailBtn && menuDetailModal) {
        closeDetailBtn.addEventListener('click', () => {
            menuDetailModal.classList.remove('show');
            menuDetailModal.style.display = 'none';
        });
    }

    // Masukkan ke Keranjang dari dalam Modal Detail
    if (modalAddToCartBtn) {
        modalAddToCartBtn.addEventListener('click', () => {
            if (currentSelectedMenu.name) {
                addToCart(currentSelectedMenu.name, currentSelectedMenu.price);
                
                const originalText = modalAddToCartBtn.innerText;
                modalAddToCartBtn.innerText = 'Tersimpan! ✔️';
                setTimeout(() => {
                    modalAddToCartBtn.innerText = originalText;
                    if (menuDetailModal) {
                        menuDetailModal.classList.remove('show');
                        menuDetailModal.style.display = 'none';
                    }
                }, 600);
            }
        });
    }

   // ==========================================
// 3. FITUR MANAJEMEN KERANJANG BELANJA & VOUCHER
// ==========================================
let cart = [];

// Variable Simpan Status Voucher Active
let activeDiscountPercent = 0;
let activeDiscountNominal = 0;
let appliedVoucherCode = "";

const cartModal = document.getElementById('cart-modal');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsList = document.getElementById('cart-items-list');
const cartCount = document.getElementById('cart-count');
const cartTotalPrice = document.getElementById('cart-total-price');
const checkoutWaBtn = document.getElementById('checkout-wa-btn');

// Elemen Voucher & Rincian Harga
const inputVoucher = document.getElementById('inputVoucher');
const btnApplyVoucher = document.getElementById('btnApplyVoucher');
const voucherMsg = document.getElementById('voucherMessage') || document.querySelector('.voucher-msg');
const subtotalPriceEl = document.getElementById('subtotalPrice');

// Otomatis Cek Kupon Tersimpan di LocalStorage
function checkSavedCoupon() {
    try {
        const savedCoupon = JSON.parse(localStorage.getItem('active_coupon'));
        if (savedCoupon && savedCoupon.code) {
            applyVoucherCode(savedCoupon.code);
        }
    } catch (e) {
        console.log("Tidak ada kupon tersimpan.");
    }
}

// Buka & Tutup Modal Keranjang
function openCartModal() {
    if (!cartModal) return;
    cartModal.classList.add('show');
    cartModal.style.display = 'flex';
    updateCartUI();
}

function closeCartModal() {
    if (!cartModal) return;
    cartModal.classList.remove('show');
    cartModal.style.display = 'none';
}

if (typeof floatingCartBtn !== 'undefined' && floatingCartBtn) {
    floatingCartBtn.addEventListener('click', () => {
        openCartModal();
        if (typeof addClickAnimation === 'function') addClickAnimation(floatingCartBtn);
    });
}

const cartIconBtn = document.getElementById('cart-icon-btn');
if (cartIconBtn) {
    cartIconBtn.addEventListener('click', openCartModal);
}

if (closeCartBtn) {
    closeCartBtn.addEventListener('click', closeCartModal);
}

window.addEventListener('click', (e) => {
    if (cartModal && e.target === cartModal) closeCartModal();
    if (typeof menuDetailModal !== 'undefined' && menuDetailModal && e.target === menuDetailModal) {
        menuDetailModal.classList.remove('show');
        menuDetailModal.style.display = 'none';
    }
});

// Tambah Produk dari Tombol Kartu
document.addEventListener('click', (e) => {
    const btnOrder = e.target.closest('.btn-add-cart, .btn-order');
    if (btnOrder) {
        e.preventDefault();
        const cardParent = btnOrder.closest('.card');
        if (cardParent) {
            const name = cardParent.getAttribute('data-name') || 
                         (cardParent.querySelector('h3') ? cardParent.querySelector('h3').innerText.trim() : 'Menu');
            
            const rawPrice = cardParent.getAttribute('data-price');
            const priceElem = cardParent.querySelector('.price');
            
            let parsedPrice = 0;
            if (rawPrice) {
                parsedPrice = parseInt(rawPrice, 10);
            } else if (priceElem) {
                const cleanPriceText = priceElem.innerText.replace(/[^0-9]/g, '');
                parsedPrice = parseInt(cleanPriceText, 10);
            }

            const finalPrice = isNaN(parsedPrice) ? 0 : parsedPrice;

            addToCart(name, finalPrice);
            if (typeof addClickAnimation === 'function') addClickAnimation(btnOrder);
        }
    }
});

function addToCart(name, price) {
    const validPrice = typeof price === 'number' && !isNaN(price) ? price : 0;

    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
        if (existingItem.price === 0 && validPrice > 0) {
            existingItem.price = validPrice;
        }
    } else {
        cart.push({ name, price: validPrice, quantity: 1 });
    }
    
    updateCartUI();
    
    if (typeof showToast === 'function') {
        const safeName = typeof escapeHTML === 'function' ? escapeHTML(name) : name;
        showToast(`🛒 <b>${safeName}</b> berhasil ditambahkan ke keranjang!`);
    }
}

// FUNGSI LOGIKA VALIDASI KODE VOUCHER (SUDAH DITAMBAL RESET SIFATNYA)
function applyVoucherCode(code) {
    if (!code) return;
    const codeInput = code.trim().toUpperCase();

    if (inputVoucher) inputVoucher.value = codeInput;

    if (codeInput === 'NIFORA10') {
        activeDiscountPercent = 0.10;
        activeDiscountNominal = 0;
        appliedVoucherCode = 'NIFORA10';
        if (voucherMsg) {
            voucherMsg.style.color = '#2e7d32';
            voucherMsg.innerText = 'Voucher Diskon 10% berhasil dipasang!';
        }
    } else if (codeInput === 'NIFORA5') {
        activeDiscountPercent = 0.05;
        activeDiscountNominal = 0;
        appliedVoucherCode = 'NIFORA5';
        if (voucherMsg) {
            voucherMsg.style.color = '#2e7d32';
            voucherMsg.innerText = 'Voucher Diskon 5% berhasil dipasang!';
        }
    } else if (codeInput === 'NIFORA5K') {
        activeDiscountPercent = 0;
        activeDiscountNominal = 5000;
        appliedVoucherCode = 'NIFORA5K';
        if (voucherMsg) {
            voucherMsg.style.color = '#2e7d32';
            voucherMsg.innerText = 'Voucher Potongan Rp 5.000 berhasil dipasang!';
        }
    } else {
        activeDiscountPercent = 0;
        activeDiscountNominal = 0;
        appliedVoucherCode = "";
        if (voucherMsg) {
            voucherMsg.style.color = '#d32f2f';
            voucherMsg.innerText = 'Kode voucher tidak valid!';
        }
    }

    updateCartUI();
}

// Event Klik Tombol Terapkan Voucher (Mencegah Eksekusi Script Perusak Luar)
if (btnApplyVoucher && inputVoucher) {
    btnApplyVoucher.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
        }
        
        const userEnteredCode = inputVoucher.value;
        applyVoucherCode(userEnteredCode);
    }, true);
}

// UPDATE UI DAN PERHITUNGAN HARGA
function updateCartUI() {
    if (!cartItemsList) return;

    cartItemsList.innerHTML = '';
    let subtotal = 0;
    let totalCount = 0;

    if (cart.length === 0) {
        cartItemsList.innerHTML = '<p class="empty-cart-text" style="text-align: center; color: #777; padding: 20px 0;">Keranjang masih kosong ☕</p>';
    } else {
        cart.forEach((item, index) => {
            subtotal += item.price * item.quantity;
            totalCount += item.quantity;

            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            itemElement.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 10px;';
            
            const safeName = typeof escapeHTML === 'function' ? escapeHTML(item.name) : item.name;

            itemElement.innerHTML = `
                <div style="flex-grow: 1; padding-right: 10px;">
                    <div class="cart-item-title" style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #333;">${safeName}</div>
                    <div class="cart-item-price" style="color: #666; font-size: 0.85rem;">Rp ${item.price.toLocaleString('id-ID')} x ${item.quantity}</div>
                </div>
                <div class="cart-item-controls" style="display: flex; align-items: center; gap: 8px;">
                    <button type="button" class="btn-qty btn-qty-minus" data-index="${index}" data-action="decrease" style="background: #f1f1f1; border: none; width: 28px; height: 28px; border-radius: 4px; font-weight: bold; cursor: pointer;">-</button>
                    <span style="font-size: 0.95rem; font-weight: 600; min-width: 15px; text-align: center;">${item.quantity}</span>
                    <button type="button" class="btn-qty btn-qty-plus" data-index="${index}" data-action="increase" style="background: #f1f1f1; border: none; width: 28px; height: 28px; border-radius: 4px; font-weight: bold; cursor: pointer;">+</button>
                </div>
            `;
            cartItemsList.appendChild(itemElement);
        });
    }

    // 1. HITUNG DISKON DINAMIS
    let discountAmount = 0;
    if (subtotal > 0) {
        if (activeDiscountPercent > 0) {
            discountAmount = Math.round(subtotal * activeDiscountPercent);
        } else if (activeDiscountNominal > 0) {
            discountAmount = activeDiscountNominal;
        }
    }

    if (discountAmount > subtotal) {
        discountAmount = subtotal;
    }

    // 2. HITUNG GRAND TOTAL
    const grandTotal = Math.max(0, subtotal - discountAmount);

    // 3. UPDATE KE DOM / HTML
    if (cartCount) cartCount.innerText = totalCount;
    
    const floatingCartCount = document.getElementById('floating-cart-count');
    if (floatingCartCount) floatingCartCount.innerText = totalCount;

    if (subtotalPriceEl) subtotalPriceEl.innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
    
    // TEMBAK KE SELURUH ELEMEN DISCOUNT PRICE (Mencegah Bug ID Ganda)
    const discountElements = document.querySelectorAll('#discountPrice');
    if (discountElements.length > 0) {
        discountElements.forEach(el => {
            el.innerText = `- Rp ${discountAmount.toLocaleString('id-ID')}`;
        });
    }

    if (cartTotalPrice) cartTotalPrice.innerText = `Rp ${grandTotal.toLocaleString('id-ID')}`;
}

// Event Pengatur Jumlah (+/-)
if (cartItemsList) {
    cartItemsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-qty')) {
            const index = parseInt(e.target.getAttribute('data-index'), 10);
            const action = e.target.getAttribute('data-action');

            if (action === 'increase') {
                cart[index].quantity += 1;
            } else if (action === 'decrease') {
                cart[index].quantity -= 1;
                if (cart[index].quantity <= 0) {
                    cart.splice(index, 1);
                }
            }
            updateCartUI();
        }
    });
}

// Checkout via WhatsApp
if (checkoutWaBtn) {
    checkoutWaBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert("Keranjang kamu masih kosong!");
            return;
        }

        const customerNameInput = document.getElementById('customer-name');
        const customerTableInput = document.getElementById('customer-table');

        const customerName = customerNameInput ? customerNameInput.value.trim() : '';
        const customerTable = customerTableInput ? customerTableInput.value.trim() : '';

        if (!customerName) {
            alert("Mohon isi nama pemesan terlebih dahulu!");
            if (customerNameInput) customerNameInput.focus();
            return;
        }

        const selectedPaymentRadio = document.querySelector('input[name="payment-method"]:checked');
        const paymentMethod = selectedPaymentRadio ? selectedPaymentRadio.value : 'QRIS';

        const phoneNumber = "6285136629380";
        let itemDetails = "";
        let subtotal = 0;

        cart.forEach((item, i) => {
            const itemSubtotal = item.price * item.quantity;
            subtotal += itemSubtotal;
            itemDetails += `${i + 1}. *${item.name}* (${item.quantity}x) = Rp ${itemSubtotal.toLocaleString('id-ID')}\n`;
        });

        let discountAmount = 0;
        if (activeDiscountPercent > 0) {
            discountAmount = Math.round(subtotal * activeDiscountPercent);
        } else if (activeDiscountNominal > 0) {
            discountAmount = activeDiscountNominal;
        }

        if (discountAmount > subtotal) discountAmount = subtotal;

        const grandTotal = Math.max(0, subtotal - discountAmount);

        let message = `Halo nifora coffee! Saya mau pesan:\n\n`;
        message += `👤 *Nama:* ${customerName}\n`;
        if (customerTable) {
            message += `📍 *Meja/Lokasi:* ${customerTable}\n`;
        }
        message += `💳 *Metode Pembayaran:* ${paymentMethod}\n\n`;
        message += `📋 *Daftar Pesanan:*\n${itemDetails}\n`;
        
        message += `💵 *Subtotal:* Rp ${subtotal.toLocaleString('id-ID')}\n`;
        if (discountAmount > 0) {
            message += `🎟️ *Voucher (${appliedVoucherCode}):* - Rp ${discountAmount.toLocaleString('id-ID')}\n`;
        }
        message += `💰 *Total Pembayaran:* Rp ${grandTotal.toLocaleString('id-ID')}\n\n`;
        message += `Mohon diproses pesanan saya. Terima kasih!`;

        const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
    });
}

// Panggil Inisialisasi Pertama
checkSavedCoupon();
updateCartUI();

   // ==========================================
    // 4. FITUR DONASI (ONE-TIME ONLY)
    // ==========================================
    const amountCards = document.querySelectorAll('.amount-card');
    const customInput = document.getElementById('other-amount');

    if (amountCards.length > 0) {
        amountCards.forEach(card => {
            card.addEventListener('click', () => {
                amountCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                if (customInput) customInput.value = '';
                
                // Pengecekan aman untuk animasi
                if (typeof addClickAnimation === 'function') {
                    addClickAnimation(card);
                }
            });
        });
    }

    if (customInput) {
        customInput.addEventListener('input', () => {
            if (customInput.value.trim() !== '') {
                amountCards.forEach(c => c.classList.remove('active'));
            }
        });
    }

    const toggleNote = document.getElementById("toggle-note");
    const noteField = document.getElementById("note-field");
    if (toggleNote && noteField) {
        toggleNote.addEventListener("change", () => {
            noteField.classList.toggle("show", toggleNote.checked);
        });
    }

    const toggleDedication = document.getElementById("toggle-dedication");
    const dedicationField = document.getElementById("dedication-field");
    if (toggleDedication && dedicationField) {
        toggleDedication.addEventListener("change", () => {
            dedicationField.classList.toggle("show", toggleDedication.checked);
        });
    }

    const submitDonateBtn = document.querySelector('.btn-donate-submit');
    if (submitDonateBtn) {
        submitDonateBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Cegah proses berulang jika tombol sedang terkunci/loading
            if (submitDonateBtn.disabled) return;

            if (typeof addClickAnimation === 'function') {
                addClickAnimation(submitDonateBtn);
            }

            const activeCard = document.querySelector('.amount-card.active');
            let selectedAmount = activeCard ? activeCard.getAttribute('data-amount') : '';
            if (!selectedAmount && customInput) {
                selectedAmount = customInput.value.trim();
            }

            // Validasi nominal donasi
            if (!selectedAmount || parseInt(selectedAmount, 10) <= 0) {
                alert('Silakan pilih atau masukkan nominal donasi yang valid.');
                return;
            }

            // Kunci tombol agar tidak bisa di-spam klik
            submitDonateBtn.disabled = true;

            const originalText = submitDonateBtn.innerText;
            submitDonateBtn.innerText = 'Memproses... ☕';
            submitDonateBtn.style.opacity = '0.8';

            setTimeout(() => {
                submitDonateBtn.innerText = 'Terima Kasih! ❤️';
                submitDonateBtn.style.backgroundColor = '#10b981';

                // Reset pilihan nominal setelah sukses
                amountCards.forEach(c => c.classList.remove('active'));
                if (customInput) customInput.value = '';

                setTimeout(() => {
                    submitDonateBtn.innerText = originalText;
                    submitDonateBtn.style.backgroundColor = '';
                    submitDonateBtn.style.opacity = '1';
                    
                    // Buka kembali kunci tombol
                    submitDonateBtn.disabled = false; 
                }, 2000);
            }, 800);
        });
    }

   // ==========================================
// 5. FITUR ULASAN PENGUNJUNG & FILTER RATING
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const reviewForm = document.getElementById('add-review-form');
    const reviewsList = document.getElementById('reviews-list');
    const ratingFilterBtns = document.querySelectorAll('.filter-star-btn, .rating-filter-btn');

    let activeRatingFilter = 'all';
    let showAllReviews = false;
    const REVIEW_LIMIT = 6;

    // Fungsi Pengaman untuk Mencegah Script Injection (XSS)
    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    const defaultReviews = [
        { id: 1, name: "fauzan ardian", rating: 5, comment: "sangat cocok untuk nongkrong" },
        { id: 2, name: "irfan agung pratama", rating: 5, comment: "aku suka coffe shop ini cocok untuk nugas" },
        { id: 3, name: "Farhan Rizky", rating: 5, comment: "Bagus banget konsep sosialnya. Minum kopi sambil secara tidak langsung ikut ngedukung komunitas lokal." },
        { id: 4, name: "Anisa Rahma", rating: 4, comment: "Sewa tempat buat acara mini gathering kemarin puas banget. Pelayanan dan mas-mas baristanya ramah." }
    ];

    function getStoredReviews() {
        try {
            const stored = localStorage.getItem('nifora_reviews');
            if (stored !== null) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error("Gagal membaca LocalStorage:", error);
        }
        localStorage.setItem('nifora_reviews', JSON.stringify(defaultReviews));
        return defaultReviews;
    }

    function updateFilterCounts(reviews) {
        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => {
            const numericRating = parseInt(r.rating, 10);
            if (counts[numericRating] !== undefined) {
                counts[numericRating]++;
            }
        });

        ratingFilterBtns.forEach(btn => {
            const r = btn.getAttribute('data-rating');
            if (r && r !== 'all') {
                const count = counts[r] || 0;
                let countSpan = btn.querySelector('.rating-count');
                if (!countSpan) {
                    countSpan = document.createElement('span');
                    countSpan.className = 'rating-count';
                    btn.appendChild(countSpan);
                }
                countSpan.innerText = ` (${count})`;
            }
        });
    }

    function renderReviews() {
        if (!reviewsList) return;

        const reviews = getStoredReviews();
        updateFilterCounts(reviews);

        reviewsList.innerHTML = '';

        const filteredReviews = activeRatingFilter === 'all' 
            ? reviews 
            : reviews.filter(r => parseInt(r.rating, 10) === parseInt(activeRatingFilter, 10));

        if (filteredReviews.length === 0) {
            reviewsList.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: #888; padding: 20px;">Belum ada ulasan untuk rating bintang ini.</p>';
            removeShowMoreButton();
            return;
        }

        const reviewsToDisplay = showAllReviews ? filteredReviews : filteredReviews.slice(0, REVIEW_LIMIT);

        const htmlContent = reviewsToDisplay.map((item) => {
            const stars = '⭐'.repeat(parseInt(item.rating, 10));
            
            return `
                <div class="testimonial-card review-card" data-rating="${item.rating}">
                    <button type="button" class="delete-review-btn" data-id="${item.id || ''}" title="Hapus Ulasan">✕</button>
                    <div class="stars review-stars">${stars}</div>
                    <p>"${escapeHTML(item.comment)}"</p>
                    <h4 class="review-author-name">- ${escapeHTML(item.name)}</h4>
                </div>
            `;
        }).join('');

        reviewsList.innerHTML = htmlContent;

        if (filteredReviews.length > REVIEW_LIMIT) {
            renderShowMoreButton(filteredReviews.length);
        } else {
            removeShowMoreButton();
        }
    }

    function renderShowMoreButton(totalCount) {
        let btn = document.getElementById('toggle-reviews-btn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'toggle-reviews-btn';
            btn.type = 'button';
            btn.style.cssText = `
                display: block;
                margin: 25px auto 10px;
                padding: 10px 24px;
                background-color: #4a2c2a;
                color: #ffffff;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            `;
            
            if (reviewsList.parentNode) {
                reviewsList.parentNode.insertBefore(btn, reviewsList.nextSibling);
            }

            btn.addEventListener('click', () => {
                showAllReviews = !showAllReviews;
                if (typeof addClickAnimation === 'function') addClickAnimation(btn);
                renderReviews();
            });
        }

        btn.innerText = showAllReviews 
            ? 'Sembunyikan Ulasan 🔼' 
            : `Tampilkan Semua Ulasan (${totalCount}) 🔽`;
    }

    function removeShowMoreButton() {
        const btn = document.getElementById('toggle-reviews-btn');
        if (btn) btn.remove();
    }

    if (ratingFilterBtns.length > 0) {
        ratingFilterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                ratingFilterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (typeof addClickAnimation === 'function') addClickAnimation(btn);

                const targetRating = btn.getAttribute('data-rating');
                if (targetRating) {
                    activeRatingFilter = targetRating;
                }
                showAllReviews = false;
                renderReviews();
            });
        });
    }

    if (reviewsList) {
        reviewsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-review-btn')) {
                const targetId = e.target.getAttribute('data-id');
                let currentReviews = getStoredReviews();
                
                if (confirm('Apakah Anda yakin ingin menghapus ulasan ini?')) {
                    if (targetId) {
                        currentReviews = currentReviews.filter(r => String(r.id) !== String(targetId));
                    } else {
                        const card = e.target.closest('.review-card');
                        const name = card.querySelector('.review-author-name').innerText.replace('- ', '');
                        const comment = card.querySelector('p').innerText.replace(/^"|"$/g, '');
                        const index = currentReviews.findIndex(r => r.name === name && r.comment === comment);
                        if (index !== -1) currentReviews.splice(index, 1);
                    }

                    localStorage.setItem('nifora_reviews', JSON.stringify(currentReviews));
                    renderReviews();
                }
            }
        });
    }

    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const authorInput = document.getElementById('review-author');
            const ratingInput = document.getElementById('review-rating');
            const textInput = document.getElementById('review-text');

            const name = authorInput ? authorInput.value.trim() : '';
            const rating = ratingInput ? parseInt(ratingInput.value, 10) : 5;
            const comment = textInput ? textInput.value.trim() : '';

            if (!name || !comment) {
                alert('Silakan isi nama dan komentar terlebih dahulu.');
                return;
            }

            const newReview = { id: Date.now(), name, rating, comment };
            const currentReviews = getStoredReviews();
            currentReviews.unshift(newReview); 
            
            localStorage.setItem('nifora_reviews', JSON.stringify(currentReviews));

            reviewForm.reset();
            activeRatingFilter = 'all'; 
            showAllReviews = false;
            
            ratingFilterBtns.forEach(b => b.classList.remove('active'));
            if (ratingFilterBtns[0]) ratingFilterBtns[0].classList.add('active');

            renderReviews();

            alert('Terima kasih! Ulasan Anda berhasil ditambahkan.');
        });
    }

    renderReviews();
});

    // ==========================================
    // 6. FITUR STATUS BUKA/TUTUP TOKO (WIB Presisi)
    // ==========================================
    const storeStatus = document.getElementById('storeStatus');
    const statusText = document.getElementById('statusText');

    if (storeStatus && statusText) {
        const now = new Date();
        
        const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'short' });
        const hourFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false });

        const dayName = dayFormatter.format(now);
        const currentHour = parseInt(hourFormatter.format(now), 10);

        const isWorkingDay = dayName !== 'Sun';
        const isOpenHours = (currentHour >= 8 && currentHour < 17);

        if (isWorkingDay && isOpenHours) {
            statusText.innerText = "Buka";
            storeStatus.classList.add('open');
            storeStatus.classList.remove('closed');
        } else {
            statusText.innerText = "Tutup";
            storeStatus.classList.add('closed');
            storeStatus.classList.remove('open');
        }
    }

    // ==========================================
    // 7. FITUR TRANSISI HALAMAN
    // ==========================================
    document.body.classList.add("page-loaded");

    const navLinks = document.querySelectorAll("a[href]");

    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            const targetUrl = link.getAttribute("href");

            if (
                !targetUrl ||
                targetUrl.startsWith("#") ||
                targetUrl.startsWith("javascript:") ||
                targetUrl.startsWith("mailto:") ||
                targetUrl.startsWith("tel:") ||
                link.getAttribute("target") === "_blank"
            ) {
                return;
            }

            e.preventDefault();

            document.body.classList.remove("page-loaded");
            document.body.classList.add("page-fading");

            setTimeout(() => {
                window.location.href = targetUrl;
            }, 300);
        });
    });

});

// ==========================================
// FITUR SPIN THE WHEEL (DESAIN BANNER)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const openSpinModalBtn = document.getElementById('openSpinModalBtn');
    const spinModal = document.getElementById('spinModal');
    const closeSpin = document.querySelector('.close-spin');
    const canvas = document.getElementById('wheelCanvas');
    const spinActionBtn = document.getElementById('spinActionBtn');
    const spinUserWa = document.getElementById('spinUserWa');
    const spinResult = document.getElementById('spinResult');
    const spinRewardText = document.getElementById('spinRewardText');
    const couponCode = document.getElementById('couponCode');
    const useCouponBtn = document.getElementById('useCouponBtn');

    if (canvas && openSpinModalBtn && spinModal) {
        const ctx = canvas.getContext('2d');

        // DAFTAR HADIAH & PERSENTASE PELUANG (Total Chance: 100%)
        const rewards = [
            { label: 'Diskon 5%', code: 'NIFORA5', chance: 35 },         // Peluang 20%
            { label: 'Zonk 😅', code: null, chance: 30 },                // Peluang 30%
            { label: 'Diskon 10%', code: 'NIFORA10', chance: 5 },         // Peluang 5% (Langka)
            { label: 'iPhone 17 Pro', code: 'IPHONE17', chance: 0 },      // Peluang 0% (Item Display)
            { label: 'Zonk ☕', code: null, chance: 35 },                 // Peluang 35%
            { label: 'Diskon 5%', code: 'NIFORA5', chance: 10 }          // Peluang 10%
        ];

        const colors = ['#6b442b', '#3d231d', '#8d5b38', '#503120', '#6b442b', '#3d231d'];
        const numSegments = rewards.length;
        const arcSize = (2 * Math.PI) / numSegments;
        let currentAngle = 0;
        let isSpinning = false;

        function drawWheel() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < numSegments; i++) {
                const angle = currentAngle + i * arcSize;
                ctx.beginPath();
                ctx.fillStyle = colors[i];
                ctx.moveTo(150, 150);
                ctx.arc(150, 150, 140, angle, angle + arcSize);
                ctx.lineTo(150, 150);
                ctx.fill();

                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.translate(150, 150);
                ctx.rotate(angle + arcSize / 2);
                ctx.textAlign = 'right';
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText(rewards[i].label, 130, 5);
                ctx.restore();
            }
        }
        drawWheel();

        // Buka Modal
        openSpinModalBtn.addEventListener('click', () => {
            spinModal.style.display = 'flex';
        });

        // Tutup Modal via Tombol Close
        if (closeSpin) {
            closeSpin.addEventListener('click', () => {
                spinModal.style.display = 'none';
            });
        }

        // Klik Luar Modal untuk Menutup
        window.addEventListener('click', (e) => {
            if (e.target === spinModal) spinModal.style.display = 'none';
        });

        // Memilih indeks berdasarkan bobot chance
        function getRandomRewardIndex() {
            const totalWeight = rewards.reduce((sum, item) => sum + item.chance, 0);
            let randomNum = Math.random() * totalWeight;

            for (let i = 0; i < rewards.length; i++) {
                if (randomNum < rewards[i].chance) {
                    return i;
                }
                randomNum -= rewards[i].chance;
            }
            return 0;
        }

        // Logika Eksekusi Spin
        if (spinActionBtn && spinUserWa) {
            spinActionBtn.addEventListener('click', () => {
                const waNumber = spinUserWa.value.trim();
                if (!waNumber) {
                    alert('Masukkan nomor WhatsApp terlebih dahulu!');
                    return;
                }

                const lastSpin = localStorage.getItem('last_spin_time');
                const now = new Date().getTime();
                if (lastSpin && (now - lastSpin < 24 * 60 * 60 * 1000)) {
                    alert('Kamu sudah memutar roda hari ini. Coba lagi besok ya!');
                    return;
                }

                if (isSpinning) return;
                isSpinning = true;

                // Sembunyikan hasil / voucher sebelumnya saat roda baru diputar
                if (spinResult) spinResult.classList.add('hidden');

                // Tentukan pemenang
                const winningIndex = getRandomRewardIndex();

                // Hitung posisi sudut agar segmen pemenang berada di jam 12 (1.5 * PI)
                const targetSegmentAngle = (winningIndex + 0.5) * arcSize;
                const targetAngle = (1.5 * Math.PI) - targetSegmentAngle;
                
                // Tambahkan 5 putaran penuh (5 * 2 * PI)
                const fullSpins = 5 * (2 * Math.PI);
                const finalAngle = currentAngle + fullSpins + ((targetAngle - (currentAngle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI));

                const startAngle = currentAngle;
                const duration = 4000;
                const startTime = performance.now();

                function animate(time) {
                    const elapsed = time - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const easeOut = 1 - Math.pow(1 - progress, 3);

                    currentAngle = startAngle + (finalAngle - startAngle) * easeOut;
                    drawWheel();

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        isSpinning = false;
                        localStorage.setItem('last_spin_time', new Date().getTime());
                        showResult(winningIndex);
                    }
                }
                requestAnimationFrame(animate);
            });
        }

        // Menampilkan Hasil Pemenang
        function showResult(index) {
            if (!spinResult || !spinRewardText || !couponCode) return;

            const prize = rewards[index];

            spinResult.classList.remove('hidden');
            if (prize.code) {
                spinRewardText.innerText = `Kamu mendapatkan ${prize.label}!`;
                couponCode.innerText = prize.code;
                localStorage.setItem('active_coupon', JSON.stringify(prize));
            } else {
                spinRewardText.innerText = 'Sayang sekali belum beruntung! Coba lagi besok.';
                couponCode.innerText = '-';
            }
        }

        if (useCouponBtn && couponCode) {
            useCouponBtn.addEventListener('click', () => {
                const code = couponCode.innerText;
                if (code !== '-') {
                    navigator.clipboard.writeText(code);
                    alert(`Kode voucher ${code} berhasil disalin! Gunakan di keranjang belanja saat checkout.`);
                }
                spinModal.style.display = 'none';
            });
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const inputVoucher = document.getElementById('inputVoucher');
    const btnApplyVoucher = document.getElementById('btnApplyVoucher');
    const voucherMessage = document.getElementById('voucherMessage');
    const subtotalPriceEl = document.getElementById('subtotalPrice');
    const discountPriceEl = document.getElementById('discountPrice');
    const totalPriceEl = document.getElementById('totalPrice');

    // Contoh harga awal belanjaan
    let subtotal = 50000;

    // Otomatis isi input jika ada voucher aktif dari Spin Wheel
    const savedCoupon = JSON.parse(localStorage.getItem('active_coupon'));
    if (savedCoupon && savedCoupon.code && inputVoucher) {
        inputVoucher.value = savedCoupon.code;
    }

    if (btnApplyVoucher) {
        btnApplyVoucher.addEventListener('click', () => {
            const codeInput = inputVoucher.value.trim().toUpperCase();
            let discountPercent = 0;
            let discountNominal = 0;

            // Cek validasi kode voucher
            if (codeInput === 'NIFORA5') {
                discountPercent = 0.05; // 5%
                voucherMessage.style.color = '#4CAF50';
                voucherMessage.innerText = 'Voucher Diskon 5% berhasil dipasang!';
            } else if (codeInput === 'NIFORA10') {
                discountPercent = 0.10; // 10%
                voucherMessage.style.color = '#4CAF50';
                voucherMessage.innerText = 'Voucher Diskon 10% berhasil dipasang!';
            } else if (codeInput === 'TOPPINGFREE') {
                discountNominal = 5000; // Contoh potongan Rp 5.000 untuk topping
                voucherMessage.style.color = '#4CAF50';
                voucherMessage.innerText = 'Voucher Gratis Topping dipasang!';
            } else {
                voucherMessage.style.color = '#ff4d4d';
                voucherMessage.innerText = 'Kode voucher tidak valid!';
                return;
            }

            // Hitung total potongan & harga akhir
            if (discountPercent > 0) {
                discountNominal = subtotal * discountPercent;
            }
            
            const grandTotal = Math.max(0, subtotal - discountNominal);

            // Tampilkan rincian ke layar
            discountPriceEl.innerText = `- Rp ${discountNominal.toLocaleString('id-ID')}`;
            totalPriceEl.innerText = `Rp ${grandTotal.toLocaleString('id-ID')}`;
        });
    }
});

//* bisa di hilangkan cuma tombol spin whell
const resetTestBtn = document.getElementById('resetTestBtn');
if (resetTestBtn) {
    resetTestBtn.addEventListener('click', () => {
        localStorage.removeItem('last_spin_time');
        alert('Limit spin berhasil di-reset! Kamu bisa spin lagi.');
    });
}
