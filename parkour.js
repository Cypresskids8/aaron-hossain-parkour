import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const objects = []; //list ~ array
let raycasterList = []; //raygun
let centerRay; 
let directionXList = [-0.4,-0.4,0.4,0.4,-0.4,0.4,0,0]
let directionZList = [-0.4,0.4,-0.4,0.4,0,0,-0.4,0.4]//need fix? 

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let isSprinting = false; 
let isCrouching = false; 

let prevTime = performance.now(); //current time
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let camera, scene, controls, renderer;

init();
animate();
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1;

    controls = new PointerLockControls(camera, document.body);

    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', function () {
        controls.lock();
    });
    controls.addEventListener('lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    });
    controls.addEventListener('unlock', function () {
        blocker.style.display = 'block';
        instructions.style.display = '';
    });

    scene.add(controls.getObject());

    const onKeyDown = function (event) {
        switch (event.code) {
            case 'KeyW':
                moveForward = true;
                break;
            case 'KeyA':
                moveLeft = true;
                break;
            case 'KeyS':
                moveBackward = true;
                break;
            case 'KeyD':
                moveRight = true;
                break;
            case 'Space':
                if (canJump === true) velocity.y += 30; //jump force
                canJump = false;
                break;
            case 'ShiftLeft':
                isSprinting = true; 
                break;
            case 'KeyC':
                if(isCrouching != true) camera.position.y -= 0.4;  
                isCrouching = true; 
                break; 
        }
    }

    const onKeyUp = function (event) {
        switch (event.code) {
            case 'KeyW':
                moveForward = false;
                break;
            case 'KeyA':
                moveLeft = false;
                break;
            case 'KeyS':
                moveBackward = false;
                break;
            case 'KeyD':
                moveRight = false;
                break;
            case 'ShiftLeft':
                isSprinting = false; 
                break;
            case 'KeyC':
                camera.position.y += 0.4; 
                isCrouching = false; 
                break;
        }
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    for(let i = 0; i<8; i++){
        let raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 1); //1 corresponds to height of player
        raycasterList.push(raycaster); 
    }
    centerRay = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0,-1,0),0,1);

    const planeGeometry = new THREE.PlaneGeometry(10, 10, 64, 64);
    const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotateX(-1.57);
    scene.add(plane);
    objects.push(plane);

    const light = new THREE.AmbientLight(0xffffff);
    scene.add(light);
    let y = 0
    for (let i = 0; i < 80; i += 4) {
        let c1 = parseInt(Math.random() * 256);
        let c2 = parseInt(Math.random() * 256);
        let c3 = parseInt(Math.random() * 256);
        const color = new THREE.Color("rgb(" + c1 + "," + c2 + "," + c3 + ")")
        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const boxMat = new THREE.MeshLambertMaterial({ color: color });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(i + 2, 2 + y, 0);
        y++
        scene.add(box);
        objects.push(box);
    }

    const sphereGeo = new THREE.SphereGeometry(3, 64, 64);
    const sphereMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(0, -2, 0);
    scene.add(sphere);
    objects.push(sphere);

    const torusGeo = new THREE.TorusGeometry(5, 2, 64, 64);
    const torusMat = new THREE.MeshLambertMaterial({ color: 0x00ffff });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.position.set(88, y + 4, 0);
    torus.rotateY(-1.57);
    scene.add(torus);
    objects.push(torus);

    const knotGeo = new THREE.TorusKnotGeometry(10, 2, 64, 64);
    const knotMat = new THREE.MeshLambertMaterial({ color: 0xff00f0 });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    knot.position.set(0, 20, -20);
    scene.add(knot);
    objects.push(knot);
    
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(window.devicePixelRatio); 
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize(){
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix(); 

    renderer.setSize(window.innerWidth, window.innerHeight); 
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now(); 

    if(controls.isLocked === true){

        //Corner Rays (8)
        for(let i =0; i<8; i++){
            raycasterList[i].ray.origin.copy(controls.getObject().position);
            raycasterList[i].ray.origin.set(
                raycasterList[i].ray.origin.x + directionXList[i],
                raycasterList[i].ray.origin.y - 1,
                raycasterList[i].ray.origin.z + directionZList[i]
                );
        }
        //Center Ray
        centerRay.ray.origin.copy(controls.getObject().position);
        centerRay.ray.origin.y -= 1
        //Intersections
        const intersections = []; 
        intersections.push(centerRay.intersectObjects(objects,false)) //center
        raycasterList.forEach(raycaster => {
            intersections.push(raycaster.intersectObjects(objects,false)); //corners
        });
        let onObject = false; 
        intersections.forEach(list => {
            let tester = list.length > 0; 
            if(tester)
                onObject = true; 
        });
        //Change in Time Calculation
        const delta = (time - prevTime) / 1000; 
        //Change in Velocity over time (Acceleration)
        velocity.x -= velocity.x * 10.0 * delta; //10.0 is speed
        velocity.z -= velocity.z * 10.0 * delta; //10.0 is speed
        velocity.y -= 9.8 * 10.0 * delta; //10.0 is mass
        //Direction of Velocity Calculation
        direction.z = Number(moveForward) - Number(moveBackward); 
        direction.x = Number(moveRight) - Number(moveLeft); 
        direction.normalize(); 

        if(isSprinting){
            if(moveForward||moveBackward) velocity.z -= direction.z * 100.0 * delta; 
            if(moveLeft||moveRight) velocity.x -= direction.x * 100.0 * delta; 
        }else if(isCrouching){
            if(moveForward||moveBackward) velocity.z -= direction.z * 20.0 * delta; 
            if(moveLeft||moveRight) velocity.x -= direction.x * 20.0 * delta; 
        }else{
            if(moveForward||moveBackward) velocity.z -= direction.z * 40.0 * delta; 
            if(moveLeft||moveRight) velocity.x -= direction.x * 40.0 * delta; 
        }
        //Negative Vertical Collisions
        if(onObject === true){
            velocity.y = Math.max(0,velocity.y); 
            canJump = true; 
        }

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        controls.getObject().position.y += (velocity.y * delta);
        
        if(controls.getObject().position.y < -20){
            velocity.y = 0; 
            controls.getObject().position.set(0,10.1,0); //respawn 

            canJump = true; 
        }
    }
    prevTime = time; 

    renderer.render(scene, camera);
}