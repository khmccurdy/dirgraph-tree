var $canvas = d3.select("canvas");
var cwidth = $canvas.attr("width");
var cheight = $canvas.attr("height");
var c = $canvas.node().getContext("2d");

var animLines=true;

var fullRadius_ = 300;
var centerOffset = [cwidth/2,cheight/2];
// var dots = [[-250,0],[-275,50],[-225,40],
//             [-150,150],[-120,200],[160,150]];
var dots1 = [[-88,-260],[88,-260],[0,-104],
            [-266,52],[-92,52],[-180,208],
            [266,52],[92,52],[180,208]];
var dots = [...dots1.map(d=>[d[0]/2.2,d[1]/2.2+170]),
            ...dots1.map(d=>[d[0]/2.2+145,d[1]/2.2-85])];

var numPoints = dots.length;
// var dotRadius = fullRadius/Math.sqrt(numPoints)*1.4;
var dotRadius_ = getDotRadius(fullRadius_, numPoints);
var dotSize = 3;
const fullArc = [0,2*Math.PI];

function getDotRadius(fullRadius, numPoints, mult=1.4){
    return fullRadius/Math.sqrt(numPoints)*mult;
}

function drawDots(dots,color='black'){
    // var c = $canvas.node().getContext("2d");
    c.fillStyle = color;
    for (var i in dots){
        var pos = arraySum(dots[i],centerOffset);
        c.beginPath();
        c.arc(...pos,dotSize,...fullArc);
        c.fill();
    }
}

function drawCircle(center=true){
    c.strokeStyle = "#4499ff";
    c.beginPath();
    c.arc(...centerOffset, fullRadius_, ...fullArc);
    c.stroke();
    if (center) {
        c.fillStyle = "#ff99cc";
        c.beginPath();
        c.arc(...centerOffset, dotSize, ...fullArc);
        c.fill();
    }
}

function iterate(dots, dotRadius=dotRadius_, fullRadius=fullRadius_, clear=true, update=true){
    var newDots = Object.clone(dots);
    // console.log(dotRadius,fullRadius);
    for (var i=0;i<dots.length;i++){
        for (var j=i+1; j<dots.length;j++){
            if (i==j) continue;
            var di = dots[i];
            var dj = dots[j];
            var dx = di[0]-dj[0];
            var dy = di[1]-dj[1];
            
            if (Math.abs(dx)>=dotRadius) continue;
            if (Math.abs(dy)>=dotRadius) continue;
            // console.log(`Proximity between dots ${i} and ${j}`);
            var dist = Math.sqrt(dx*dx + dy*dy);
            if (dist >= dotRadius) continue;
            // console.log(`Match`);

            // console.log(`Proximity between dots ${i} and ${j}`);
            
            // console.log(dx,dy);
            var vi = [dx,dy].map(d=>(dotRadius-dist)/dist*d/2);
            var vj = vi.map(d=>-d);
            // console.log(...vj);
            // console.log(vi);
            newDots[i]=arraySum(newDots[i],vi);
            newDots[j]=arraySum(newDots[j],vj);
        }
        let ndx = newDots[i][0];
        let ndy = newDots[i][1];
        let dc = Math.sqrt(ndx*ndx + ndy*ndy);
        // console.log(dc);
        if (dc>fullRadius) {
            // console.log(`${i}, ${dc}`);
            newDots[i]=[ndx*fullRadius/dc,ndy*fullRadius/dc];
        }
        if (update){
            dots[i]=newDots[i];
        }
    }
    // console.log(newDots);
    if (clear) {
        c.clearRect(0,0,cwidth,cheight);
        drawCircle();
    }
    drawDots(newDots);
}

function iterateMultiple(dots, n, dotRadius=dotRadius_, fullRadius=fullRadius_, clear=true, update=true) {
    for (var i=0;i<n;i++){
        iterate(dots, dotRadius, fullRadius, clear, update);
    }
}

function nextLevel(dots, radius=dotRadius/3) {
    const cos30 = Math.sqrt(3)/2
    var v1 = [0,-radius];
    var v2 = [radius*cos30,radius/2];
    var v3 = [-radius*cos30,radius/2];
    newDots = [];
    dots.forEach(d=>{newDots.push(arraySum(d,v1), arraySum(d,v2), arraySum(d,v3))});
    return newDots;
}

function triPoints(radius) {
    const cos30 = Math.sqrt(3)/2;
    var v = [[0,-radius], [radius*cos30,radius/2], [-radius*cos30,radius/2]];
    return v;
}

drawCircle();
drawDots(dots);

// positions1 = {0:[0,0,0],1:[200,123,1],2:[-300,132,1],x0r:[4,-231,0.5],"@1l":[250,145,2]};
positions1 = {0:[0,0,0]};
{
    // let tree=tree1;
    // let dz = 50;

    triDotsState(positions1, tree1, 0, 50);

    for(var g=1;g<30;g++){
        let gen = getGen(positions1, g);
        if (gen.ids.length==0) break;
        let fullRadius = gen.radius;
        let dotRadius = getDotRadius(fullRadius, gen.ids.length,1.4);
        iterateMultiple(gen.pos,10,dotRadius,fullRadius);

        updateGenPositions(positions1, gen);

        for (var i in gen.ids){
            triDotsState(positions1, tree1, gen.ids[i], Math.min(dotRadius/2,50));
        }
    }

    // console.log(gen1);
    // console.log(positions1);
}

function proj2d(p,sx=.5,sy=.01,sz=20,ox=0,oy=-280,angle=0){
    let [px,py,pz]=p;
    if (angle != 0){
        let cosA = Math.cos(angle);
        let sinA = Math.sin(angle);
        px = cosA*p[0]+sinA*p[1];
        py = sinA*p[0]-cosA*p[1];
    }
    return [px*sx + ox, py*sy + pz*sz + oy];
}
// var dots0 = Object.values(positions1).map(proj2d);
function drawProjDots(positions, sx=.5,sy=.01,sz=20,ox=0,oy=-280,angle=0, clear=true){
    let dots = Object.values(positions).map(d=>proj2d(d,sx,sy,sz,ox,oy,angle));
    if (clear) c.clearRect(0,0,cwidth,cheight);
    drawDots(dots);
}

function drawGenLines(positions, tree, genLevel, proj=null){
    let gen = getGen(positions, genLevel);
    const dirColors = {u:'255,0,150',d:'0,255,150',l:'0,150,255',r:'255,200,0'};
    c.strokeStyle = "rgba(0,0,0,0.5)";
    let maxID = Math.max(...gen.ids);
    let exits = [];
    let fails = [];
    // console.log(maxID);
    // console.log(gen.ids);

    for (var i in gen.ids){
        let id = gen.ids[i];
        let pos = gen.pos[i];
        let p0 = arraySum(centerOffset, proj?proj(positions[id]):pos);
        // if (proj) p0 = proj(positions[i]);
        for (var j in tree[id]){
            if (j=="gen") continue;
            // console.log(j, tree[id][j]);
            let tx = tree[id][j];
            let tPos;
            if (tx == +tx){
                tPos = positions[tx];
                // console.log(id, tx);
                if (cullBack && tx <= maxID) continue;
            } else {
                // continue;
                tPos = positions[tx+id+j];
                if (tx=="@") {
                    exits.push(proj?proj(tPos):tPos);
                } else {
                    fails.push(proj?proj(tPos):tPos);
                }
            }
            // console.log(id, tx);
            let p1 = arraySum(centerOffset,proj?proj(tPos):tPos);
            // if (proj) p1 = proj(tPos);
            // console.log(p0);
            let gradient = c.createLinearGradient(...p0,...p1);
            gradient.addColorStop(0,`rgba(${dirColors[j]},0.7)`);
            gradient.addColorStop(1,`rgba(${dirColors[j]},0.1)`);
            c.strokeStyle = gradient;
            c.beginPath();
            c.moveTo(...p0);
            c.lineTo(...p1);
            c.stroke();
            
            // console.log(i,j,tx,tPos)
        }
    }
    if(drawExits) drawDots(exits, 'rgba(255,120,200,.5)');
    if(drawFails) drawDots(fails, 'rgba(170,0,0,.5)');
}

function updateGenPositions(positions, gen){
    for (var i in gen.ids){
        for (var j in [0,1]){
            positions[gen.ids[i]][j]=gen.pos[i][j];
        }
    }
}

function triDotsState(positions, tree, state, radius){
    let v0 = triPoints(radius);
    let count = 0;
    for (var x in tree[state]){
        if (x == 'gen') continue;
        let tx = tree[state][x]
        if (tx == +tx) {
            if (!positions[tx]) {
                positions[tx] = arraySum(positions[state],[...v0[count],1]);
            }
        } else {
            zMult = (tx=="@")? .75 : .5;
            positions[tx+state+x] = arraySum(positions[state],[...v0[count],zMult]);
        }
        count++;
    }
}

function getGen(positions, genLevel) {
    var pos = [];
    var ids = [];
    var radii = [];
    for (var x in positions){
        let px = positions[x]
        if (px[2]==genLevel){
            pos.push([px[0],px[1]]);
            ids.push(x);
            radii.push(px[0]*px[0]+px[1]*px[1]);
        }
    }
    return {pos:pos,ids:ids,radius:Math.sqrt(Math.max(...radii))};
}

var animCount=0;

function animateLines(positions, tree, count=animCount, maxL=30, minL=0,
            sx=.8,sy=.8,sz=20,ox=0,oy=-280,angle=0){
    c.clearRect(0,0,800,600);
    c.fillStyle="black";
    c.fillRect(0,0,800,600);
    let cosA = Math.cos(count);
    // console.log(animCount);
    proj=d=>proj2d(d,sx,sy/2*(1-cosA),sz/2*(1+cosA),0,oy/2*(1+cosA),angle);
    for (var i = minL; i<maxL; i++){drawGenLines(positions, tree, i, proj)};
    animCount+=0.005;
}
var minLevelDraw = 0;
var maxLevelDraw = 1;
var yAngle = 0;
var xAngle = 0;
var animateOn = true;
var cullBack = false;
var drawExits = true;
var drawFails = false;
var maxLevels = 30;
var scales = {
    sx:.8, sy:.8, sz: 20,
    ox:0, oy:-280
}

function doAnimate(){
    animateLines(positions1,tree1,yAngle,maxLevelDraw,minLevelDraw,
        scales.sx,scales.sy,scales.sz,scales.ox,scales.oy,xAngle);
}
$canvas.on("mousemove",function(e){
    if (!animLines) return;
    let [x,y]=d3.mouse(this);
    xAngle = -x/400*Math.PI;
    yAngle = y/600*Math.PI;
    doAnimate();
})

const keyRef = {
    a: 65,
    s: 83,
    d: 68,
    f: 70,
    q: 81,
    w: 87,
    e: 69,
    r: 82,
    j: 74,
    k: 75,
    l: 76,
}

d3.select("body").on("keydown",()=>{
    let key=d3.event.keyCode;
    console.log(key);
    ao = animateOn;
    animateOn = false;
    if (key==keyRef.a && minLevelDraw > 0){minLevelDraw--}
    else if (key==keyRef.s && minLevelDraw < maxLevelDraw){minLevelDraw++}
    else if (key==keyRef.d && maxLevelDraw > minLevelDraw){maxLevelDraw--}
    else if (key==keyRef.f && maxLevelDraw < maxLevels){maxLevelDraw++}
    else {animateOn=ao}
    if (key==keyRef.q){scales.sz--}
    else if (key==keyRef.w){scales.sz++}
    else if (key==keyRef.e){scales.oy-=10}
    else if (key==keyRef.r){scales.oy+=10}
    else if (key==keyRef.j){cullBack=!cullBack}
    else if (key==keyRef.k){drawExits=!drawExits}
    else if (key==keyRef.l){drawFails=!drawFails}
    doAnimate();
})

setInterval(()=>{
        if (!animateOn || maxLevelDraw>maxLevels) return;
        maxLevelDraw++;
        doAnimate();
    }, 500);
// Array and Object functions

// arraySum(a1,a2);
// Object.clone();