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
		top: 100.0,
		bottom: 100.0
	},
	lower: {
		top: 100.0,
		bottom: 100.0
	}
}
let lineMtl, upperLine, lowerLine;
//popup

let popupPlaneMesh,
	popupBtn = document.getElementById('popupBtn'),
	popupTexts = JSON.parse(popupData)

//params
let params = {
	sceneWidth: 850,
	sceneHeight: 450,
	bgSrc: './assets/img/interaction_mark_midline_bg.jpg',
	popupSrc: './assets/img/popup.png',
	isBovieLocked: false,
	isActive: false,
	isSuccess: undefined,
	positionProps: {
		step: 0.1,
		maxY: 0.0,
		minY: -6.2,
	},
	rotationProps: {
		step: 0.015,
		minXAngle: -18.0 * Math.PI / 180.0,
		maxXAngle: 18.0 * Math.PI / 180.0,
	},
	
}

let objectsParams = {
	modelPath: './assets/models/',
	bovie: {
		bovieObj: 'bovie_pen_01.obj',
		bovieMtl: 'bovie_pen_01.mtl',
		scale: new THREE.Vector3(2.0, 2.0, 2.0),
		position: new THREE.Vector3(0.0, 2.0, 0.0),
		rotation: new THREE.Vector3(83.0 * Math.PI / 180.0,
			-220.0 * Math.PI / 180.0, 0.0)
	},
	line: {
		lineLimits: {
		upper: {
			top: 0.0,
			bottom: -2.75
		},
		lower: {
			top: -4.0,
			bottom: -6.2
			}
		},
		lineWidth: 3,
		maxOffset: 0.5,
		perspectiveEdit: 3.0
	}
}

let touchParams = {
	objectCenter: { x: 425.0, y: 5.0 },
	radius: 50,
	limits: { min: 0.0, max: 450.0 },
	mouseDown: {x: 0.0, y: 0.0}
}

class App {
	init() {
		canvas = document.getElementById('canvas');
		canvas.setAttribute('width', params.sceneWidth);
		canvas.setAttribute('height', params.sceneHeight);

		document.getElementById('spot').style.width = `${2 * touchParams.radius}px`;
		document.getElementById('spot').style.height = `${2 * touchParams.radius}px`;
		document.getElementById('spot').style.top = `${touchParams.objectCenter.y - touchParams.radius}px`;
		document.getElementById('spot').style.left = `${touchParams.objectCenter.x - touchParams.radius}px`;

		//scene and camera
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0xcccccc);
		camera = new THREE.PerspectiveCamera(40.0, params.sceneWidth / params.sceneHeight, 0.1, 5000);
		camera.position.set(0, 0.0, 30);
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
			linewidth: objectsParams.line.lineWidth, // px
			resolution: new THREE.Vector2(params.sceneWidth, params.sceneHeight) // resolution of the viewport
		});

		//popup
		createPopupPlane();
		addPopup();

		renderer.render(scene, camera);
		canvas.addEventListener('mousemove', onMouseMove, false);
		canvas.addEventListener('mousedown', onMouseDown, false);
		popupBtn.addEventListener('click', removePopup, false);

		canvas.addEventListener("touchstart",   touch_start_handler);
    	canvas.addEventListener("touchmove",    touch_move_handler);    
    	canvas.addEventListener("touchend",     touch_up_handler);

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
		if (Math.abs(movementY) > 0.5)
			movementY = Math.sign(movementY) * 0.5;
		if (Math.abs(movementX) > 1.0)
			movementX = Math.sign(movementX) * 1.0;
		let newYPosition = bovieObj.position.y - movementY * params.positionProps.step;
		if (newYPosition < params.positionProps.maxY && newYPosition > params.positionProps.minY) {
			bovieObj.position.y -= movementY * params.positionProps.step;

			bovieObj.rotation.x += movementY * params.rotationProps.step;
			let newYAngle = bovieObj.rotation.y + movementX * params.rotationProps.step;
			if (newYAngle > params.rotationProps.minXAngle && newYAngle < params.rotationProps.maxXAngle)
				bovieObj.rotation.y += movementX * params.rotationProps.step;
			
			DrawLine();
		}
	}
}

function DrawLine() {
	//upper line
	if (bovieObj.position.y > objectsParams.line.lineLimits.upper.bottom &&
		bovieObj.position.y < objectsParams.line.lineLimits.upper.top) {
		if (bovieObj.position.y > currentLineLimits.upper.top ||
			currentLineLimits.upper.top === 100)
			currentLineLimits.upper.top = bovieObj.position.y;
		if (bovieObj.position.y < currentLineLimits.upper.bottom ||
			currentLineLimits.upper.bottom === 100)
			currentLineLimits.upper.bottom = bovieObj.position.y;
	}
	//lower line
	if (bovieObj.position.y > objectsParams.line.lineLimits.lower.bottom &&
		bovieObj.position.y < objectsParams.line.lineLimits.lower.top) {
		if (bovieObj.position.y > currentLineLimits.lower.top ||
			currentLineLimits.lower.top === 100)
			currentLineLimits.lower.top = bovieObj.position.y;
		if (bovieObj.position.y < currentLineLimits.lower.bottom ||
			currentLineLimits.lower.bottom === 100) {
				currentLineLimits.lower.bottom = bovieObj.position.y;
			}
	}
	
	//line
	scene.remove(upperLine)
	scene.remove(lowerLine)

	let upperGeometry = new LineGeometry();
	let lowerGeometry = new LineGeometry();

	let posArray = [
		objectsParams.bovie.position.x,
		objectsParams.bovie.position.y,
		objectsParams.bovie.position.z,
		objectsParams.bovie.position.x,
		objectsParams.bovie.position.y,
		objectsParams.bovie.position.z + objectsParams.line.perspectiveEdit];

	posArray[1] = currentLineLimits.upper.top + objectsParams.bovie.position.y;
	posArray[4] = currentLineLimits.upper.bottom + objectsParams.bovie.position.y;
	upperGeometry.setPositions(posArray);

	posArray[1] = currentLineLimits.lower.top + objectsParams.bovie.position.y;
	posArray[4] = currentLineLimits.lower.bottom + objectsParams.bovie.position.y;
	lowerGeometry.setPositions(posArray);

	upperLine = new Line2(upperGeometry, lineMtl);
	lowerLine = new Line2(lowerGeometry, lineMtl);
	scene.add(upperLine)
	scene.add(lowerLine)
}

function onMouseDown() {
	if (!params.isActive) return;
	if (bovieObj.position.y < -2.3 && bovieObj.position.y > -4.0)
		return;
	if (params.isBovieLocked) {
		//unlock
		document.exitPointerLock = document.exitPointerLock ||
			document.mozExitPointerLock ||
			document.webkitExitPointerLock;
		document.exitPointerLock();
		params.isBovieLocked = false;
		CheckDrawedLine();
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

function CheckDrawedLine() {
	if (Math.abs(currentLineLimits.upper.top - objectsParams.line.lineLimits.upper.top) < objectsParams.line.maxOffset &&
		Math.abs(currentLineLimits.upper.bottom - objectsParams.line.lineLimits.upper.bottom) < objectsParams.line.maxOffset &&
		Math.abs(currentLineLimits.lower.top - objectsParams.line.lineLimits.lower.top) < objectsParams.line.maxOffset &&
		Math.abs(currentLineLimits.lower.bottom - objectsParams.line.lineLimits.lower.bottom) < objectsParams.line.maxOffset) {
		params.isSuccess = true;
		setTimeout(() => {
			addPopup();
		}, 1000);
	}
	else {
		params.isSuccess = false;
		setTimeout(() => {
			addPopup();
		}, 1000);
	}
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
			texture.minFilter = THREE.LinearFilter;
		}),
		transparent: true
	});
	popupPlaneMesh = new THREE.Mesh(popupPlane, popupMaterial);
	popupPlaneMesh.scale.set(0.0116, 0.0116, 0.0116);
	popupPlaneMesh.position.z = 20;
}

function addPopup() {
	scene.add(popupPlaneMesh);
	params.isBovieLocked = false;
	params.isActive = false;
	//interface
	document.getElementById('popupTitle').style.display = 'block';
	document.getElementById('popupText').style.display = 'block';
	popupBtn.style.display = 'block';
	if (params.isSuccess === undefined) {
		document.getElementById('popupTitle').value = popupTexts.introTitle;
		document.getElementById('popupText').value = popupTexts.introText;
		return;
	}
	if (params.isSuccess) {
		document.getElementById('popupTitle').value = popupTexts.successTitle;
		document.getElementById('popupText').value = popupTexts.successText;
		return;
	}
	if (!params.isSuccess) {
		document.getElementById('popupTitle').value = popupTexts.unsuccessTitle;
		document.getElementById('popupText').value = popupTexts.unsuccessText;
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
	document.getElementById('spot').style.top = `${touchParams.objectCenter.y - touchParams.radius}px`;
	document.getElementById('spot').style.left = `${touchParams.objectCenter.x - touchParams.radius}px`;
	document.getElementById('spot').classList.remove('d-none');
	if (!params.isSuccess) {
		onMouseDown();
	}
}

function touch_start_handler(e) {
	e.preventDefault();
	if (!params.isActive) return;
	params.isBovieLocked = false;
	let evt = (typeof e.originalEvent === 'undefined') ? e : e.originalEvent;
	let touch = evt.touches[0] || evt.changedTouches[0];
	
	let dist = 	(parseInt(touch.pageX) - touchParams.objectCenter.x) *
				(parseInt(touch.pageX) - touchParams.objectCenter.x) +
				(parseInt(touch.pageY) - touchParams.objectCenter.y) *
				(parseInt(touch.pageY) - touchParams.objectCenter.y);
	if (Math.sqrt(dist) < touchParams.radius) {
		document.getElementById('spot').classList.add('d-none');
		params.isBovieLocked = true;
		touchParams.mouseDown.x = parseInt(touch.pageX);
		touchParams.mouseDown.y = parseInt(touch.pageY);
	}
}

function touch_move_handler(e) {
	let evt = (typeof e.originalEvent === 'undefined') ? e : e.originalEvent;
	let touch = evt.touches[0] || evt.changedTouches[0];
	if (params.isBovieLocked) {
		let newMouseY = params.sceneHeight - parseInt(touch.pageY);
		if (newMouseY < touchParams.limits.max && newMouseY > touchParams.limits.min) {
			let newYPosition = (newMouseY - touchParams.limits.min) *
				(params.positionProps.maxY - params.positionProps.minY) /
				(touchParams.limits.max - touchParams.limits.min) + params.positionProps.minY;
			bovieObj.position.y = newYPosition;
			
			let squeeze = 0.75;
			bovieObj.rotation.x = (10.0 * touch.pageY / touchParams.limits.max) * Math.PI / 180.0;
			let newYAngle = bovieObj.rotation.y + (touch.pageX - 0.5 * params.sceneWidth) / 100.0;
			if (newYAngle > squeeze * params.rotationProps.minXAngle && newYAngle < squeeze * params.rotationProps.maxXAngle)
			{
				bovieObj.rotation.y = (touch.pageX - 0.5 * params.sceneWidth) / 200.0;
				//touchParams.objectCenter.y = parseInt(touch.pageY);
				//touchParams.objectCenter.x = parseInt(touch.pageX);
			}
			
			DrawLine();
		}
	}
}

function touch_up_handler(e) {
	let evt = (typeof e.originalEvent === 'undefined') ? e : e.originalEvent;
	let touch = evt.touches[0] || evt.changedTouches[0];
	if (params.isBovieLocked) {
		CheckDrawedLine();
		params.isBovieLocked = false;
		touchParams.objectCenter.x = 340.0 + ((bovieObj.rotation.y + 0.1) / 0.2) * 160.0;
		// touchParams.objectCenter.y += parseInt(touch.pageY) - touchParams.mouseDown.y; 
		touchParams.objectCenter.y = parseInt(touch.pageY); 
		touchParams.mouseDown.x = 0.0;
		touchParams.mouseDown.y = 0.0;
	}
}

export default App;