// Core THREE.js elements
let scene, camera, renderer, controls, raycaster, mouse, selectedObject, mixer;

// Popup DOM elements
let popup = document.getElementById("popup");
let popupTitle = document.getElementById("popup-title");
let popupClose = document.getElementById("popup-close");
let popupsubTitle = document.getElementById("popup-subtitle");

// Camera animation variables
let animationStartTime = null;
let cameraAnimationDuration = 1;
let isAnimating = false;
let cameraPosition, cameraTarget;

const clock = new THREE.Clock(); // Used for animation timing
const snowflakesCount = 50000; // Number of snow particles
let objects = []; // Trackable scene objects
let snowflakes = []; // Snow particle system

// Allowed track names
const allowedNames = [
    "Schwarze_Loipe",
    "Nachtloipe",
    "Grüne_Loipe",
    "Rote_Loipe",
    "Gelbe_Loipe"
];

// Track GPX links
const linkTracks = {
    "Schwarze_Loipe": "./Tracks_gpx/Black.gpx",
    "Nachtloipe": "./Tracks_gpx/Night.gpx",
    "Grüne_Loipe": "./Tracks_gpx/Green.gpx",
    "Rote_Loipe": "./Tracks_gpx/Rot.gpx",
    "Gelbe_Loipe": "./Tracks_gpx/Yellow.gpx"
};

// Track display names
const nameTrack = {
    "Schwarze_Loipe": "Schwarze Loipe",
    "Nachtloipe": "Nachtloipe",
    "Grüne_Loipe": "Grüne Loipe",
    "Rote_Loipe": "Rote Loipe",
    "Gelbe_Loipe": "Gelbe Loipe"
};

// Track difficulty levels
const complexity = {
    "Schwarze_Loipe": "Schwierig",
    "Nachtloipe": "Mittel",
    "Grüne_Loipe": "Mittel",
    "Rote_Loipe": "Leicht",
    "Gelbe_Loipe": "Schwierig"
};

init();     // Initialize the scene
animate();  // Start animation loop

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb3dbff);

    // Set up perspective camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

    // Set up renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Orbit controls for mouse interaction
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    popup.style.display = "none";

    // Lighting
    let hemiLight = new THREE.HemisphereLight(0xfafaf0, 0x080820, 0.9);
    scene.add(hemiLight);

    let ambientLight = new THREE.AmbientLight(0xFF7F00, 0.1);
    scene.add(ambientLight);

    let directionalLight = new THREE.DirectionalLight(0xFF7F00, 0.6);
    directionalLight.position.set(300, 100, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Load 3D model
    const loader = new THREE.GLTFLoader();
    loader.load('https://raw.githubusercontent.com/MoiseyT/Langkauf_Kandersteg/main/3D_Model/3D_Model.gltf', function (gltf) {
        const model = gltf.scene;
        model.name = "3D-Model";
        model.position.set(0, 0, 0);
        model.scale.set(0.1, 0.1, 0.1);
        scene.add(model);

        // Play model animations if available
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
                mixer.clipAction(clip).play();
            });
        }

        // Auto-set camera position based on model size
        let boundingBox = new THREE.Box3().setFromObject(model);
        let center = boundingBox.getCenter(new THREE.Vector3());
        let size = boundingBox.getSize(new THREE.Vector3());
        let maxDim = Math.max(size.x, size.y, size.z);
        let fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / Math.tan(fov / 2));
        camera.position.set(center.x - 450, center.y + 350, cameraZ * 0.1);
        controls.target.copy(center);
        controls.update();

        filterObjectsByName(model); // Filter tracks by name
    }, undefined, function (error) {
        console.error("error", error);
    });

    createSnow(); // Create snow particle effect
}

function filterObjectsByName(model) {
    const objectListContainer = document.getElementById("object-list");

    model.traverse((child) => {
        if (!allowedNames.includes(child.name)) return;

        child.visible = (child.name === "Loipe");
        child.link_track = linkTracks[child.name];
        child.track_name = nameTrack[child.name];
        child.complexity = complexity[child.name];
        objects.push(child);

        const button = createObjectButton(child);
        objectListContainer.appendChild(button);
    });
}

function createObjectButton(object) {
    const button = document.createElement("button");
    button.textContent = object.track_name;

    button.addEventListener("click", () => {
        const previousActiveButton = document.querySelector('.object-list button.active');
        if (previousActiveButton) previousActiveButton.classList.remove('active');
        button.classList.add('active');

        // Remove old map and elevation controls if they exist
        if (currentMap) {
            currentMap.remove();
            currentMap = null;
        }
        if (controlElevation) {
            controlElevation.remove();
            controlElevation = null;
        }

        showOnlyObject(object);
    });

    return button;
}
// Function to show the popup with the map and elevation control
function showOnlyObject(objectToShow) {
    objects.forEach(obj => obj.visible = false);

    objectToShow.visible = true; 

    showPopupWithMap(objectToShow); 


    const boundingBox = new THREE.Box3().setFromObject(objectToShow);
    const center = boundingBox.getCenter(new THREE.Vector3());

    cameraTarget = center;
    cameraPosition = new THREE.Vector3(center.x, center.y + 200, center.z + 175);

    camera.position.copy(cameraPosition);
    controls.target.copy(center);
    controls.update();
}

function animateCamera() {
    if (animationStartTime !== null) {
        let elapsedTime = (performance.now() - animationStartTime) / 3000;
        let t = Math.min(elapsedTime / cameraAnimationDuration, 1);

        camera.position.lerp(cameraPosition, t);

        if (t === 1) {
            animationStartTime = null;
            isAnimating = false;
            controls.enabled = true;
            controls.target.copy(cameraTarget);
            controls.update();
        } else {
            isAnimating = true;
            controls.enabled = false;
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    let delta = clock.getDelta();

    if (mixer) mixer.update(delta); 

    // Animate snow
    const positions = snowflakes.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 0.1; 
        if (positions[i + 1] < -250) positions[i + 1] = 250; 
    }
    snowflakes.geometry.attributes.position.needsUpdate = true;

    animateCamera(); 
    controls.update(); 
    renderer.render(scene, camera); 
}

// Popup close logic
function closePopup() {
    currentMap.remove();
    currentMap = null;
    controlElevation.remove();
    controlElevation = null;
    popup.style.display = "none";
}

// Setup popup close button
document.addEventListener("DOMContentLoaded", function () {
    if (popupClose) {
        popupClose.addEventListener("click", closePopup);
    }
});

function createSnow() {
    const snowflakesGeometry = new THREE.BufferGeometry();
    const positions = [];
    const sizes = [];
    const colors = [];

    // Create snowflake particles
    for (let i = 0; i < snowflakesCount; i++) {
        positions.push(Math.random() * 1500 - 500);
        positions.push(Math.random() * 1000 - 250);
        positions.push(Math.random() * 1250 - 750);
        sizes.push(Math.random() * 5 + 2);
        colors.push(1.0, 1.0, 1.0);
    }

    snowflakesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    snowflakesGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    snowflakesGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const snowflakesMaterial = new THREE.PointsMaterial({
        size: 1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
    });

    const snowflakesSystem = new THREE.Points(snowflakesGeometry, snowflakesMaterial);
    scene.add(snowflakesSystem);
    snowflakes = snowflakesSystem;
}
