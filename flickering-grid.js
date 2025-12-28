/**
 * Flickering Grid Effect (Vanilla JS Port)
 * Matches the aesthetics of the React component.
 */

const FlickeringGrid = {
    init: function (canvasId, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element with id '${canvasId}' not found.`);
            return;
        }

        const config = {
            squareSize: options.squareSize || 4,
            gridGap: options.gridGap || 6,
            flickerChance: options.flickerChance || 0.3,
            color: options.color || "rgb(0, 0, 0)", // Default color
            maxOpacity: options.maxOpacity || 0.3,
        };

        const ctx = canvas.getContext("2d");
        let animationFrameId;
        let squares;
        let cols, rows;
        let dpr;
        let isInView = true; // Simplified for this implementation, assumes always in view or managed externally

        // Helper to parse color (basic implementation)
        const getColorString = (color) => {
            // In a real app this might need more robust parsing to handle all CSS colors
            // But for now we assume rgb/rgba or simple hex if we added a helper.
            // The React version created a tmp canvas to parse. Let's stick to simple string concat for now
            // if the user passes 'rgb(0,0,0)' we need to extract the values to add alpha.
            // For simplicity in this vanilla port, let's assume the passed color is compatible
            // or just use the logic from the component which is robust.

            if (color.startsWith('rgb')) {
                return color.replace(')', ',').replace('rgb(', 'rgba(').replace('rgba(', 'rgba(');
            }
            if (color.startsWith('#')) {
                // Convert hex to rgba prefix
                let c = color.substring(1).split('');
                if (c.length === 3) {
                    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
                }
                c = '0x' + c.join('');
                return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',';
            }
            return 'rgba(0, 0, 0,'; // Fallback
        };

        const memoizedColor = getColorString(config.color);

        const setupCanvas = () => {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            dpr = window.devicePixelRatio || 1;

            canvas.width = width * dpr;
            canvas.height = height * dpr;

            cols = Math.floor(width / (config.squareSize + config.gridGap));
            rows = Math.floor(height / (config.squareSize + config.gridGap));

            squares = new Float32Array(cols * rows);
            for (let i = 0; i < squares.length; i++) {
                squares[i] = Math.random() * config.maxOpacity;
            }
        };

        const updateSquares = (deltaTime) => {
            for (let i = 0; i < squares.length; i++) {
                if (Math.random() < config.flickerChance * deltaTime) {
                    squares[i] = Math.random() * config.maxOpacity;
                }
            }
        };

        const drawGrid = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // We don't need to fill transparent, clearRect does that.

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const opacity = squares[i * rows + j];
                    ctx.fillStyle = `${memoizedColor}${opacity})`;
                    ctx.fillRect(
                        i * (config.squareSize + config.gridGap) * dpr,
                        j * (config.squareSize + config.gridGap) * dpr,
                        config.squareSize * dpr,
                        config.squareSize * dpr
                    );
                }
            }
        };

        let lastTime = 0;
        const animate = (time) => {
            if (!isInView) return;

            const deltaTime = (time - lastTime) / 1000;
            lastTime = time;

            // Cap delta time to prevent huge jumps
            const safeDelta = Math.min(deltaTime, 0.1);

            updateSquares(safeDelta);
            drawGrid();
            animationFrameId = requestAnimationFrame(animate);
        };

        // Init
        setupCanvas();
        requestAnimationFrame(animate);

        // Handle resize
        window.addEventListener('resize', () => {
            setupCanvas();
        });
    }
};
