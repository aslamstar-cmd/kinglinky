// ad-check.js
(function() {
    function createNotice() {
        const overlay = document.createElement('div');
        overlay.id = 'ab-detector-overlay';
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(3, 7, 18, 0.98); z-index: 999999;
            display: flex; align-items: center; justify-content: center;
            text-align: center; font-family: 'Plus Jakarta Sans', sans-serif;
            color: white;
        `;
        
        overlay.innerHTML = `
            <div style="background: #111827; border: 2px solid #ef4444; padding: 40px; border-radius: 20px; max-width: 450px; margin: 20px;">
                <h2 style="color: #ef4444; margin-bottom: 15px;">Ad Blocker Detected! 🚫</h2>
                <p style="color: #9ca3af; line-height: 1.6;">Nanba, please disable your Ad Blocker to continue. Ads help us provide this service for free. It takes only 5 seconds to disable it.</p>
                <button onclick="location.reload()" style="background: #ef4444; color: white; padding: 12px 30px; border: none; border-radius: 8px; cursor: pointer; font-weight: 800; margin-top: 20px; width: 100%;">I've Disabled It (Reload Page)</button>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden'; // Scroll panna mudiyadhu
    }

    function checkAds() {
        // Create a dummy ad element
        const adTest = document.createElement('div');
        adTest.innerHTML = '&nbsp;';
        adTest.className = 'adsbox ads google-ads ad-placement pub_300x250'; // Common ad classes
        adTest.style = 'position: absolute; left: -9999px; width: 1px; height: 1px;';
        document.body.appendChild(adTest);

        window.setTimeout(function() {
            // Check if element is hidden or height is 0
            if (adTest.offsetHeight === 0 || window.getComputedStyle(adTest).display === 'none') {
                createNotice();
            }
            adTest.remove();
        }, 300);
    }

    // Run after DOM loads
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        checkAds();
    } else {
        document.addEventListener('DOMContentLoaded', checkAds);
    }
})();