// GigsCourt App - Main JavaScript
console.log('GigsCourt app initialized');

// Check if running in Capacitor
const isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

// Display platform info
document.addEventListener('DOMContentLoaded', () => {
    const infoDiv = document.querySelector('.info');
    
    if (isCapacitor) {
        const platform = Capacitor.getPlatform();
        const p = document.createElement('p');
        p.className = 'small';
        p.textContent = `Running natively on ${platform}`;
        p.style.marginTop = '10px';
        infoDiv.appendChild(p);
    }
    
    // Add a simple tap interaction
    const statusDiv = document.querySelector('.status');
    let tapCount = 0;
    
    statusDiv.addEventListener('click', () => {
        tapCount++;
        if (tapCount === 1) {
            const hint = document.createElement('p');
            hint.textContent = '👆 Tap again for a surprise!';
            hint.style.color = '#e67e22';
            hint.style.marginTop = '10px';
            hint.style.fontSize = '14px';
            hint.id = 'tap-hint';
            statusDiv.appendChild(hint);
        } else if (tapCount === 2) {
            const hint = document.getElementById('tap-hint');
            if (hint) hint.remove();
            
            const celebration = document.createElement('p');
            celebration.textContent = '🎉 Ready to build GigsCourt! 🎉';
            celebration.style.color = '#27ae60';
            celebration.style.fontWeight = 'bold';
            celebration.style.marginTop = '10px';
            celebration.id = 'celebration';
            statusDiv.appendChild(celebration);
            
            setTimeout(() => {
                const msg = document.getElementById('celebration');
                if (msg) msg.remove();
                tapCount = 0;
            }, 3000);
        }
    });
});

// Handle app state changes
if (isCapacitor) {
    document.addEventListener('pause', () => {
        console.log('App moved to background');
    });
    
    document.addEventListener('resume', () => {
        console.log('App returned to foreground');
    });
}

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {};
}
