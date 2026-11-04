// Small dependency-free skills globe. It renders only while visible.
(() => {
    const globe = document.getElementById('skillsGlobe');
    const canvas = document.getElementById('skillsGlobeCanvas');
    const nodeLayer = document.getElementById('skillsGlobeNodes');
    if (!globe || !canvas || !nodeLayer) return;

    const skills = [
        { name: 'Python', image: 'images/python.svg' },
        { name: 'JavaScript', image: 'images/js.svg' },
        { name: 'FastAPI', image: 'images/fastapi.svg' },
        { name: 'SQL', image: 'images/sql.svg' },
        { name: 'UiPath', image: 'images/uipath.svg' },
        { name: '.NET', image: 'images/dotnet.svg' },
        { name: 'Power BI', image: 'images/powerbi.svg' },
        { name: 'C++', glyph: 'C++' },
        { name: 'AWS', glyph: 'AWS' },
        { name: 'Azure', glyph: 'AZ' },
        { name: 'HTML/CSS', glyph: '</>' },
        { name: 'Git', glyph: 'git' }
    ];

    const points = skills.map((skill, index) => {
        const row = Math.floor(index / 4);
        const y = [0, -.62, .62][row];
        const ring = Math.sqrt(1 - y * y);
        const angle = (index % 4) * Math.PI / 2 + row * Math.PI / 4;
        const element = document.createElement('span');
        element.className = 'globe-skill';
        if (skill.image) {
            const image = document.createElement('img');
            image.src = skill.image;
            image.alt = '';
            element.append(image);
        } else {
            const glyph = document.createElement('span');
            glyph.className = 'globe-glyph';
            glyph.textContent = skill.glyph;
            element.append(glyph);
        }
        const label = document.createElement('span');
        label.textContent = skill.name;
        element.append(label);
        nodeLayer.append(element);
        return { x: Math.cos(angle) * ring, y, z: Math.sin(angle) * ring, element };
    });

    const context = canvas.getContext('2d');
    if (!context) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let radius = 0;
    let yaw = -.55;
    let pitch = -.18;
    let visible = false;
    let dragging = false;
    let pointerX = 0;
    let pointerY = 0;
    let lastFrame = 0;
    let frameId = 0;

    function resize() {
        width = globe.clientWidth;
        radius = width * .4;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(width * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        draw();
    }

    function rotate(x, y, z) {
        const cy = Math.cos(yaw), sy = Math.sin(yaw);
        const cp = Math.cos(pitch), sp = Math.sin(pitch);
        const turnedX = x * cy - z * sy;
        const turnedZ = x * sy + z * cy;
        return { x: turnedX, y: y * cp - turnedZ * sp, z: y * sp + turnedZ * cp };
    }

    function project(x, y, z) {
        const point = rotate(x, y, z);
        return { x: width / 2 + point.x * radius, y: width / 2 + point.y * radius, z: point.z };
    }

    function drawCurve(samples, alpha, colour) {
        context.beginPath();
        samples.forEach((sample, index) => {
            const point = project(sample[0], sample[1], sample[2]);
            if (index === 0) context.moveTo(point.x, point.y);
            else context.lineTo(point.x, point.y);
        });
        context.globalAlpha = alpha;
        context.strokeStyle = colour;
        context.stroke();
    }

    function draw() {
        if (!width) return;
        context.clearRect(0, 0, width, width);
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff7f87';
        context.lineWidth = 1;
        context.beginPath();
        context.arc(width / 2, width / 2, radius, 0, Math.PI * 2);
        context.globalAlpha = .24;
        context.strokeStyle = accent;
        context.stroke();
        for (let latitude = -2; latitude <= 2; latitude++) {
            const y = latitude / 3;
            const ring = Math.sqrt(1 - y * y);
            const samples = Array.from({ length: 73 }, (_, i) => {
                const angle = i / 72 * Math.PI * 2;
                return [Math.cos(angle) * ring, y, Math.sin(angle) * ring];
            });
            drawCurve(samples, .2, accent);
        }
        for (let meridian = 0; meridian < 8; meridian++) {
            const angle = meridian / 8 * Math.PI;
            const samples = Array.from({ length: 73 }, (_, i) => {
                const sweep = i / 72 * Math.PI * 2;
                return [Math.cos(sweep) * Math.cos(angle), Math.sin(sweep), Math.cos(sweep) * Math.sin(angle)];
            });
            drawCurve(samples, .18, accent);
        }
        context.globalAlpha = 1;
        for (const point of points) {
            const projected = project(point.x, point.y, point.z);
            const scale = .72 + (projected.z + 1) * .2;
            point.element.style.transform = `translate(${projected.x - width / 2}px, ${projected.y - width / 2}px) translate(-50%, -50%) scale(${scale})`;
            point.element.style.opacity = String(projected.z < -.08 ? .12 : .65 + projected.z * .35);
            point.element.style.zIndex = String(Math.round((projected.z + 1) * 10));
        }
    }

    function animate(time) {
        frameId = 0;
        if (!visible || document.hidden || reduceMotion.matches) return;
        if (time - lastFrame >= 32) {
            if (!dragging) yaw += Math.min((time - lastFrame) || 32, 60) * .00014;
            draw();
            lastFrame = time;
        }
        frameId = requestAnimationFrame(animate);
    }

    function syncAnimation() {
        if (visible && !document.hidden && !reduceMotion.matches && !frameId) {
            lastFrame = 0;
            frameId = requestAnimationFrame(animate);
        } else if ((!visible || document.hidden || reduceMotion.matches) && frameId) {
            cancelAnimationFrame(frameId);
            frameId = 0;
        }
        draw();
    }

    globe.addEventListener('pointerdown', event => {
        dragging = true;
        pointerX = event.clientX;
        pointerY = event.clientY;
        globe.setPointerCapture(event.pointerId);
    });
    globe.addEventListener('pointermove', event => {
        if (!dragging) return;
        yaw += (event.clientX - pointerX) * .008;
        pitch = Math.max(-1.1, Math.min(1.1, pitch + (event.clientY - pointerY) * .008));
        pointerX = event.clientX;
        pointerY = event.clientY;
        draw();
    });
    globe.addEventListener('pointerup', () => { dragging = false; });
    globe.addEventListener('pointercancel', () => { dragging = false; });
    document.addEventListener('visibilitychange', syncAnimation);
    reduceMotion.addEventListener('change', syncAnimation);
    new ResizeObserver(resize).observe(globe);
    new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        syncAnimation();
    }, { threshold: .05 }).observe(globe);
    resize();
})();
