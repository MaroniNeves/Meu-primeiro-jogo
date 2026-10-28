/* Interactive height-field water, adapted from the method in WebGL Water.
 * Copyright 2011 Evan Wallace. https://madebyevan.com/webgl-water/ (MIT).
 * River adaptation: world-space cell spacing, wet boundaries and fixed volume.
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function(){
 const T=window.THREE;
 window.ArcanoInteractiveRiver=class {
  constructor(geometry,nx,nz,length){
   this.geometry=geometry;this.nx=nx;this.nz=nz;this.length=length;
   this.height=new Float32Array(nx*nz);this.velocity=new Float32Array(nx*nz);
   this.next=new Float32Array(nx*nz);this.bytes=new Uint8Array(nx*nz*4);
   this.wave=new Float32Array(nx*nz);this.acc=0;this.time=0;
   geometry.setAttribute('waveHeight',new T.BufferAttribute(this.wave,1));
   this.normal=new T.DataTexture(this.bytes,nx,nz,T.RGBAFormat);
   this.normal.minFilter=this.normal.magFilter=T.LinearFilter;
   this.normal.wrapS=this.normal.wrapT=T.ClampToEdgeWrapping;
   this.normal.generateMipmaps=false;this.encodeNormals();
  }
  disturb(x,z,strength=.018,radius=.5){
   const p=this.geometry.attributes.position.array,d=this.geometry.attributes.waterDepth.array;
   const row=Math.round((z/this.length+.5)*(this.nz-1));const affected=[];let total=0;
   const reach=Math.ceil(radius/(this.length/(this.nz-1)))+1;
   for(let j=Math.max(0,row-reach);j<=Math.min(this.nz-1,row+reach);j++)
   for(let i=0;i<this.nx;i++){
    const k=j*this.nx+i;if(d[k]<.015)continue;
    const q=((p[k*3]-x)**2+(p[k*3+2]-z)**2)/(radius*radius);
    if(q>4)continue;
    const value=(1-q)*Math.exp(-q*2);affected.push([k,value]);total+=value;
   }
   // Balanced impulse changes the shape, not the river's stored water level.
   const mean=total/Math.max(1,affected.length);
   for(const [k,v] of affected)this.height[k]+=strength*(v-mean);
  }
  step(dt){
   this.time+=Math.min(.05,dt);this.acc+=Math.min(.05,dt);
   const n=this.nx,m=this.nz,h=this.height,v=this.velocity;
   const p=this.geometry.attributes.position.array,d=this.geometry.attributes.waterDepth.array;
   const dz=this.length/(m-1),fixed=1/120;
   while(this.acc>=fixed){
    for(let j=0;j<m;j++)for(let i=0;i<n;i++){
     const k=j*n+i;if(d[k]<.006){this.next[k]=0;v[k]=0;continue;}
     const left=i?k-1:k,right=i<n-1?k+1:k,up=j?k-n:k,down=j<m-1?k+n:k;
     const dx=Math.max(.045,(p[right*3]-p[left*3])/((i&&i<n-1)?2:1));
     const lap=((d[left]>.006?h[left]:h[k])+(d[right]>.006?h[right]:h[k])-2*h[k])/(dx*dx)+((d[up]>.006?h[up]:h[k])+(d[down]>.006?h[down]:h[k])-2*h[k])/(dz*dz);
     v[k]=(v[k]+lap*.45*fixed)*.993;
     this.next[k]=Math.max(-.035,Math.min(.035,h[k]+v[k]*fixed));
    }
    h.set(this.next);this.acc-=fixed;
   }
   for(let k=0;k<h.length;k++){
    const z=p[k*3+2],x=p[k*3],fade=Math.min(1,Math.max(0,d[k]/.07));
    this.wave[k]=fade*(h[k]+.0028*Math.sin(z*4.1+x*2.3-this.time*2.1)+.0018*Math.sin(z*6.7-x*3.2-this.time*3.3));
   }
   this.geometry.attributes.waveHeight.needsUpdate=true;this.encodeNormals();
  }
  encodeNormals(){
   const p=this.geometry.attributes.position.array,n=this.nx,m=this.nz,h=this.wave;
   for(let j=0;j<m;j++)for(let i=0;i<n;i++){
    const k=j*n+i,l=i?k-1:k,r=i<n-1?k+1:k,u=j?k-n:k,b=j<m-1?k+n:k;
    const sx=(h[r]-h[l])/Math.max(.045,p[r*3]-p[l*3]);
    const sz=(h[b]-h[u])/Math.max(.045,p[b*3+2]-p[u*3+2]);
    const inv=1/Math.hypot(sx,1,sz),o=k*4;
    this.bytes[o]=Math.round((-.5*sx*inv+.5)*255);
    this.bytes[o+1]=Math.round((-.5*sz*inv+.5)*255);
    this.bytes[o+2]=Math.round(inv*255);this.bytes[o+3]=255;
   }
   this.normal.needsUpdate=true;
  }
 };
})();
