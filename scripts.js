// scripts.js: Conversion Tracking, Stats Animation, Modal Logic, and Filtering

// --- 1. Stats Counter Animation Logic ---
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        let currentValue = Math.floor(progress * (end - start) + start);
        
        if (obj.dataset.target.includes('%')) {
            obj.textContent = currentValue + "%";
        } else if (obj.dataset.target.includes('Days')) {
            obj.textContent = currentValue + " Days";
        } else {
            obj.textContent = currentValue;
        }
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function checkStatsVisibility() {
    const statsContainer = document.getElementById('stats-container');
    if (!statsContainer) return;

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('#stats-container p[data-target]').forEach(obj => {
                    const target = parseInt(obj.dataset.target.replace(/[^0-9]/g, '')); 
                    const duration = 2500; 
                    animateValue(obj, 0, target, duration);
                });
                observer.unobserve(statsContainer); 
            }
        });
    }, {
        threshold: 0.5 
    });

    observer.observe(statsContainer);
}

// --- 2. Lead Capture Modal Logic ---
function setupModal() {
    const modal = document.getElementById('lead-modal');
    const trigger = document.getElementById('lead-modal-trigger');
    const close = document.getElementById('close-modal');

    if (modal && trigger && close) {
        trigger.addEventListener('click', () => {
            modal.style.display = 'flex';
            if (typeof dataLayer !== 'undefined') {
                dataLayer.push({'event': 'lead_modal_open', 'form_type': 'quick_capture'});
            }
        });

        close.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

// --- 3. Form Submission ---
function setupFormSubmission() {
    const form = document.getElementById('lead-capture-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Conversion tracking: Form Submission Success
            if (typeof dataLayer !== 'undefined') {
                dataLayer.push({
                    'event': 'lead_form_submit_success',
                    'lead_region': data.region,
                    'lead_problem': data.problem
                });
            }
            
            alert('Success! Your audit request has been sent. We will contact you within 4 hours.');
            document.getElementById('lead-modal').style.display = 'none';
            form.reset();
        });
    }
}

// --- 4. GDPR/Cookie Consent Logic & Cookie Settings Handler ---
function setupCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    const accept = document.getElementById('accept-cookies');
    
    const handleCookieSettingsClick = (e) => {
        e.preventDefault();
        alert("Cookie Preferences: You can manage consent via the banner at the bottom or review our data usage in the Privacy Policy. Clicking 'Accept All' enables analytics.");
        window.location.href = 'privacy-policy.html';
    };

    document.querySelectorAll('#cookie-settings').forEach(link => {
        link.addEventListener('click', handleCookieSettingsClick);
    });

    const consentStatus = localStorage.getItem('gibes_cookie_consent');

    if (!consentStatus && banner) {
        // Show banner only if no consent status is stored
        banner.style.display = 'flex';
    }

    if (accept) {
        accept.addEventListener('click', () => {
            localStorage.setItem('gibes_cookie_consent', 'accepted');
            if (banner) banner.style.display = 'none';
            
            // GTM Consent Update
            if (typeof dataLayer !== 'undefined') {
                 dataLayer.push({
                    'consent': 'update',
                    'ad_storage': 'granted',
                    'analytics_storage': 'granted'
                 });
            }
            // Execute analytics scripts
            initializeAnalytics();
        });
    }
}

function initializeAnalytics() {
    console.log("Analytics initialized/loaded based on consent.");
}

// --- 5. Case Study Filtering Logic ---
function setupCaseStudyFiltering() {
    const filterContainer = document.getElementById('case-study-filters');
    const caseStudiesContainer = document.getElementById('case-studies-grid');
    const cards = Array.from(document.querySelectorAll('.case-study-card'));
    
    if (!filterContainer || !caseStudiesContainer) return;

    filterContainer.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') return;

        const clickedButton = e.target;
        const filterValue = clickedButton.dataset.filter;
        const filterType = clickedButton.dataset.type;

        // Reset all buttons' active state
        filterContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));

        if (filterValue === 'all') {
            cards.forEach(card => card.classList.remove('filtered-out'));
            clickedButton.classList.add('active');
            return;
        }

        clickedButton.classList.add('active');

        cards.forEach(card => {
            const industry = card.dataset.industry;
            const solution = card.dataset.solution;
            let showCard = false;

            if (filterType === 'industry') {
                showCard = industry === filterValue;
            } else if (filterType === 'solution') {
                showCard = solution === filterValue;
            }

            if (showCard) {
                card.classList.remove('filtered-out');
            } else {
                card.classList.add('filtered-out');
            }
        });
    });

    document.querySelector('#filter-all').classList.add('active');
}


// --- 6. Initialisation ---
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('stats-container')) {
        checkStatsVisibility();
    }
    
    setupModal();
    setupFormSubmission();
    setupCookieBanner();
    
    if (document.getElementById('case-study-filters')) {
        setupCaseStudyFiltering(); 
    }

    // Modal pre-fill logic
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    if (type) {
        const problemSelector = document.querySelector('#lead-capture-form select[name="problem"]');
        if (problemSelector) {
            const problemMap = {
                'audit': 'Downtime',
                'retrofit': 'Retrofit',
                'prototype': 'Prototype',
                'energy': 'Energy',
                'compliance': 'Compliance'
            };
            problemSelector.value = problemMap[type] || '';
        }
        const modalTrigger = document.getElementById('lead-modal-trigger');
        if (modalTrigger) {
             setTimeout(() => { modalTrigger.click(); }, 100); 
        }
    }
});