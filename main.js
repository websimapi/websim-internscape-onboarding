import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { InternCharacter } from './Character.js';

// The InternScape modular blueprint data
const customizationData = {
    frame: [
        { id: 'masc', name: 'Masculine Frame', desc: 'Broad Shoulders' },
        { id: 'fem', name: 'Feminine Frame', desc: 'Tapered Waist' },
        { id: 'neu', name: 'Neutral Frame', desc: 'Androgynous Mesh' }
    ],
    hair: [
        { id: 'undercut', name: 'Tidy Undercut', desc: 'Style A (Corporate)' },
        { id: 'messy', name: 'Apprentice Hair', desc: 'Style B (Fantasy)' },
        { id: 'visor', name: 'Tech-Visor', desc: 'Style C (Synthetic)' }
    ],
    top: [
        { id: 'corporate', name: 'Button-Up', desc: 'Style A (Corporate)' },
        { id: 'fantasy', name: 'Tattered Tunic', desc: 'Style B (Fantasy)' },
        { id: 'synthetic', name: 'Tech-Vest', desc: 'Style C (Synthetic)' }
    ],
    hands: [
        { id: 'corporate', name: 'Wristwatch', desc: 'Left Hand Only' },
        { id: 'fantasy', name: 'Leather Wraps', desc: 'Style B (Fantasy)' },
        { id: 'synthetic', name: 'Haptic Glow-Gloves', desc: 'Style C (Synthetic)' }
    ],
    bottom: [
        { id: 'corporate', name: 'Chinos / Slacks', desc: 'Style A (Corporate)' },
        { id: 'fantasy', name: 'Cloth Breeches', desc: 'Style B (Fantasy)' },
        { id: 'synthetic', name: 'Cargo Joggers', desc: 'Style C (Synthetic)' }
    ],
    shoes: [
        { id: 'corporate', name: 'Polished Loafers', desc: 'Style A (Corporate)' },
        { id: 'fantasy', name: 'Buckled Boots', desc: 'Style B (Fantasy)' },
        { id: 'synthetic', name: 'Mag-Sneakers', desc: 'Style C (Synthetic)' }
    ]
};

const corporatePalette = [
    '#ffffff', '#e2e8f0', '#94a3b8', '#334155', '#0f172a', '#000000',
    '#f87171', '#ef4444', '#b91c1c', '#7f1d1d', '#fbbf24', '#d97706',
    '#a3e635', '#65a30d', '#4ade80', '#16a34a', '#38bdf8', '#0284c7',
    '#818cf8', '#4f46e5', '#a78bfa', '#7c3aed', '#f472b6', '#db2777'
];

let scene, camera, renderer, controls, character;
let currentCategory = 'frame';
let clock = new THREE.Clock();
let inGame = false;

const worldBlocks = [];
const worldGroup = new THREE.Group();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let skills = {
    penmanship: 1,
    actionItemExecution: 1,
    liabilityMitigation: 1,
    synergy: 1
};

function init() {
    const container = document.getElementById('three-canvas');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe5e7eb);
    scene.fog = new THREE.Fog(0xe5e7eb, 5, 20);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.8, 5.5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 2;
    controls.maxDistance = 8;
    controls.target.set(0, 1.4, 0);
    controls.maxPolarAngle = Math.PI / 2 + 0.1;

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(3, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 4;
    dirLight.shadow.camera.bottom = -4;
    dirLight.shadow.camera.left = -4;
    dirLight.shadow.camera.right = 4;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    const grid = new THREE.GridHelper(10, 10, 0xcccccc, 0xd1d5db);
    scene.add(grid);

    createOfficeChair();
    character = new InternCharacter(scene);

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('pointerdown', onPointerDown);
    setupUI();
    renderer.setAnimationLoop(animate);
}

function onPointerDown(e) {
    if (!inGame) return;
    if (e.target.closest('#game-ui')) return; // Ignore UI clicks

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(worldBlocks);

    if (intersects.length > 0) {
        const point = intersects[0].point;
        character.targetPosition.copy(point);
        character.targetPosition.y = 1.4; // floor height offset
        character.isMoving = true;
        
        spawnClickMarker(point);
    }
}

function spawnClickMarker(pos) {
    const marker = new THREE.Mesh(
        new THREE.RingGeometry(0.2, 0.3, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.copy(pos);
    marker.position.y += 0.05; 
    scene.add(marker);

    let scale = 1;
    const animateMarker = () => {
        scale += 0.05;
        marker.scale.setScalar(scale);
        marker.material.opacity -= 0.05;
        if (marker.material.opacity <= 0) {
            scene.remove(marker);
            marker.geometry.dispose();
            marker.material.dispose();
        } else {
            requestAnimationFrame(animateMarker);
        }
    };
    animateMarker();
}

function generateWorld() {
    scene.add(worldGroup);
    
    const blockSize = 1;
    const radius = 12; // Base tutorial region

    const matCorp = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9, flatShading: true });
    const matFant = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 1.0, flatShading: true });
    const matSynth = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.5, flatShading: true });

    const geo = new THREE.BoxGeometry(blockSize, blockSize, blockSize);

    // Inner playable chunk
    for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
            if (x*x + z*z > radius*radius) continue;

            let mat = matCorp;
            if (x < 0 && z > 0) mat = matFant;
            if (x > 0 && z > 0) mat = matSynth;

            let y = 0;
            if (Math.random() < 0.05) y = 1; 

            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x * blockSize, y * blockSize - 0.5, z * blockSize);
            mesh.receiveShadow = true;
            mesh.castShadow = true;
            worldGroup.add(mesh);
            worldBlocks.push(mesh);
        }
    }

    // Unreachable distant chunks (The "World")
    for (let i = 0; i < 40; i++) {
        const dist = radius + 4 + Math.random() * 15;
        const angle = Math.random() * Math.PI * 2;
        const cx = Math.cos(angle) * dist;
        const cz = Math.sin(angle) * dist;
        
        const chunkRadius = 1 + Math.random() * 3;
        const chunkMat = Math.random() > 0.6 ? matFant : (Math.random() > 0.5 ? matSynth : matCorp);
        
        for (let x = -chunkRadius; x <= chunkRadius; x++) {
            for (let z = -chunkRadius; z <= chunkRadius; z++) {
                if (x*x + z*z > chunkRadius*chunkRadius) continue;
                const mesh = new THREE.Mesh(geo, chunkMat);
                mesh.position.set(Math.round(cx + x), -0.5 + Math.floor(Math.random() * 2), Math.round(cz + z));
                mesh.receiveShadow = true;
                mesh.castShadow = true;
                worldGroup.add(mesh);
            }
        }
    }
}

function createOfficeChair() {
    const chair = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, flatShading: true });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, flatShading: true });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8), metalMat);
    base.position.y = 0.2;
    base.castShadow = true;
    chair.add(base);

    for (let i = 0; i < 5; i++) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.6), metalMat);
        leg.position.y = 0.05;
        leg.rotation.y = (i * Math.PI * 2) / 5;
        leg.translateZ(0.3);
        chair.add(leg);
        
        const wheel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        wheel.position.copy(leg.position);
        wheel.translateZ(0.25);
        wheel.position.y = 0.05;
        chair.add(wheel);
    }

    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 1.0), mat);
    seat.position.y = 0.45;
    seat.castShadow = true;
    chair.add(seat);

    const support = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.05), metalMat);
    support.position.set(0, 0.7, -0.45);
    chair.add(support);

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.1), mat);
    back.position.set(0, 1.1, -0.45);
    back.castShadow = true;
    chair.add(back);

    scene.add(chair);
    scene.userData.chair = chair;
}

function setupUI() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.tab;
            renderOptions();
            applyHighlight(currentCategory);
        });
    });

    const colorGrid = document.getElementById('color-grid');
    corporatePalette.forEach(hex => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = hex;
        swatch.addEventListener('click', () => {
            applyColor(hex);
            document.getElementById('color-picker').value = hex;
        });
        colorGrid.appendChild(swatch);
    });

    document.getElementById('color-picker').addEventListener('input', (e) => applyColor(e.target.value));

    document.getElementById('sign-btn').addEventListener('click', () => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.innerHTML = `
            <div class="modal">
                <h2>Contract Signed!</h2>
                <p>Welcome to InternScape. Your Day 1 orientation begins shortly. Don't forget to track your hours to avoid burnout.</p>
                <button id="start-game-btn">Enter World</button>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('start-game-btn').addEventListener('click', () => {
            overlay.remove();
            startGame();
        });
    });

    // Game UI events
    document.getElementById('skills-btn').addEventListener('click', () => {
        document.getElementById('notepad-modal').classList.remove('hidden');
        updateSkillsUI();
    });

    document.getElementById('close-notepad-btn').addEventListener('click', () => {
        document.getElementById('notepad-modal').classList.add('hidden');
    });

    document.getElementById('practice-writing-btn').addEventListener('click', () => {
        if (skills.penmanship < 4) {
            skills.penmanship++;
            updateSkillsUI();
        } else {
            alert("Your penmanship is already fully optimized for synergy.");
        }
    });

    renderOptions();
}

function startGame() {
    inGame = true;
    
    // Hide Onboarding UI
    document.querySelector('.header').style.display = 'none';
    document.querySelector('.sidebar.left-sidebar').style.display = 'none';
    document.querySelector('.sidebar.right-sidebar').style.display = 'none';
    document.querySelector('.footer').style.display = 'none';
    document.querySelector('.canvas-overlay').style.display = 'none';
    document.querySelector('.canvas-container').style.boxShadow = 'none';
    
    // Adjust layout for full screen canvas
    const mainContent = document.querySelector('.main-content');
    mainContent.style.flexDirection = 'row';

    // Show game UI
    document.getElementById('game-ui').style.display = 'block';

    if (scene.userData.chair) scene.remove(scene.userData.chair);
    
    // Reset character
    character.group.position.set(0, 1.4, 0);
    character.group.rotation.y = 0;
    
    // Set up Game Camera (Isometric/Top-Down feel)
    camera.position.set(10, 15, 10);
    controls.maxPolarAngle = Math.PI / 2.5; 
    controls.minDistance = 5;
    controls.maxDistance = 25;
    
    generateWorld();
    updateSkillsUI();
    onWindowResize();
}

function updateSkillsUI() {
    const list = document.getElementById('skills-list');
    list.innerHTML = '';
    
    const skillNames = {
        penmanship: "Penmanship (UI Skill)",
        actionItemExecution: "Action Item Execution",
        liabilityMitigation: "Liability Mitigation",
        synergy: "Synergy Optimization"
    };

    let hwClass = `hw-lvl-${skills.penmanship}`;
    
    document.querySelector('.notepad-title').className = `notepad-title ${hwClass}`;

    for (let key in skills) {
        const li = document.createElement('li');
        li.innerHTML = `<span>${skillNames[key]}</span> <span>Lvl ${skills[key]}</span>`;
        list.appendChild(li);
    }
    
    list.className = hwClass;
}

function renderOptions() {
    const container = document.getElementById('options-grid');
    container.innerHTML = '';

    customizationData[currentCategory].forEach(opt => {
        const btn = document.createElement('button');
        btn.className = `option-btn ${character.state[currentCategory] === opt.id ? 'selected' : ''}`;
        btn.innerHTML = `
            <div>
                <div style="font-size: 1rem; margin-bottom: 0.2rem;">${opt.name}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${opt.desc}</div>
            </div>
        `;
        btn.addEventListener('click', () => {
            character.setPart(currentCategory, opt.id);
            renderOptions(); 
        });
        container.appendChild(btn);
    });
}

function applyHighlight(category) {
    let matKey = category === 'frame' ? 'skin' : category;
    const mat = character.mats[matKey];
    if (!mat) return;

    const origEmissive = mat.emissive ? mat.emissive.getHex() : 0x000000;
    mat.emissive = new THREE.Color(0xffffff);
    mat.emissiveIntensity = 0.3;
    
    document.querySelector('.canvas-container').style.boxShadow = `inset 0 0 30px rgba(0,86,179,0.2)`;
    
    setTimeout(() => {
        mat.emissive.setHex(origEmissive);
        mat.emissiveIntensity = matKey === 'visor' ? 0.8 : 0;
        document.querySelector('.canvas-container').style.boxShadow = 'none';
    }, 300);
}

function applyColor(hex) {
    let matKey = currentCategory === 'frame' ? 'skin' : currentCategory;
    character.setColor(matKey, hex);
}

function onWindowResize() {
    const container = document.getElementById('three-canvas');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    const dt = clock.getDelta();
    if (character) character.update(dt);
    
    if (inGame) {
        controls.target.copy(character.group.position);
    } else {
        if (scene.userData.chair) scene.userData.chair.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.15;
    }

    controls.update();
    renderer.render(scene, camera);
}

init();