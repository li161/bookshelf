import * as THREE from 'three'

export function createUnderwaterStrawberryWorld(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.visible = false
  scene.add(root)
  const light = new THREE.PointLight('#ff6b32', 110, 18)
  light.position.set(-3, 2, 3)
  root.add(light)
  const fill = new THREE.PointLight('#e52b24', 65, 15)
  fill.position.set(3, -1, 2)
  root.add(fill)
  const top = new THREE.PointLight('#fff0d2', 140, 18)
  top.position.set(0, 4, 1)
  root.add(top)

  const water = new THREE.Mesh(new THREE.PlaneGeometry(16, 2.3, 100, 24), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { uTime: { value: 0 } },
    vertexShader: 'uniform float uTime; varying vec2 vUv; void main(){vUv=uv;vec3 p=position;p.z+=sin(p.x*2.4+uTime*1.5)*.055+sin(p.x*5.2-uTime*1.1)*.022;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}',
    fragmentShader: 'uniform float uTime;varying vec2 vUv;void main(){float bands=pow(.5+.5*sin(vUv.x*48.0+uTime*2.0),8.0);vec3 c=mix(vec3(.025,.018,.016),vec3(.95,.28,.045),bands*.7+vUv.y*.22);gl_FragColor=vec4(c,.58+bands*.28);}'
  }))
  water.position.set(0, 3.5, -1.6)
  root.add(water)

  const leafMat = new THREE.MeshStandardMaterial({ color: '#4f8a39', roughness: .68, side: THREE.DoubleSide })
  const seedGeo = new THREE.SphereGeometry(.022, 8, 6)
  const seedMat = new THREE.MeshStandardMaterial({ color: '#ffd98b', roughness: .45 })
  const profile = [new THREE.Vector2(.02,-.62),new THREE.Vector2(.22,-.58),new THREE.Vector2(.37,-.38),new THREE.Vector2(.43,-.08),new THREE.Vector2(.39,.22),new THREE.Vector2(.27,.43),new THREE.Vector2(.12,.55),new THREE.Vector2(.02,.57)]
  const strawberries: THREE.Group[] = []
  const placements = [[-2.3,1.25,.1,1.08,-.32],[.2,.75,-.4,1.18,.2],[2.1,.95,.25,1.12,-.45],[-1.25,-.9,.35,.95,.38],[1.7,-1.55,-.2,1.12,-.28],[-2.8,-2,-.35,.82,.4],[0,-2.05,.2,.9,-.12],[3,-.55,.1,.8,.25],[-.1,2.05,-.5,.7,.5]]
  placements.forEach(([x,y,z,scale,rot], index) => {
    const group = new THREE.Group()
    group.position.set(x,y,z); group.scale.setScalar(scale); group.rotation.z = rot
    const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), new THREE.MeshPhysicalMaterial({ color: '#d91f27', roughness: .24, clearcoat: 1, clearcoatRoughness: .12 }))
    body.castShadow = true; group.add(body)
    for (let i=0;i<44;i++) {
      const yy=-.48+(i%8)*.13, ring=Math.floor(i/8), a=ring*2.399+i*.19
      const radius=.42*Math.sqrt(Math.max(.08,1-Math.pow((yy-.03)/.66,2)))
      const seed=new THREE.Mesh(seedGeo,seedMat)
      seed.position.set(Math.cos(a)*radius,yy,Math.sin(a)*radius)
      seed.scale.set(.72,1.2,.55); group.add(seed)
    }
    for(let i=0;i<7;i++) {
      const a=i*Math.PI*2/7, leaf=new THREE.Mesh(new THREE.ConeGeometry(.13,.42,5),leafMat)
      leaf.position.set(Math.cos(a)*.13,.56,Math.sin(a)*.13)
      leaf.rotation.z=Math.cos(a)*.9; leaf.rotation.x=Math.sin(a)*.8; group.add(leaf)
    }
    root.add(group); strawberries.push(group)
  })

  const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1,10,8), new THREE.MeshPhysicalMaterial({ color:'#d8e8e9',roughness:.04,metalness:.05,transmission:.88,thickness:.25,transparent:true,opacity:.62,clearcoat:1 }), 150)
  const bubbleData: Array<{ x: number; y: number; z: number; speed: number; scale: number }> = []
  const dummy = new THREE.Object3D()
  for(let i=0;i<150;i++) {
    const b={x:(Math.random()-.5)*8.8,y:-3.7+Math.random()*7,z:-.7+Math.random()*1.5,speed:.25+Math.random()*.75,scale:.018+Math.random()*.045}
    bubbleData.push(b); dummy.position.set(b.x,b.y,b.z); dummy.scale.setScalar(b.scale); dummy.updateMatrix(); bubbles.setMatrixAt(i,dummy.matrix)
  }
  root.add(bubbles)
  const glintPositions = new Float32Array(1500)
  for(let i=0;i<500;i++){glintPositions[i*3]=(Math.random()-.5)*10;glintPositions[i*3+1]=(Math.random()-.5)*8;glintPositions[i*3+2]=-.25+Math.random()*.5}
  const glints = new THREE.BufferGeometry()
  glints.setAttribute('position',new THREE.BufferAttribute(glintPositions,3))
  root.add(new THREE.Points(glints,new THREE.PointsMaterial({color:'#fff0d7',size:.018,transparent:true,opacity:.55})))

  const update = (time:number) => {
    ;(water.material as THREE.ShaderMaterial).uniforms.uTime.value=time
    const obj = new THREE.Object3D()
    bubbleData.forEach((b,i)=>{b.y+=b.speed*.016;if(b.y>4.2)b.y=-3.9;obj.position.set(b.x+Math.sin(time+b.y)*.025,b.y,b.z);obj.scale.setScalar(b.scale);obj.updateMatrix();bubbles.setMatrixAt(i,obj.matrix)})
    bubbles.instanceMatrix.needsUpdate=true
    strawberries.forEach((b,i)=>{b.rotation.y=Math.sin(time*.55+i*1.7)*.18;b.rotation.x=Math.sin(time*.7+i)*.09})
  }
  return { root, update }
}
