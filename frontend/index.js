document.addEventListener('DOMContentLoaded', () => {

    // --- Typewriter Effect ---
    const professions = ["Emerging IT", "Emerging Network Engineer", "Emerging CyberSecurity Analyst", "Web Developer", "UI/UX Designer", "Graphic Designer"];
    const professionElement = document.getElementById('profession-text');
    if (professionElement) {
        let professionIndex = 0;
        let charIndex = 0;
        let isTyping = true;

        function typeWriter() {
            const currentProfession = professions[professionIndex];
            if (isTyping) {
                if (charIndex < currentProfession.length) {
                    professionElement.textContent += currentProfession.charAt(charIndex);
                    charIndex++;
                    setTimeout(typeWriter, 100);
                } else {
                    isTyping = false;
                    setTimeout(typeWriter, 1500);
                }
            } else {
                if (charIndex > 0) {
                    professionElement.textContent = currentProfession.substring(0, charIndex - 1);
                    charIndex--;
                    setTimeout(typeWriter, 50);
                } else {
                    isTyping = true;
                    professionIndex = (professionIndex + 1) % professions.length;
                    setTimeout(typeWriter, 500);
                }
            }
        }
        typeWriter();
    }

    // --- Navigation & Section Toggle ---
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.section-link');
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    function showSection(targetId) {
        sections.forEach(sec => {
            if ('#' + sec.id === targetId) {
                sec.style.display = 'block';
            } else {
                sec.style.display = 'none';
            }
        });
    }

    const storedSection = localStorage.getItem('lastSection');
    if (storedSection) {
        showSection(storedSection);
    } else {
        showSection('#home');
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            localStorage.setItem('lastSection', targetId);
            showSection(targetId);
            
            // Auto close mobile menu if open
            if (navMenu && !navMenu.classList.contains('hidden')) {
                navMenu.classList.add('hidden');
                menuToggle.classList.remove('open');
            }
        });
    });

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('hidden');
            menuToggle.classList.toggle('open');
        }); 
    }

    // --- Contact Form Handling ---
    const form = document.getElementById('contactForm');
    const statusMessageDiv = document.getElementById('statusMessage');

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            statusMessageDiv.textContent = 'Sending message...';
            statusMessageDiv.className = 'status-message';
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            try {
                // FIXED: Use relative path for seamless local/prod functionality
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                
                if (!response.ok) {
                    const errorBody = await response.json();
                    console.error('API Error Response:', errorBody);
                    throw new Error(`HTTP error! status: ${response.status}. Message: ${errorBody.error || 'No specific error message provided.'}`);
                }
                
                form.reset();
                statusMessageDiv.textContent = 'Thank you for your feedback! I will get back to you shortly.';
                statusMessageDiv.className = 'status-message status-success';
                
            } catch (error) {
                console.error('Error submitting form:', error);
                statusMessageDiv.textContent = 'Failed to send message. Please try again.';
                statusMessageDiv.className = 'status-message status-error';
            }
        });
    }

    // --- Portfolio Logic (Filter and Lightbox Modal) ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    const portfolioGrid = document.querySelector('.portfolio-grid');
    const modal = document.getElementById('portfolio-modal');
    const modalImage = document.getElementById('modal-image');
    const modalCaption = document.getElementById('modal-caption');
    const closeButton = document.querySelector('.close-button');
    const prevButton = document.querySelector('.prev-button');
    const nextButton = document.querySelector('.next-button');

    if (portfolioGrid && modal) {
        let currentImageIndex = 0;
        let filteredImages = [];

        function updateFilteredItems() {
            const activeFilter = document.querySelector('.filter-btn.active');
            const filterValue = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
            
            portfolioItems.forEach(item => {
                if (filterValue === 'all' || item.classList.contains(filterValue)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
            updateFilteredImages();
        }

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                updateFilteredItems();
            });
        });

        function updateFilteredImages() {
            filteredImages = Array.from(portfolioItems).filter(item => item.style.display !== 'none');
        }

        updateFilteredImages();

        portfolioGrid.addEventListener('click', (e) => {
            const itemLink = e.target.closest('.portfolio-lightbox-link');
            if (itemLink) {
                e.preventDefault();
                const parentItem = itemLink.closest('.portfolio-item');
                currentImageIndex = filteredImages.findIndex(item => item === parentItem);
                updateModalContent();
                modal.classList.add('active');
            }
        });

        closeButton.addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

        prevButton.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex - 1 + filteredImages.length) % filteredImages.length;
            updateModalContent();
        });

        nextButton.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex + 1) % filteredImages.length;
            updateModalContent();
        });

        function updateModalContent() {
            if (filteredImages.length > 0) {
                const newItem = filteredImages[currentImageIndex];
                modalImage.src = newItem.getAttribute('data-full-image');
                modalCaption.textContent = newItem.getAttribute('data-title');
            }
        }

        document.addEventListener('keydown', (e) => {
            if (modal.classList.contains('active')) {
                if (e.key === 'ArrowLeft') prevButton.click();
                else if (e.key === 'ArrowRight') nextButton.click();
                else if (e.key === 'Escape') closeButton.click();
            }
        });
    }

    // --- Carousel Testimonial Logic ---
    const track = document.querySelector('.testimonial-track');
    const dotsContainer = document.querySelector('.carousel-dots');
    
    if (track && dotsContainer) {
        const dots = Array.from(dotsContainer.querySelectorAll('.dot'));
        const testimonials = Array.from(track.querySelectorAll('.testimonial-card'));
        const intervalTime = 4000;

        let currentIndex = 0;
        let autoPlayInterval;

        function updateCarousel() {
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            dots.forEach((dot, index) => {
                if (index === currentIndex) dot.classList.add('active');
                else dot.classList.remove('active');
            });
        }

        function autoPlay() {
            currentIndex = (currentIndex + 1) % testimonials.length;
            updateCarousel();
        }

        function startAutoPlay() { autoPlayInterval = setInterval(autoPlay, intervalTime); }
        function stopAutoPlay() { clearInterval(autoPlayInterval); }

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                stopAutoPlay();
                currentIndex = index;
                updateCarousel();
                startAutoPlay();
            });
        });

        updateCarousel();
        startAutoPlay();
    }
});