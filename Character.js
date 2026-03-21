import * as THREE from 'three';

export class InternCharacter {
  constructor(scene) {
    this.group = new THREE.Group();
    // Positioned to stand directly ON the rotating office chair's seat
    this.group.position.y = 1.9; 
    scene.add(this.group);
    
    // Low-Poly "Corporate Standard" Flat Materials
    this.mats = {
      skin: new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.9, flatShading: true }),
      hair: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9, flatShading: true }),
      top: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }),
      hands: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9, flatShading: true }),
      bottom: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9, flatShading: true }),
      shoes: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, flatShading: true }),
      visor: new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.8, flatShading: true })
    };

    // Day 1 Starting Config
    this.state = {
      frame: 'neu',
      hair: 'undercut',
      top: 'corporate',
      hands: 'corporate',
      bottom: 'corporate',
      shoes: 'corporate'
    };

    this.animTime = 0;
    this.currentAnim = 'idle';
    this.animTimer = 0;

    this.buildRig();
    this.updateMesh();
  }

  buildRig() {
    this.rig = {
      pelvis: new THREE.Group(),
      torso: new THREE.Group(),
      head: new THREE.Group(),
      armL: new THREE.Group(),
      armR: new THREE.Group(),
      legL: new THREE.Group(),
      legR: new THREE.Group()
    };

    this.group.add(this.rig.pelvis);
    this.rig.pelvis.add(this.rig.torso);
    this.rig.torso.position.y = 0.2;
    
    this.rig.torso.add(this.rig.head);
    this.rig.torso.add(this.rig.armL);
    this.rig.torso.add(this.rig.armR);
    this.rig.pelvis.add(this.rig.legL);
    this.rig.pelvis.add(this.rig.legR);

    // Box Geometries for that chunky OSRS/Low-Poly readable silhouette
    this.meshes = {
      torso: new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.mats.top),
      head: new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), this.mats.skin),
      hairGroup: new THREE.Group(),
      armL: new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), this.mats.skin), 
      armR: new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), this.mats.skin),
      sleeveL: new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.35), this.mats.top),
      sleeveR: new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.35), this.mats.top),
      handL: new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 0.25), this.mats.skin),
      handR: new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 0.25), this.mats.skin),
      gloveL: new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.28), this.mats.hands),
      gloveR: new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.28), this.mats.hands),
      legL: new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), this.mats.bottom),
      legR: new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), this.mats.bottom),
      shoeL: new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.55), this.mats.shoes),
      shoeR: new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.55), this.mats.shoes),
      accessories: new THREE.Group()
    };

    // Head Details (Eyes)
    const eyeMat = new THREE.MeshBasicMaterial({color: 0x111111});
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), eyeMat);
    eyeL.position.set(0.15, 0.1, 0.31);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), eyeMat);
    eyeR.position.set(-0.15, 0.1, 0.31);
    this.meshes.head.add(eyeL, eyeR);

    // Assembly
    this.rig.torso.add(this.meshes.torso);
    this.meshes.torso.position.y = 0.7; 
    this.rig.torso.add(this.meshes.accessories);
    this.rig.head.add(this.meshes.head);
    this.rig.head.add(this.meshes.hairGroup);
    
    // Arms
    this.rig.armL.add(this.meshes.armL);
    this.meshes.armL.position.y = -0.5;
    this.rig.armL.add(this.meshes.sleeveL);
    this.meshes.sleeveL.position.y = -0.2;
    this.meshes.armL.add(this.meshes.handL);
    this.meshes.handL.position.y = -0.75;
    this.meshes.handL.add(this.meshes.gloveL);

    this.rig.armR.add(this.meshes.armR);
    this.meshes.armR.position.y = -0.5;
    this.rig.armR.add(this.meshes.sleeveR);
    this.meshes.sleeveR.position.y = -0.2;
    this.meshes.armR.add(this.meshes.handR);
    this.meshes.handR.position.y = -0.75;
    this.meshes.handR.add(this.meshes.gloveR);

    // Legs
    this.rig.legL.add(this.meshes.legL);
    this.meshes.legL.position.y = -0.7;
    this.rig.legL.add(this.meshes.shoeL);
    this.meshes.shoeL.position.set(0, -1.4, 0.1);

    this.rig.legR.add(this.meshes.legR);
    this.meshes.legR.position.y = -0.7;
    this.rig.legR.add(this.meshes.shoeR);
    this.meshes.shoeR.position.set(0, -1.4, 0.1);

    Object.values(this.meshes).forEach(m => {
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
    });
  }

  updateMesh() {
    // 1. Frame Selection (Identity Proportions)
    const s = this.state.frame === 'masc' ? { tW: 1.2, tY: 1.4, lW: 0.4 } :
              this.state.frame === 'fem' ?  { tW: 0.9, tY: 1.2, lW: 0.35 } :
                                            { tW: 1.05, tY: 1.3, lW: 0.38 };
    
    this.meshes.torso.scale.set(s.tW, s.tY, 0.6);
    this.rig.head.position.y = 0.7 + (s.tY / 2) + 0.1;
    this.rig.armL.position.set(s.tW/2 + 0.15, 0.7 + (s.tY / 2) - 0.1, 0);
    this.rig.armR.position.set(-(s.tW/2 + 0.15), 0.7 + (s.tY / 2) - 0.1, 0);
    
    const hipW = s.tW * 0.3;
    this.rig.legL.position.set(hipW, 0, 0);
    this.rig.legR.position.set(-hipW, 0, 0);
    this.meshes.legL.scale.set(s.lW/0.4, 1, s.lW/0.4);
    this.meshes.legR.scale.set(s.lW/0.4, 1, s.lW/0.4);

    // 2. Hair Options
    this.meshes.hairGroup.clear();
    if (this.state.hair === 'undercut') {
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.65), this.mats.hair);
      h.position.y = 0.35;
      this.meshes.hairGroup.add(h);
    } else if (this.state.hair === 'messy') {
      const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.7), this.mats.hair);
      h1.position.y = 0.35;
      const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.8), this.mats.hair);
      h2.position.set(0.1, 0.45, 0);
      h2.rotation.z = 0.2;
      this.meshes.hairGroup.add(h1, h2);
    } else if (this.state.hair === 'visor') {
      const v = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.15, 0.2), this.mats.visor);
      v.position.set(0, 0.1, 0.3);
      this.meshes.hairGroup.add(v);
    }

    // 3. Top (Shirt) Attachments
    this.meshes.accessories.clear();
    if (this.state.top === 'corporate') {
      const collar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), this.mats.top);
      collar.position.y = s.tY - 0.05;
      this.meshes.accessories.add(collar);
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.05), new THREE.MeshStandardMaterial({color: 0xaa2222, flatShading: true}));
      tie.position.set(0, s.tY - 0.4, 0.32);
      this.meshes.accessories.add(tie);
    } else if (this.state.top === 'fantasy') {
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(s.tW + 0.1, 0.4, 0.7), this.mats.top);
      skirt.position.y = 0.2;
      this.meshes.accessories.add(skirt);
    } else if (this.state.top === 'synthetic') {
      const vest = new THREE.Mesh(new THREE.BoxGeometry(s.tW + 0.15, s.tY - 0.2, 0.75), new THREE.MeshStandardMaterial({color: 0x222222, flatShading: true}));
      vest.position.y = s.tY / 2;
      this.meshes.accessories.add(vest);
      const glow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.8), this.mats.visor);
      glow.position.set(0, s.tY/2, 0);
      this.meshes.accessories.add(glow);
    }

    // 4. Hands (Gloves)
    this.meshes.gloveL.visible = false;
    this.meshes.gloveR.visible = false;
    if (this.state.hands === 'corporate') {
        this.meshes.gloveL.visible = true; // Wristwatch only
        this.meshes.gloveL.scale.set(1.1, 0.2, 1.1);
        this.meshes.gloveL.position.y = 0.15;
    } else if (this.state.hands === 'fantasy' || this.state.hands === 'synthetic') {
        this.meshes.gloveL.visible = true;
        this.meshes.gloveR.visible = true;
        const glvScale = this.state.hands === 'synthetic' ? 1.05 : 1.0;
        this.meshes.gloveL.scale.set(glvScale, glvScale, glvScale);
        this.meshes.gloveR.scale.set(glvScale, glvScale, glvScale);
        this.meshes.gloveL.position.y = 0;
        this.meshes.gloveR.position.y = 0;
    }

    // 5. Boots
    if (this.state.shoes === 'corporate') {
      this.meshes.shoeL.geometry = new THREE.BoxGeometry(0.45, 0.2, 0.6);
      this.meshes.shoeR.geometry = new THREE.BoxGeometry(0.45, 0.2, 0.6);
    } else if (this.state.shoes === 'fantasy') {
      this.meshes.shoeL.geometry = new THREE.BoxGeometry(0.48, 0.5, 0.55);
      this.meshes.shoeR.geometry = new THREE.BoxGeometry(0.48, 0.5, 0.55);
    } else if (this.state.shoes === 'synthetic') {
      this.meshes.shoeL.geometry = new THREE.BoxGeometry(0.5, 0.3, 0.65);
      this.meshes.shoeR.geometry = new THREE.BoxGeometry(0.5, 0.3, 0.65);
    }
  }

  playAnimation(name) {
    this.currentAnim = name;
    this.animTimer = 0;
    
    // Reset poses
    this.rig.armL.rotation.set(0, 0, 0);
    this.rig.armR.rotation.set(0, 0, 0);
    this.rig.head.rotation.set(0, 0, 0);
    this.rig.legL.rotation.set(0, 0, 0);
    this.group.scale.setScalar(1);
    this.mats.skin.transparent = false;
    this.mats.skin.opacity = 1;
  }

  update(dt) {
    this.animTime += dt;
    this.animTimer += dt;

    if (this.currentAnim === 'idle') {
      // Impatient Breathing
      const breath = Math.sin(this.animTime * 2) * 0.02;
      this.rig.torso.scale.set(1, 1 + breath, 1);
      this.rig.armL.rotation.z = Math.sin(this.animTime * 1.5) * 0.05 + 0.1;
      this.rig.armR.rotation.z = -Math.sin(this.animTime * 1.5) * 0.05 - 0.1;
      
      // Randomly check watch
      if (Math.random() < 0.003) this.playAnimation('checkWatch');
    } 
    else if (this.currentAnim === 'checkWatch') {
      if (this.animTimer < 2) {
        this.rig.armL.rotation.x = -Math.PI / 2;
        this.rig.armL.rotation.y = Math.PI / 4;
        this.rig.head.rotation.x = -Math.PI / 8;
        this.rig.head.rotation.y = Math.PI / 8;
      } else this.playAnimation('idle');
    }
    else if (this.currentAnim === 'checkBoots') {
      if (this.animTimer < 1.5) {
        this.rig.legL.rotation.x = -Math.PI / 4;
        this.rig.head.rotation.x = -Math.PI / 4;
      } else this.playAnimation('idle');
    }
    else if (this.currentAnim === 'checkHair') {
      if (this.animTimer < 2) {
        this.rig.armR.rotation.x = -Math.PI / 1.5;
        this.rig.armR.rotation.z = -Math.PI / 4;
        this.rig.head.rotation.y = Math.sin(this.animTimer * 8) * 0.2;
        this.rig.head.rotation.z = Math.sin(this.animTimer * 8) * 0.1;
      } else this.playAnimation('idle');
    }
    else if (this.currentAnim === 'glitch') {
      if (this.animTimer < 0.5) {
        this.group.scale.set(1 + Math.random()*0.1, 1 + Math.random()*0.1, 1 + Math.random()*0.1);
        this.group.position.x = (Math.random() - 0.5) * 0.2;
        this.mats.skin.opacity = 0.5 + Math.random()*0.5;
        this.mats.skin.transparent = true;
      } else {
        this.group.position.x = 0;
        this.playAnimation('idle');
      }
    }
  }

  setPart(category, id) {
    this.state[category] = id;
    this.updateMesh();
    
    // Play interaction animations described in blueprint
    if (category === 'hair') this.playAnimation('checkHair');
    else if (category === 'shoes') this.playAnimation('checkBoots');
    else if (category === 'frame') this.playAnimation('glitch');
    else this.playAnimation('checkWatch');
  }

  setColor(category, hex) {
    if (this.mats[category]) {
      this.mats[category].color.setHex(hex);
      if (this.mats[category].emissive) {
        this.mats[category].emissive.setHex(hex);
      }
    }
  }
}