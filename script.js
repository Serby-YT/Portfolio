document.addEventListener('DOMContentLoaded', () => {
    /* -------------------------------------------------------------
       1. Custom Cursor Loop & Interactions
       ------------------------------------------------------------- */
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let followerX = 0, followerY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    const renderCursor = () => {
        // Fast snap for the dot
        cursorX += (mouseX - cursorX) * 0.5;
        cursorY += (mouseY - cursorY) * 0.5;
        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;

        // Smooth trailing for the circle
        followerX += (mouseX - followerX) * 0.15;
        followerY += (mouseY - followerY) * 0.15;
        follower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0)`;

        requestAnimationFrame(renderCursor);
    };
    renderCursor();

    // Hover states for links and buttons
    const magneticElements = document.querySelectorAll('a, .magnetic, button');
    magneticElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('active');
            follower.classList.add('active');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('active');
            follower.classList.remove('active');
            // reset magnetic transform if applicable
            el.style.transform = 'translate(0px, 0px)';
        });

        // Magnetic effect logic
        if (el.classList.contains('magnetic') || el.classList.contains('magnetic-btn')) {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
            });
        }
    });

    /* -------------------------------------------------------------
       2. Scroll Observer for Nav & Animations
       ------------------------------------------------------------- */
    const nav = document.getElementById('main-navigation');
    const fadeElements = document.querySelectorAll('.fade-in');
    
    // Smooth fade in reveal
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    fadeElements.forEach(el => observer.observe(el));

    // Scroll Logic for Nav & Parallax Images
    const parallaxImages = document.querySelectorAll('.parallax-img img');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        // Nav background
        if (scrollY > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');

        // Simple Parallax Effect
        parallaxImages.forEach(img => {
            const parent = img.closest('.parallax-img');
            if (!parent) return;
            const speed = parseFloat(parent.getAttribute('data-speed') || 0.1);
            
            // Only calc if in viewport
            const rect = parent.getBoundingClientRect();
            if(rect.top < window.innerHeight && rect.bottom > 0) {
                const yPos = (rect.top - window.innerHeight/2) * speed;
                img.style.transform = `translate3d(0, ${yPos}px, 0) scale(1.1)`;
            }
        });
    });

    // Trigger initial scroll to set states
    window.dispatchEvent(new Event('scroll'));

    /* -------------------------------------------------------------
       3. Auto Resize Textarea
       ------------------------------------------------------------- */
    const textarea = document.getElementById('message');
    if (textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    /* -------------------------------------------------------------
       4. Anchor Link Smooth Scrolling (without altering address bar)
       ------------------------------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
});
