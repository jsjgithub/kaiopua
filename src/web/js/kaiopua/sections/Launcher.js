/*
 *
 * Launcher.js
 * Interactive environment for loading and launching game.
 *
 * @author Collin Hover / http://collinhover.com/
 *
 */
(function (main) {
    
    var shared = main.shared = main.shared || {},
		assetPath = "js/kaiopua/sections/Launcher.js",
		_Launcher = {},
		_Water,
        _Sky,
		_ObjectHelper,
		_ObjectMaker,
        ready = false,
		waitingToShow = false,
		addOnShow = [],
		addBGOnShow = [],
		ambientLight,
		lightSky,
        water,
		sky,
        skybox,
        time,
		camPositionBase,
		camPositionOffset,
		camPositionOffsetQ,
		camRotationBaseQ,
		camRotationOffset,
		camRotationOffsetQ,
        viewShift = {
            rx: 0,
            ry: 0, 
            rangeRotMaxX: Math.PI * 0.1,
            rangeRotMinX: Math.PI * 0.1,
            rangeRotMaxY: Math.PI * 2,// * 0.05,
            rangeRotMinY: -Math.PI * 2,// * 0.05,
			rangeRotMaxDiff: Math.PI,
			speedOnMove: 0.005,
			speedToTarget: 0.005,
			speedToTargetMax: Math.PI * 0.01
        };
    
    /*===================================================
    
    public properties
    
    =====================================================*/
	
    _Launcher.show = show;
    _Launcher.hide = hide;
    _Launcher.remove = remove;
    _Launcher.update = update;
	_Launcher.resize = resize;
	
	main.asset_register( assetPath, { 
		data: _Launcher,
		requirements: [
			"js/kaiopua/env/Sky.js",
			"js/kaiopua/env/Water.js",
			"js/kaiopua/utils/ObjectHelper.js",
			"js/kaiopua/utils/ObjectMaker.js",
			"asset/texture/skybox_world_posx.jpg",
            "asset/texture/skybox_world_negx.jpg",
			"asset/texture/skybox_world_posy.jpg",
            "asset/texture/skybox_world_negy.jpg",
			"asset/texture/skybox_world_posz.jpg",
            "asset/texture/skybox_world_negz.jpg"
		],
		callbacksOnReqs: init_internal,
		wait: true
	} );
    
    /*===================================================
    
    internal init
    
    =====================================================*/
    
    function init_internal ( s, w, oh, om ) {
		
		if ( ready !== true ) {
			console.log('internal launcher');
			
			_Sky = s;
			_Water = w;
			_ObjectHelper = oh;
			_ObjectMaker = om;
			
			init_environment();
			
			ready = true;
			
			if ( waitingToShow === true ) {
				
				waitingToShow = false;
				
				show();
				
			}
			
		}
		
    }
	
	function init_environment () {
		
		camPositionBase = new THREE.Vector3( -5800, 0, 0 );
		camPositionOffset = new THREE.Vector3();
		camPositionOffsetRot = new THREE.Vector3();
		camRotationBaseQ = new THREE.Quaternion().setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), -Math.PI * 0.5 );
		camRotationOffset = new THREE.Vector3();
		camRotationOffsetQ = new THREE.Quaternion();
		
		// lights
		
		ambientLight = new THREE.AmbientLight( 0xeeeeee );
		
		//lightSky = new THREE.DirectionalLight( 0xffffff, 1 );
		//lightSky.position = new THREE.Vector3(-1,0.5, 0).normalize();
		
		lightSky = new THREE.PointLight( 0xffffff, 2, 10000 );
		lightSky.position.set( -3000, 4000, 0 );
		
		// skybox
		
		skybox = _ObjectMaker.make_skybox( shared.pathToTextures + "skybox_world" );
		
		// water
		
		water = new _Water.Instance();
		water.quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), -Math.PI * 0.65 );
		
		// sky
		
		sky = new _Sky.Instance( {
			numClouds: 30,
			cloudParameters: {
				options: {
					intersectable: false
				}
			},
			cloudScaleMax: 8,
			cloudOpacityByDistance: 1,
			cloudBoundRadius: 5000,
			cloudDistanceFromSurfaceMin: 3000,
			cloudDistanceFromSurfaceMax: 6000,
			cloudRotateTowardWorld: false,
			zones: [
				{
					polar: {
						min: Math.PI * 0.15,
						max: Math.PI * 0.85
					},
					azimuth: {
						min: Math.PI * 0.15,
						max: Math.PI * 0.85
					}
				}/*,
				{
					polar: {
						min: Math.PI * 0.2,
						max: Math.PI * 0.8
					},
					azimuth: {
						min: Math.PI * 1.2,
						max: Math.PI * 1.8
					}
				}*/
			]
		} );
		
	}
    
    /*===================================================
    
    pointer
    
    =====================================================*/
    
    function on_pointer_moved ( e, pointer ) {
        
		pointer = pointer || main.get_pointer( e );
		
        var rx = viewShift.rx - pointer.deltaY * viewShift.speedOnMove,
			ry = viewShift.ry + pointer.deltaX * viewShift.speedOnMove;
		
		if ( viewShift.rangeRotMaxX === Math.PI * 2 && viewShift.rangeRotMinX === -Math.PI * 2 ) {
			
			viewShift.rx = rx;
			
		}
		else {
			
			viewShift.rx = Math.max( Math.min( rx, viewShift.rangeRotMaxX ), viewShift.rangeRotMinX );
			
		}
		
		if ( viewShift.rangeRotMaxY === Math.PI * 2 && viewShift.rangeRotMinY === -Math.PI * 2 ) {
			
			viewShift.ry = ry;
			
		}
		else {
			
			viewShift.ry = Math.max( Math.min( ry, viewShift.rangeRotMaxY ), viewShift.rangeRotMinY );
			
		}
        
    }
    
    /*===================================================
    
    standard
    
    =====================================================*/
    
    function show ( ) {
		
		var ccOptions;
		
		if ( ready === true ) {
			
			// cameras
			
			
			// TODO: modify camera controls without modifying the original values, and add a reset() method to camera controls
			
			ccOptions = {};
			ccOptions.boundRadiusMod = ccOptions.boundRadiusModMin = ccOptions.boundRadiusModMax = 0.75;
			ccOptions.rotationMaxX = ccOptions.rotationMinX = Math.PI * 0.035;
			ccOptions.positionBaseY = 750;
			
			//main.cameraControls.modify( ccOptions );
			_ObjectHelper.temporary_change( main.cameraControls.options, ccOptions );
			
			main.cameraControls.target = water;
			main.cameraControls.enabled = true;
			main.cameraControls.controllable = true;
			
			// environment
			
			water.morphs.play( 'waves', { duration: 4000, loop: true } );
			
			sky.animate();
			
			// add items
			
			main.scene.add( ambientLight );
			main.scene.add( lightSky );
			main.scene.add( water );
			main.scene.add( sky );
			main.sceneBG.add( skybox );
			
			// shared
			
			shared.renderer.sortObjects = false;
			
			shared.signals.onGamePointerDragged.add( on_pointer_moved );
			
			shared.signals.onGameUpdated.add( update );
			
			on_pointer_moved();
			
		}
		else {
			
			waitingToShow = true;
			
		}
		
    }
    
    function hide () {
		
		waitingToShow = false;
		
		water.morphs.stop_all();
		
		sky.animate( { stop: true } );
		
		shared.signals.onGamePointerDragged.remove( on_pointer_moved );
		
		shared.signals.onGameUpdated.remove( update );
		
    }
    
    function remove () {
		
		if ( ready === true ) {
			
			// enable renderer object sorting
			shared.renderer.sortObjects = true;
			
			// remove added items
			
			main.scene.remove( ambientLight );
			main.scene.remove( lightSky );
			main.scene.remove( water );
			main.scene.remove( sky );
			main.sceneBG.remove( skybox );
			
		}
		else {
			
			waitingToShow = false;
			
		}
        
    }
    
    function update ( timeDelta ) {
		
		var deltaRX = viewShift.rx - camRotationOffset.z,
			deltaRY = viewShift.ry - camRotationOffset.y;
		
		if ( Math.abs( deltaRX ) > viewShift.rangeRotMaxDiff ) {
			
			viewShift.rx = camRotationOffset.z + viewShift.rangeRotMaxDiff * ( deltaRX / Math.abs( deltaRX ) );
			
		}
		
		if ( Math.abs( deltaRY ) > viewShift.rangeRotMaxDiff ) {
			
			viewShift.ry = camRotationOffset.y + viewShift.rangeRotMaxDiff * ( deltaRY / Math.abs( deltaRY ) );
			
		}
		
		camRotationOffset.z += Math.max( Math.min( deltaRX * viewShift.speedToTarget, viewShift.speedToTargetMax ), -viewShift.speedToTargetMax );
        camRotationOffset.y += Math.max( Math.min( deltaRY * viewShift.speedToTarget, viewShift.speedToTargetMax ), -viewShift.speedToTargetMax );
		
		// update rotation
		
		camRotationOffsetQ.setFromEuler( camRotationOffset ).normalize();
        
		main.camera.quaternion.multiply( camRotationOffsetQ, camRotationBaseQ );
		
		camPositionOffset.copy( camPositionBase );
		camPositionOffsetRot.y = camRotationOffset.y;
		camPositionOffsetRot.z = -Math.PI * 0.01;
		camRotationOffsetQ.setFromEuler( camPositionOffsetRot ).normalize();
		camRotationOffsetQ.multiplyVector3( camPositionOffset );
		main.camera.position.copy( camPositionOffset );
		
    }
	
	function resize () {
		
	}
    
} ( KAIOPUA ) );