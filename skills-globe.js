// Dependency-free skills globe. Rendering pauses while it is offscreen.
(() => {
    const globe = document.getElementById('skillsGlobe');
    const canvas = document.getElementById('skillsGlobeCanvas');
    const nodeLayer = document.getElementById('skillsGlobeNodes');
    if (!globe || !canvas || !nodeLayer) return;

    const skills = [
        { name: 'Python', image: 'images/python.svg' },
        { name: 'JavaScript', image: 'images/js.svg' },
        { name: 'Node.js', image: 'images/skills/nodejs.png' },
        { name: 'FastAPI', image: 'images/skills/FastAPI.png' },
        { name: 'SQL', image: 'images/skills/icons8-sql-100.png' },
        { name: 'UiPath', image: 'images/uipath.svg' },
        { name: '.NET', image: 'images/skills/icons8-.net-framework-100.png' },
        { name: 'Power BI', image: 'images/powerbi.svg' },
        { name: 'C++', image: 'images/skills/cpp.png' },
        { name: 'AWS', image: 'images/skills/icons8-aws-logo-96.png' },
        { name: 'Azure', image: 'images/skills/azure.png' },
        { name: 'HTML5', image: 'images/skills/text.png' },
        { name: 'CSS3', image: 'images/skills/css-3.png' },
        { name: 'Git', image: 'images/skills/git.png' },
        { name: 'GitHub', image: 'images/skills/github.png' },
        { name: 'SQLite', image: 'images/skills/icons8-sqlite-100.png' },
        { name: 'REST APIs', image: 'images/skills/icons8-rest-api-100.png' },
        { name: 'MongoDB', image: 'images/skills/MongoDB.png' },
        { name: 'Express.js', image: 'images/skills/icons8-express-js-100.png' },
        { name: 'Flask', image: 'images/skills/icons8-flask-100.png' },
        { name: 'Next.js', image: 'images/skills/icons8-next.js-100.png' },
        { name: 'UE5', image: 'images/ue5.svg' }
    ];

    const points = skills.map((skill, index) => {
        const y = 1 - ((index + .5) / skills.length) * 2;
        const ring = Math.sqrt(1 - y * y);
        const angle = index * Math.PI * (3 - Math.sqrt(5));
        const element = document.createElement('span');
        element.className = 'globe-skill';
        element.dataset.skill = skill.name;
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
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const baseVertices = [
        [-1, goldenRatio, 0], [1, goldenRatio, 0], [-1, -goldenRatio, 0], [1, -goldenRatio, 0],
        [0, -1, goldenRatio], [0, 1, goldenRatio], [0, -1, -goldenRatio], [0, 1, -goldenRatio],
        [goldenRatio, 0, -1], [goldenRatio, 0, 1], [-goldenRatio, 0, -1], [-goldenRatio, 0, 1]
    ];
    const normalize = vertex => {
        const length = Math.hypot(...vertex);
        return vertex.map(value => value / length);
    };
    const vertices = baseVertices.map(normalize);
    const faces = [
        [0,11,5], [0,5,1], [0,1,7], [0,7,10], [0,10,11],
        [1,5,9], [5,11,4], [11,10,2], [10,7,6], [7,1,8],
        [3,9,4], [3,4,2], [3,2,6], [3,6,8], [3,8,9],
        [4,9,5], [2,4,11], [6,2,10], [8,6,7], [9,8,1]
    ];
    const midpointCache = new Map();
    const midpoint = (a, b) => {
        const key = [a, b].sort((left, right) => left - right).join('-');
        if (midpointCache.has(key)) return midpointCache.get(key);
        const index = vertices.push(normalize(vertices[a].map((value, i) => value + vertices[b][i]))) - 1;
        midpointCache.set(key, index);
        return index;
    };
    const edges = new Set();
    for (const [a, b, c] of faces) {
        const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
        for (const [x, y, z] of [[a,ab,ca], [b,bc,ab], [c,ca,bc], [ab,bc,ca]]) {
            for (const [start, end] of [[x,y], [y,z], [z,x]]) {
                edges.add([start, end].sort((left, right) => left - right).join('-'));
            }
        }
    }
    const meshEdges = [...edges].map(edge => edge.split('-').map(Number));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let radius = 0;
    let yaw = -.55;
    let pitch = -.18;
    let visible = false;
    let dragging = false;
    let hoveringIcon = false;
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

    function draw() {
        if (!width) return;
        context.clearRect(0, 0, width, width);
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff7f87';
        context.lineWidth = 1.2;
        context.strokeStyle = accent;
        for (const [a, b] of meshEdges) {
            const first = project(...vertices[a]);
            const second = project(...vertices[b]);
            context.globalAlpha = (first.z + second.z) / 2 < 0 ? .18 : .58;
            context.beginPath();
            context.moveTo(first.x, first.y);
            context.lineTo(second.x, second.y);
            context.stroke();
        }
        context.globalAlpha = 1;
        for (const point of points) {
            const projected = project(point.x, point.y, point.z);
            const scale = .72 + (projected.z + 1) * .2;
            point.element.style.transform = `translate(${projected.x - width / 2}px, ${projected.y - width / 2}px) translate(-50%, -50%) scale(${scale})`;
            const front = projected.z > .08;
            point.element.classList.toggle('is-front', front);
            point.element.style.opacity = String(front ? .88 + projected.z * .12 : .18);
            point.element.style.zIndex = String(Math.round((projected.z + 1) * 10));
        }
    }

    function animate(time) {
        frameId = 0;
        if (!visible || document.hidden || reduceMotion.matches) return;
        if (time - lastFrame >= 32) {
            if (!dragging && !hoveringIcon) yaw += Math.min((time - lastFrame) || 32, 60) * .00014;
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
        yaw -= (event.clientX - pointerX) * .008;
        pitch = Math.max(-1.1, Math.min(1.1, pitch - (event.clientY - pointerY) * .008));
        pointerX = event.clientX;
        pointerY = event.clientY;
        draw();
    });
    globe.addEventListener('pointerup', () => { dragging = false; });
    globe.addEventListener('pointercancel', () => { dragging = false; });
    nodeLayer.addEventListener('pointerover', event => {
        if (event.target.closest('.globe-skill.is-front')) hoveringIcon = true;
    });
    nodeLayer.addEventListener('pointerout', () => { hoveringIcon = false; });
    document.addEventListener('visibilitychange', syncAnimation);
    reduceMotion.addEventListener('change', syncAnimation);
    new ResizeObserver(resize).observe(globe);
    new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        syncAnimation();
    }, { threshold: .05 }).observe(globe);
    resize();
})();
