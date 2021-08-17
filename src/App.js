import * as THREE from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'; 

//scene
let canvas, camera, scene, light, renderer;
//objects
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
	bgSrc: './assets/img/interaction_bg.jpeg',
	popupSrc: './assets/img/popup.png'
}
/*
let objectsParams = {
	modelPath: './assets/models/',
	patient: {
		patientObj: 'body.obj',
		patientMtl: 'body.mtl',
		scale : 	new THREE.Vector3(2, 2, 2),
		position : 	new THREE.Vector3(0, 1, 0),
		rotation : 	new THREE.Vector3(Math.PI / 2.0, Math.PI / 2.0, 0)
	},
}
*/

class App {
	init() {
		canvas = document.getElementById('canvas');
		canvas.setAttribute('width', 	params.sceneWidth);
		canvas.setAttribute('height', 	params.sceneHeight);
		
		//scene and camera
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(40.0, params.sceneWidth / params.sceneHeight, 0.1, 5000);
		camera.position.set(0, 0, 100);
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
		/*
		patientObj = new THREE.Object3D();
		let mtlLoader = new MTLLoader();
		mtlLoader.setPath(objectsParams.modelPath);
		

		//load patient body
		mtlLoader.load(objectsParams.patient.patientMtl, function (materials) {
			materials.preload();
			let objLoader = new OBJLoader();
			objLoader.setMaterials(materials);
			objLoader.setPath(objectsParams.modelPath);
			objLoader.load(objectsParams.patient.patientObj, function (object) {
				object.scale.copy(objectsParams.patient.scale);
				object.position.copy(objectsParams.patient.position);
				object.rotation.setFromVector3(objectsParams.patient.rotation);
				patientObj.add(object);
				scene.add(patientObj);
			});
		});		

		*/
		
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

function onMouseMove(event) {
	
}

function onMouseDown() {
	
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
