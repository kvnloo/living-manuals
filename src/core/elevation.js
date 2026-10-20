import {installationFraction} from './assembly.js';

/**
 * Draw authored part extents in a camera-independent elevation. This is not a
 * source/manual image, physical wiring diagram or manufacturer-certified plan.
 * Fits furniture, outdoor layouts and electronics in the same 220 × 205 sheet.
 */
export function elevationPrimitives(manual,stageIndex){
  const activeIds=new Set(manual.steps[stageIndex].parts);
  const bounds=manual.parts.reduce((b,p)=>{
    const s=p.size,e=p.end;
    b.minX=Math.min(b.minX,e.x-s[0]/2);b.maxX=Math.max(b.maxX,e.x+s[0]/2);
    b.minY=Math.min(b.minY,e.y-s[1]/2);b.maxY=Math.max(b.maxY,e.y+s[1]/2);
    return b;
  },{minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity});
  const dx=Math.max(.001,bounds.maxX-bounds.minX),dy=Math.max(.001,bounds.maxY-bounds.minY);
  const scale=Math.min(178/dx,173/dy),cx=(bounds.minX+bounds.maxX)/2,cy=(bounds.minY+bounds.maxY)/2;
  const ordered=[...manual.parts].sort((a,b)=>{
    const aRank=a.id==='back'?-1:a.kind==='hardware'?2:0;
    const bRank=b.id==='back'?-1:b.kind==='hardware'?2:0;
    return aRank-bRank;
  });
  const primitives=[];
  for(const part of ordered){
    const installed=installationFraction(part,stageIndex)===1;
    const active=activeIds.has(part.id);
    const ghost=stageIndex===0 && part.kind!=='hardware';
    if(!installed && !active && !ghost)continue;
    const x=110+(part.end.x-cx)*scale;
    const y=102.5-(part.end.y-cy)*scale;
    if(part.kind==='hardware'){
      primitives.push({type:'circle',id:part.id,cx:x,cy:y,r:active?2.7:1.65,active,ghost});
    }else{
      primitives.push({type:'rect',id:part.id,
        x:x-part.size[0]*scale/2,y:y-part.size[1]*scale/2,
        width:Math.max(1.2,part.size[0]*scale),height:Math.max(1.2,part.size[1]*scale),
        active,ghost});
    }
  }
  return primitives;
}
