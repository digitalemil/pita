let pitas = 0;
let hidepitas = true;

function addPitaPlus(x, y) {
    let pitaplus = document.createElement('div');
    pitaplus.setAttribute("id", "pitaplus");
    pitaplus.innerHTML = "<div onclick='createPita()'>+</div>";
    pitaplus.style.cssText = 'position: absolute; top: ' + y + 'px; left: ' + x + 'px; height: 64px; width:32px; font-size: 32px; z-index: 9999; padding: 0px 0px 0px; cursor: move; opacity:0.6;background: rgba(0, 0, 0, 0.0) none repeat scroll 0; color: white;';
    document.body.appendChild(pitaplus)
}

function showhidePita() {
    if(!hidepitas)
        document.getElementById("pitaeyetext").innerHTML="&#x25ce";
    else
        document.getElementById("pitaeyetext").innerHTML="&#x25c9";

    hidepitas = !hidepitas;
    for (let p = 0; p < pitas; p++) {
        document.getElementById("pita" + p).style.display = hidepitas ? "none" : "initial";
    }
 }

function addPitaEye(x, y) {
    let pitaplus = document.createElement('div');
    pitaplus.setAttribute("id", "pitaeye");
    pitaplus.innerHTML = "<div id='pitaeyetext' onclick='showhidePita()'>&#x25ce</div>";
    pitaplus.style.cssText = 'position: absolute; top: ' + y + 'px; left: ' + x + 'px; height: 64px; width:64; font-size: 28px; z-index: 99; padding: 0px 0px 0px; cursor: move; opacity:0.6;background: rgba(0, 0, 0, 0.0) none repeat scroll 0; color: white;';
    document.body.appendChild(pitaplus)
}

function getPitas() {
    let xhttp = new XMLHttpRequest();
    xhttp.open("GET", "/pita/pitas", true);
    xhttp.setRequestHeader('Content-type', 'application/json');
    xhttp.onreadystatechange = function () {
        if (xhttp.readyState == XMLHttpRequest.DONE) {
            let p = JSON.parse(xhttp.responseText);
            for (let i = 0; i < p.length; i++) {
                addPita("pita"+i, p[i].text, p[i].x, p[i].y, false, p[i].id);
            }
        }
    }
    xhttp.send();

}
function deletePita(id) {
    let xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/pita/deletepita", true);
    xhttp.setRequestHeader('Content-type', 'application/json');
    xhttp.send(JSON.stringify({ id: document.getElementById(id).getAttribute("name") }));
    document.getElementById(id).style.display = "none";
    delete updatePitaPos[id];
}

updatedPosition = new Object();
function updatePitaPos(id, x, y) {
    updatePitaPos[id] = { x: x, y: y };
};

function sendUpdatedPitas() {
    let keys = Object.keys(updatePitaPos);
    keys.forEach(key => {
        if (document.getElementById(key).style.display === "none") {
            return;
        }
        let xhttp = new XMLHttpRequest();
        xhttp.open("POST", "/pita/updatepitapos", true);
        xhttp.setRequestHeader('Content-type', 'application/json');
        xhttp.send(JSON.stringify(
            {
                id: document.getElementById(key).getAttribute("name"),
                y: updatePitaPos[key].x,
                x: updatePitaPos[key].y
            }));
        delete updatePitaPos[key];
    });
    setTimeout(sendUpdatedPitas, 1000);
}

sendUpdatedPitas();

function createPita() {
    id = "pita" + pitas;
    x = 128 + 32 * pitas;
    y = 128 + 32 * pitas;
    addPita(id, "", x, y, true);
    if(hidepitas)
        showhidePita();
}

function addPita(id, text, x, y, persist, dbid) {
    let pita = document.createElement('div');
    pita.setAttribute("id", id);
  
    pita.innerHTML = "<div style='position: absolute; top: 0px; left: 0px; background: #808080; height: 16%; width:100%;' id='" + id + "handle'><div onclick='deletePita(\"" + id + "\")' style='font-size: 18px; position: absolute; top: -2px; right: 4px; height: 24%;'>X</div></div><div style='text-align: center;'><p><textarea id='" + id + "textarea'   style='font-size: 18px; text-align:left; color: #0F0F0F; resize: none; outline: none; border: 0; position: absolute; top:18%; left: 2%; width:96%; height:76%' savedtext='"+text+"'>" + text + "</textarea></div>";
    pita.style.cssText = 'z-index: 100; box-shadow: 5px 5px 7px rgba(33, 33, 33, 0.7); padding: 8px 2px 2px; cursor: move; position:fixed;left:' + x + 'px;top:' + y + 'px;width:128px;height:128px;opacity:0.6;background:#FFFFFF none repeat scroll 0;';
    document.body.appendChild(pita);
    //document.getElementById(id+"textarea").setAttribute("savedtext", text);
    pitas++;
    if (persist) {
        let xhttp = new XMLHttpRequest();
        xhttp.open("POST", "/pita/createpita", true);
        xhttp.setRequestHeader('Content-type', 'application/json');
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState == XMLHttpRequest.DONE) {
                pita.setAttribute("name", xhttp.responseText);
            }
        }
        xhttp.send(JSON.stringify({ x: x, y: y }));
    }
    else {
        pita.setAttribute("name", dbid); 
    }
    /* Mobile */
    let handle = document.getElementById(id + "handle");
    handle.addEventListener('touchmove', function (e) {
        let touchLocation = e.targetTouches[0];
        pita.style.left = touchLocation.pageX + 'px';
        pita.style.top = touchLocation.pageY + 'px';
        updatePitaPos(pita.getAttribute("id"), Math.round(touchLocation.pageY), Math.round(touchLocation.pageX));   
    });

    /* Desktop */
    dragElement(document.body, handle, pita);

    function dragElement(body, handle, el) {
        let pos1, pos2, pos3, pos4;

        handle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            handle.onmouseup = closeDragElement;
            handle.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            el.style.top = (el.offsetTop - pos2) + "px";
            el.style.left = (el.offsetLeft - pos1) + "px";
            updatePitaPos(pita.getAttribute("id"), (el.offsetTop - pos2), (el.offsetLeft - pos1));
        }


    }
    function closeDragElement() {
        handle.onmouseup = null;
        handle.onmousemove = null;
    }
}

function textChecker() {
    setTimeout(textChecker, 100);
    if(hidepitas)
        return;   
  for(let p= 0; p< pitas; p++) {
        let pita= document.getElementById("pita"+p+"textarea");
        if(pita.getAttribute("savedtext")===pita.value)
            continue;
        let xhttp = new XMLHttpRequest();
        xhttp.open("POST", "/pita/updatepitatext", true);
        xhttp.setRequestHeader('Content-type', 'application/json');
        xhttp.send(JSON.stringify({
                id: document.getElementById("pita"+p).getAttribute("name"),
                text: pita.value
        }));
   //     pita.savedtext= pita.value;
        pita.savedtext= pita.setAttribute("savedtext", pita.value);
    }
}
addPitaPlus(8, 8);
addPitaEye(32, 10);
getPitas();
showhidePita();
setTimeout(textChecker, 100);