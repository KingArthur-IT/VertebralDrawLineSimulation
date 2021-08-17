import * as THREE from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { Line2, LineGeometry, LineMaterial } from 'three-fatline';

//scene
let canvas, camera, scene, light, renderer;
//objects
let bovieObj;
//line
let currentLineLimits = {
		upper: {
			top: undefined,
			bottom: undefined
		},
		lower: {
			top: undefined,
			bottom: undefined
		}
}
let lineMtl, upperLine, lowerLine;
//popup
/*
let popupPlaneMesh,
	popupBtn = document.getElementById('popupBtn'),
	popupTexts = JSON.parse(popupData);
	*/
//params
let params = {
	sceneWidth: 850,
	sceneHeight: 450,
	bgSrc: './assets/img/interaction_bg.jpg',
	popupSrc: './assets/img/popup.png',
	isBovieLocked: false,
	positionProps: {
		step: 0.1,
		minY: -5,
		maxY: 1
	},
	rotationProps: {
		step: 0.01,
		minXAngle: -20.0 * Math.PI / 180.0,
		maxXAngle: 20.0 * Math.PI / 180.0
	},
	lineLimits: {
		upper: {
			top: 1,
			bottom: -2
		},
		lower: {
			top: -3,
			bottom: -5
		}
	}
}

let objectsParams = {
	modelPath: './assets/models/',
	bovie: {
		bovieObj: 'bovie.obj',
		bovieMtl: 'bovie.mtl',
		scale : 	new THREE.Vector3(1, 1, 1),
		position : 	new THREE.Vector3(0, 0, 0),
		rotation : 	new THREE.Vector3(60.0 * Math.PI / 180.0, 0.0, 0)
	},
}

class App {
	init() {
		canvas = document.getElementById('canvas');
		canvas.setAttribute('width', 	params.sceneWidth);
		canvas.setAttribute('height', 	params.sceneHeight);
		
		//scene and camera
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(40.0, params.sceneWidth / params.sceneHeight, 0.1, 5000);
		camera.position.set(0, 0, 30);
		//light
		light = new THREE.AmbientLight(0xffffff);
		scene.add(light);
		
		//renderer
		renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
		renderer.setClearColor(0xffffff);

		//Load background texture
		let loader = new THREE.TextureLoader();
		loader.load(params.bgSrc, function (texture) {
			texture.minFilter = THREE.LinearFilter;
			scene.background = texture;
		});

		//objects		
		bovieObj = new THREE.Object3D();
		let mtlLoader = new MTLLoader();
		mtlLoader.setPath(objectsParams.modelPath);		

		//load patient body
		mtlLoader.load(objectsParams.bovie.bovieMtl, function (materials) {
			materials.preload();
			let objLoader = new OBJLoader();
			objLoader.setMaterials(materials);
			objLoader.setPath(objectsParams.modelPath);
			objLoader.load(objectsParams.bovie.bovieObj, function (object) {
				object.scale.copy(objectsParams.bovie.scale);
				object.position.copy(objectsParams.bovie.position);
				object.rotation.setFromVector3(objectsParams.bovie.rotation);
				bovieObj.add(object);
				scene.add(bovieObj);
			});
		});				
		
		//line
		lineMtl = new LineMaterial({
			color: 'black',
			linewidth: 3, // px
			resolution: new THREE.Vector2(850, 450) // resolution of the viewport
		});

		//popup
		//createPopupPlane();
		//addPopup();

		renderer.render(scene, camera);
		//window.addEventListener( 'resize', onWindowResize, false );
		canvas.addEventListener('mousemove', onMouseMove, false);
		canvas.addEventListener('mousedown', onMouseDown, false);
		//popupBtn.addEventListener('click', removePopup, false);

		animate();
	}
}

function onMouseMove(e) {
	if (params.isBovieLocked) {
		//get movement of the mouse in lock API
		let movementX = e.movementX ||
			e.mozMovementX ||
			e.webkitMovementX ||
			0;
		let movementY = e.movementY ||
			e.mozMovementY ||
			e.webkitMovementY ||
			0;
		let newYPosition = bovieObj.position.y - movementY * params.positionProps.step;
		if (newYPosition < params.positionProps.maxY && newYPosition > params.positionProps.minY) {
			bovieObj.position.y -= movementY * params.positionProps.step;
			//upper line
			if (bovieObj.position.y > params.lineLimits.upper.bottom &&
				bovieObj.position.y < params.lineLimits.upper.top) {
				if (bovieObj.position.y > currentLineLimits.upper.top ||
					currentLineLimits.upper.top === undefined)
					currentLineLimits.upper.top = bovieObj.position.y;
				if (bovieObj.position.y < currentLineLimits.upper.bottom ||
					currentLineLimits.upper.bottom === undefined)
					currentLineLimits.upper.bottom = bovieObj.position.y;
			}
			//lower line
			if (bovieObj.position.y > params.lineLimits.lower.bottom &&
				bovieObj.position.y < params.lineLimits.lower.top) {
				if (bovieObj.position.y > currentLineLimits.lower.top ||
					currentLineLimits.lower.top === undefined)
					currentLineLimits.lower.top = bovieObj.position.y;
				if (bovieObj.position.y < currentLineLimits.lower.bottom ||
					currentLineLimits.lower.bottom === undefined)
					currentLineLimits.lower.bottom = bovieObj.position.y;
			}
			bovieObj.rotation.x += movementY * params.rotationProps.step;
			let newYAngle = bovieObj.rotation.y + movementX * params.rotationProps.step;
			if (newYAngle > params.rotationProps.minXAngle && newYAngle < params.rotationProps.maxXAngle)
				bovieObj.rotation.y += movementX * params.rotationProps.step;
			//line
			scene.remove(upperLine)
			scene.remove(lowerLine)

			let upperGeometry = new LineGeometry();
			let lowerGeometry = new LineGeometry();
			
			let posArray = [0, 0, 0, 0, 0, 0];

			posArray[1] = currentLineLimits.upper.top;
			posArray[4] = currentLineLimits.upper.bottom;
			upperGeometry.setPositions(posArray);
			
			posArray[1] = currentLineLimits.lower.top;
			posArray[4] = currentLineLimits.lower.bottom;
			lowerGeometry.setPositions(posArray); 

			upperLine = new Line2(upperGeometry, lineMtl);
			lowerLine = new Line2(lowerGeometry, lineMtl);

			upperLine.computeLineDistances();
			lowerLine.computeLineDistances();
			scene.add(upperLine)
			scene.add(lowerLine)
		}		
	}	
}

function onMouseDown() {
	if (params.isBovieLocked) {
		//unlock
		document.exitPointerLock = document.exitPointerLock ||
			document.mozExitPointerLock ||
			document.webkitExitPointerLock;
		document.exitPointerLock();
		params.isBovieLocked = false;
	}
	else {
		//lock
		canvas.requestPointerLock = canvas.requestPointerLock ||
			canvas.mozRequestPointerLock ||
			canvas.webkitRequestPointerLock;
		canvas.requestPointerLock();
		params.isBovieLocked = true;
	}	
}



function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
}

function createPopupPlane() {
	const popupPlane = new THREE.PlaneGeometry(params.sceneWidth, params.sceneHeight, 10.0);
	const loader = new THREE.TextureLoader();
	const popupMaterial = new THREE.MeshBasicMaterial({
		map: loader.load(params.popupSrc, function (texture) {
			texture.minFilter = THREE.LinearFilter; }),
		transparent: true
	});    
	popupPlaneMesh = new THREE.Mesh(popupPlane, popupMaterial);
	popupPlaneMesh.scale.set(0.105, 0.105, 0.105)
	popupPlaneMesh.position.z = 10;
}

function addPopup() {
	scene.add(popupPlaneMesh);
	params.isActive = false;
	//interface
	document.getElementById('popupTitle').style.display = 'block';
	document.getElementById('popupText').style.display = 'block';
	popupBtn.style.display = 'block';
	if (popupRezult === undefined) {
		document.getElementById('popupTitle').value = popupTexts.introTitle;
		document.getElementById('popupText').value = popupTexts.introText;
		return;
	}
	if (popupRezult) {
		document.getElementById('popupTitle').value = popupTexts.correctPadTitle;
		document.getElementById('popupText').value = popupTexts.correctPadText;
		return;
	}
	if (!popupRezult) {
		document.getElementById('popupTitle').value = popupTexts.uncorrectPadTitle;
		document.getElementById('popupText').value = popupTexts.uncorrectPadText;
		return;
	}
}

function removePopup() {
	scene.remove(popupPlaneMesh);
	params.isActive = true;
	//interface
	document.getElementById('popupTitle').style.display = 'none';
	document.getElementById('popupText').style.display = 'none';
	popupBtn.style.display = 'none';
}

export default App;
