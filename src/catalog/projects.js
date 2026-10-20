/** Independent geometric *studies*, not build plans or safety instructions.
 *  Every count, measurement and dependency must be reviewed against the user's
 *  actual project before anything is used for physical work.
 */
import {bookcase} from './billy.js';

const pose = (x,y,z,ry=0,rz=0) => ({x,y,z,ry,rz});
const camera = (theta=.67,phi=1.16,distance=3.2,y=.6,x=0,z=0) => ({theta,phi,distance,y,x,z});
const part = (id,label,kind,size,end,installStep,{shape='box',tone='wood',start,notes}={}) => ({
  id,label,kind,shape,tone,size,end,installStep,
  start:start??pose(end.x+(end.x>0?.6:-.6),end.y+.28,end.z+.6),
  ...(notes?{notes}:{})
});
const stage = (id,title,parts,options={}) => ({
  id,title,parts:parts.map(p=>typeof p==='string'?p:p.id),
  detail:options.detail??'An illustrative 3D relationship, not a work instruction.',
  hint:options.hint??'Concept geometry • verify before building',
  phase:options.phase??'Explore',
  camera:options.camera??camera(),
  ...(options.requires?{requires:options.requires}:{}),
  ...(options.tool?{tool:options.tool}:{}),
  ...(options.caution?{caution:options.caution}:{}),
  ...(options.safety?{safety:true}:{})
});
const tool=(kind,target,action='align')=>({kind,target,action});
const meta=(id,title,category,dimensions,parts,steps,options={})=>({
  schemaVersion:1,id,title,shortTitle:options.shortTitle??title,
  subtitle:options.subtitle??'Independent conceptual study · not verified instructions',
  category,source:options.source??{creator:'Living Manuals contributors',url:'https://github.com/kvnloo/living-manuals'},
  inventoryStatus:'ILLUSTRATIVE_NOT_VENDOR_VERIFIED',approximate:true,units:'metres',
  dimensions,review:{status:'illustrative',requiresHumanApproval:true},
  parts,steps,
  cautions:options.cautions??['This is a visual concept, not an approved construction or assembly plan.'],
  ...(options.description?{description:options.description}:{})
});

function tableStudy(){
  const top=part('tabletop','Top board','panel',[.65,.035,.55],pose(0,.49,0),2,{start:pose(-.83,.25,.42)});
  const legs=Array.from({length:4},(_,i)=>{
    const x=(i%2?1:-1)*.275,z=(i<2?-1:1)*.225;
    return part(`leg-${i+1}`,`Leg ${i+1}`,'panel',[.045,.46,.045],pose(x,.23,z),3,{start:pose(x*2,.25,z*2)});
  });
  const connectors=Array.from({length:8},(_,i)=>{
    const x=(i%2?1:-1)*.27,z=(i<4?-1:1)*.22;
    return part(`joint-${i+1}`,`Illustrative joint ${i+1}`,'hardware',[.012,.04,.012],pose(x,.445,z),1,{shape:'cylinder',tone:'metal',start:pose(x,.72+.04*(i%4),z+.16)});
  });
  const parts=[top,...legs,...connectors];
  const steps=[
    stage('overview','Explore table geometry',[],{phase:'Explore',camera:camera(.65,1.12,2.25,.28)}),
    stage('connections','Study connection points',connectors,{phase:'Connect',tool:tool('driver','joint-1','turn'),camera:camera(.9,1.04,1.7,.46)}),
    stage('top','Locate the top panel',[top],{phase:'Frame',camera:camera(.7,1.0,2.2,.4),requires:['connections']}),
    stage('legs','Visualize four legs',legs,{phase:'Frame',camera:camera(.7,1.14,2.1,.3),requires:['top']}),
    stage('check','Compare against the official instructions',[],{phase:'Review',camera:camera(.7,1.1,2.45,.28),safety:true,caution:'Verify the exact product variant, supplied hardware and official assembly instructions.'})
  ];
  return meta('table-concept','LACK-inspired table','furniture',{width:.65,height:.51,depth:.55},parts,steps,{shortTitle:'LACK',subtitle:'Illustrative low table · unverified connectors'});
}

function doghouseStudy(){
  const floor=part('floor','Raised floor','panel',[1.15,.06,.93],pose(0,.10,0),2,{start:pose(-1,.32,.65)});
  const sides=[
    part('side-left','Left wall','panel',[.06,.77,.93],pose(-.55,.515,0),3,{start:pose(-1.05,.52,-.23)}),
    part('side-right','Right wall','panel',[.06,.77,.93],pose(.55,.515,0),3,{start:pose(1.05,.52,.23)}),
    part('rear','Rear wall','panel',[1.04,.77,.05],pose(0,.515,-.44),3,{start:pose(.12,.52,-1.07)}),
  ];
  const entrance=[
    part('entrance-left','Entrance post left','panel',[.25,.77,.05],pose(-.405,.515,.44),4,{start:pose(-.85,.6,.9)}),
    part('entrance-right','Entrance post right','panel',[.25,.77,.05],pose(.405,.515,.44),4,{start:pose(.87,.6,.9)}),
    part('lintel','Entrance lintel','panel',[.56,.19,.05],pose(0,.805,.44),4,{start:pose(0,1.46,.89)})
  ];
  const roof=[
    part('roof-left','Roof plane left','panel',[.82,.04,1.09],pose(-.29,1.07,0,0,.6),6,{start:pose(-1.14,1.58,0,0,.6),tone:'roof'}),
    part('roof-right','Roof plane right','panel',[.82,.04,1.09],pose(.29,1.07,0,0,-.6),6,{start:pose(1.14,1.58,0,0,-.6),tone:'roof'})
  ];
  const runners=[-1,1].map((v,i)=>part(`runner-${i+1}`,`Floor support ${i+1}`,'fixture',[.06,.12,.94],pose(v*.42,.025,0),1,{start:pose(v*.9,.22,.72),tone:'wood'}));
  const frame=[floor,...sides,...entrance,...roof,...runners];
  const steps=[
    stage('overview','Inspect the doghouse concept',[],{phase:'Plan',camera:camera(.7,1.12,3.8,.7),caution:'A doghouse requires proper ventilation, weather sealing and animal-safe materials.'}),
    stage('base-supports','Visualize ground clearance',runners,{phase:'Foundation',camera:camera(.8,1.22,3.0,.2)}),
    stage('floor','Position a floor plane',[floor],{phase:'Foundation',camera:camera(.65,1.18,3.2,.3),requires:['base-supports']}),
    stage('walls','Preview the exterior walls',sides,{phase:'Enclosure',camera:camera(.65,1.2,3.0,.65),requires:['floor']}),
    stage('entrance','Leave a modeled entrance',entrance,{phase:'Enclosure',camera:camera(.67,1.1,2.5,.5),requires:['walls']}),
    stage('roof-review','Review roof clearances',[],{phase:'Roof',camera:camera(.8,1.05,3.1,.9),caution:'Roof pitch and spans are conceptual, not load-engineered.'}),
    stage('roof','Preview overlapping roof panels',roof,{phase:'Roof',tool:tool('driver','roof-left','align'),camera:camera(.73,.9,2.85,.9),requires:['entrance','roof-review']}),
    stage('safety','Check comfort, weather and safety',[],{phase:'Review',camera:camera(.67,1.18,3.4,.62),safety:true,caution:'Confirm safe dimensions for the animal, insulation, ventilation, drainage and local materials before construction.'}),
  ];
  return meta('doghouse-concept','Doghouse concept','architecture',{width:1.15,height:1.4,depth:1.1},frame,steps,{shortTitle:'DOGHOUSE',description:'From foundation through enclosure to roofing, with independent safety review.'});
}

/** Generates an illustrative fence section with up to eight schematic bays.
 *  This computes only rendering geometry, NOT post foundations, setbacks,
 *  permitted height, wind loads, or construction quantities.
 */
export function createFenceStudy({bays=2,picketsPerBay=9}={}){
  if(!Number.isInteger(bays)||bays<1||bays>8)throw new RangeError('Fence bays must be an integer from 1 to 8');
  if(!Number.isInteger(picketsPerBay)||picketsPerBay<6||picketsPerBay>18)throw new RangeError('Pickets per bay must be an integer from 6 to 18');
  const span=1.3,width=bays*span,postXs=Array.from({length:bays+1},(_,i)=>-width/2+i*span);
  const frameDistance=Math.max(3.2,width*.89+1.1);
  const cameraFor=(theta=.6,phi=1.14,offset=.0)=>camera(theta,phi,frameDistance+offset,.8);
  const posts=postXs.map((x,i)=>part(`post-${i+1}`,`Fence post ${i+1}`,'fixture',[.115,1.65,.115],pose(x,.825,0),2,{start:pose(x,.825,-.7)}));
  const rails=[.44,1.18].flatMap((y,j)=>Array.from({length:bays},(_,i)=>{
    const x=(postXs[i]+postXs[i+1])/2;
    return part(`rail-${j+1}-${i+1}`,`Horizontal rail ${j+1}.${i+1}`,'panel',[span-.03,.085,.06],pose(x,y,-.06),3,{start:pose(x,y+.45,.74)});
  }));
  const spacing=span/picketsPerBay;
  const pickets=Array.from({length:bays*picketsPerBay},(_,i)=>{
    const bay=Math.floor(i/picketsPerBay),slot=i%picketsPerBay;
    const x=postXs[bay]+(slot+.5)*spacing;
    return part(`picket-${i+1}`,`Picket ${i+1}`,'panel',[Math.min(.125,spacing*.86),1.35,.038],
      pose(x,.74,.08),i<Math.ceil(bays*picketsPerBay/2)?4:5,
      {start:pose(x,.74,.55+(i%3)*.07)});
  });
  const caps=posts.map((p,i)=>part(`cap-${i+1}`,`Post cap ${i+1}`,'fixture',[.145,.04,.145],pose(p.end.x,1.66,0),6,{start:pose(p.end.x,2.06,.3)}));
  const parts=[...posts,...rails,...pickets,...caps];
  const split=Math.ceil(pickets.length/2);
  const steps=[
    stage('scope','Review boundaries and permits',[],{phase:'Plan',camera:cameraFor(.58,1.21,.2),safety:true,caution:'Do not dig or build from this animation. Check property boundaries, permits, setbacks and utility locating.'}),
    stage('survey','Plan the alignment corridor',[],{phase:'Plan',camera:cameraFor(.5,1.28,.2),caution:'Utility and boundary clearance must be independently verified.'}),
    stage('posts','Study the post grid',posts,{phase:'Supports',camera:cameraFor(.62,1.17),requires:['scope','survey'],caution:'No embedment depth, soil or footing design is represented.'}),
    stage('rails','Visualize rail spans',rails,{phase:'Structure',tool:tool('driver','rail-1-1','align'),camera:cameraFor(.78,1.14,-.1),requires:['posts']}),
    stage('first-half','Preview initial pickets',pickets.slice(0,split),{phase:'Cladding',tool:tool('driver','picket-1','align'),camera:cameraFor(.55,1.13,-.1),requires:['rails']}),
    stage('second-half','Complete the visual rhythm',pickets.slice(split),{phase:'Cladding',camera:cameraFor(.52,1.14),requires:['first-half']}),
    stage('caps','Preview post tops',caps,{phase:'Finish',camera:cameraFor(.66,1.1),requires:['second-half']}),
    stage('review','Verify regulations and structure',[],{phase:'Review',camera:cameraFor(.65,1.16,.2),safety:true,caution:'Fence footing and wind loads depend on local codes, site, climate and materials. An engineered or permitted plan may be required.'})
  ];
  return meta('fence-concept',`Fence concept · ${bays} ${bays===1?'bay':'bays'}`,'outdoor',
    {width:width+.12,height:1.68,depth:.18},parts,steps,
    {shortTitle:'FENCE',description:`${bays} illustrative bays with ${picketsPerBay} picket shapes each; not a surveyed property installation.`});
}

function pcStudy(){
  const frame=[
    ...[-.19,.19].flatMap(x=>[-.13,.13].map(z=>part(`frame-${x<0?'l':'r'}-${z<0?'b':'f'}`,`Chassis upright`,'fixture',[.025,.49,.025],pose(x,.255,z),1,{tone:'steel',start:pose(x*1.7,.34,z*2)}))),
    part('bottom','Chassis floor','fixture',[.41,.028,.30],pose(0,.02,0),1,{tone:'steel',start:pose(-.59,.18,.56)}),
    part('top','Chassis top rail','fixture',[.41,.025,.30],pose(0,.50,0),1,{tone:'steel',start:pose(.6,.64,-.48)})
  ];
  const board=part('motherboard','Motherboard','component',[.345,.375,.012],pose(.01,.29,-.13),2,{tone:'board',start:pose(-.48,.42,.38)});
  const processor=part('cpu','CPU package','component',[.052,.005,.052],pose(-.025,.32,-.115),3,{tone:'metal',start:pose(-.025,.61,.12)});
  const ram=[0,1].map(i=>part(`memory-${i+1}`,`Memory module ${i+1}`,'component',[.014,.112,.024],pose(.10+i*.025,.32,-.097),4,{tone:'board',start:pose(.30+i*.08,.57,.17)}));
  const cooler=part('cooler','Illustrative CPU cooler','component',[.125,.105,.12],pose(-.025,.32,-.025),5,{tone:'steel',start:pose(-.24,.70,.44)});
  const psu=part('psu','Power supply','component',[.15,.095,.15],pose(-.105,.09,.02),6,{tone:'steel',start:pose(-.57,.12,.65)});
  const gpu=part('gpu','Graphics card','component',[.245,.09,.105],pose(.025,.215,.04),7,{tone:'board',start:pose(.49,.24,.6)});
  const fans=[0,1].map(i=>part(`fan-${i+1}`,`Chassis fan ${i+1}`,'component',[.105,.105,.021],pose(i?.11:-.11,.34,.13),8,{tone:'steel',start:pose(i?.39:-.38,.31,.6)}));
  const parts=[...frame,board,processor,...ram,cooler,psu,gpu,...fans];
  const steps=[
    stage('overview','Inspect the workstation build',[],{phase:'Plan',camera:camera(.7,1.13,1.43,.28),caution:'Verify component compatibility, PSU sizing and ESD controls before handling real parts.'}),
    stage('case','Study chassis clearances',frame,{phase:'Chassis',camera:camera(.65,1.14,1.48,.3)}),
    stage('board','Review board mounting',[board],{phase:'Mainboard',tool:tool('driver','motherboard','align'),camera:camera(.93,1.13,1.22,.28),requires:['case']}),
    stage('socket','Inspect the CPU socket',[processor],{phase:'Mainboard',camera:camera(.8,1.17,1.05,.31),requires:['board'],caution:'Socket-specific alignment and retention mechanisms require the official motherboard/CPU manuals.'}),
    stage('memory','Preview dual memory modules',ram,{phase:'Mainboard',camera:camera(.85,1.08,1.12,.32),requires:['socket']}),
    stage('cooling','Visualize cooling clearance',[cooler],{phase:'Cooling',camera:camera(.8,1.16,1.3,.31),requires:['memory'],caution:'Cooling mounting pressure, thermal paste and clearances are model-specific.'}),
    stage('power','Locate power enclosure',[psu],{phase:'Power',camera:camera(.77,1.15,1.55,.2),requires:['case'],caution:'Never open a PSU; disconnect power before working.'}),
    stage('graphics','Preview graphics expansion',[gpu],{phase:'Expansion',tool:tool('driver','gpu','align'),camera:camera(.83,1.18,1.27,.23),requires:['board','power']}),
    stage('airflow','Check intake and exhaust geometry',fans,{phase:'Cooling',camera:camera(.64,1.1,1.58,.31),requires:['cooling']}),
    stage('review','Verify the hardware manuals',[],{phase:'Review',camera:camera(.67,1.18,1.43,.29),safety:true,caution:'Check compatibility, ESD, thermal limits, power disconnection, torque and wiring against manufacturer guidance.'}),
  ];
  return meta('pc-concept','PC workstation concept','electronics',{width:.43,height:.52,depth:.3},parts,steps,{shortTitle:'PC BUILD',description:'A spatial component study; no connectors or electrical procedures are asserted.'});
}

export const projects=[bookcase,tableStudy(),doghouseStudy(),createFenceStudy(),pcStudy()];
export const projectById=id=>projects.find(p=>p.id===id);
